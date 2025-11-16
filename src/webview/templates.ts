import { GasCoin, WebviewParams, CoinPortfolio, CoinBalance, CoinObject, CoinMetadata } from './types';

export function generateHeader(iconUri: string): string {
  return `
    <div class="header">
      <img src="${iconUri}" alt="⚡" width="32" height="32">
      <h1> Sui Move Runner</h1>
    </div>
  `;
}

export function generateStatusBar(): string {
  return `
    <div class="status-bar">
      <div id="statusMessage">Ready</div>
    </div>
  `;
}

export function generateSuiVersionSection(params: WebviewParams): string {
  const { isSuiOutdated, suiVersion, latestSuiVersion } = params;
  
  return `
    <div class="section" style="background-color: ${isSuiOutdated ? 'var(--vscode-inputValidation-errorBackground)' : 'var(--vscode-inputValidation-infoBackground)'}; border-color: ${isSuiOutdated ? 'var(--vscode-inputValidation-errorBorder)' : 'var(--vscode-inputValidation-infoBorder)'};">
      <div>
        <div class="section-title" style="color: ${isSuiOutdated ? 'var(--vscode-inputValidation-errorForeground)' : 'var(--vscode-inputValidation-infoForeground)'}; margin-bottom: 4px;">
          ${isSuiOutdated ? '⚠️ Sui CLI Outdated' : '✅ Sui CLI Up to Date'}
        </div>
        <div style="font-size: 11px; color: ${isSuiOutdated ? 'var(--vscode-inputValidation-errorForeground)' : 'var(--vscode-inputValidation-infoForeground)'}; margin-bottom: 8px;">
          Current: ${suiVersion} | Latest: ${latestSuiVersion}
        </div>
        ${isSuiOutdated ? 
          '<button id="updateSuiBtn" class="btn-primary" style="background-color: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 6px 12px; border-radius: 4px; font-size: 11px; cursor: pointer;">Update Sui CLI</button>' :
          '<div style="font-size: 11px; color: var(--vscode-inputValidation-infoForeground); font-weight: 600; display: inline-flex; align-items: center; gap: 4px;"><span>✓</span> <span>All up to date!</span></div>'
        }
      </div>
    </div>
  `;
}

export function generateRefreshSection(): string {
  return `
    <div class="section">
      <button id="refreshBtn" class="btn-secondary">🔄 Refresh</button>
    </div>
  `;
}

export function generateEnvironmentDisplay(activeEnv: string): string {
  return `
    <div class="env-display">
      🌐 ${activeEnv || "No Environment"}
    </div>
  `;
}

export function generateLocalnetSection(params: WebviewParams): string {
  const { activeEnv, localnetRunning } = params;
  
  if (activeEnv === "localnet" && !localnetRunning) {
    return `
      <div class="section">
        <div class="section-title">🟢 Local Network</div>
        <button id="startLocalnetBtn" class="btn-primary">Start Local Network</button>
        <div style="font-size:11px;margin-top:6px;color:var(--vscode-descriptionForeground)">
          Please start the local network.<br>
          This will run <code>sui start --with-faucet --force-regenesis</code> in a new terminal.
        </div>
      </div>
    `;
  }
  return "";
}

export function generateFaucetSection(showFaucet: boolean): string {
  if (showFaucet) {
    return `
      <div class="section">
        <div class="section-title">💧 Faucet</div>
        <button id="getFaucetBtn" class="btn-primary">Get Faucet</button>
      </div>
    `;
  }
  return "";
}

export function generateEnvironmentSection(availableEnvs: any[], activeEnv: string): string {
  const envOptions = availableEnvs
    .map(
      (e) =>
        `<option value="${e.alias}" ${
          e.alias === activeEnv ? "selected" : ""
        }>${e.alias}</option>`
    )
    .join("");

  return `
    <div class="section">
      <div class="section-title">🔧 Environment</div>
      <select id="envSwitcher">${envOptions}</select>
    </div>
  `;
}

export function generateGasCoinsHtml(gasCoins: GasCoin[]): string {
  if (gasCoins.length === 0) {
    return "";
  }

  return `
    <div class="gas-coins-section" id="gasCoinsSection">
      <div class="gas-coins-header">
        <div class="gas-coins-title">Gas Coins (${gasCoins.length})</div>
        <button class="gas-coins-toggle" onclick="toggleGasCoins()">▼ Show</button>
      </div>
      <div class="gas-coins-container" style="display: none;">
        ${gasCoins
          .map(
            (coin) => `
          <div class="gas-coin-item">
            <span class="gas-coin-id" title="${
              coin.gasCoinId
            }" onclick="copyGasCoinId('${coin.gasCoinId}')">
              ${coin.gasCoinId.slice(0, 8)}...${coin.gasCoinId.slice(-8)}
            </span>
            <span class="gas-coin-balance">${coin.suiBalance} SUI</span>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;
}

