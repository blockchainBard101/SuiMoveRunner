import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';
import * as toml from 'toml';

function runCommand(command: string, cwd?: string): Promise<string> {
	return new Promise((resolve, reject) => {
		exec(command, { cwd }, (error, stdout, stderr) => {
			if (error) reject(stderr || error.message);
			else resolve(stdout);
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

	resolveWebviewView(view: vscode.WebviewView) {
		this.view = view;
		view.webview.options = { enableScripts: true };
		this.renderHtml(view);

		view.webview.onDidReceiveMessage(async (message) => {
			switch (message.command) {
				case 'create': {
					const name = message.packageName;
					if (!name) return;

					let basePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
					if (!basePath) {
						const folderUris = await vscode.window.showOpenDialog({
							canSelectFiles: false,
							canSelectFolders: true,
							canSelectMany: false,
							openLabel: 'Select folder to create Move package in'
						});
						if (!folderUris || folderUris.length === 0) return;
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

				case 'publish': {
					const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
					if (!workspaceFolder) {
						vscode.window.showErrorMessage('No workspace open');
						return;
					}
					const rootPath = workspaceFolder.uri.fsPath;

					try {
						const output = await runCommand(`sui client publish --json`, rootPath);
						// We no longer save publish_output.json, so no write here
						vscode.window.showInformationMessage(`✅ Published successfully`);
						this.renderHtml(this.view!);
					} catch (err) {
						vscode.window.showErrorMessage(`❌ Failed to publish: ${err}`);
					}
					break;
				}

				case 'call': {
					const { pkg, module, func, args } = message;
					const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
					const rootPath = workspaceFolder?.uri.fsPath;

					const joinedArgs = args.join(' ');
					const callCmd = `sui client call --package ${pkg} --module ${module} --function ${func} --args ${joinedArgs}`;

					try {
						const output = await runCommand(callCmd, rootPath);
						vscode.window.showInformationMessage(`✅ Call Success:\n${output}`);
					} catch (err) {
						vscode.window.showErrorMessage(`❌ Call Failed: ${err}`);
					}
					break;
				}

				case 'switch-env': {
					const alias = message.alias;
					if (!alias) return;

					const exists = this.availableEnvs.some(e => e.alias === alias);
					if (!exists) {
						const rpc = await vscode.window.showInputBox({ prompt: `RPC for new env '${alias}'` });
						if (!rpc) return;
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
					if (!address) return;
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
		if (!s.address || !s.module || !s.name) return 'Unknown';
		const shortAddr = s.address.slice(0, 5) + '...' + s.address.slice(-3);
		return `${shortAddr}::${s.module}::${s.name}`;
	}

	async renderHtml(view: vscode.WebviewView) {
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		const rootPath = workspaceFolder?.uri.fsPath || '';
		const isMoveProject = fs.existsSync(path.join(rootPath, 'Move.toml'));

		let modulesHtml = '';
		let pkg = '';
		let argsMapping: Record<string, string[]> = {};

		try {
			const envOutput = await runCommand(`sui client envs --json`);
			const [envsList, currentEnv] = JSON.parse(envOutput);
			this.activeEnv = currentEnv;
			this.availableEnvs = envsList.map((e: any) => ({ alias: e.alias, rpc: e.rpc }));
		} catch (err) {
			this.activeEnv = 'None';
			this.availableEnvs = [];
		}

		try {
			const addrOutput = await runCommand(`sui client addresses --json`);
			const parsed = JSON.parse(addrOutput);
			this.activeWallet = parsed.activeAddress || '';
			this.wallets = parsed.addresses.map((arr: any[]) => ({ name: arr[0], address: arr[1] }));

			await this.fetchWalletBalance();
		} catch (err) {
			this.activeWallet = 'Unavailable';
			this.wallets = [];
			this.suiBalance = '0';
		}

		try {
			const lockFile = fs.readFileSync(path.join(rootPath, 'Move.lock'), 'utf-8');
			const lockData = toml.parse(lockFile);
			
			const envSection = lockData.env?.[this.activeEnv] || lockData.env?.default || {};

			pkg = envSection['latest-published-id'] || envSection['original-published-id'] || '';

			if (!pkg) {
				throw new Error('Package ID not found in move.lock');
			}

			const response = await fetch('https://fullnode.testnet.sui.io:443', {
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
									if (typeof obj === 'string') return obj;
									if (obj.Struct && obj.Struct.name !== 'TxContext') return this.formatStruct(obj.Struct);
									if (obj.Reference?.Struct && obj.Reference.Struct.name !== 'TxContext') return this.formatStruct(obj.Reference.Struct);
									if (obj.MutableReference?.Struct && obj.MutableReference.Struct.name !== 'TxContext') return this.formatStruct(obj.MutableReference.Struct);
									return null;
								};
								return getName(t);
							}).filter(Boolean) as string[];

							argsMapping[`${modName}::${fname}`] = argTypes;
							return `<option value="${fname}" data-mod="${modName}">${fname}</option>`;
						}
					).join('');
					return `<optgroup label="${modName}">${funcs}</optgroup>`;
				})
				.join('');
		} catch (err) {
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
          body { font-family: sans-serif; padding: 1em; background-color: #1e1e1e; color: white; }
          input, button, select { margin: 0.3em 0; width: 100%; padding: 0.5em; }
          button { background-color: #007acc; color: white; border: none; cursor: pointer; }
          #walletAddress { cursor: pointer; user-select: text; }
        </style>
      </head>
      <body>
        <h3>Sui Move Runner</h3>

        <p><strong>Active Env:</strong> ${this.activeEnv}</p>
        <select id="envSwitcher">${envOptions}</select>

        <p><strong>Wallet:</strong></p>
        <select id="walletSwitcher">
          ${this.wallets.map(w => `
            <option value="${w.address}" ${w.address === this.activeWallet ? 'selected' : ''}>
              ${w.name} - ${w.address.slice(0, 6)}...${w.address.slice(-4)}
            </option>
          `).join('')}
        </select>
        <p>Address: <span id="walletAddress" title="Click to copy">${shortWallet}</span></p>
        <p><strong>Balance:</strong> ${this.suiBalance} SUI</p>

        ${!isMoveProject ? `
          <h4>Create Package</h4>
          <input id="packageName" placeholder="Package name" />
          <button onclick="sendCreate()">📦 Create</button>
        ` : ''}

        ${isMoveProject ? `
          <h4>Publish Package</h4>
          <button onclick="sendPublish()">🚀 Publish</button>
        ` : ''}

        <h4>Call Function</h4>
        <input id="pkg" value="${pkg}" readonly />
        <select id="functionSelect">${modulesHtml}</select>
        <div id="argsContainer"></div>
        <button onclick="sendCall()">🧠 Call</button>

        <script>
          const vscode = acquireVsCodeApi();
          const argsMapping = ${JSON.stringify(argsMapping)};

          function sendCreate() {
            vscode.postMessage({ command: 'create', packageName: document.getElementById('packageName').value });
          }

          function sendPublish() {
            vscode.postMessage({ command: 'publish' });
          }

          function sendCall() {
            const pkg = document.getElementById('pkg').value;
            const selected = document.getElementById('functionSelect').selectedOptions[0];
            const module = selected.getAttribute('data-mod');
            const func = selected.value;
            const argElements = document.querySelectorAll('#argsContainer input');
            const args = Array.from(argElements).map(input => input.value);
            vscode.postMessage({ command: 'call', pkg, module, func, args });
          }

          document.getElementById('functionSelect').addEventListener('change', () => {
            const selected = document.getElementById('functionSelect').selectedOptions[0];
            const mod = selected.getAttribute('data-mod');
            const func = selected.value;
            const key = mod + '::' + func;
            const argTypes = argsMapping[key] || [];
            const container = document.getElementById('argsContainer');
            container.innerHTML = '';
            argTypes.forEach((type) => {
              const input = document.createElement('input');
              input.placeholder = type;
              container.appendChild(input);
            });
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
