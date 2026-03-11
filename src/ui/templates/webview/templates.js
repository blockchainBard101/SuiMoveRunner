"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateHeader = generateHeader;
exports.generateStatusBar = generateStatusBar;
exports.generateSuiStatusSection = generateSuiStatusSection;
exports.generateRefreshSection = generateRefreshSection;
exports.generateEnvironmentDisplay = generateEnvironmentDisplay;
exports.generateLocalnetSection = generateLocalnetSection;
exports.generateFaucetSection = generateFaucetSection;
exports.generateEnvironmentSection = generateEnvironmentSection;
exports.generateGasCoinsHtml = generateGasCoinsHtml;
exports.generateCoinToolsSection = generateCoinToolsSection;
exports.generateWalletSection = generateWalletSection;
exports.generateImportWalletSection = generateImportWalletSection;
exports.generateMoveProjectSelectionSection = generateMoveProjectSelectionSection;
exports.generateCreatePackageSection = generateCreatePackageSection;
exports.generateMoveProjectSections = generateMoveProjectSections;
exports.generatePtbBuilderSection = generatePtbBuilderSection;
exports.generateCoinPortfolioSection = generateCoinPortfolioSection;
exports.generateCoinPortfolioContent = generateCoinPortfolioContent;
const icons_1 = require("./icons");
function generateHeader(iconUri) {
    return `
    <div class="header">
      <img src="${iconUri}" alt="⚡" width="32" height="32">
      <h1> Sui Move Runner</h1>
    </div>
  `;
}
function generateStatusBar() {
    return `
    <div class="status-bar">
      <div id="statusMessage">Ready</div>
    </div>
  `;
}
function generateSuiStatusSection(params) {
    const { isSuiInstalled, installMethod, suiVersion, latestSuiVersion, isSuiOutdated, osPlatform } = params;
    if (!isSuiInstalled) {
        // Show Setup Helper
        const options = [
            { id: 'suiup', name: 'suiup (Recommended)', os: ['darwin', 'linux', 'win32'] },
            { id: 'brew', name: 'Homebrew', os: ['darwin', 'linux'] },
            { id: 'choco', name: 'Chocolatey', os: ['win32'] },
            { id: 'binary', name: 'Pre-built Binaries', os: ['darwin', 'linux', 'win32'] },
            { id: 'source', name: 'Build from Source', os: ['darwin', 'linux', 'win32'] },
        ].filter(opt => opt.os.includes(osPlatform || ''));
        const selectOptions = options.map(opt => `<option value="${opt.id}">${opt.name}</option>`).join('');
        return `
      <div class="section setup-section" style="background-color: var(--vscode-notifications-infoBackground); border-left: 4px solid var(--vscode-notifications-infoBorder); padding: 12px; border-radius: 4px; margin-bottom: 12px;">
        <div class="section-title" style="margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 16px;">${(0, icons_1.getIcon)(icons_1.ICONS.ROCKET)}</span>
          <span>Sui CLI Not Found</span>
        </div>
        <div style="font-size: 11px; margin-bottom: 12px; opacity: 0.9;">
          Install the Sui CLI to start building. We recommend using <b>suiup</b>.
        </div>
        <div class="input-group">
          <label class="input-label">Installation Method</label>
          <select id="installMethodSelector" style="width: 100%; margin-bottom: 8px;">
            ${selectOptions}
          </select>
        </div>
        <button id="installSuiBtn" class="btn-primary" style="width: 100%;" onclick="handleInstallSui()">Install Sui CLI</button>
      </div>
    `;
    }
    // If installed, show version and update option
    const methodMap = {
        suiup: 'suiup',
        homebrew: 'Homebrew',
        chocolatey: 'Chocolatey',
        source: 'Built from Source',
        binary: 'Binary'
    };
    const methodName = methodMap[installMethod || 'none'] || 'Unknown';
    return `
    <div class="section" style="background-color: ${isSuiOutdated ? 'var(--vscode-inputValidation-errorBackground)' : 'var(--vscode-inputValidation-infoBackground)'}; border-color: ${isSuiOutdated ? 'var(--vscode-inputValidation-errorBorder)' : 'var(--vscode-inputValidation-infoBorder)'};">
      <div>
        <div class="section-title" style="color: ${isSuiOutdated ? 'var(--vscode-inputValidation-errorForeground)' : 'var(--vscode-inputValidation-infoForeground)'}; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
          <span style="display: flex; align-items: center; gap: 4px;">${isSuiOutdated ? (0, icons_1.getIcon)(icons_1.ICONS.WARNING, 'icon-warning') + ' Sui CLI Outdated' : (0, icons_1.getIcon)(icons_1.ICONS.CHECK, 'icon-success') + ' Sui CLI Up to Date'}</span>
          <span style="font-size: 9px; opacity: 0.8; font-weight: normal; background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 3px;">via ${methodName}</span>
        </div>
        <div style="font-size: 11px; color: ${isSuiOutdated ? 'var(--vscode-inputValidation-errorForeground)' : 'var(--vscode-inputValidation-infoForeground)'}; margin-bottom: 8px;">
          Current: ${suiVersion} | Latest: ${latestSuiVersion}
        </div>
        ${isSuiOutdated ?
        `<button id="updateSuiBtn" class="btn-primary" onclick="handleUpdateSui('${installMethod}')">Update via ${methodName}</button>` :
        `<div style="font-size: 11px; color: var(--vscode-inputValidation-infoForeground); font-weight: 600; display: inline-flex; align-items: center; gap: 4px;"><span>\${getIcon(ICONS.CHECK, 'icon-success')}</span> <span>All up to date!</span></div>`}
      </div>
    </div>
  `;
}
function generateRefreshSection() {
    return `
    <div class="section">
      <button id="refreshBtn" class="btn-secondary">${(0, icons_1.getIcon)(icons_1.ICONS.RELOAD)} Refresh</button>
    </div>
  `;
}
function generateEnvironmentDisplay(activeEnv) {
    return `
    <div class="env-display">
      ${(0, icons_1.getIcon)(icons_1.ICONS.GLOBAL)} ${activeEnv || "No Environment"}
    </div>
  `;
}
function generateLocalnetSection(params) {
    const { activeEnv, localnetRunning } = params;
    if (activeEnv === "localnet" && !localnetRunning) {
        return `
      <div class="section">
        <div class="section-title">${(0, icons_1.getIcon)(icons_1.ICONS.CHECK, 'icon-success')} Local Network</div>
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
function generateFaucetSection(showFaucet) {
    if (showFaucet) {
        return `
      <div class="section">
        <div class="section-title">${(0, icons_1.getIcon)(icons_1.ICONS.EXPERIMENT)} Faucet</div>
        <button id="getFaucetBtn" class="btn-primary">Get Faucet</button>
      </div>
    `;
    }
    return "";
}
function generateEnvironmentSection(availableEnvs, activeEnv) {
    const envOptions = availableEnvs
        .map((e) => `<option value="${e.alias}" ${e.alias === activeEnv ? "selected" : ""}>${e.alias}</option>`)
        .join("");
    return `
    <div class="section">
      <div class="section-title">${(0, icons_1.getIcon)(icons_1.ICONS.TOOL)} Environment</div>
      <select id="envSwitcher">${envOptions}</select>
    </div>
  `;
}
function generateGasCoinsHtml(gasCoins) {
    if (gasCoins.length === 0) {
        return "";
    }
    return `
    <div class="gas-coins-section" id="gasCoinsSection">
      <div class="gas-coins-header">
        <div class="gas-coins-title">${(0, icons_1.getIcon)(icons_1.ICONS.FIRE, 'icon-warning')} Gas Coins (${gasCoins.length})</div>
        <button class="gas-coins-toggle" onclick="toggleGasCoins()">${(0, icons_1.getIcon)(icons_1.ICONS.DOWN, 'toggle-icon')} <span class="toggle-text">Show</span></button>
      </div>
      <div class="gas-coins-container" style="display: none;">
        ${gasCoins
        .map((coin) => `
          <div class="gas-coin-item">
            <span class="gas-coin-id" title="${coin.gasCoinId}" onclick="copyGasCoinId('${coin.gasCoinId}')">
              ${coin.gasCoinId.slice(0, 8)}...${coin.gasCoinId.slice(-8)}
            </span>
            <span class="gas-coin-balance">${coin.suiBalance} SUI</span>
          </div>
        `)
        .join("")}
      </div>
    </div>
  `;
}
// Extract all coin objects from portfolio for coin tools
function getAllCoinObjects(coinPortfolio, gasCoins) {
    const coins = [];
    // Add gas coins (SUI) first
    gasCoins.forEach(coin => {
        coins.push({
            coinObjectId: coin.gasCoinId,
            coinType: "0x2::sui::SUI",
            balance: coin.suiBalance,
            displayName: `${coin.gasCoinId.slice(0, 8)}...${coin.gasCoinId.slice(-8)} (${coin.suiBalance} SUI)`
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
            coinObjects.forEach((coin) => {
                const balanceNum = parseFloat(coin.balance);
                const displayBalance = (balanceNum / Math.pow(10, decimals)).toFixed(6);
                coins.push({
                    coinObjectId: coin.coinObjectId,
                    coinType: coinType,
                    balance: displayBalance,
                    displayName: `${coin.coinObjectId.slice(0, 8)}...${coin.coinObjectId.slice(-8)} (${displayBalance} ${symbol})`
                });
            });
        });
    }
    return coins;
}
function generateCoinToolsSection(gasCoins, coinPortfolio) {
    const allCoins = getAllCoinObjects(coinPortfolio, gasCoins);
    if (allCoins.length === 0) {
        return "";
    }
    return `
    <div class="gas-coins-section" id="coinToolsSection">
      <div class="gas-coins-header">
        <div class="gas-coins-title coin-tools-title">${(0, icons_1.getIcon)(icons_1.ICONS.TOOL)} Coin Tools</div>
        <button class="gas-coins-toggle" onclick="toggleCoinTools()">${(0, icons_1.getIcon)(icons_1.ICONS.DOWN, 'toggle-icon')} <span class="toggle-text">Show</span></button>
      </div>
      <div id="coinToolsContainer" style="display: none;">
        ${generateMergeCoinsSection(allCoins)}
        ${generateSplitCoinSection(allCoins)}
        ${generateTransferCoinSection(allCoins)}
      </div>
    </div>
  `;
}
function generateMergeCoinsSection(coins) {
    if (coins.length <= 1) {
        return "";
    }
    return `
    <div class="coin-tools-form">
      <div class="coin-tools-section-title merge-title">${(0, icons_1.getIcon)(icons_1.ICONS.MERGE)} Merge Coins</div>
      <div class="input-group">
        <label class="input-label">Primary Coin (to keep)</label>
        <select id="primaryCoinSelect">
          ${coins
        .map((c) => `<option value="${c.coinObjectId}" data-coin-type="${c.coinType}">${c.displayName}</option>`)
        .join("")}
        </select>
      </div>
      <div class="input-group">
        <label class="input-label">Coin to Merge</label>
        <select id="coinToMergeSelect">
          ${coins
        .map((c) => `<option value="${c.coinObjectId}" data-coin-type="${c.coinType}">${c.displayName}</option>`)
        .join("")}
        </select>
      </div>
      <button id="mergeCoinsBtn" class="coin-tools-btn btn-disabled" disabled>Merge into Primary</button>
      <div class="input-help">Select a primary coin to keep, and a coin to merge into it. Coins must be of the same type.</div>
    </div>
  `;
}
function generateSplitCoinSection(coins) {
    return `
    <div class="coin-tools-form">
      <div class="coin-tools-section-title split-title">${(0, icons_1.getIcon)(icons_1.ICONS.SPLIT)} Split Coin</div>
      <div class="input-group">
        <label class="input-label">Coin to Split</label>
        <select id="splitCoinSelect">
          ${coins
        .map((c) => `<option value="${c.coinObjectId}" data-coin-type="${c.coinType}">${c.displayName}</option>`)
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
function generateTransferCoinSection(coins) {
    return `
    <div class="coin-tools-form">
      <div class="coin-tools-section-title transfer-title">${(0, icons_1.getIcon)(icons_1.ICONS.SEND)} Transfer Coin</div>
      <div class="input-group">
        <label class="input-label">Coin to Transfer</label>
        <select id="transferCoinSelect">
          ${coins
        .map((c) => `<option value="${c.coinObjectId}" data-coin-type="${c.coinType}">${c.displayName}</option>`)
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
function generateWalletSection(params) {
    const { wallets, activeWallet, suiBalance, gasCoins, coinPortfolio } = params;
    const shortWallet = activeWallet?.slice(0, 6) + "..." + activeWallet?.slice(-4) || "";
    return `
    <div class="wallet-section">
      <div class="wallet-header">
        <div class="wallet-title">${(0, icons_1.getIcon)(icons_1.ICONS.USER)} Wallet</div>
        <div class="wallet-status">Connected</div>
      </div>
      
      <select id="walletSwitcher">
        ${wallets
        .map((w) => `<option value="${w.address}" ${w.address === activeWallet ? "selected" : ""}>${w.name} - ${w.address.slice(0, 6)}...${w.address.slice(-4)}</option>`)
        .join("")}
      </select>
      
      <div class="wallet-info-grid">
        <div class="wallet-info-card">
          <div class="wallet-info-label">Wallet Address</div>
          <div id="walletAddress" class="wallet-address" title="Click to copy" data-full-address="${activeWallet || ''}">
            <span class="wallet-address-text">${shortWallet}</span>
            <span class="wallet-address-icon">${(0, icons_1.getIcon)(icons_1.ICONS.COPY)}</span>
          </div>
        </div>
        
        <div class="wallet-balance">
          <div class="balance-label">Total Balance</div>
          <div class="balance-amount">${suiBalance} SUI</div>
        </div>
      </div>
      
      <div class="wallet-actions">
        <button id="createAddressBtn" class="wallet-action-btn">${(0, icons_1.getIcon)(icons_1.ICONS.PLUS)} New Address</button>
        <button id="exportWalletBtn" class="wallet-action-btn">${(0, icons_1.getIcon)(icons_1.ICONS.COPY)} Export Wallet</button>
      </div>
      
      ${generateGasCoinsHtml(gasCoins)}
      ${generateCoinToolsSection(gasCoins, coinPortfolio || null)}

      <div class="import-wallet-section">
        <div class="import-wallet-header">
          <div class="import-wallet-title">${(0, icons_1.getIcon)(icons_1.ICONS.KEY)} Import Wallet</div>
          <button class="import-wallet-toggle" onclick="toggleImportWallet()">${(0, icons_1.getIcon)(icons_1.ICONS.DOWN, 'toggle-icon')} <span class="toggle-text">Show</span></button>
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
          <div class="coin-portfolio-title">${(0, icons_1.getIcon)(icons_1.ICONS.WALLET)} Coin Portfolio ${coinPortfolio && coinPortfolio.balances.length > 0 ? `(${coinPortfolio.balances.length} types)` : ''}</div>
          <button class="coin-portfolio-toggle" onclick="toggleCoinPortfolio()">${(0, icons_1.getIcon)(icons_1.ICONS.DOWN, 'toggle-icon')} <span class="toggle-text">Show</span></button>
        </div>
        <div id="coinPortfolioContainer" style="display: none;">
          ${coinPortfolio && coinPortfolio.balances.length > 0 ? generateCoinPortfolioContent(coinPortfolio) : '<div class="no-coins-message">No coins found in this wallet</div>'}
        </div>
      </div>
    </div>
  `;
}
function generateImportWalletSection() {
    return "";
}
function generateMoveProjectSelectionSection(params) {
    const { foundMoveProjects = [], activeMoveProjectRoot, isMoveProject } = params;
    // If no Move projects found and current directory is not a Move project, show scan option
    if (foundMoveProjects.length === 0 && !isMoveProject) {
        return `
      <div class="section">
        <div class="section-title">${(0, icons_1.getIcon)(icons_1.ICONS.SEARCH)} Move Project Detection</div>
        <div style="font-size: 11px; color: var(--vscode-descriptionForeground); margin-bottom: 8px;">
          No Move project detected in the current workspace root.
        </div>
        <button id="scanMoveProjectsBtn" class="btn-primary">${(0, icons_1.getIcon)(icons_1.ICONS.SEARCH)} Scan for Move Projects</button>
        <div style="font-size: 11px; color: var(--vscode-descriptionForeground); margin-top: 6px;">
          This will scan subdirectories for Move projects (Move.toml files).
        </div>
      </div>
    `;
    }
    // If Move projects found, show selection UI
    if (foundMoveProjects.length > 0) {
        const projectOptions = foundMoveProjects.map((project) => `<option value="${project.path}" ${project.path === activeMoveProjectRoot ? 'selected' : ''}>
        ${project.name} (${project.relativePath})
      </option>`).join('');
        return `
      <div class="section">
        <div class="section-title">${(0, icons_1.getIcon)(icons_1.ICONS.FOLDER)} Move Project Selection</div>
        <div style="font-size: 11px; color: var(--vscode-descriptionForeground); margin-bottom: 8px;">
          Found ${foundMoveProjects.length} Move project(s). Select which one to use for build/test/publish operations.
        </div>
        <select id="moveProjectSelect" style="width: 100%; margin-bottom: 8px;">
          ${projectOptions}
        </select>
        <div style="display: flex; gap: 8px;">
          <button id="selectMoveProjectBtn" class="btn-primary">${(0, icons_1.getIcon)(icons_1.ICONS.CHECK)} Select Project</button>
          <button id="rescanMoveProjectsBtn" class="btn-secondary">${(0, icons_1.getIcon)(icons_1.ICONS.RELOAD)} Rescan</button>
        </div>
        <div id="activeMoveProjectStatus" style="font-size: 11px; color: var(--vscode-inputValidation-infoForeground); margin-top: 6px; display: flex; align-items: center; gap: 4px; ${!activeMoveProjectRoot ? 'display: none;' : ''}">
          <span>${(0, icons_1.getIcon)(icons_1.ICONS.CHECK, 'icon-success')}</span> <span>Active: ${activeMoveProjectRoot ? (foundMoveProjects.find((p) => p.path === activeMoveProjectRoot)?.name || 'Unknown') : ''}</span>
        </div>
      </div>
    `;
    }
    // If current directory is a Move project, show confirmation
    if (isMoveProject) {
        return `
      <div class="section">
        <div class="section-title">${(0, icons_1.getIcon)(icons_1.ICONS.CHECK, 'icon-success')} Move Project Detected</div>
        <div style="font-size: 11px; color: var(--vscode-inputValidation-infoForeground); margin-bottom: 8px;">
          Current workspace root contains a Move project. All operations will use this directory.
        </div>
        <button id="rescanMoveProjectsBtn" class="btn-secondary">${(0, icons_1.getIcon)(icons_1.ICONS.RELOAD)} Scan for Other Projects</button>
      </div>
    `;
    }
    return "";
}
function generateCreatePackageSection(isMoveProject) {
    if (isMoveProject) {
        return "";
    }
    return `
    <div class="section">
      <div class="section-title">${(0, icons_1.getIcon)(icons_1.ICONS.PACKAGE)} Create Package</div>
      <input id="packageName" placeholder="Package name (e.g., my_package)" />
      <span id="packageNameError" class="error-message" style="display: none;"></span>
      <button id="createPackageBtn" onclick="sendCreate()" class="btn-primary btn-disabled" disabled>Create</button>
    </div>
  `;
}
function generateMoveProjectSections(params) {
    const { isMoveProject, pkg, upgradeCapInfo, modulesHtml, activeEnv, publishedTomlData } = params;
    const isEphemeralEnv = activeEnv === "devnet" || activeEnv === "localnet";
    if (!isMoveProject) {
        return "";
    }
    return `
    <div class="section">
      <div class="section-title">${(0, icons_1.getIcon)(icons_1.ICONS.TOOL)} Build & Tools ${isEphemeralEnv ? '<span class="badge-info">Resolving via testnet</span>' : ''}</div>
      <div class="btn-group">
        <button onclick="sendBuild()" class="btn-primary" title="sui move build">Build Package</button>
        <button onclick="sendUpdateDeps()" class="btn-secondary" title="sui move update-deps">${(0, icons_1.getIcon)(icons_1.ICONS.RELOAD)} Update Deps</button>
      </div>
      <button onclick="sendDumpBytecode()" class="btn-secondary" style="margin-top: 8px;" title="sui move build --dump-bytecode-as-base64">${(0, icons_1.getIcon)(icons_1.ICONS.PACKAGE)} Dump Bytecode</button>
    </div>

    <div class="section">
      <div class="section-title">${(0, icons_1.getIcon)(icons_1.ICONS.ROCKET)} Publish ${isEphemeralEnv ? '<span class="badge-warning">Ephemeral</span>' : ''}</div>
      <div class="btn-group">
        <button onclick="sendPublish()" class="btn-primary">${pkg ? "Re-publish" : "Publish"}</button>
        ${isEphemeralEnv ? `
          <button onclick="sendPublishWithDeps()" class="btn-secondary" title="test-publish --publish-unpublished-deps">${(0, icons_1.getIcon)(icons_1.ICONS.ROCKET)} Publish w/ Auto-Deps</button>
        ` : ""}
      </div>
      ${isEphemeralEnv ? `
        <div style="font-size: 10px; color: var(--vscode-descriptionForeground); margin-top: 6px;">
          Note: Publish info is not saved to Move.toml on ${activeEnv}.
        </div>
      ` : ""}
    </div>

    ${generatePublishedTomlSection(publishedTomlData)}
    ${generateDependencySection()}

    ${upgradeCapInfo ? `
      <div class="section">
        <div class="section-title">${(0, icons_1.getIcon)(icons_1.ICONS.UP)} Upgrade</div>
        <button onclick="sendUpgrade()" class="btn-primary">Upgrade Package</button>
      </div>
    ` : ""}

    <div class="section">
      <div class="section-title">${(0, icons_1.getIcon)(icons_1.ICONS.EXPERIMENT)} Test</div>
      <div class="input-group">
        <input id="testFuncName" placeholder="Test function (optional)" />
      </div>
      <button onclick="sendTest()" class="btn-primary">Run Tests</button>
    </div>

    <div class="section">
      <div class="section-title">${(0, icons_1.getIcon)(icons_1.ICONS.THUNDERBOLT)} Call Function</div>
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

      <div style="display: flex; gap: 8px;">
        <button onclick="sendCall()" class="btn-primary" style="flex: 1;">Execute</button>
        <button onclick="sendDevInspect()" class="btn-secondary" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px;">🔍 Dev Inspect</button>
      </div>
      <div id="devInspectResults" class="dev-inspect-results" style="display: none; margin-top: 12px; font-size: 11px; max-height: 400px; overflow-y: auto; background: var(--vscode-editor-background); border: 1px solid var(--vscode-widget-border); padding: 8px; border-radius: 4px;"></div>
    </div>

    ${generatePtbBuilderSection()}

    <div class="section danger-zone">
      <div class="section-title">${(0, icons_1.getIcon)(icons_1.ICONS.WARNING, 'icon-error')} Danger Zone</div>
      <button onclick="sendReset()" class="btn-primary btn-danger">Reset Deployment</button>
      <div class="input-help">
        Warning: This will delete Move.lock, Publish.toml, and wipe deployment addresses from Move.toml.
      </div>
    </div>
  `;
}
function generatePtbBuilderSection() {
    return `
    <div class="section">
      <div class="section-title" style="display: flex; justify-content: space-between; align-items: center;">
        <span>${(0, icons_1.getIcon)(icons_1.ICONS.TOOL)} PTB Builder</span>
        <div style="display: flex; gap: 4px;">
          <button onclick="importPtbJson()" class="btn-secondary" style="padding: 2px 6px; font-size: 10px;" title="Import JSON">${(0, icons_1.getIcon)(icons_1.ICONS.UP)}</button>
          <button onclick="exportPtbJson()" class="btn-secondary" style="padding: 2px 6px; font-size: 10px;" title="Export JSON">${(0, icons_1.getIcon)(icons_1.ICONS.DOWN)}</button>
          <button onclick="clearPtb()" class="btn-secondary" style="padding: 2px 6px; font-size: 10px; color: var(--vscode-errorForeground);" title="Clear PTB">${(0, icons_1.getIcon)(icons_1.ICONS.WARNING)}</button>
        </div>
      </div>
      
      <div id="ptbCommandsContainer" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; min-height: 50px; border: 1px dashed var(--vscode-widget-border); padding: 8px; border-radius: 4px;">
        <div id="emptyPtbMessage" style="text-align: center; color: var(--vscode-descriptionForeground); font-size: 11px; padding: 12px 0;">
          No commands added yet. Click "+ Add Command" to start building a transaction.
        </div>
      </div>

      <div class="input-group" style="display: flex; gap: 8px;">
        <select id="newPtbCommandType" style="flex: 1;">
          <option value="moveCall">Move Call (moveCall)</option>
          <option value="transferObjects">Transfer Objects (transferObjects)</option>
          <option value="splitCoins">Split Coins (splitCoins)</option>
          <option value="mergeCoins">Merge Coins (mergeCoins)</option>
          <option value="makeMoveVec">Make Vector (makeMoveVec)</option>
          // <option value="publish">Publish (publish)</option>
          // <option value="upgrade">Upgrade (upgrade)</option>
        </select>
        <button onclick="addPtbCommand()" class="btn-secondary" style="white-space: nowrap;">${(0, icons_1.getIcon)(icons_1.ICONS.PLUS)} Add Command</button>
      </div>

      <div style="display: flex; gap: 8px; margin-top: 12px;">
        <button onclick="executePtb()" class="btn-primary" style="flex: 1;" id="executePtbBtn">Execute PTB</button>
        <button onclick="devInspectPtb()" class="btn-secondary" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px;" id="devInspectPtbBtn">🔍 Inspect PTB</button>
      </div>
      
      <div id="ptbResultsContainer" style="display: none; margin-top: 12px; font-size: 11px; max-height: 400px; overflow-y: auto; background: var(--vscode-editor-background); border: 1px solid var(--vscode-widget-border); padding: 8px; border-radius: 4px;"></div>
    </div>
  `;
}
function generatePublishedTomlSection(data) {
    return `
    <div class="section">
      <div class="section-header">
        <div class="section-title">${(0, icons_1.getIcon)(icons_1.ICONS.FILE_TEXT)} Published Info</div>
        <button class="toggle-btn" onclick="toggleSection('publishedTomlContainer')">${(0, icons_1.getIcon)(icons_1.ICONS.DOWN, 'toggle-icon')} <span class="toggle-text">Show</span></button>
      </div>
      <div id="publishedTomlContainer" style="display: none;">
        <button onclick="sendViewPublishedToml()" class="btn-secondary" style="margin-bottom: 8px;">${(0, icons_1.getIcon)(icons_1.ICONS.SEARCH)} Fetch Published.toml</button>
        <div id="publishedTomlContent">
          ${data ? renderPublishedToml(data) : '<div class="input-help">Click fetch to view details from Published.toml</div>'}
        </div>
      </div>
    </div>
  `;
}
function renderPublishedToml(data) {
    if (!data || !data.published)
        return '<div class="input-help">No publication data found.</div>';
    const envs = Object.keys(data.published);
    return envs.map(env => {
        const pub = data.published[env];
        return `
      <div class="pub-env-item">
        <div class="pub-env-header">${env.toUpperCase()}</div>
        <div class="pub-env-grid">
          <div class="pub-env-label">Address</div>
          <div class="pub-env-value mono" onclick="copyValue('${pub['published-at']}')" title="Click to copy">${pub['published-at']?.slice(0, 8)}...</div>
          
          <div class="pub-env-label">Version</div>
          <div class="pub-env-value">${pub.version}</div>
          
          <div class="pub-env-label">Chain ID</div>
          <div class="pub-env-value mono">${pub['chain-id']?.slice(0, 8)}...</div>
        </div>
      </div>
    `;
    }).join("");
}
function generateDependencySection() {
    return `
    <div class="section">
      <div class="section-header">
        <div class="section-title">${(0, icons_1.getIcon)(icons_1.ICONS.PACKAGE)} Dependencies</div>
        <button class="toggle-btn" onclick="toggleSection('dependencyContainer')">${(0, icons_1.getIcon)(icons_1.ICONS.DOWN, 'toggle-icon')} <span class="toggle-text">Show</span></button>
      </div>
      <div id="dependencyContainer" style="display: none;">
        <div class="input-group">
          <label class="input-label">Type</label>
          <select id="depTypeSelector" onchange="updateDepForm()">
            <option value="mvr">Move Registry (MVR)</option>
            <option value="git">Git Repository</option>
            <option value="local">Local Path</option>
            <option value="system">System Package</option>
          </select>
        </div>
        
        <div class="input-group">
          <label class="input-label">Alias (name in Move.toml)</label>
          <input id="depAlias" placeholder="e.g., my_dep" />
        </div>

        <div class="input-group">
          <label id="depValueLabel" class="input-label">MVR Name (@scope/pkg)</label>
          <input id="depValue" placeholder="e.g., @potatoes/ascii" />
        </div>

        <div id="mvrOptions" style="display: block;">
          <div class="input-group">
            <label class="input-label">MVR Network</label>
            <select id="mvrNetwork">
              <option value="mainnet">Mainnet</option>
              <option value="testnet">Testnet</option>
            </select>
          </div>
        </div>

        <div id="gitOptions" style="display: none;">
          <div class="input-group">
            <label class="input-label">Subdirectory (optional)</label>
            <input id="depSubdir" placeholder="e.g., packages/codec" />
          </div>
          <div class="input-group">
            <label class="input-label">Revision (optional)</label>
            <input id="depRev" placeholder="e.g., main or v1.0.1" />
          </div>
        </div>

        <button onclick="sendAddDependency()" class="btn-primary" style="margin-top: 8px;">${(0, icons_1.getIcon)(icons_1.ICONS.PLUS)} Add Dependency</button>
      </div>
    </div>
  `;
}
function generateCoinPortfolioSection(coinPortfolio) {
    if (!coinPortfolio || coinPortfolio.balances.length === 0) {
        return `
      <div class="section">
        <div class="section-title">${(0, icons_1.getIcon)(icons_1.ICONS.WALLET)} Coin Portfolio</div>
        <div style="font-size: 11px; color: var(--vscode-descriptionForeground); text-align: center; padding: 20px;">
          No coins found. Try refreshing or check your wallet connection.
        </div>
      </div>
    `;
    }
    const formatBalance = (balance, decimals) => {
        const num = parseFloat(balance);
        if (num === 0) {
            return "0";
        }
        return (num / Math.pow(10, decimals)).toFixed(6);
    };
    const formatCoinType = (coinType) => {
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
      <div class="section-title">${(0, icons_1.getIcon)(icons_1.ICONS.WALLET)} Coin Portfolio (${coinPortfolio.balances.length} types)</div>
      <div class="coin-portfolio-container">
              ${coinPortfolio.balances.map((balance) => {
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
                    <button class="coin-objects-toggle" onclick="toggleCoinObjects('${balance.coinType}')">${(0, icons_1.getIcon)(icons_1.ICONS.DOWN, 'toggle-icon')} <span class="toggle-text">Show</span></button>
                  </div>
                  <div class="coin-objects-container" id="coin-objects-${balance.coinType}" style="display: none;">
                  ${coinObjects.map((coin) => `
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
function generateCoinPortfolioContent(coinPortfolio) {
    const formatBalance = (balance, decimals) => {
        const num = parseFloat(balance);
        if (num === 0) {
            return "0";
        }
        return (num / Math.pow(10, decimals)).toFixed(6);
    };
    const formatCoinType = (coinType) => {
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
    return coinPortfolio.balances.map((balance) => {
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
              <button class="coin-objects-toggle" onclick="toggleCoinObjects('${balance.coinType}')">${(0, icons_1.getIcon)(icons_1.ICONS.DOWN, 'toggle-icon')} <span class="toggle-text">Show</span></button>
            </div>
            <div class="coin-objects-container" id="coin-objects-${balance.coinType}" style="display: none;">
            ${coinObjects.map((coin) => `
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
//# sourceMappingURL=templates.js.map