// Helper interface for coin selection
interface CoinOption {
  coinObjectId: string;
  coinType: string;
  balance: string;
  displayName: string;
}

// Extract all coin objects from portfolio for coin tools
function getAllCoinObjects(coinPortfolio: CoinPortfolio | null, gasCoins: GasCoin[]): CoinOption[] {
  const coins: CoinOption[] = [];
  
  // Add gas coins (SUI) first
  gasCoins.forEach(coin => {
    coins.push({
      coinObjectId: coin.gasCoinId,
      coinType: "0x2::sui::SUI",
      balance: coin.suiBalance,
      displayName: `${coin.gasCoinId.slice(0,8)}...${coin.gasCoinId.slice(-8)} (${coin.suiBalance} SUI)`
    });
  });
  
  // Add all other coins from portfolio
  if (coinPortfolio) {
    Object.keys(coinPortfolio.coinObjects).forEach(coinType => {
      // Skip SUI as we already added it from gasCoins
      if (coinType === "0x2::sui::SUI") {
        return;
      }
      
      const coinObjects = coinPortfolio.coinObjects[coinType];
      const metadata = coinPortfolio.metadata[coinType];
      const decimals = metadata?.decimals || 9;
      const symbol = metadata?.symbol || coinType.split("::").pop() || "Unknown";
      
      coinObjects.forEach(coin => {
        const balanceNum = parseFloat(coin.balance);
        const displayBalance = (balanceNum / Math.pow(10, decimals)).toFixed(6);
        coins.push({
          coinObjectId: coin.coinObjectId,
          coinType: coinType,
          balance: displayBalance,
          displayName: `${coin.coinObjectId.slice(0,8)}...${coin.coinObjectId.slice(-8)} (${displayBalance} ${symbol})`
        });
      });
    });
  }
  
  return coins;
}

export function generateCoinToolsSection(gasCoins: GasCoin[], coinPortfolio: CoinPortfolio | null): string {
  const allCoins = getAllCoinObjects(coinPortfolio, gasCoins);
  
  if (allCoins.length === 0) {
    return "";
  }

  return `
    <div class="gas-coins-section" id="coinToolsSection">
      <div class="gas-coins-header">
        <div class="gas-coins-title coin-tools-title">Coin Tools</div>
        <button class="gas-coins-toggle" onclick="toggleCoinTools()">▼ Show</button>
      </div>
      <div id="coinToolsContainer" style="display: none;">
        ${generateMergeCoinsSection(allCoins)}
        ${generateSplitCoinSection(allCoins)}
        ${generateTransferCoinSection(allCoins)}
      </div>
    </div>
  `;
}

function generateMergeCoinsSection(coins: CoinOption[]): string {
  if (coins.length <= 1) {
    return "";
  }

  return `
    <div class="coin-tools-form">
      <div class="coin-tools-section-title merge-title">Merge Coins</div>
      <div class="input-group">
        <label class="input-label">Primary Coin (to keep)</label>
        <select id="primaryCoinSelect">
          ${coins
            .map(
              (c) => `<option value="${c.coinObjectId}" data-coin-type="${c.coinType}">${c.displayName}</option>`
            )
            .join("")}
        </select>
      </div>
      <div class="input-group">
        <label class="input-label">Coin to Merge</label>
        <select id="coinToMergeSelect">
          ${coins
            .map(
              (c) => `<option value="${c.coinObjectId}" data-coin-type="${c.coinType}">${c.displayName}</option>`
            )
            .join("")}
        </select>
      </div>
      <button id="mergeCoinsBtn" class="coin-tools-btn btn-disabled" disabled>Merge into Primary</button>
      <div class="input-help">Select a primary coin to keep, and a coin to merge into it. Coins must be of the same type.</div>
    </div>
  `;
}

