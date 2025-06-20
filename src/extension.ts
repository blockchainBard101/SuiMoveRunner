import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';
import * as toml from 'toml';

function runCommand(command: string, cwd?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {reject(stderr || error.message);}
      else {resolve(stdout);}
    });
  });
}

function waitForFolder(folderPath: string, timeout: number): Promise<boolean> {
  const interval = 100;
  let elapsed = 0;
  return new Promise((resolve) => {
    const timer = setInterval(() => {
      if (fs.existsSync(folderPath)) {
        clearInterval(timer);
        resolve(true);
      } else if ((elapsed += interval) >= timeout) {
        clearInterval(timer);
        resolve(false);
      }
    }, interval);
  });
}

export function activate(context: vscode.ExtensionContext) {
  const provider = new SuiRunnerSidebar();
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('suiRunner.sidebarView', provider)
  );
}

class SuiRunnerSidebar implements vscode.WebviewViewProvider {
  view?: vscode.WebviewView;
  private activeEnv: string = '';
  private availableEnvs: { alias: string; rpc: string }[] = [];
  private activeWallet: string = '';
  private wallets: { name: string; address: string }[] = [];
  private suiBalance: string = '0';

  async renderUpgradeCapInfo(rootPath: string, pkg: string) {
    const upgradeTomlPath = path.join(rootPath, 'upgrade.toml');
    if (!fs.existsSync(upgradeTomlPath)) {return null;}
    try {
      const content = fs.readFileSync(upgradeTomlPath, 'utf-8');
      const info = toml.parse(content);
      // Check if the package ID matches
      if (info.upgrade?.packageId === pkg || info.upgrade?.package_id === pkg) {
        return {
          upgradeCap: info.upgrade?.upgradeCap || info.upgrade?.upgrade_cap,
          packageId: info.upgrade?.packageId || info.upgrade?.package_id
        };
      }
    } catch {
      // ignore parse errors
    }
    return null;
  }

  resolveWebviewView(view: vscode.WebviewView) {
    this.view = view;
    view.webview.options = { enableScripts: true };
    this.renderHtml(view);

    view.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'create': {
          const name = message.packageName;
          if (!name) {return;}

          let basePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
          if (!basePath) {
            const folderUris = await vscode.window.showOpenDialog({
              canSelectFiles: false,
              canSelectFolders: true,
              canSelectMany: false,
              openLabel: 'Select folder to create Move package in'
            });
            if (!folderUris || folderUris.length === 0) {return;}
            basePath = folderUris[0].fsPath;
          }

          const targetPath = path.join(basePath, name);
          try {
            await runCommand(`sui move new ${name}`, basePath);
            await waitForFolder(targetPath, 2000);
            vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(targetPath), true);
          } catch (err) {
            vscode.window.showErrorMessage(`❌ Failed to create package: ${err}`);
          }
          break;
        }

        case 'build': {
          const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
          if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace open');
            return;
          }
          const rootPath = workspaceFolder.uri.fsPath;
          const outputChannel = vscode.window.createOutputChannel('Sui Move Build');
          outputChannel.show(true);
          outputChannel.appendLine(`Running 'sui move build' in ${rootPath}...\n`);

