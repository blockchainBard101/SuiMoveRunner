import * as vscode from "vscode";
import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import fetch from "node-fetch";
import * as toml from "toml";
import { getWebviewContent, GasCoin } from "./webviewTemplate";
import { CoinPortfolio, CoinBalance, CoinObject, CoinMetadata, MoveProject } from "./webview/types";

// RPC Helper functions for faster operations
async function makeRpcCall(rpcUrl: string, method: string, params: any[] = []): Promise<any> {
  try {
    console.log(`Making RPC call: ${method} to ${rpcUrl}`);
    
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method,
        params,
      }),
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`RPC call failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    if (data.error) {
      throw new Error(`RPC error: ${data.error.message}`);
    }
    
    console.log(`RPC call successful: ${method}`);
    return data.result;
  } catch (error) {
    console.error(`RPC call failed for ${method} to ${rpcUrl}:`, error);
    throw error;
  }
}

async function getWalletBalanceRpc(rpcUrl: string, address: string): Promise<{ balance: string; gasCoins: GasCoin[] }> {
  try {
    console.log(`Fetching balance for address ${address} via RPC ${rpcUrl}`);
    
    let totalMistBalance = 0;
    const gasCoins: GasCoin[] = [];
    
    // Try suix_getBalance first (more specific)
    try {
      const suiBalance = await makeRpcCall(rpcUrl, "suix_getBalance", [address, "0x2::sui::SUI"]);
      console.log("SUI balance response:", suiBalance);
      
      if (suiBalance && suiBalance.totalBalance) {
        totalMistBalance = parseInt(suiBalance.totalBalance.toString());
      }
    } catch (balanceError) {
      console.log("suix_getBalance failed, trying suix_getAllBalances:", balanceError);
      
      // Fallback to suix_getAllBalances
      const balances = await makeRpcCall(rpcUrl, "suix_getAllBalances", [address]);
      console.log("All balances response:", balances);
      
      // Find SUI balance
      const suiBalance = balances.find((b: any) => b.coinType === "0x2::sui::SUI");
      if (suiBalance) {
        totalMistBalance = parseInt(suiBalance.totalBalance || "0");
      }
    }
    
    // Get all coins for detailed gas coin information
    const coins = await makeRpcCall(rpcUrl, "suix_getAllCoins", [address, null, 100]);
    console.log("Coins response:", coins);
    
    if (coins.data) {
      coins.data.forEach((coin: any) => {
        if (coin.coinType === "0x2::sui::SUI" && coin.balance) {
          const mistBalance = parseInt(coin.balance);
          gasCoins.push({
            gasCoinId: coin.coinObjectId,
            mistBalance: mistBalance,
            suiBalance: (mistBalance / 1e9).toFixed(6),
          });
        }
      });
    }
    
    console.log(`Total balance: ${totalMistBalance} MIST, Gas coins: ${gasCoins.length}`);
    
    return {
      balance: (totalMistBalance / 1e9).toFixed(6),
      gasCoins,
    };
  } catch (error) {
    console.error("Failed to fetch wallet balance via RPC:", error);
    throw error;
  }
}

async function checkRpcHealth(rpcUrl: string): Promise<boolean> {
  try {
    console.log(`Checking RPC health for ${rpcUrl}`);
    await makeRpcCall(rpcUrl, "sui_getLatestCheckpointSequenceNumber", []);
    console.log(`RPC health check passed for ${rpcUrl}`);
    return true;
  } catch (error) {
    console.log(`RPC health check failed for ${rpcUrl}:`, error);
    return false;
  }
}

async function getCoinPortfolio(rpcUrl: string, address: string): Promise<CoinPortfolio> {
  try {
    console.log(`Fetching coin portfolio for address ${address} via RPC ${rpcUrl}`);
    
    // Get all balances
    const balances = await makeRpcCall(rpcUrl, "suix_getAllBalances", [address]);
    console.log("All balances response:", balances);
    
    // Get all coins with pagination
    const coinObjects: Record<string, CoinObject[]> = {};
    let cursor: string | null = null;
    let hasNextPage = true;
    
    while (hasNextPage) {
      const coinsResponse = await makeRpcCall(rpcUrl, "suix_getAllCoins", [address, cursor, 100]);
      console.log("Coins response:", coinsResponse);
      
      if (coinsResponse.data) {
        coinsResponse.data.forEach((coin: any) => {
          const coinType = coin.coinType;
          if (!coinObjects[coinType]) {
            coinObjects[coinType] = [];
          }
          coinObjects[coinType].push({
            coinType: coin.coinType,
            coinObjectId: coin.coinObjectId,
            version: coin.version,
            digest: coin.digest,
            balance: coin.balance,
            previousTransaction: coin.previousTransaction,
          });
        });
      }
      
      cursor = coinsResponse.nextCursor;
      hasNextPage = coinsResponse.hasNextPage;
    }
    
    // Get metadata for each coin type
    const metadata: Record<string, CoinMetadata> = {};
    const uniqueCoinTypes = [...new Set(Object.keys(coinObjects))];
    
    for (const coinType of uniqueCoinTypes) {
      try {
        console.log(`Fetching metadata for coin type: ${coinType}`);
        const coinMetadata = await makeRpcCall(rpcUrl, "suix_getCoinMetadata", [coinType]);
        console.log(`Metadata for ${coinType}:`, coinMetadata);
        metadata[coinType] = {
          decimals: coinMetadata.decimals,
          name: coinMetadata.name,
          symbol: coinMetadata.symbol,
          description: coinMetadata.description,
          iconUrl: coinMetadata.iconUrl,
          id: coinMetadata.id,
        };
      } catch (error) {
        console.log(`Failed to get metadata for ${coinType}:`, error);
        // Provide default metadata with better defaults
        const coinName = coinType.split('::').pop() || 'Unknown';
        let defaultDecimals = 9; // Default for SUI
        
        // Special handling for common tokens
        if (coinType.toLowerCase().includes('usdc')) {
          defaultDecimals = 6;
        } else if (coinType.toLowerCase().includes('usdt')) {
          defaultDecimals = 6;
        } else if (coinType.toLowerCase().includes('weth')) {
          defaultDecimals = 18;
        }
        
        metadata[coinType] = {
          decimals: defaultDecimals,
          name: coinName,
          symbol: coinName,
          description: 'No description available',
          iconUrl: null,
          id: null,
        };
      }
    }
    
    console.log(`Coin portfolio fetched: ${balances.length} coin types, ${Object.keys(coinObjects).length} coin types with objects`);
    
    return {
      balances: balances.map((balance: any) => ({
        coinType: balance.coinType,
        coinObjectCount: balance.coinObjectCount,
        totalBalance: balance.totalBalance,
        lockedBalance: balance.lockedBalance || "0",
      })),
      coinObjects,
      metadata,
    };
  } catch (error) {
    console.error("Failed to fetch coin portfolio via RPC:", error);
    throw error;
  }
}

function runCommand(command: string, cwd?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Use proper shell for Windows compatibility
    const isWindows = process.platform === 'win32';
    
    exec(command, { 
      cwd, 
      shell: isWindows ? 'cmd.exe' : undefined
    }, (error: any, stdout: any, stderr: any) => {
      if (error) {
        reject(stderr || error.message);
      } else {
        resolve(stdout);
      }
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

async function getSuiVersion(): Promise<string | null> {
  try {
    const output = await runCommand('sui --version');
    // Extract version from output like "sui 1.18.0-rc.0" or "sui 1.55.0-homebrew"
    const match = output.match(/sui\s+([\d.]+(?:-[\w.]+)?)/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error getting Sui version:', error);
    return null;
  }
}

async function getLatestSuiVersion(): Promise<string | null> {
  try {
    const response = await fetch('https://api.github.com/repos/MystenLabs/sui/releases/latest');
    const data = await response.json();
    // Extract version from tag name like "mainnet-v1.18.0" or "testnet-v1.56.1"
    const match = data.tag_name?.match(/(?:mainnet|testnet)-v([\d.]+)/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error getting latest version:', error);
    return null;
  }
}

function compareVersions(current: string, latest: string): boolean {
  // Simple version comparison - returns true if current is outdated
  // Strip any suffixes like "-homebrew", "-rc.0", etc.
  const cleanCurrent = current.split('-')[0];
  const cleanLatest = latest.split('-')[0];
  
  const currentParts = cleanCurrent.split('.').map(Number);
  const latestParts = cleanLatest.split('.').map(Number);
  
  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const currentPart = currentParts[i] || 0;
    const latestPart = latestParts[i] || 0;
    
    if (currentPart < latestPart) {
      return true;
    }
    if (currentPart > latestPart) {
      return false;
    }
  }
  
  return false;
}

// Move project detection functions
function isMoveProject(directoryPath: string): boolean {
  const moveTomlPath = path.join(directoryPath, "Move.toml");
  return fs.existsSync(moveTomlPath);
}

async function scanForMoveProjects(rootPath: string, maxDepth: number = 3): Promise<MoveProject[]> {
  const moveProjects: MoveProject[] = [];
  
  async function scanDirectory(currentPath: string, currentDepth: number, relativePath: string = ""): Promise<void> {
    if (currentDepth > maxDepth) {
      return;
    }
    
    try {
      const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const fullPath = path.join(currentPath, entry.name);
          const newRelativePath = relativePath ? path.join(relativePath, entry.name) : entry.name;
          
          // Check if this directory is a Move project
          if (isMoveProject(fullPath)) {
            moveProjects.push({
              path: fullPath,
              name: entry.name,
              relativePath: newRelativePath
            });
          } else {
            // Recursively scan subdirectories
            await scanDirectory(fullPath, currentDepth + 1, newRelativePath);
          }
        }
      }
    } catch (error) {
      console.log(`Error scanning directory ${currentPath}:`, error);
    }
  }
  
  await scanDirectory(rootPath, 0);
  return moveProjects;
}

export function activate(context: vscode.ExtensionContext) {
  try {
    const provider = new SuiRunnerSidebar(context.extensionUri);
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider("suiRunner.sidebarView", provider)
    );
    
    // Register commands
    context.subscriptions.push(
      vscode.commands.registerCommand('suimoverunner.createMovePackage', () => {
        vscode.window.showInformationMessage('Sui Move Package creation triggered from command palette');
      })
    );
    
    context.subscriptions.push(
      vscode.commands.registerCommand('suimoverunner.publishMovePackage', () => {
        vscode.window.showInformationMessage('Sui Move Package publish triggered from command palette');
      })
    );
    
    context.subscriptions.push(
      vscode.commands.registerCommand('suimoverunner.callMoveFunction', () => {
        vscode.window.showInformationMessage('Sui Move Function call triggered from command palette');
      })
    );
    
    console.log('SuiMoveRunner extension activated successfully');
  } catch (error) {
    console.error('Failed to activate SuiMoveRunner extension:', error);
    vscode.window.showErrorMessage('Failed to activate SuiMoveRunner extension. Check the console for details.');
  }
}

class SuiRunnerSidebar implements vscode.WebviewViewProvider {
  view?: vscode.WebviewView;
  private activeEnv: string = "";
  private availableEnvs: { alias: string; rpc: string }[] = [];
  private activeWallet: string = "";
  private wallets: { name: string; address: string }[] = [];
  private suiBalance: string = "0";
  private gasCoins: GasCoin[] = [];
  private coinPortfolio: CoinPortfolio | null = null;
  private _extensionUri: vscode.Uri;
  private suiVersion: string = "";
  private latestSuiVersion: string = "";
  private isSuiOutdated: boolean = false;
  private foundMoveProjects: MoveProject[] = [];
  private activeMoveProjectRoot: string = "";

  // Add this property for default envs
  private defaultEnvs = [
    { alias: "localnet", rpc: "http://127.0.0.1:9000" },
    { alias: "testnet", rpc: "https://fullnode.testnet.sui.io:443" },
    { alias: "devnet", rpc: "https://fullnode.devnet.sui.io:443" },
    { alias: "mainnet", rpc: "https://fullnode.mainnet.sui.io:443" },
  ];

  constructor(extensionUri: vscode.Uri) {
    this._extensionUri = extensionUri;
  }

  private safeJsonParse(output: string): any {
    // Some CLI outputs include warnings before the JSON. Try to find the first JSON start.
    const firstBrace = output.indexOf('{');
    const firstBracket = output.indexOf('[');
    let start = -1;
    if (firstBrace !== -1 && firstBracket !== -1) {
      start = Math.min(firstBrace, firstBracket);
    } else {
      start = Math.max(firstBrace, firstBracket);
    }
    const candidate = start > -1 ? output.slice(start) : output;
    try {
      return JSON.parse(candidate);
    } catch {
      // As a fallback, try to strip lines that don't look like JSON
      const lines = output.split('\n').filter(l => l.trim().startsWith('{') || l.trim().startsWith('[') || l.trim().startsWith(']') || l.trim().startsWith('}'));
      const joined = lines.join('\n');
      return JSON.parse(joined);
    }
  }

  private generateUpgradeToml(data: any): string {
    let tomlContent = "# Sui Move Package Upgrade Capabilities\n";
    tomlContent +=
      "# This file tracks upgrade capabilities across different networks\n\n";

    if (data.environments) {
      Object.entries(data.environments).forEach(
        ([env, envData]: [string, any]) => {
          tomlContent += `[environments.${env}]\n`;
          tomlContent += `upgrade_cap = "${envData.upgrade_cap}"\n`;
          tomlContent += `package_id = "${envData.package_id}"\n`;
          if (envData.network_rpc) {
            tomlContent += `network_rpc = "${envData.network_rpc}"\n`;
          }
          if (envData.created_at) {
            tomlContent += `created_at = "${envData.created_at}"\n`;
          }
          if (envData.updated_at) {
            tomlContent += `updated_at = "${envData.updated_at}"\n`;
          }
          tomlContent += "\n";
        }
      );
    }

    return tomlContent;
  }

  async getKeyIdentityForAddress(address: string): Promise<string | null> {
    try {
      // Get all addresses to find the key identity
      const output = await runCommand('sui client addresses --json');
      const parsed = this.safeJsonParse(output);
      
      // The addresses format is an array of arrays: [alias, address]
      // The key identity is the alias (first element)
      if (parsed.addresses && Array.isArray(parsed.addresses)) {
        const wallet = parsed.addresses.find((addr: any[]) => addr[1] === address);
        return wallet?.[0] || null; // keyIdentity is the alias at index 0
      }
      
      console.error('Unexpected addresses response format:', parsed);
      return null;
    } catch (error) {
      console.error('Error getting key identity:', error);
      return null;
    }
  }

  async refreshWallets() {
    try {
      const addrOutput = await runCommand(`sui client addresses --json`);
      const parsed = this.safeJsonParse(addrOutput);
      this.activeWallet = parsed.activeAddress || "";
      this.wallets = parsed.addresses.map((arr: any[]) => ({
        name: arr[0],
        address: arr[1],
      }));
      await this.fetchWalletBalance();
    } catch {
      this.activeWallet = "Unavailable";
      this.wallets = [];
      this.suiBalance = "0";
    }
  }

  async refreshEnvs() {
    try {
      const envOutput = await runCommand(`sui client envs --json`);
      const [envsList, currentEnv] = this.safeJsonParse(envOutput);
      this.activeEnv = currentEnv;

      // Merge defaultEnvs with user's envs, avoiding duplicates
      const userEnvs = envsList.map((e: any) => ({
        alias: e.alias,
        rpc: e.rpc,
      }));
      const merged = [...this.defaultEnvs];
      for (const env of userEnvs) {
        if (!merged.some((e) => e.alias === env.alias)) {
          merged.push(env);
        }
      }
      this.availableEnvs = merged;
      
      // Verify current environment is healthy via RPC
      if (this.activeEnv && this.activeEnv !== "None") {
        const currentRpc = this.availableEnvs.find(e => e.alias === this.activeEnv)?.rpc;
        if (currentRpc) {
          const isHealthy = await checkRpcHealth(currentRpc);
          if (!isHealthy) {
            console.warn(`Environment ${this.activeEnv} appears to be unhealthy`);
          }
        }
      }
    } catch {
      this.activeEnv = "None";
      this.availableEnvs = [...this.defaultEnvs];
    }
  }

  async renderUpgradeCapInfo(rootPath: string, pkg: string) {
    const upgradeTomlPath = path.join(rootPath, "upgrade.toml");
    if (!fs.existsSync(upgradeTomlPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(upgradeTomlPath, "utf-8");
      const info = toml.parse(content);

      // Check if current environment has upgrade info
      const envData = info.environments?.[this.activeEnv] || info.upgrade; // fallback to old format

      if (envData?.packageId === pkg || envData?.package_id === pkg) {
        return {
          upgradeCap: envData.upgradeCap || envData.upgrade_cap,
          packageId: envData.packageId || envData.package_id,
        };
      }
    } catch {}
    return null;
  }

  async isLocalnetRunning(): Promise<boolean> {
    try {
      return await checkRpcHealth("http://127.0.0.1:9000");
    } catch {
      return false;
    }
  }

  async checkSuiVersion() {
    try {
      const currentVersion = await getSuiVersion();
      const latestVersion = await getLatestSuiVersion();
      
      this.suiVersion = currentVersion || "Unknown";
      this.latestSuiVersion = latestVersion || "Unknown";
      
      if (currentVersion && latestVersion) {
        this.isSuiOutdated = compareVersions(currentVersion, latestVersion);
      } else {
        this.isSuiOutdated = false;
      }
    } catch (error) {
      console.error("Failed to check Sui version:", error);
      this.suiVersion = "Unknown";
      this.latestSuiVersion = "Unknown";
      this.isSuiOutdated = false;
    }
  }

  async scanForMoveProjects() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      this.foundMoveProjects = [];
      return;
    }

    const rootPath = workspaceFolder.uri.fsPath;
    this.foundMoveProjects = await scanForMoveProjects(rootPath);
    
    // Set active project root to the first found project if none is set
    if (this.foundMoveProjects.length > 0 && !this.activeMoveProjectRoot) {
      this.activeMoveProjectRoot = this.foundMoveProjects[0].path;
    }
  }

  async resolveWebviewView(view: vscode.WebviewView) {
    this.view = view;
    view.webview.options = { enableScripts: true };
    
    // Scan for Move projects on activation
    await this.scanForMoveProjects();
    
    this.renderHtml(view);

    view.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case "create": {
          const name = message.packageName;
          if (!name) {
            return;
          }

          const packageNameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
          if (!packageNameRegex.test(name)) {
            vscode.window.showErrorMessage(
              "Invalid package name. Please use only letters, numbers, and underscores, and start with a letter."
            );
            view.webview.postMessage({ command: "showWarning" });
            return;
          }

          let basePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
          if (!basePath) {
            const folderUris = await vscode.window.showOpenDialog({
              canSelectFiles: false,
              canSelectFolders: true,
              canSelectMany: false,
              openLabel: "Select folder to create Move package in",
            });
            if (!folderUris || folderUris.length === 0) {
              return;
            }
            basePath = folderUris[0].fsPath;
          }

          const targetPath = path.join(basePath, name);
          try {
            await runCommand(`sui move new ${name}`, basePath);
            await waitForFolder(targetPath, 2000);
            vscode.commands.executeCommand(
              "vscode.openFolder",
              vscode.Uri.file(targetPath),
              true
            );
          } catch (err) {
            vscode.window.showErrorMessage(
              `❌ Failed to create package: ${err}`
            );
          }
          break;
        }

        case "build": {
          const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
          if (!workspaceFolder) {
            vscode.window.showErrorMessage("No workspace open");
            return;
          }
          const rootPath = this.activeMoveProjectRoot || workspaceFolder.uri.fsPath;

          const terminal = vscode.window.createTerminal({
            name: "Sui Move Build",
          });
          terminal.show(true);
          const isWindows = process.platform === 'win32';
          const buildCmd = isWindows 
            ? `cd /d "${rootPath}" && sui move build`
            : `cd "${rootPath}" && sui move build`;
          terminal.sendText(buildCmd, true);

          vscode.window.showInformationMessage(
            `🛠️ Running 'sui move build' in ${rootPath}...`
          );

          break;
        }

        case "publish": {
          const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
          if (!workspaceFolder) {
            vscode.window.showErrorMessage("No workspace open");
            return;
          }
          const rootPath = this.activeMoveProjectRoot || workspaceFolder.uri.fsPath;
          const outputChannel =
            vscode.window.createOutputChannel("Sui Move Publish");
          outputChannel.show(true);
          outputChannel.appendLine(
            `Running 'sui client publish' in ${rootPath}...\n`
          );

          try {
            const isWindows = process.platform === 'win32';
            const publishProcess = exec(`sui client publish`, {
              cwd: rootPath,
              shell: isWindows ? 'cmd.exe' : undefined,
            });
            let fullOutput = "";

            publishProcess.stdout?.on("data", (data) => {
              fullOutput += data.toString();
              outputChannel.append(data.toString());
            });

            publishProcess.stderr?.on("data", (data) => {
              fullOutput += data.toString();
              outputChannel.append(data.toString());
            });

            publishProcess.on("close", async (code) => {
              if (code === 0) {
                vscode.window.showInformationMessage(
                  '✅ Publish succeeded, see "Sui Move Publish" output.'
                );

                // Extract UpgradeCap ObjectID
                const lines = fullOutput.split("\n");
                let upgradeCapId = "";

                for (let i = 0; i < lines.length; i++) {
                  if (
                    lines[i].includes("ObjectType: 0x2::package::UpgradeCap")
                  ) {
                    for (let j = i - 1; j >= 0; j--) {
                      const idMatch = lines[j].match(
                        /ObjectID:\s*(0x[a-fA-F0-9]+)/
                      );
                      if (idMatch) {
                        upgradeCapId = idMatch[1];
                        break;
                      }
                    }
                    if (upgradeCapId) {
                      break;
                    }
                  }
                }

                // Extract package ID from Move.lock for current env
                let pkg = "";
                try {
                  const lockFile = fs.readFileSync(
                    path.join(rootPath, "Move.lock"),
                    "utf-8"
                  );
                  const lockData = toml.parse(lockFile);
                  const envSection =
                    lockData.env?.[this.activeEnv] ||
                    lockData.env?.default ||
                    {};
                  pkg =
                    envSection["latest-published-id"] ||
                    envSection["original-published-id"] ||
                    "";
                } catch {
                  pkg = "";
                }

                if (upgradeCapId && pkg) {
                  const upgradeTomlPath = path.join(rootPath, "upgrade.toml");

                  // Read existing upgrade.toml or create new structure
                  let upgradeData: any = { environments: {} };
                  if (fs.existsSync(upgradeTomlPath)) {
                    try {
                      const existingContent = fs.readFileSync(
                        upgradeTomlPath,
                        "utf-8"
                      );
                      const existingData = toml.parse(existingContent);

                      // Migrate old format to new format if needed
                      if (existingData.upgrade && !existingData.environments) {
                        const oldEnv =
                          existingData.upgrade.environment || "unknown";
                        upgradeData.environments = {
                          [oldEnv]: {
                            upgrade_cap:
                              existingData.upgrade.upgrade_cap ||
                              existingData.upgrade.upgradeCap,
                            package_id:
                              existingData.upgrade.package_id ||
                              existingData.upgrade.packageId,
                            created_at: existingData.upgrade.created_at,
                            updated_at: existingData.upgrade.updated_at,
                          },
                        };
                      } else {
                        upgradeData = existingData;
                      }
                    } catch {
                      upgradeData = { environments: {} };
                    }
                  }

                  // Ensure environments object exists
                  if (!upgradeData.environments) {
                    upgradeData.environments = {};
                  }

                  // Add or update current environment
                  upgradeData.environments[this.activeEnv] = {
                    upgrade_cap: upgradeCapId,
                    package_id: pkg,
                    created_at: new Date().toISOString(),
                    network_rpc:
                      this.availableEnvs.find((e) => e.alias === this.activeEnv)
                        ?.rpc || "",
                  };

                  // Convert to TOML format
                  const upgradeTomlContent =
                    this.generateUpgradeToml(upgradeData);
                  fs.writeFileSync(upgradeTomlPath, upgradeTomlContent);

                  vscode.window.showInformationMessage(
                    `📄 UpgradeCap saved to upgrade.toml for ${this.activeEnv}: ${upgradeCapId}`
                  );
                } else {
                  vscode.window.showWarningMessage(
                    "⚠️ Could not find UpgradeCap or package ID in publish output."
                  );
                }

                this.renderHtml(this.view!);
              } else {
                vscode.window.showErrorMessage(
                  `❌ Publish failed with exit code ${code}, see "Sui Move Publish" output.`
                );
              }
            });
          } catch (err) {
            vscode.window.showErrorMessage(`❌ Failed to run publish: ${err}`);
          }
          break;
        }

        case "upgrade": {
          const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
          if (!workspaceFolder) {
            vscode.window.showErrorMessage("No workspace open");
            return;
          }
          const rootPath = this.activeMoveProjectRoot || workspaceFolder.uri.fsPath;
          const upgradeTomlPath = path.join(rootPath, "upgrade.toml");

          if (!fs.existsSync(upgradeTomlPath)) {
            vscode.window.showErrorMessage(
              "⚠️ No upgrade capability found. Please publish first."
            );
            break;
          }

          let upgradeCapInfo;
          let upgradeData: any;

          try {
            const content = fs.readFileSync(upgradeTomlPath, "utf-8");
            upgradeData = toml.parse(content);

            // Get upgrade info for current environment
            const envData =
              upgradeData.environments?.[this.activeEnv] || upgradeData.upgrade; // fallback to old format

            if (!envData) {
              vscode.window.showErrorMessage(
                `⚠️ No upgrade capability found for environment: ${this.activeEnv}`
              );
              break;
            }

            upgradeCapInfo = {
              upgradeCap: envData.upgrade_cap || envData.upgradeCap,
              packageId: envData.package_id || envData.packageId,
            };
          } catch {
            vscode.window.showErrorMessage("⚠️ Invalid upgrade.toml content.");
            break;
          }

          const outputChannel =
            vscode.window.createOutputChannel("Sui Move Upgrade");
          outputChannel.show(true);
          outputChannel.appendLine(
            `Running 'sui client upgrade --upgrade-capability ${upgradeCapInfo.upgradeCap}' in ${rootPath}...\n`
          );

          try {
            const isWindows = process.platform === 'win32';
            const upgradeProcess = exec(
              `sui client upgrade --upgrade-capability ${upgradeCapInfo.upgradeCap}`,
              { 
                cwd: rootPath,
                shell: isWindows ? 'cmd.exe' : undefined,
              }
            );

            let fullOutput = "";

            upgradeProcess.stdout?.on("data", (data) => {
              fullOutput += data.toString();
              outputChannel.append(data.toString());
            });

            upgradeProcess.stderr?.on("data", (data) => {
              fullOutput += data.toString();
              outputChannel.append(data.toString());
            });

            upgradeProcess.on("close", async (code) => {
              if (code === 0) {
                vscode.window.showInformationMessage(
                  '✅ Upgrade succeeded, see "Sui Move Upgrade" output.'
                );

                // Extract new UpgradeCap ObjectID from output
                const lines = fullOutput.split("\n");
                let newUpgradeCapId = "";

                for (let i = 0; i < lines.length; i++) {
                  if (
                    lines[i].includes("ObjectType: 0x2::package::UpgradeCap")
                  ) {
                    for (let j = i - 1; j >= 0; j--) {
                      const idMatch = lines[j].match(
                        /ObjectID:\s*(0x[a-fA-F0-9]+)/
                      );
                      if (idMatch) {
                        newUpgradeCapId = idMatch[1];
                        break;
                      }
                    }
                    if (newUpgradeCapId) {
                      break;
                    }
                  }
                }

                // Extract latest package ID from Move.lock
                let pkg = "";
                try {
                  const lockFile = fs.readFileSync(
                    path.join(rootPath, "Move.lock"),
                    "utf-8"
                  );
                  const lockData = toml.parse(lockFile);
                  const envSection =
                    lockData.env?.[this.activeEnv] ||
                    lockData.env?.default ||
                    {};
                  pkg =
                    envSection["latest-published-id"] ||
                    envSection["original-published-id"] ||
                    "";
                } catch {
                  pkg = "";
                }

                if (newUpgradeCapId && pkg) {
                  // Ensure environments object exists
                  if (!upgradeData.environments) {
                    upgradeData.environments = {};
                  }

                  // Update current environment with new upgrade cap
                  upgradeData.environments[this.activeEnv] = {
                    ...upgradeData.environments[this.activeEnv], // preserve existing data
                    upgrade_cap: newUpgradeCapId,
                    package_id: pkg,
                    updated_at: new Date().toISOString(),
                    network_rpc:
                      this.availableEnvs.find((e) => e.alias === this.activeEnv)
                        ?.rpc || "",
                  };

                  // Convert to TOML format and save
                  const upgradeTomlContent =
                    this.generateUpgradeToml(upgradeData);
                  fs.writeFileSync(upgradeTomlPath, upgradeTomlContent);

                  vscode.window.showInformationMessage(
                    `📄 UpgradeCap updated in upgrade.toml for ${this.activeEnv}: ${newUpgradeCapId}`
                  );
                } else {
                  vscode.window.showWarningMessage(
                    "⚠️ Could not find UpgradeCap or package ID in upgrade output."
                  );
                }

                this.renderHtml(this.view!);
              } else {
                vscode.window.showErrorMessage(
                  `❌ Upgrade failed with exit code ${code}, see "Sui Move Upgrade" output.`
                );
              }
            });
          } catch (err) {
            vscode.window.showErrorMessage(`❌ Failed to run upgrade: ${err}`);
          }
          break;
        }

        case "test": {
          const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
          if (!workspaceFolder) {
            vscode.window.showErrorMessage("No workspace open");
            return;
          }
          const rootPath = this.activeMoveProjectRoot || workspaceFolder.uri.fsPath;
          const funcName = message.functionName?.trim() || "";

          const terminal = vscode.window.createTerminal({
            name: "Sui Move Test",
          });
          terminal.show(true);

          let cmd = "sui move test";
          if (funcName) {
            cmd += ` ${funcName}`;
          }
          const isWindows = process.platform === 'win32';
          const testCmd = isWindows 
            ? `cd /d "${rootPath}" && ${cmd}`
            : `cd "${rootPath}" && ${cmd}`;
          terminal.sendText(testCmd, true);

          vscode.window.showInformationMessage(
            `🧪 Running '${cmd}' in ${rootPath}...`
          );

          break;
        }

        case "call": {
          const { pkg, module, func, args, typeArgs } = message;
          const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
          if (!workspaceFolder) {
            vscode.window.showErrorMessage("No workspace open");
            return;
          }
          const rootPath = this.activeMoveProjectRoot || workspaceFolder.uri.fsPath;

          let callCmd = `sui client call --package ${pkg} --module ${module} --function ${func}`;

          if (typeArgs && typeArgs.length > 0) {
            callCmd += " --type-args " + typeArgs.join(" ");
          }
          if (args && args.length > 0) {
            callCmd += " --args " + args.join(" ");
          }

          const terminal = vscode.window.createTerminal({
            name: "Sui Move Call",
          });
          terminal.show(true);
          const isWindows = process.platform === 'win32';
          const callCmdFinal = isWindows 
            ? `cd /d "${rootPath}" && ${callCmd}`
            : `cd "${rootPath}" && ${callCmd}`;
          terminal.sendText(callCmdFinal, true);

          vscode.window.showInformationMessage(
            `🧠 Running '${callCmd}' in ${rootPath}...`
          );

          break;
        }

        case "switch-env": {
          const alias = message.env || message.alias; // support both keys for compatibility
          if (!alias) {
            return;
          }

          this.view?.webview.postMessage({
            command: "set-status",
            message: `Changing environment to ${alias}...`,
          });
          vscode.window.showInformationMessage(
            `Changing environment to ${alias}...`
          );

          try {
            // Check if environment exists in default environments
            const isDefaultEnv = this.defaultEnvs.some((e) => e.alias === alias);
            
            // Check if environment exists in user's Sui client
            let envExists = false;
            try {
              const envOutput = await runCommand(`sui client envs --json`);
              const [envsList] = JSON.parse(envOutput);
              envExists = envsList.some((e: any) => e.alias === alias);
            } catch {
              // If we can't check, assume it doesn't exist
              envExists = false;
            }

            if (alias === "localnet") {
              const running = await this.isLocalnetRunning();
              if (!running) {
                vscode.window.showInformationMessage(
                  "🟢 Starting Sui local network in new terminal..."
                );
                const terminal = vscode.window.createTerminal({
                  name: "Sui Local Network",
                });
                terminal.show(true);
                const isWindows = process.platform === 'win32';
                const localnetCmd = isWindows 
                  ? 'set RUST_LOG=off,sui_node=info && sui start --with-faucet --force-regenesis'
                  : 'RUST_LOG="off,sui_node=info" sui start --with-faucet --force-regenesis';
                terminal.sendText(localnetCmd, true);
                // Wait a few seconds for the node to start
                await new Promise((res) => setTimeout(res, 6000));
              }
            }

            // If environment doesn't exist in Sui client, create it
            if (!envExists) {
              let rpc = "";
              
              if (isDefaultEnv) {
                // Use the default RPC for predefined environments
                const defaultEnv = this.defaultEnvs.find((e) => e.alias === alias);
                rpc = defaultEnv?.rpc || "";
              } else {
                // Ask user for RPC for custom environments
                const userRpc = await vscode.window.showInputBox({
                  prompt: `RPC for new env '${alias}'`,
                });
                if (!userRpc) {
                  this.view?.webview.postMessage({
                    command: "set-status",
                    message: "",
                  });
                  return;
                }
                rpc = userRpc;
              }

              if (rpc) {
                await runCommand(
                  `sui client new-env --alias ${alias} --rpc ${rpc}`
                );
                vscode.window.showInformationMessage(
                  `✅ Created new environment: ${alias}`
                );
              }
            }

            // Now switch to the environment
            await runCommand(`sui client switch --env ${alias}`);

            await this.refreshEnvs();
            await this.refreshWallets();

            this.view?.webview.postMessage({
              command: "switch-env-done",
              alias,
            });
            vscode.window.showInformationMessage(
              `🔄 Switched to env: ${alias}`
            );
            this.renderHtml(this.view!);
          } catch (err) {
            this.view?.webview.postMessage({
              command: "set-status",
              message: "",
            });
            vscode.window.showErrorMessage(`❌ Failed to switch env: ${err}`);
          }

          break;
        }

        case "switch-wallet": {
          const address = message.address;
          if (!address) {
            return;
          }
          const shortAddress = address.slice(0, 6) + "..." + address.slice(-4);
          this.view?.webview.postMessage({
            command: "set-status",
            message: `Changing wallet to ${shortAddress}...`,
          });
          vscode.window.showInformationMessage(
            `Changing wallet to ${shortAddress}...`
          );

          try {
            await runCommand(`sui client switch --address ${address}`);

            await this.refreshWallets();
            const shortAddress =
              address.slice(0, 6) + "..." + address.slice(-4);
            this.view?.webview.postMessage({
              command: "switch-wallet-done",
              address,
            });
            vscode.window.showInformationMessage(
              `💻 Switched wallet to ${address}`
            );
            this.renderHtml(this.view!);
          } catch (err) {
            this.view?.webview.postMessage({
              command: "set-status",
              message: "",
            });
            vscode.window.showErrorMessage(
              `❌ Failed to switch wallet: ${err}`
            );
          }
          break;
        }

        case "create-address": {
          try {
            const keyScheme = await vscode.window.showQuickPick(
              ["ed25519", "secp256k1", "secp256r1"],
              { placeHolder: "Select key scheme for new address" }
            );
            if (!keyScheme) {
              vscode.window.showWarningMessage("Address creation cancelled.");
              break;
            }
            const output = await runCommand(
              `sui client new-address ${keyScheme} --json`
            );
            const parsed = JSON.parse(output);

            await this.refreshWallets();
            vscode.window.showInformationMessage(
              `✅ New address created:\nAlias: ${parsed.alias}\nAddress: ${parsed.address}\nRecovery Phrase: ${parsed.recoveryPhrase}`
            );
            this.renderHtml(this.view!);
          } catch (err) {
            vscode.window.showErrorMessage(
              `❌ Failed to create new address: ${err}`
            );
          }
          break;
        }

        case "export-wallet": {
          try {
            if (this.wallets.length === 0) {
              vscode.window.showErrorMessage("❌ No wallets available to export.");
              break;
            }

            // Create wallet selection options
            const walletOptions = this.wallets.map(wallet => ({
              label: `${wallet.name} - ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`,
              description: wallet.address,
              address: wallet.address
            }));

            // Show wallet selection dropdown
            const selectedWallet = await vscode.window.showQuickPick(walletOptions, {
              placeHolder: "Select wallet to export",
              title: "Export Wallet"
            });

            if (!selectedWallet) {
              vscode.window.showInformationMessage("Wallet export cancelled.");
              break;
            }

            const walletAddress = selectedWallet.address;

            // Show security warning before export
            const warningAction = await vscode.window.showWarningMessage(
              `⚠️ Security Warning: Exporting Private Key\n\n` +
              `You are about to export the private key for wallet:\n` +
              `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}\n\n` +
              `⚠️ IMPORTANT SECURITY NOTICE:\n` +
              `• This private key gives FULL ACCESS to your wallet\n` +
              `• Anyone with this key can steal ALL your funds\n` +
              `• Never share this key with anyone\n` +
              `• Store it securely and offline\n` +
              `• Consider using a hardware wallet for better security\n\n` +
              `Are you sure you want to continue?`,
              { modal: true },
              "Yes, I understand the risks",
              "Cancel"
            );

            if (warningAction !== "Yes, I understand the risks") {
              vscode.window.showInformationMessage("Wallet export cancelled for security.");
              break;
            }

            // Get the key identity for the selected wallet
            const keyIdentity = await this.getKeyIdentityForAddress(walletAddress);
            if (!keyIdentity) {
              vscode.window.showErrorMessage("❌ Could not find key identity for selected wallet.");
              break;
            }

            // Export the private key with JSON output
            const output = await runCommand(`sui keytool export --key-identity ${keyIdentity} --json`);
            const exportData = JSON.parse(output);
            const privateKey = exportData.exportedPrivateKey;
            const keyInfo = exportData.key;

            // Show the private key in a dialog
            const action = await vscode.window.showInformationMessage(
              `✅ Private key exported for wallet ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
              "Copy to Clipboard",
              "Show Details"
            );

            if (action === "Copy to Clipboard") {
              await vscode.env.clipboard.writeText(privateKey);
              vscode.window.showInformationMessage("🔐 Private key copied to clipboard!");
            } else if (action === "Show Details") {
              const panel = vscode.window.createWebviewPanel(
                'walletExport',
                'Wallet Export Details',
                vscode.ViewColumn.One,
                { enableScripts: true }
              );
              panel.webview.html = `
                <!DOCTYPE html>
                <html>
                <head>
                  <style>
                    body { font-family: var(--vscode-font-family); padding: 20px; }
                    .warning { background: var(--vscode-inputValidation-warningBackground); 
                              color: var(--vscode-inputValidation-warningForeground); 
                              padding: 10px; border-radius: 4px; margin: 10px 0; }
                    .private-key { background: var(--vscode-textCodeBlock-background); 
                                  padding: 10px; border-radius: 4px; 
                                  font-family: var(--vscode-editor-font-family); 
                                  word-break: break-all; margin: 10px 0; }
                    button { background: var(--vscode-button-background); 
                            color: var(--vscode-button-foreground); 
                            border: none; padding: 8px 16px; 
                            border-radius: 4px; cursor: pointer; margin: 5px; }
                  </style>
                </head>
                <body>
                  <h2>🔐 Wallet Export Details</h2>
                  <div class="warning">
                    ⚠️ <strong>Security Warning:</strong> Keep this private key secure and never share it. 
                    Anyone with this key can access your wallet and funds.
                  </div>
                  <p><strong>Alias:</strong> ${keyInfo.alias}</p>
                  <p><strong>Wallet Address:</strong> ${keyInfo.suiAddress}</p>
                  <p><strong>Key Identity:</strong> ${keyIdentity}</p>
                  <p><strong>Key Scheme:</strong> ${keyInfo.keyScheme}</p>
                  <p><strong>Public Key:</strong> ${keyInfo.publicBase64Key}</p>
                  <p><strong>Private Key:</strong></p>
                  <div class="private-key">${privateKey}</div>
                  <button onclick="navigator.clipboard.writeText('${privateKey}')">Copy Private Key</button>
                  <button onclick="window.close()">Close</button>
                </body>
                </html>
              `;
            }
          } catch (err) {
            vscode.window.showErrorMessage(
              `❌ Failed to export wallet: ${err}`
            );
          }
          break;
        }

        case "refresh": {
          if (!this.view) {
            break;
          }

          this.view.webview.postMessage({
            command: "set-status",
            message: "Refreshing wallets, environments, and checking for updates...",
          });
          vscode.window.showInformationMessage(
            "Refreshing wallets, environments, and checking for updates..."
          );

          try {
            await this.refreshWallets();
            await this.refreshEnvs();
            await this.checkSuiVersion();
            await this.fetchCoinPortfolio();

            this.view.webview.postMessage({
              command: "set-status",
              message: "Refresh complete.",
            });
            this.renderHtml(this.view);
          } catch (err) {
            this.view.webview.postMessage({
              command: "set-status",
              message: "",
            });
            vscode.window.showErrorMessage(`❌ Failed to refresh: ${err}`);
          }
          break;
        }

        case "showGasCoinCopyNotification": {
          const coinId = message.coinId;
          const shortId =
            message.shortId || coinId.slice(0, 8) + "..." + coinId.slice(-8);

          vscode.window.showInformationMessage(
            `📋 Gas coin ID copied to clipboard: ${shortId}`
          );
          break;
        }

        case "showCopyNotification": {
          vscode.window.showInformationMessage(
            "📋 Wallet address copied to clipboard!"
          );
          break;
        }

        case "start-localnet": {
          const terminal = vscode.window.createTerminal({
            name: "Sui Local Network",
          });
          terminal.show(true);
          const isWindows = process.platform === 'win32';
          const localnetCmd = isWindows 
            ? 'set RUST_LOG=off,sui_node=info && sui start --with-faucet --force-regenesis'
            : 'RUST_LOG="off,sui_node=info" sui start --with-faucet --force-regenesis';
          terminal.sendText(localnetCmd, true);
          vscode.window.showInformationMessage(
            "🟢 Starting Sui local network in new terminal..."
          );
          break;
        }

        case "get-faucet": {
          try {
            // Only allow faucet on devnet or localnet
            if (!['devnet', 'localnet'].includes(this.activeEnv)) {
              vscode.window.showWarningMessage("Faucet is only available on devnet or localnet.");
              break;
            }

            const address = this.activeWallet || '';
            const cmd = address
              ? `sui client faucet --address ${address}`
              : 'sui client faucet';
            const output = await runCommand(cmd);
            vscode.window.showInformationMessage(
              "💧 Faucet requested:\n" + output
            );
            // Allow time for the faucet transaction to finalize, then refresh
            setTimeout(async () => {
              await this.refreshWallets();
              this.renderHtml(this.view!);
              this.view?.webview.postMessage({ command: "set-status", message: "" });
            }, 4000);
          } catch (err) {
            vscode.window.showErrorMessage("❌ Faucet failed: " + err);
          }
          break;
        }

        case "merge-coin": {
          const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
          const rootPath = workspaceFolder?.uri.fsPath;

          const primaryCoin = message.primaryCoin as string;
          const coinToMerge = message.coinToMerge as string;
          if (!primaryCoin || !coinToMerge) {
            vscode.window.showErrorMessage("Select both primary coin and coin to merge");
            return;
          }

          const terminal = vscode.window.createTerminal({ name: "Sui Merge Coin" });
          terminal.show(true);
          const isWindows = process.platform === 'win32';
          const mergeCmd = `sui client merge-coin --primary-coin ${primaryCoin} --coin-to-merge ${coinToMerge}`;
          const finalCmd = rootPath
            ? (isWindows
              ? `cd /d "${rootPath}" && ${mergeCmd}`
              : `cd "${rootPath}" && ${mergeCmd}`)
            : mergeCmd;
          terminal.sendText(finalCmd, true);

          vscode.window.showInformationMessage(
            `🪙 Merging coin ${coinToMerge} into ${primaryCoin}...`
          );

          // Best-effort refresh after a short delay
          setTimeout(async () => {
            await this.refreshWallets();
            this.renderHtml(this.view!);
            this.view?.webview.postMessage({ command: "set-status", message: "" });
          }, 4000);
          break;
        }

        case "split-coin": {
          const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
          const rootPath = workspaceFolder?.uri.fsPath;

          const coinId = message.coinId as string;
          const amounts = message.amounts as string[] | undefined;
          const count = message.count as number | undefined;
          if (!coinId) {
            vscode.window.showErrorMessage("Select a coin to split");
            return;
          }
          if ((!amounts || amounts.length === 0) && (count === undefined)) {
            vscode.window.showErrorMessage("Provide amounts or count");
            return;
          }

          const terminal = vscode.window.createTerminal({ name: "Sui Split Coin" });
          terminal.show(true);
          const isWindows = process.platform === 'win32';
          let splitCmd = `sui client split-coin --coin-id ${coinId}`;
          if (amounts && amounts.length > 0) {
            splitCmd += ` --amounts ${amounts.join(' ')}`;
          } 
          if ((!amounts || amounts.length === 0) && (count !== undefined)) {
            splitCmd += ` --count ${count}`;
          }
          const finalCmd = rootPath
            ? (isWindows
              ? `cd /d "${rootPath}" && ${splitCmd}`
              : `cd "${rootPath}" && ${splitCmd}`)
            : splitCmd;
          terminal.sendText(finalCmd, true);

          vscode.window.showInformationMessage(
            `✂️ Splitting coin ${coinId}...`
          );

          setTimeout(async () => {
            await this.refreshWallets();
            this.renderHtml(this.view!);
            this.view?.webview.postMessage({ command: "set-status", message: "" });
          }, 4000);
          break;
        }

        case "transfer-sui": {
          const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
          const rootPath = workspaceFolder?.uri.fsPath;

          const coinId = message.coinId as string;
          const to = message.to as string;
          const amount = message.amount as string | undefined;
          if (!coinId || !to) {
            vscode.window.showErrorMessage("Provide coin and recipient");
            return;
          }

          const terminal = vscode.window.createTerminal({ name: "Sui Transfer SUI" });
          terminal.show(true);
          const isWindows = process.platform === 'win32';
          let transferCmd = `sui client transfer-sui --to ${to} --sui-coin-object-id ${coinId}`;
          if (amount && amount.trim().length > 0) {
            transferCmd += ` --amount ${amount.trim()}`;
          }
          // Default gas budget (in MIST)
          transferCmd += ` --gas-budget 10000000`;
          const finalCmd = rootPath
            ? (isWindows
              ? `cd /d "${rootPath}" && ${transferCmd}`
              : `cd "${rootPath}" && ${transferCmd}`)
            : transferCmd;
          terminal.sendText(finalCmd, true);

          vscode.window.showInformationMessage(
            `📤 Transferring SUI from ${coinId.slice(0,8)}... to ${to.slice(0,6)}...`
          );

          setTimeout(async () => {
            await this.refreshWallets();
            this.renderHtml(this.view!);
            this.view?.webview.postMessage({ command: "set-status", message: "" });
          }, 4000);
          break;
        }

        case "transfer-coin": {
          const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
          const rootPath = workspaceFolder?.uri.fsPath;

          const coinId = message.coinId as string;
          const coinType = message.coinType as string;
          const to = message.to as string;
          const amount = message.amount as string | undefined;
          if (!coinId || !to) {
            vscode.window.showErrorMessage("Provide coin and recipient");
            return;
          }

          const terminal = vscode.window.createTerminal({ name: "Sui Transfer Coin" });
          terminal.show(true);
          const isWindows = process.platform === 'win32';
          
          // Use transfer-sui for SUI coins, transfer for other coins
          const isSui = coinType === "0x2::sui::SUI";
          let transferCmd: string;
          
          if (isSui) {
            transferCmd = `sui client transfer-sui --to ${to} --sui-coin-object-id ${coinId}`;
            if (amount && amount.trim().length > 0) {
              transferCmd += ` --amount ${amount.trim()}`;
            }
            transferCmd += ` --gas-budget 10000000`;
          } else {
            // For non-SUI coins, use the generic transfer command
            transferCmd = `sui client transfer --to ${to} --coin-object-id ${coinId}`;
            if (amount && amount.trim().length > 0) {
              transferCmd += ` --amount ${amount.trim()}`;
            }
            // Default gas budget (in MIST)
            transferCmd += ` --gas-budget 10000000`;
          }
          
          const finalCmd = rootPath
            ? (isWindows
              ? `cd /d "${rootPath}" && ${transferCmd}`
              : `cd "${rootPath}" && ${transferCmd}`)
            : transferCmd;
          terminal.sendText(finalCmd, true);

          const coinName = isSui ? "SUI" : coinType.split("::").pop() || "coin";
          vscode.window.showInformationMessage(
            `📤 Transferring ${coinName} from ${coinId.slice(0,8)}... to ${to.slice(0,6)}...`
          );

          setTimeout(async () => {
            await this.refreshWallets();
            this.renderHtml(this.view!);
            this.view?.webview.postMessage({ command: "set-status", message: "" });
          }, 4000);
          break;
        }
        case "update-sui": {
          const isWindows = process.platform === 'win32';
          const isMacOS = process.platform === 'darwin';
          const terminal = vscode.window.createTerminal({
            name: "Sui CLI Update",
          });
          terminal.show(true);
          
          let updateCmd = "";
          if (isWindows) {
            // Windows: Use Chocolatey
            updateCmd = 'choco upgrade sui';
          } else if (isMacOS) {
            // macOS: Use Homebrew
            updateCmd = 'brew upgrade sui';
          } else {
            // Linux: Use Cargo
            updateCmd = 'cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui --features tracing';
          }
          
          terminal.sendText(updateCmd, true);
          vscode.window.showInformationMessage(
            "🔄 Updating Sui CLI... Check the terminal for progress."
          );
          
          // Refresh version check after a delay
          setTimeout(async () => {
            await this.checkSuiVersion();
            this.renderHtml(this.view!);
          }, 15000);
          
          break;
        }

        case "view-coin-portfolio": {
          try {
            await this.fetchCoinPortfolio();
            this.renderHtml(this.view!);
            vscode.window.showInformationMessage(
              "💰 Coin portfolio updated!"
            );
          } catch (err) {
            vscode.window.showErrorMessage(`❌ Failed to fetch coin portfolio: ${err}`);
          }
          break;
        }

        case "scan-move-projects": {
          try {
            this.view?.webview.postMessage({
              command: "set-status",
              message: "Scanning for Move projects...",
            });
            
            await this.scanForMoveProjects();
            
            this.view?.webview.postMessage({
              command: "set-status",
              message: "",
            });
            
            this.renderHtml(this.view!);
            
            if (this.foundMoveProjects.length === 0) {
              vscode.window.showInformationMessage(
                "No Move projects found in the current workspace."
              );
            } else {
              vscode.window.showInformationMessage(
                `Found ${this.foundMoveProjects.length} Move project(s). Check the sidebar to select one.`
              );
            }
          } catch (err) {
            this.view?.webview.postMessage({
              command: "set-status",
              message: "",
            });
            vscode.window.showErrorMessage(`❌ Failed to scan for Move projects: ${err}`);
          }
          break;
        }

        case "select-move-project": {
          const projectPath = message.projectPath;
          if (!projectPath) {
            vscode.window.showErrorMessage("No project path provided");
            this.view?.webview.postMessage({
              command: "move-project-error",
              message: "No project path provided"
            });
            return;
          }

          try {
            this.activeMoveProjectRoot = projectPath;
            
            const projectName = this.foundMoveProjects.find(p => p.path === projectPath)?.name || "Unknown";
            
            // Re-render the view (this will load package data and modules)
            // The button will stay in loading state until renderHtml completes
            await this.renderHtml(this.view!);
            
            // After HTML is set, the DOM is replaced and button is recreated in default state
            // Send a message to keep the button in loading state
            this.view?.webview.postMessage({
              command: "move-project-loading",
              message: "Loading package..."
            });
            
            // Add a delay to ensure webview has fully rendered and processed the loading message
            // This keeps the button in loading state until package is fully loaded
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Send success message after render and rendering delay completes
            this.view?.webview.postMessage({
              command: "move-project-selected",
              message: `Project "${projectName}" selected successfully`
            });
            
            vscode.window.showInformationMessage(
              `✅ Selected Move project: ${projectName}`
            );
          } catch (err) {
            vscode.window.showErrorMessage(`❌ Failed to select Move project: ${err}`);
            this.view?.webview.postMessage({
              command: "move-project-error",
              message: `Failed to select project: ${err}`
            });
          }
          break;
        }

      }
    });
  }

  async fetchWalletBalance() {
    try {
      // Get current RPC URL for the active environment
      const rpcUrl = this.availableEnvs.find(e => e.alias === this.activeEnv)?.rpc;
      
      console.log(`fetchWalletBalance: activeEnv=${this.activeEnv}, rpcUrl=${rpcUrl}, activeWallet=${this.activeWallet}`);
      
      if (!rpcUrl || !this.activeWallet) {
        console.log("No RPC URL or active wallet, setting balance to 0");
        this.suiBalance = "0";
        this.gasCoins = [];
        return;
      }

      // Use RPC call for faster balance fetching
      console.log("Attempting RPC balance fetch...");
      const balanceData = await getWalletBalanceRpc(rpcUrl, this.activeWallet);
      this.suiBalance = balanceData.balance;
      this.gasCoins = balanceData.gasCoins;
      console.log(`RPC balance fetch successful: ${this.suiBalance} SUI, ${this.gasCoins.length} gas coins`);
    } catch (error) {
      console.log("Failed to fetch wallet balance via RPC, falling back to CLI:", error);
      
      // Fallback to CLI if RPC fails
      try {
        const gasOutput = await runCommand(`sui client gas --json`);
        const gasCoinsData = JSON.parse(gasOutput);

        let totalMistBalance = 0;
        this.gasCoins = [];

        if (Array.isArray(gasCoinsData)) {
          gasCoinsData.forEach((coin: any) => {
            if (coin.mistBalance && coin.gasCoinId) {
              const mistBalance = parseInt(coin.mistBalance.toString());
              totalMistBalance += mistBalance;

              this.gasCoins.push({
                gasCoinId: coin.gasCoinId,
                mistBalance: mistBalance,
                suiBalance: coin.suiBalance || (mistBalance / 1e9).toFixed(6),
              });
            }
          });
        }

        this.suiBalance = (totalMistBalance / 1e9).toFixed(6);
      } catch (cliError) {
        console.log("CLI fallback also failed:", cliError);
        this.suiBalance = "0";
        this.gasCoins = [];
      }
    }
  }

  async fetchCoinPortfolio() {
    try {
      // Get current RPC URL for the active environment
      const rpcUrl = this.availableEnvs.find(e => e.alias === this.activeEnv)?.rpc;
      
      console.log(`fetchCoinPortfolio: activeEnv=${this.activeEnv}, rpcUrl=${rpcUrl}, activeWallet=${this.activeWallet}`);
      
      if (!rpcUrl || !this.activeWallet) {
        console.log("No RPC URL or active wallet, setting portfolio to null");
        this.coinPortfolio = null;
        return;
      }

      // Use RPC call for coin portfolio fetching
      console.log("Attempting RPC coin portfolio fetch...");
      this.coinPortfolio = await getCoinPortfolio(rpcUrl, this.activeWallet);
      console.log(`RPC coin portfolio fetch successful: ${this.coinPortfolio.balances.length} coin types`);
    } catch (error) {
      console.log("Failed to fetch coin portfolio via RPC:", error);
      this.coinPortfolio = null;
    }
  }

  formatStruct(s: any): string {
    if (!s.address || !s.module || !s.name) {
      return "Unknown";
    }
    const shortAddr = s.address.slice(0, 5) + "..." + s.address.slice(-3);
    return `${shortAddr}::${s.module}::${s.name}`;
  }

  async renderHtml(view: vscode.WebviewView) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const rootPath = workspaceFolder?.uri.fsPath || "";
    
    // Use active Move project root if set, otherwise check current workspace root
    const activeProjectRoot = this.activeMoveProjectRoot || rootPath;
    const isMoveProject = fs.existsSync(path.join(activeProjectRoot, "Move.toml"));

    // Check Sui version
    await this.checkSuiVersion();

    let modulesHtml = "";
    let pkg = "";
    let argsMapping: Record<
      string,
      { argTypes: string[]; typeParams: string[] }
    > = {};

    try {
      const envOutput = await runCommand(`sui client envs --json`);
      const [envsList, currentEnv] = JSON.parse(envOutput);
      this.activeEnv = currentEnv;
      this.availableEnvs = envsList.map((e: any) => ({
        alias: e.alias,
        rpc: e.rpc,
      }));
    } catch {
      this.activeEnv = "None";
      this.availableEnvs = [];
    }

    await this.refreshWallets();
    await this.fetchCoinPortfolio();

    try {
      const lockFile = fs.readFileSync(
        path.join(activeProjectRoot, "Move.lock"),
        "utf-8"
      );
      const lockData = toml.parse(lockFile);

      const envSection =
        lockData.env?.[this.activeEnv] || lockData.env?.default || {};

      pkg =
        envSection["latest-published-id"] ||
        envSection["original-published-id"] ||
        "";
    } catch {
      pkg = "";
    }

    let upgradeCapInfo: { upgradeCap: string; packageId: string } | null = null;
    try {
      const upgradeTomlPath = path.join(activeProjectRoot, "upgrade.toml");
      if (fs.existsSync(upgradeTomlPath)) {
        const content = fs.readFileSync(upgradeTomlPath, "utf-8");
        const parsed = toml.parse(content);
        const upgradeCap =
          parsed.upgrade?.upgrade_cap || parsed.upgrade?.upgradeCap;
        const packageId =
          parsed.upgrade?.package_id || parsed.upgrade?.packageId;
        if (packageId === pkg && upgradeCap) {
          upgradeCapInfo = { upgradeCap, packageId };
        }
      }
    } catch {
      upgradeCapInfo = null;
    }

    // Get RPC URL for current environment
    const rpcUrl = this.availableEnvs.find(e => e.alias === this.activeEnv)?.rpc || 
                   this.defaultEnvs.find(e => e.alias === this.activeEnv)?.rpc ||
                   "https://fullnode.testnet.sui.io:443";

    try {
      if (pkg) {
        // Use RPC helper function for consistent error handling
        const modules = await makeRpcCall(rpcUrl, "sui_getNormalizedMoveModulesByPackage", [pkg]);

        modulesHtml = Object.entries(modules)
          .map(([modName, modData]: any) => {
            const funcs = Object.entries(modData.exposedFunctions || {})
              .map(([fname, fdata]: [string, any]) => {
                const argTypes = fdata.parameters
                  .map((t: any) => {
                    const getName = (obj: any): string | null => {
                      if (typeof obj === "string") {
                        return obj;
                      }
                      if (obj.Struct && obj.Struct.name !== "TxContext") {
                        return this.formatStruct(obj.Struct);
                      }
                      if (
                        obj.Reference?.Struct &&
                        obj.Reference.Struct.name !== "TxContext"
                      ) {
                        return this.formatStruct(obj.Reference.Struct);
                      }
                      if (
                        obj.MutableReference?.Struct &&
                        obj.MutableReference.Struct.name !== "TxContext"
                      ) {
                        return this.formatStruct(obj.MutableReference.Struct);
                      }
                      return null;
                    };
                    return getName(t);
                  })
                  .filter(Boolean) as string[];

                const typeParams = fdata.typeParameters || [];

                argsMapping[`${modName}::${fname}`] = { argTypes, typeParams };

                return `<option value="${fname}" data-mod="${modName}" data-type-params='${JSON.stringify(
                  typeParams
                )}'>${fname}</option>`;
              })
              .join("");
            return `<optgroup label="${modName}">${funcs}</optgroup>`;
          })
          .join("");
      }
    } catch {
      modulesHtml = "<option disabled selected>Failed to load modules</option>";
    }
    const webview = view.webview;
    // const envOptions = this.availableEnvs.map(e => `<option value="${e.alias}" ${e.alias === this.activeEnv ? 'selected' : ''}>${e.alias}</option>`).join('');
    // const shortWallet = this.activeWallet.slice(0, 6) + '...' + this.activeWallet.slice(-4);
    const iconUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "logo2.png")
    );
    const localnetRunning = await this.isLocalnetRunning();
    const showFaucet = ["devnet", "localnet"].includes(this.activeEnv);
    view.webview.html = getWebviewContent({
      activeEnv: this.activeEnv,
      availableEnvs: this.defaultEnvs,
      wallets: this.wallets,
      activeWallet: this.activeWallet,
      suiBalance: this.suiBalance,
      gasCoins: this.gasCoins,
      isMoveProject,
      pkg,
      upgradeCapInfo,
      modulesHtml,
      argsMapping,
      iconUri: iconUri.toString(),
      localnetRunning,
      showFaucet,
      suiVersion: this.suiVersion,
      latestSuiVersion: this.latestSuiVersion,
      isSuiOutdated: this.isSuiOutdated,
      coinPortfolio: this.coinPortfolio,
      foundMoveProjects: this.foundMoveProjects,
      activeMoveProjectRoot: this.activeMoveProjectRoot,
    });
  }
}

export function deactivate() {}