function generateSplitCoinSection(coins: CoinOption[]): string {
  return `
    <div class="coin-tools-form">
      <div class="coin-tools-section-title split-title">Split Coin</div>
      <div class="input-group">
        <label class="input-label">Coin to Split</label>
        <select id="splitCoinSelect">
          ${coins
            .map(
              (c) => `<option value="${c.coinObjectId}" data-coin-type="${c.coinType}">${c.displayName}</option>`
            )
            .join("")}
        </select>
      </div>
      <div class="input-group">
        <label class="input-label">Amounts (comma-separated)</label>
        <input id="splitAmounts" placeholder="e.g., 1000,2000,3000 (amount units per CLI)" inputmode="numeric" />
        <div class="input-help">Provide specific amounts for each split coin</div>
      </div>
      <div class="input-group">
        <label class="input-label">Or Number of Equal Coins</label>
        <input id="splitCount" placeholder="Number of equal coins (count)" type="number" min="1" step="1" />
        <div class="input-help">If both provided, amounts are used</div>
      </div>
      <button id="splitCoinBtn" class="coin-tools-btn btn-disabled" disabled>Split Coin</button>
    </div>
  `;
}

function generateTransferCoinSection(coins: CoinOption[]): string {
  return `
    <div class="coin-tools-form">
      <div class="coin-tools-section-title transfer-title">Transfer Coin</div>
      <div class="input-group">
        <label class="input-label">Coin to Transfer</label>
        <select id="transferCoinSelect">
          ${coins
            .map(
              (c) => `<option value="${c.coinObjectId}" data-coin-type="${c.coinType}">${c.displayName}</option>`
            )
            .join("")}
        </select>
      </div>
      <div class="input-group">
        <label class="input-label">Recipient Address</label>
        <input id="transferTo" placeholder="0x... or keystore alias" />
        <div class="input-help">Enter the recipient's wallet address or keystore alias</div>
      </div>
      <div class="input-group">
        <label class="input-label">Amount (optional)</label>
        <input id="transferAmount" placeholder="If omitted, whole coin transfers" type="number" min="0" step="1" />
        <div class="input-help">Leave empty to transfer the entire coin</div>
      </div>
      <button id="transferCoinBtn" class="coin-tools-btn btn-disabled" disabled>Transfer Coin</button>
    </div>
  `;
}

export function generateWalletSection(params: WebviewParams): string {
  const { wallets, activeWallet, suiBalance, gasCoins, coinPortfolio } = params;
  const shortWallet = activeWallet?.slice(0, 6) + "..." + activeWallet?.slice(-4) || "";
  
  return `
    <div class="wallet-section">
      <div class="wallet-header">
        <div class="wallet-title">Wallet</div>
        <div class="wallet-status">Connected</div>
      </div>
      
      <select id="walletSwitcher">
        ${wallets
          .map(
            (w) =>
              `<option value="${w.address}" ${
                w.address === activeWallet ? "selected" : ""
              }>${w.name} - ${w.address.slice(0, 6)}...${w.address.slice(
                -4
              )}</option>`
          )
          .join("")}
      </select>
      
      <div class="wallet-info-grid">
        <div class="wallet-info-card">
          <div class="wallet-info-label">Wallet Address</div>
          <div id="walletAddress" class="wallet-address" title="Click to copy" data-full-address="${activeWallet || ''}">${shortWallet}</div>
        </div>
        
        <div class="wallet-balance">
          <div class="balance-label">Total Balance</div>
          <div class="balance-amount">${suiBalance} SUI</div>
        </div>
      </div>
      
      <div class="wallet-actions">
        <button id="createAddressBtn" class="wallet-action-btn">➕ New Address</button>
        <button id="exportWalletBtn" class="wallet-action-btn">📤 Export Wallet</button>
      </div>
      
      ${generateGasCoinsHtml(gasCoins)}
      ${generateCoinToolsSection(gasCoins, coinPortfolio || null)}

      <div class="import-wallet-section">
        <div class="import-wallet-header">
          <div class="import-wallet-title">Import Wallet</div>
          <button class="import-wallet-toggle" onclick="toggleImportWallet()">▼ Show</button>
        </div>
        <div id="importWalletContainer" style="display: none;">
          <div class="import-wallet-form">
            <div class="input-group">
              <label class="input-label">Input String</label>
              <input id="importInputString" placeholder="Mnemonic (12-24 words) or suiprivkey..." />
              <div class="input-help">Supports 12-24 word mnemonic or Bech32 33-byte key starting with suiprivkey</div>
            </div>
            <div class="input-group">
              <label class="input-label">Key Scheme</label>
              <select id="importKeyScheme">
                <option value="ed25519">ed25519</option>
                <option value="secp256k1">secp256k1</option>
                <option value="secp256r1">secp256r1</option>
              </select>
            </div>
            <div class="input-group">
              <label class="input-label">Derivation Path (optional)</label>
              <input id="importDerivationPath" placeholder="Auto-fills based on scheme" />
              <div class="input-help">Defaults: m/44'/784'/0'/0'/0' (ed25519), m/54'/784'/0'/0/0 (secp256k1), m/74'/784'/0'/0/0 (secp256r1)</div>
            </div>
            <div class="input-group">
              <label class="input-label">Alias (optional)</label>
              <input id="importAlias" placeholder="e.g., my_wallet_1" />
              <div class="input-help">Must start with a letter; letters, digits, hyphens, underscores</div>
            </div>
            <button id="importWalletBtn" class="import-wallet-btn btn-disabled" disabled>Import Wallet</button>
          </div>
        </div>
      </div>

      <div class="coin-portfolio-section">
        <div class="coin-portfolio-header">
          <div class="coin-portfolio-title">Coin Portfolio ${coinPortfolio && coinPortfolio.balances.length > 0 ? `(${coinPortfolio.balances.length} types)` : ''}</div>
          <button class="coin-portfolio-toggle" onclick="toggleCoinPortfolio()">▼ Show</button>
        </div>
        <div id="coinPortfolioContainer" style="display: none;">
          ${coinPortfolio && coinPortfolio.balances.length > 0 ? generateCoinPortfolioContent(coinPortfolio) : '<div class="no-coins-message">No coins found in this wallet</div>'}
        </div>
      </div>
    </div>
  `;
}