          try {
            const buildProcess = exec(`sui move build`, { cwd: rootPath });

            buildProcess.stdout?.on('data', (data) => {
              outputChannel.append(data.toString());
            });
            buildProcess.stderr?.on('data', (data) => {
              outputChannel.append(data.toString());
            });

            buildProcess.on('close', (code) => {
              if (code === 0) {
                vscode.window.showInformationMessage('✅ Build succeeded, see "Sui Move Build" output.');
              } else {
                vscode.window.showErrorMessage(`❌ Build failed with exit code ${code}, see "Sui Move Build" output.`);
              }
            });
          } catch (err) {
            vscode.window.showErrorMessage(`❌ Failed to run build: ${err}`);
          }
          break;
        }

        case 'publish': {
          const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
          if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace open');
            return;
          }
          const rootPath = workspaceFolder.uri.fsPath;
          const outputChannel = vscode.window.createOutputChannel('Sui Move Publish');
          outputChannel.show(true);
          outputChannel.appendLine(`Running 'sui client publish' in ${rootPath}...\n`);

          try {
            const publishProcess = exec(`sui client publish`, { cwd: rootPath });

            let fullOutput = '';

            publishProcess.stdout?.on('data', (data) => {
              fullOutput += data.toString();
              outputChannel.append(data.toString());
            });

            publishProcess.stderr?.on('data', (data) => {
              fullOutput += data.toString();
              outputChannel.append(data.toString());
            });

            publishProcess.on('close', async (code) => {
              if (code === 0) {
                vscode.window.showInformationMessage('✅ Publish succeeded, see "Sui Move Publish" output.');

                const lines = fullOutput.split('\n');
                let upgradeCapId = '';

                for (let i = 0; i < lines.length; i++) {
                  if (lines[i].includes('ObjectType: 0x2::package::UpgradeCap')) {
                    for (let j = i - 1; j >= 0; j--) {
                      const idMatch = lines[j].match(/ObjectID:\s*(0x[a-fA-F0-9]+)/);
                      if (idMatch) {
                        upgradeCapId = idMatch[1];
                        break;
                      }
                    }
                    if (upgradeCapId) {break;}
                  }
                }

                if (upgradeCapId) {
                  const upgradeTomlPath = path.join(rootPath, 'upgrade.toml');

                  let pkg = '';
                  try {
                    const lockFile = fs.readFileSync(path.join(rootPath, 'Move.lock'), 'utf-8');
                    const lockData = toml.parse(lockFile);
                    const envSection = lockData.env?.[this.activeEnv] || lockData.env?.default || {};
                    pkg = envSection['latest-published-id'] || envSection['original-published-id'] || '';
                  } catch {
                    pkg = '';
                  }

                  // Create TOML content for upgrade information
                  const upgradeTomlContent = `[upgrade]
upgrade_cap = "${upgradeCapId}"
package_id = "${pkg}"
environment = "${this.activeEnv}"
created_at = "${new Date().toISOString()}"
`;

                  fs.writeFileSync(upgradeTomlPath, upgradeTomlContent);
                  vscode.window.showInformationMessage(`📄 UpgradeCap saved to upgrade.toml: ${upgradeCapId}`);
                } else {
                  vscode.window.showWarningMessage('⚠️ UpgradeCap not found in publish output.');
                }

                this.renderHtml(this.view!);
              } else {
                vscode.window.showErrorMessage(`❌ Publish failed with exit code ${code}, see "Sui Move Publish" output.`);
              }
            });


          } catch (err) {
            vscode.window.showErrorMessage(`❌ Failed to run publish: ${err}`);
          }
          break;
        }

        case 'upgrade': {
          const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
          if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace open');
            return;
          }
          const rootPath = workspaceFolder.uri.fsPath;
          const upgradeTomlPath = path.join(rootPath, 'upgrade.toml');

          if (!fs.existsSync(upgradeTomlPath)) {
            vscode.window.showErrorMessage('⚠️ No upgrade capability found. Please publish first.');
            break;
          }

          let upgradeCapInfo;
          try {
            const content = fs.readFileSync(upgradeTomlPath, 'utf-8');
            const parsed = toml.parse(content);
            upgradeCapInfo = {
              upgradeCap: parsed.upgrade?.upgrade_cap || parsed.upgrade?.upgradeCap,
              packageId: parsed.upgrade?.package_id || parsed.upgrade?.packageId
            };
          } catch {
            vscode.window.showErrorMessage('⚠️ Invalid upgrade.toml content.');
            break;
          }

          const outputChannel = vscode.window.createOutputChannel('Sui Move Upgrade');
          outputChannel.show(true);
          outputChannel.appendLine(`Running 'sui client upgrade --upgrade-capability ${upgradeCapInfo.upgradeCap}' in ${rootPath}...\n`);

          try {
            const upgradeProcess = exec(`sui client upgrade --upgrade-capability ${upgradeCapInfo.upgradeCap}`, { cwd: rootPath });

            let fullOutput = '';

            upgradeProcess.stdout?.on('data', (data) => {
              fullOutput += data.toString();
              outputChannel.append(data.toString());
            });
            upgradeProcess.stderr?.on('data', (data) => {
              fullOutput += data.toString();
              outputChannel.append(data.toString());
            });

            upgradeProcess.on('close', (code) => {
              if (code === 0) {
                const lines = fullOutput.split('\n');
                let newUpgradeCapId = '';

                for (let i = 0; i < lines.length; i++) {
                  if (lines[i].includes('ObjectType: 0x2::package::UpgradeCap')) {
                    for (let j = i - 1; j >= 0; j--) {
                      const idMatch = lines[j].match(/ObjectID:\s*(0x[a-fA-F0-9]+)/);
                      if (idMatch) {
                        newUpgradeCapId = idMatch[1];
                        break;
                      }
                    }
                    if (newUpgradeCapId) {break;}
                  }
                }

                if (newUpgradeCapId) {
                  let pkg = '';
                  try {
                    const lockFile = fs.readFileSync(path.join(rootPath, 'Move.lock'), 'utf-8');
                    const lockData = toml.parse(lockFile);
                    const envSection = lockData.env?.[this.activeEnv] || lockData.env?.default || {};
                    pkg = envSection['latest-published-id'] || envSection['original-published-id'] || '';
                  } catch {
                    pkg = '';
                  }

                  // Update TOML content with new upgrade capability
                  const upgradeTomlContent = `[upgrade]
upgrade_cap = "${newUpgradeCapId}"
package_id = "${pkg}"
environment = "${this.activeEnv}"
updated_at = "${new Date().toISOString()}"
`;

                  fs.writeFileSync(upgradeTomlPath, upgradeTomlContent);

                  vscode.window.showInformationMessage(`✅ Upgrade succeeded. New UpgradeCap saved to upgrade.toml: ${newUpgradeCapId}`);
                } else {
                  vscode.window.showWarningMessage('⚠️ Could not find new UpgradeCap ObjectID in upgrade output.');
                }

                this.renderHtml(this.view!);
              } else {
                vscode.window.showErrorMessage(`❌ Upgrade failed with exit code ${code}, see "Sui Move Upgrade" output.`);
              }
            });
          } catch (err) {
            vscode.window.showErrorMessage(`❌ Failed to run upgrade: ${err}`);
          }
          break;
        }

        case 'test': {
          const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
          if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace open');
            return;
          }
          const rootPath = workspaceFolder.uri.fsPath;
          const funcName = message.functionName?.trim() || '';
          const outputChannel = vscode.window.createOutputChannel('Sui Move Test');
          outputChannel.show(true);

          let cmd = 'sui move test';
          if (funcName) {
            cmd += ` ${funcName}`;
          }

          outputChannel.appendLine(`Running '${cmd}' in ${rootPath}...\n`);

          try {
            const testProcess = exec(cmd, { cwd: rootPath });

            testProcess.stdout?.on('data', (data) => {
              outputChannel.append(data.toString());
            });
            testProcess.stderr?.on('data', (data) => {
              outputChannel.append(data.toString());
            });

            testProcess.on('close', (code) => {
              if (code === 0) {
                vscode.window.showInformationMessage('✅ Test succeeded, see "Sui Move Test" output.');
              } else {
                vscode.window.showErrorMessage(`❌ Test failed with exit code ${code}, see "Sui Move Test" output.`);
              }
            });
          } catch (err) {
            vscode.window.showErrorMessage(`❌ Failed to run test: ${err}`);
          }
          break;
        }

        case 'call': {
          const { pkg, module, func, args, typeArgs } = message;
          const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
          const rootPath = workspaceFolder?.uri.fsPath;

          let callCmd = `sui client call --package ${pkg} --module ${module} --function ${func}`;

          if (typeArgs && typeArgs.length > 0) {
            callCmd += ' --type-args ' + typeArgs.join(' ');
          }
          if (args && args.length > 0) {
            callCmd += ' --args ' + args.join(' ');
          }

          const outputChannel = vscode.window.createOutputChannel('Sui Move Call');
          outputChannel.show(true);
          outputChannel.appendLine(`Running '${callCmd}' in ${rootPath}...\n`);

          try {
            const callProcess = exec(callCmd, { cwd: rootPath });

            callProcess.stdout?.on('data', (data) => {
              outputChannel.append(data.toString());
            });
            callProcess.stderr?.on('data', (data) => {
              outputChannel.append(data.toString());
            });

            callProcess.on('close', (code) => {
              if (code === 0) {
                vscode.window.showInformationMessage('✅ Call succeeded, see "Sui Move Call" output.');
              } else {
                vscode.window.showErrorMessage(`❌ Call failed with exit code ${code}, see "Sui Move Call" output.`);
              }
            });
          } catch (err) {
            vscode.window.showErrorMessage(`❌ Failed to run call: ${err}`);
          }
          break;
        }

        case 'switch-env': {
          const alias = message.alias;
          if (!alias) {return;}

          const exists = this.availableEnvs.some(e => e.alias === alias);
          if (!exists) {
            const rpc = await vscode.window.showInputBox({ prompt: `RPC for new env '${alias}'` });
            if (!rpc) {return;}
            try {
              await runCommand(`sui client new-env --alias ${alias} --rpc ${rpc}`);
            } catch (err) {
              vscode.window.showErrorMessage(`❌ Failed to add new env: ${err}`);
              return;
            }
          }

          try {
            await runCommand(`sui client switch --env ${alias}`);
            vscode.window.showInformationMessage(`🔄 Switched to env: ${alias}`);
            this.renderHtml(this.view!);
          } catch (err) {
            vscode.window.showErrorMessage(`❌ Failed to switch env: ${err}`);
          }
          break;
        }

        case 'switch-wallet': {
          const address = message.address;
          if (!address) {return;}
          try {
            await runCommand(`sui client switch --address ${address}`);
            vscode.window.showInformationMessage(`💻 Switched wallet to ${address}`);
            this.renderHtml(this.view!);
          } catch (err) {
            vscode.window.showErrorMessage(`❌ Failed to switch wallet: ${err}`);
          }
          break;
        }

        case 'showCopyNotification': {
          vscode.window.showInformationMessage('📋 Wallet address copied to clipboard!');
          break;
        }
      }
    });
  }

  async fetchWalletBalance() {
    try {
      const balanceOutput = await runCommand(`sui client balance --json`);
      const balanceData = JSON.parse(balanceOutput);
      const coinData = balanceData?.[0]?.[0]?.[1] || [];

      const suiBalanceObj = coinData.find((coin: any) => coin.coinType === '0x2::sui::SUI');
      const rawBalance = BigInt(suiBalanceObj?.balance || '0');
      this.suiBalance = (Number(rawBalance) / 1e9).toFixed(6);
    } catch {
      this.suiBalance = '0';
    }
  }

  formatStruct(s: any): string {
    if (!s.address || !s.module || !s.name) {return 'Unknown';}
    const shortAddr = s.address.slice(0, 5) + '...' + s.address.slice(-3);
    return `${shortAddr}::${s.module}::${s.name}`;
  }

  async renderHtml(view: vscode.WebviewView) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const rootPath = workspaceFolder?.uri.fsPath || '';
    const isMoveProject = fs.existsSync(path.join(rootPath, 'Move.toml'));

    let modulesHtml = '';
    let pkg = '';
    let argsMapping: Record<string, { argTypes: string[], typeParams: string[] }> = {};

    try {
      const envOutput = await runCommand(`sui client envs --json`);
      const [envsList, currentEnv] = JSON.parse(envOutput);
      this.activeEnv = currentEnv;
      this.availableEnvs = envsList.map((e: any) => ({ alias: e.alias, rpc: e.rpc }));
    } catch {
      this.activeEnv = 'None';
      this.availableEnvs = [];
    }

    try {
      const addrOutput = await runCommand(`sui client addresses --json`);
      const parsed = JSON.parse(addrOutput);
      this.activeWallet = parsed.activeAddress || '';
      this.wallets = parsed.addresses.map((arr: any[]) => ({ name: arr[0], address: arr[1] }));

      await this.fetchWalletBalance();
    } catch {
      this.activeWallet = 'Unavailable';
      this.wallets = [];
      this.suiBalance = '0';
    }

    try {
      const lockFile = fs.readFileSync(path.join(rootPath, 'Move.lock'), 'utf-8');
      const lockData = toml.parse(lockFile);

      const envSection = lockData.env?.[this.activeEnv] || lockData.env?.default || {};

      pkg = envSection['latest-published-id'] || envSection['original-published-id'] || '';
    } catch {
      pkg = '';
    }

    let upgradeCapInfo: { upgradeCap: string; packageId: string } | null = null;
    try {
      const upgradeTomlPath = path.join(rootPath, 'upgrade.toml');
      if (fs.existsSync(upgradeTomlPath)) {
        const content = fs.readFileSync(upgradeTomlPath, 'utf-8');
        const parsed = toml.parse(content);
        const upgradeCap = parsed.upgrade?.upgrade_cap || parsed.upgrade?.upgradeCap;
        const packageId = parsed.upgrade?.package_id || parsed.upgrade?.packageId;
        if (packageId === pkg && upgradeCap) {
          upgradeCapInfo = { upgradeCap, packageId };
        }
      }
    } catch {
      upgradeCapInfo = null;
    }

    const fullnodeUrls: Record<string, string> = {
      testnet: 'https://fullnode.testnet.sui.io:443',
      mainnet: 'https://fullnode.mainnet.sui.io:443',
      devnet: 'https://fullnode.devnet.sui.io:443',
    };
    const fullnodeUrl = fullnodeUrls[this.activeEnv] || fullnodeUrls['testnet'];

    try {
      if (pkg) {
        const response = await fetch(fullnodeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'sui_getNormalizedMoveModulesByPackage',
            params: [pkg]
          })
        });
        const data = await response.json();
        const modules = data.result || {};

        modulesHtml = Object.entries(modules)
          .map(([modName, modData]: any) => {
            const funcs = Object.entries(modData.exposedFunctions || {}).map(
              ([fname, fdata]: [string, any]) => {
                const argTypes = fdata.parameters.map((t: any) => {
                  const getName = (obj: any): string | null => {
                    if (typeof obj === 'string') {return obj;}
                    if (obj.Struct && obj.Struct.name !== 'TxContext') {return this.formatStruct(obj.Struct);}
                    if (obj.Reference?.Struct && obj.Reference.Struct.name !== 'TxContext') {return this.formatStruct(obj.Reference.Struct);}
                    if (obj.MutableReference?.Struct && obj.MutableReference.Struct.name !== 'TxContext') {return this.formatStruct(obj.MutableReference.Struct);}
                    return null;
                  };
                  return getName(t);
                }).filter(Boolean) as string[];

                const typeParams = fdata.typeParameters || [];

                argsMapping[`${modName}::${fname}`] = { argTypes, typeParams };

                return `<option value="${fname}" data-mod="${modName}" data-type-params='${JSON.stringify(typeParams)}'>${fname}</option>`;
              }
            ).join('');
            return `<optgroup label="${modName}">${funcs}</optgroup>`;
          })
          .join('');
      }
    } catch {
      modulesHtml = '<option disabled selected>Failed to load modules</option>';
    }

    const envOptions = this.availableEnvs.map(e => `<option value="${e.alias}" ${e.alias === this.activeEnv ? 'selected' : ''}>${e.alias}</option>`).join('');
    const shortWallet = this.activeWallet.slice(0, 6) + '...' + this.activeWallet.slice(-4);

    view.webview.html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <style>
          /* Reset and base */
          * {
            box-sizing: border-box;
          }
          body {
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            padding: 16px;
            margin: 0;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
          }
          h3 {
            margin-bottom: 1rem;
            font-weight: 700;
            color: var(--vscode-editor-focusBorder);
            text-align: center;
          }
          p, h4 {
            margin: 0.8rem 0 0.4rem 0;
          }
          select, input[type="text"], input[type="search"], input {
            width: 100%;
            padding: 8px 10px;
            margin-bottom: 12px;
            border-radius: 6px;
            border: 1.5px solid var(--vscode-dropdown-border);
            background-color: var(--vscode-dropdown-background);
            color: var(--vscode-input-foreground);
            font-size: 0.9rem;
            transition: border-color 0.2s ease;
          }
          select:focus, input:focus {
            outline: none;
            border-color: var(--vscode-inputValidation-infoBorder);
            box-shadow: 0 0 6px var(--vscode-inputValidation-infoBorder);
          }
          button {
            width: 100%;
            padding: 6px 0;
            background-color: var(--vscode-button-background);
            border: none;
            border-radius: 6px;
            color: var(--vscode-button-foreground);
            font-weight: 600;
            font-size: 0.85rem;
            cursor: pointer;
            margin-bottom: 1rem;
            transition: background-color 0.3s ease;
          }
          button:hover {
            background-color: var(--vscode-button-hoverBackground);
          }
          #walletAddress {
            user-select: text;
            cursor: pointer;
            color: var(--vscode-editorWarning-foreground);
            font-weight: 600;
            display: inline-block;
            padding: 4px 8px;
            border-radius: 5px;
            background-color: var(--vscode-editorWarning-background);
            transition: background-color 0.3s ease;
          }
          #walletAddress:hover {
            background-color: var(--vscode-inputValidation-infoBackground);
            color: var(--vscode-input-foreground);
          }
          #typeArgsContainer > input,
          #argsContainer > input {
            margin-bottom: 10px;
            border-radius: 6px;
            border: 1.5px solid var(--vscode-dropdown-border);
            background-color: var(--vscode-dropdown-background);
            padding: 8px 10px;
            color: var(--vscode-input-foreground);
            font-size: 0.9rem;
            width: 100%;
          }
          b {
            display: block;
            margin-bottom: 6px;
            color: var(--vscode-editorInfo-foreground);
            font-size: 1rem;
          }
          .section {
            background-color: var(--vscode-sideBar-background);
            padding: 12px 16px;
            border-radius: 12px;
            margin-bottom: 16px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          }
          #argsContainer, #typeArgsContainer {
            max-height: 120px;
            overflow-y: auto;
          }
        </style>
      </head>
      <body>
        <h3>Sui Move Runner</h3>

        <div class="section" style="text-align:center; font-weight:bold; font-size:1.1rem; color: var(--vscode-editor-focusBorder);">
          ${this.activeEnv || 'None'}
        </div>

        <div class="section">
          <select id="envSwitcher">${envOptions}</select>
        </div>

        <div class="section">
          <p><strong>Wallet</strong></p>
          <select id="walletSwitcher">
            ${this.wallets.map(w => `
              <option value="${w.address}" ${w.address === this.activeWallet ? 'selected' : ''}>
                ${w.name} - ${w.address.slice(0, 6)}...${w.address.slice(-4)}
              </option>
            `).join('')}
          </select>
          <p>Address: <span id="walletAddress" title="Click to copy">${shortWallet}</span></p>
          <p><strong>Balance:</strong> ${this.suiBalance} SUI</p>
        </div>

        ${!isMoveProject ? `
          <div class="section">
            <h4>Create Package</h4>
            <input id="packageName" placeholder="Package name" />
            <button onclick="sendCreate()">📦 Create</button>
          </div>
        ` : ''}

        ${isMoveProject ? `
          <div class="section">
            <h4>Build Package</h4>
            <button onclick="sendBuild()">🛠️ Build</button>
          </div>

          <div class="section">
            <h4>Publish Package</h4>
            <button onclick="sendPublish()">🚀 ${pkg ? 'Re-publish' : 'Publish'}</button>
          </div>

          ${upgradeCapInfo ? `
          <div class="section">
            <h4>Upgrade Package</h4>
            <button onclick="sendUpgrade()">⬆️ Upgrade</button>
          </div>
          ` : ''}

          <div class="section">
            <h4>Test Package</h4>
            <input id="testFuncName" placeholder="Test function name (optional)" />
            <button onclick="sendTest()">🧪 Test</button>
          </div>

          <div class="section">
            <h4>Call Function</h4>
            <input id="pkg" value="${pkg}" readonly />
            <select id="functionSelect">${modulesHtml}</select>

            <div id="typeArgsContainer"></div>
            <div id="argsContainer"></div>

            <button onclick="sendCall()">🧠 Call</button>
          </div>
        ` : ''}

        <script>
          const vscode = acquireVsCodeApi();
          const argsMapping = ${JSON.stringify(argsMapping)};

          function sendCreate() {
            vscode.postMessage({ command: 'create', packageName: document.getElementById('packageName').value });
          }

          function sendBuild() {
            vscode.postMessage({ command: 'build' });
          }

          function sendPublish() {
            vscode.postMessage({ command: 'publish' });
          }

          function sendUpgrade() {
            vscode.postMessage({ command: 'upgrade' });
          }

          function sendTest() {
            const funcName = document.getElementById('testFuncName').value.trim();
            vscode.postMessage({ command: 'test', functionName: funcName });
          }

          function sendCall() {
            const pkg = document.getElementById('pkg').value;
            const selected = document.getElementById('functionSelect').selectedOptions[0];
            const module = selected.getAttribute('data-mod');
            const func = selected.value;
            const key = module + '::' + func;
            const { typeParams } = argsMapping[key] || { typeParams: [] };

            const argElements = Array.from(document.querySelectorAll('#argsContainer input'));
            const args = argElements.map(input => input.value);

            const typeArgElements = Array.from(document.querySelectorAll('#typeArgsContainer input'));
            const typeArgs = typeArgElements.map(input => input.value);

            vscode.postMessage({ command: 'call', pkg, module, func, args, typeArgs });
          }

          document.getElementById('functionSelect').addEventListener('change', () => {
            const selected = document.getElementById('functionSelect').selectedOptions[0];
            const mod = selected.getAttribute('data-mod');
            const func = selected.value;
            const key = mod + '::' + func;
            const { argTypes, typeParams } = argsMapping[key] || { argTypes: [], typeParams: [] };

            const argsContainer = document.getElementById('argsContainer');
            const typeArgsContainer = document.getElementById('typeArgsContainer');
            argsContainer.innerHTML = '';
            typeArgsContainer.innerHTML = '';

            if (typeParams.length > 0) {
              const typeArgsHeader = document.createElement('b');
              typeArgsHeader.textContent = 'Type Arguments';
              typeArgsHeader.style.display = 'block';
              typeArgsHeader.style.marginBottom = '0.3em';
              typeArgsContainer.appendChild(typeArgsHeader);

              typeParams.forEach((tp, i) => {
                const input = document.createElement('input');
                input.placeholder = tp && tp.length > 0 ? tp : 'TypeArg' + (i + 1);
                typeArgsContainer.appendChild(input);
              });
            }

            if (argTypes.length > 0) {
              const argsHeader = document.createElement('b');
              argsHeader.textContent = 'Arguments';
              argsHeader.style.display = 'block';
              argsHeader.style.marginBottom = '0.3em';
              argsContainer.appendChild(argsHeader);
            }

            argTypes.forEach((type) => {
              const input = document.createElement('input');
              input.placeholder = type;
              argsContainer.appendChild(input);
            });
          });

          // Trigger initial load of inputs for the default selected function
          window.addEventListener('load', () => {
            const functionSelect = document.getElementById('functionSelect');
            if (functionSelect) {
              functionSelect.dispatchEvent(new Event('change'));
            }
          });

          document.getElementById('envSwitcher').addEventListener('change', (e) => {
            const alias = e.target.value;
            vscode.postMessage({ command: 'switch-env', alias });
          });

          document.getElementById('walletSwitcher').addEventListener('change', (e) => {
            const address = e.target.value;
            vscode.postMessage({ command: 'switch-wallet', address });
          });

          document.getElementById('walletAddress').addEventListener('click', () => {
            const walletAddress = '${this.activeWallet}';
            navigator.clipboard.writeText(walletAddress).then(() => {
              vscode.postMessage({ command: 'showCopyNotification' });
            });
          });
        </script>
      </body>
      </html>
    `;
  }
}

export function deactivate() { }