export function generateImportWalletSection(): string {
  return "";
}

export function generateMoveProjectSelectionSection(params: WebviewParams): string {
  const { foundMoveProjects = [], activeMoveProjectRoot, isMoveProject } = params;
  
  // If no Move projects found and current directory is not a Move project, show scan option
  if (foundMoveProjects.length === 0 && !isMoveProject) {
    return `
      <div class="section">
        <div class="section-title">🔍 Move Project Detection</div>
        <div style="font-size: 11px; color: var(--vscode-descriptionForeground); margin-bottom: 8px;">
          No Move project detected in the current workspace root.
        </div>
        <button id="scanMoveProjectsBtn" class="btn-primary">🔍 Scan for Move Projects</button>
        <div style="font-size: 11px; color: var(--vscode-descriptionForeground); margin-top: 6px;">
          This will scan subdirectories for Move projects (Move.toml files).
        </div>
      </div>
    `;
  }
  
  // If Move projects found, show selection UI
  if (foundMoveProjects.length > 0) {
    const projectOptions = foundMoveProjects.map(project => 
      `<option value="${project.path}" ${project.path === activeMoveProjectRoot ? 'selected' : ''}>
        ${project.name} (${project.relativePath})
      </option>`
    ).join('');
    
    return `
      <div class="section">
        <div class="section-title">📁 Move Project Selection</div>
        <div style="font-size: 11px; color: var(--vscode-descriptionForeground); margin-bottom: 8px;">
          Found ${foundMoveProjects.length} Move project(s). Select which one to use for build/test/publish operations.
        </div>
        <select id="moveProjectSelect" style="width: 100%; margin-bottom: 8px;">
          ${projectOptions}
        </select>
        <div style="display: flex; gap: 8px;">
          <button id="selectMoveProjectBtn" class="btn-primary">✅ Select Project</button>
          <button id="rescanMoveProjectsBtn" class="btn-secondary">🔄 Rescan</button>
        </div>
        <div id="activeMoveProjectStatus" style="font-size: 11px; color: var(--vscode-inputValidation-infoForeground); margin-top: 6px; ${!activeMoveProjectRoot ? 'display: none;' : ''}">
          ✓ Active: ${activeMoveProjectRoot ? (foundMoveProjects.find(p => p.path === activeMoveProjectRoot)?.name || 'Unknown') : ''}
        </div>
      </div>
    `;
  }
  
  // If current directory is a Move project, show confirmation
  if (isMoveProject) {
    return `
      <div class="section">
        <div class="section-title">✅ Move Project Detected</div>
        <div style="font-size: 11px; color: var(--vscode-inputValidation-infoForeground); margin-bottom: 8px;">
          Current workspace root contains a Move project. All operations will use this directory.
        </div>
        <button id="rescanMoveProjectsBtn" class="btn-secondary">🔄 Scan for Other Projects</button>
      </div>
    `;
  }
  
  return "";
}

export function generateCreatePackageSection(isMoveProject: boolean): string {
  if (isMoveProject) {
    return "";
  }

  return `
    <div class="section">
      <div class="section-title">📦 Create Package</div>
      <input id="packageName" placeholder="Package name (e.g., my_package)" />
      <span id="packageNameError" class="error-message" style="display: none;"></span>
      <button id="createPackageBtn" onclick="sendCreate()" class="btn-primary btn-disabled" disabled>Create</button>
    </div>
  `;
}

export function generateMoveProjectSections(params: WebviewParams): string {
  const { isMoveProject, pkg, upgradeCapInfo, modulesHtml } = params;
  
  if (!isMoveProject) {
    return "";
  }

  return `
    <div class="section">
      <div class="section-title">🛠️ Build</div>
      <button onclick="sendBuild()" class="btn-primary">Build Package</button>
    </div>

    <div class="section">
      <div class="section-title">🚀 Publish</div>
      <button onclick="sendPublish()" class="btn-primary">${
        pkg ? "Re-publish" : "Publish"
      }</button>
    </div>

    ${upgradeCapInfo ? `
      <div class="section">
        <div class="section-title">⬆️ Upgrade</div>
        <button onclick="sendUpgrade()" class="btn-primary">Upgrade Package</button>
      </div>
    ` : ""}

    <div class="section">
      <div class="section-title">🧪 Test</div>
      <input id="testFuncName" placeholder="Test function (optional)" />
      <button onclick="sendTest()" class="btn-primary">Run Tests</button>
    </div>

    <div class="section">
      <div class="section-title">⚡ Call Function</div>
      <div class="input-group">
        <label class="input-label">Package ID</label>
        <input id="pkg" value="${pkg}" readonly />
      </div>
      
      <div class="input-group">
        <label class="input-label">Function</label>
        <select id="functionSelect">${modulesHtml}</select>
      </div>

      <div id="typeArgsContainer"></div>
      <div id="argsContainer"></div>

      <button onclick="sendCall()" class="btn-primary">Execute</button>
    </div>
  `;
}

export function generateCoinPortfolioSection(coinPortfolio: CoinPortfolio | null): string {
  if (!coinPortfolio || coinPortfolio.balances.length === 0) {
    return `
      <div class="section">
        <div class="section-title">💰 Coin Portfolio</div>
        <div style="font-size: 11px; color: var(--vscode-descriptionForeground); text-align: center; padding: 20px;">
          No coins found. Try refreshing or check your wallet connection.
        </div>
      </div>
    `;
  }

  const formatBalance = (balance: string, decimals: number): string => {
    const num = parseFloat(balance);
    if (num === 0) {
      return "0";
    }
    return (num / Math.pow(10, decimals)).toFixed(6);
  };

  const formatCoinType = (coinType: string): string => {
    if (coinType === "0x2::sui::SUI") {
      return "SUI";
    }
    const parts = coinType.split("::");
    if (parts.length >= 3) {
      // Show shortened address + module + name
      const address = parts[0];
      const module = parts[1];
      const name = parts[2];
      const shortAddress = address.slice(0, 6) + "..." + address.slice(-4);
      return `${shortAddress}::${module}::${name}`;
    }
    return coinType;
  };

  return `
    <div class="section">
      <div class="section-title">💰 Coin Portfolio (${coinPortfolio.balances.length} types)</div>
      <div class="coin-portfolio-container">
              ${coinPortfolio.balances.map((balance: CoinBalance) => {
                const metadata = coinPortfolio.metadata[balance.coinType];
                const coinObjects = coinPortfolio.coinObjects[balance.coinType] || [];
                const decimals = metadata?.decimals || 9; // Default to 9 for SUI if no metadata
                const displayBalance = formatBalance(balance.totalBalance, decimals);
                const symbol = metadata?.symbol || formatCoinType(balance.coinType);
          
          return `
            <div class="coin-balance-item">
              <div class="coin-balance-header">
                <div class="coin-info">
                  <span class="coin-symbol">${symbol}</span>
                  <span class="coin-name">${metadata?.name || formatCoinType(balance.coinType)}</span>
                </div>
                <div class="coin-balance">
                  <span class="balance-amount">${displayBalance}</span>
                  <span class="balance-label">${symbol}</span>
                </div>
              </div>
              <div class="coin-details">
                <div class="coin-detail-row">
                  <span>Total Balance:</span>
                  <span>${displayBalance} ${symbol} (${balance.coinObjectCount} objects)</span>
                </div>
                <div class="coin-detail-row">
                  <span>Coin Type:</span>
                  <span class="coin-type" title="${balance.coinType}" onclick="copyCoinType('${balance.coinType}')">${formatCoinType(balance.coinType)}</span>
                </div>
              </div>
              ${coinObjects.length > 0 ? `
                <div class="coin-objects-section">
                  <div class="coin-objects-header">
                    <span>Coin Objects (${coinObjects.length})</span>
                    <button class="coin-objects-toggle" onclick="toggleCoinObjects('${balance.coinType}')">▼ Show</button>
                  </div>
                  <div class="coin-objects-container" id="coin-objects-${balance.coinType}" style="display: none;">
                  ${coinObjects.map((coin: CoinObject) => `
                    <div class="coin-object-item">
                      <div class="coin-object-id" title="${coin.coinObjectId}" onclick="copyCoinObjectId('${coin.coinObjectId}')">
                        ${coin.coinObjectId.slice(0, 8)}...${coin.coinObjectId.slice(-8)}
                      </div>
                      <div class="coin-object-balance">${formatBalance(coin.balance, decimals)} ${symbol}</div>
                    </div>
                  `).join("")}
                  </div>
                </div>
              ` : ""}
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

export function generateCoinPortfolioContent(coinPortfolio: CoinPortfolio): string {
  const formatBalance = (balance: string, decimals: number): string => {
    const num = parseFloat(balance);
    if (num === 0) {
      return "0";
    }
    return (num / Math.pow(10, decimals)).toFixed(6);
  };

  const formatCoinType = (coinType: string): string => {
    if (coinType === "0x2::sui::SUI") {
      return "SUI";
    }
    const parts = coinType.split("::");
    if (parts.length >= 3) {
      // Show shortened address + module + name
      const address = parts[0];
      const module = parts[1];
      const name = parts[2];
      const shortAddress = address.slice(0, 6) + "..." + address.slice(-4);
      return `${shortAddress}::${module}::${name}`;
    }
    return coinType;
  };

  return coinPortfolio.balances.map((balance: CoinBalance) => {
    const metadata = coinPortfolio.metadata[balance.coinType];
    const coinObjects = coinPortfolio.coinObjects[balance.coinType] || [];
    const decimals = metadata?.decimals || 9; // Default to 9 for SUI if no metadata
    const displayBalance = formatBalance(balance.totalBalance, decimals);
    const symbol = metadata?.symbol || formatCoinType(balance.coinType);

    return `
      <div class="coin-balance-item">
        <div class="coin-balance-header">
          <div class="coin-info">
            <span class="coin-symbol">${symbol}</span>
            <span class="coin-name">${metadata?.name || formatCoinType(balance.coinType)}</span>
          </div>
          <div class="coin-balance">
            <span class="balance-amount">${displayBalance}</span>
            <span class="balance-label">${symbol}</span>
          </div>
        </div>
        <div class="coin-details">
          <div class="coin-detail-row">
            <span>Total Balance</span>
            <span>${displayBalance} ${symbol} (${balance.coinObjectCount} objects)</span>
          </div>
          <div class="coin-detail-row">
            <span>Coin Type</span>
            <span class="coin-type" title="${balance.coinType}" onclick="copyCoinType('${balance.coinType}')">${formatCoinType(balance.coinType)}</span>
          </div>
        </div>
        ${coinObjects.length > 0 ? `
          <div class="coin-objects-section">
            <div class="coin-objects-header">
              <span>Coin Objects (${coinObjects.length})</span>
              <button class="coin-objects-toggle" onclick="toggleCoinObjects('${balance.coinType}')">▼ Show</button>
            </div>
            <div class="coin-objects-container" id="coin-objects-${balance.coinType}" style="display: none;">
            ${coinObjects.map((coin: CoinObject) => `
              <div class="coin-object-item">
                <span class="coin-object-id" title="${coin.coinObjectId}" onclick="copyCoinObjectId('${coin.coinObjectId}')">
                  ${coin.coinObjectId.slice(0, 8)}...${coin.coinObjectId.slice(-8)}
                </span>
                <span class="coin-object-balance">${formatBalance(coin.balance, decimals)} ${symbol}</span>
              </div>
            `).join("")}
            </div>
          </div>
        ` : ""}
      </div>
    `;
  }).join("");
}

