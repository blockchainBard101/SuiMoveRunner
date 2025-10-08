export interface GasCoin {
  gasCoinId: string;
  mistBalance: number;
  suiBalance: string;
}

export function getWebviewContent(params: {
  activeEnv: string;
  availableEnvs: { alias: string; rpc: string }[];
  wallets: { name: string; address: string }[];
  activeWallet: string;
  suiBalance: string;
  gasCoins: GasCoin[];
  isMoveProject: boolean;
  pkg: string;
  upgradeCapInfo: { upgradeCap: string; packageId: string } | null;
  modulesHtml: string;
  argsMapping: Record<string, { argTypes: string[]; typeParams: string[] }>;
  iconUri: string;
  localnetRunning?: boolean;
  showFaucet?: boolean;
  suiVersion?: string;
  latestSuiVersion?: string;
  isSuiOutdated?: boolean;
}): string {
  const {
    activeEnv,
    availableEnvs,
    wallets,
    activeWallet,
    suiBalance,
    gasCoins,
    isMoveProject,
    pkg,
    upgradeCapInfo,
    modulesHtml,
    argsMapping,
    iconUri,
    localnetRunning = true,
    showFaucet = false,
    suiVersion = "Unknown",
    latestSuiVersion = "Unknown",
    isSuiOutdated = false,
  } = params;

  const envOptions = availableEnvs
    .map(
      (e) =>
        `<option value="${e.alias}" ${
          e.alias === activeEnv ? "selected" : ""
        }>${e.alias}</option>`
    )
    .join("");

  const shortWallet =
    activeWallet?.slice(0, 6) + "..." + activeWallet?.slice(-4) || "";

  const gasCoinsHtml =
    gasCoins.length > 0
      ? `
    <div class="gas-coins-section" id="gasCoinsSection">
      <div class="gas-coins-header">
        <span>Gas Coins (${gasCoins.length})</span>
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
  `
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: var(--vscode-font-family), -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: var(--vscode-font-size, 13px);
      padding: 12px;
      background-color: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      line-height: 1.4;
    }

    /* Header */
    .header {
      text-align: center;
      margin-bottom: 16px;
      padding: 8px 0;
      border-bottom: 1px solid var(--vscode-panel-border);
    }

    .header h1 {
      font-size: 16px;
      font-weight: 600;
      color: var(--vscode-titleBar-activeForeground);
      margin: 0;
    }

    /* Status bar */
    .status-bar {
      background-color: var(--vscode-statusBar-background);
      border: 1px solid var(--vscode-statusBar-border, var(--vscode-panel-border));
      border-radius: 4px;
      padding: 6px 10px;
      margin-bottom: 12px;
      font-size: 12px;
    }

    #statusMessage {
      color: var(--vscode-statusBar-foreground);
      text-align: center;
      min-height: 16px;
    }

    /* Sections */
    .section {
      background-color: var(--vscode-sideBar-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 12px;
    }

    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--vscode-foreground);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Environment indicator */
    .env-display {
      background-color: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      padding: 4px 8px;
      border-radius: 4px;
      text-align: center;
      font-weight: 500;
      font-size: 12px;
      margin-bottom: 12px;
    }

    /* Form elements */
    select, input[type="text"], input[type="search"], input {
      width: 100%;
      padding: 6px 8px;
      margin-bottom: 8px;
      border-radius: 4px;
      border: 1px solid var(--vscode-dropdown-border);
      background-color: var(--vscode-dropdown-background);
      color: var(--vscode-dropdown-foreground);
      font-size: 12px;
      font-family: inherit;
      transition: border-color 0.2s ease;
    }

    select:focus, input:focus {
      outline: none;
      border-color: var(--vscode-focusBorder);
      box-shadow: 0 0 0 1px var(--vscode-focusBorder);
    }

    /* Buttons */
    button {
      padding: 6px 12px;
      border: 1px solid var(--vscode-button-border, transparent);
      border-radius: 4px;
      font-size: 12px;
      font-family: inherit;
      cursor: pointer;
      margin-bottom: 6px;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      min-height: 28px;
    }

    .btn-primary {
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      width: 100%;
    }

    .btn-primary:hover {
      background-color: var(--vscode-button-hoverBackground);
    }

    .btn-secondary {
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      width: 100%;
    }

    .btn-secondary:hover {
      background-color: var(--vscode-button-secondaryHoverBackground);
    }

    .btn-small {
      padding: 4px 8px;
      font-size: 11px;
      min-height: 24px;
    }

    /* Wallet info */
    .wallet-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
      font-size: 12px;
    }

    .wallet-address {
      background-color: var(--vscode-textCodeBlock-background);
      color: var(--vscode-textPreformat-foreground);
      padding: 2px 6px;
      border-radius: 3px;
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: 11px;
      cursor: pointer;
      user-select: text;
      transition: background-color 0.2s ease;
    }

    .wallet-address:hover {
      background-color: var(--vscode-list-hoverBackground);
    }

    .balance {
      color: var(--vscode-terminal-ansiGreen);
      font-weight: 500;
    }

    /* Function inputs */
    .input-group {
      margin-bottom: 10px;
    }

    .input-label {
      display: block;
      margin-bottom: 4px;
      color: var(--vscode-foreground);
      font-size: 11px;
      font-weight: 500;
    }

    #typeArgsContainer, #argsContainer {
      max-height: 120px;
      overflow-y: auto;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      padding: 6px;
      margin-bottom: 8px;
      background-color: var(--vscode-editor-background);
    }

    #typeArgsContainer:empty, #argsContainer:empty {
      display: none;
    }

    /* Scrollbar */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    ::-webkit-scrollbar-track {
      background: var(--vscode-scrollbarSlider-background);
    }

    ::-webkit-scrollbar-thumb {
      background: var(--vscode-scrollbarSlider-hoverBackground);
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: var(--vscode-scrollbarSlider-activeBackground);
    }

    /* Compact layout */
    .compact-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .compact-row > * {
      margin-bottom: 0;
    }

    .flex-1 {
      flex: 1;
    }

    /* Icons */
    .icon {
      width: 14px;
      height: 14px;
      opacity: 0.8;
    }

    /* Loading state */
    .loading {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 2px solid var(--vscode-progressBar-background);
      border-radius: 50%;
      border-top-color: var(--vscode-button-foreground);
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Responsive adjustments */
    @media (max-width: 300px) {
      body {
        padding: 8px;
      }
      
      .section {
        padding: 8px;
      }
    }

    .input-error {
      border-color: var(--vscode-inputValidation-errorBorder) !important;
      background-color: var(--vscode-inputValidation-errorBackground);
    }

    .error-message {
      color: var(--vscode-inputValidation-errorForeground);
      font-size: 11px;
      margin-top: 4px;
      margin-bottom: 8px;
      display: block;
    }

    .btn-disabled {
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-descriptionForeground);
      cursor: not-allowed;
      opacity: 0.6;
    }

  .btn-disabled:hover {
    background-color: var(--vscode-button-secondaryBackground);
  }

  /* Gas coins styles */
    .gas-coins-container {
      margin-top: 8px;
      max-height: 150px;
      overflow-y: auto;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      background-color: var(--vscode-editor-background);
    }

    .gas-coin-item {
      padding: 6px 8px;
      border-bottom: 1px solid var(--vscode-panel-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      transition: background-color 0.2s ease;
    }

    .gas-coin-item:last-child {
      border-bottom: none;
    }

    .gas-coin-item:hover {
      background-color: var(--vscode-list-hoverBackground);
    }

    .gas-coin-id {
      font-family: var(--vscode-editor-font-family, monospace);
      color: var(--vscode-textPreformat-foreground);
      cursor: pointer;
      user-select: text;
      flex: 1;
      margin-right: 8px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .gas-coin-balance {
      color: var(--vscode-terminal-ansiGreen);
      font-weight: 500;
      white-space: nowrap;
    }

    .gas-coins-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
    }

    .gas-coins-toggle {
      background: none;
      border: none;
      color: #ffd166; /* brighter for dark mode */
      cursor: pointer;
      font-size: 11px;
      padding: 2px 4px;
      border-radius: 2px;
      transition: background-color 0.2s ease;
    }

    .gas-coins-toggle:hover {
      background-color: rgba(255, 209, 102, 0.12);
    }

    .collapsed .gas-coins-container {
      display: none;
    }

    .auto-filled {
    font-style: italic;
    color: var(--vscode-descriptionForeground);
  }
  
  .input-help {
    font-size: 10px;
    color: var(--vscode-descriptionForeground);
    margin-top: 2px;
    margin-bottom: 6px;
  }
  
  .common-value {
    background-color: var(--vscode-badge-background);
    color: var(--vscode-badge-foreground);
    padding: 1px 4px;
    border-radius: 2px;
    font-size: 10px;
    margin-left: 4px;
    cursor: pointer;
  }
  </style>
</head>
<body>
  <div class="header">
    <img src="${iconUri}" alt="⚡" width="32" height="32">
    <h1> Sui Move Runner</h1>
  </div>

  <div class="status-bar">
    <div id="statusMessage">Ready</div>
  </div>

  <!-- Sui CLI Version Status -->
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

  <div class="section">
    <button id="refreshBtn" class="btn-secondary">🔄 Refresh</button>
  </div>

  <div class="env-display">
    🌐 ${activeEnv || "No Environment"}
  </div>

  ${
    activeEnv === "localnet" && !localnetRunning
      ? `<div class="section">
          <div class="section-title">🟢 Local Network</div>
          <button id="startLocalnetBtn" class="btn-primary">Start Local Network</button>
          <div style="font-size:11px;margin-top:6px;color:var(--vscode-descriptionForeground)">
            Please start the local network.<br>
            This will run <code>sui start --with-faucet --force-regenesis</code> in a new terminal.
          </div>
        </div>`
      : ""
  }

  ${
    showFaucet
      ? `<div class="section">
          <div class="section-title">💧 Faucet</div>
          <button id="getFaucetBtn" class="btn-primary">Get Faucet</button>
        </div>`
      : ""
  }

  <div class="section">
    <div class="section-title">🔧 Environment</div>
    <select id="envSwitcher">${envOptions}</select>
  </div>

  <div class="section">
    <div class="section-title">👤 Wallet</div>
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
    <div class="wallet-row">
      <span>Address:</span>
      <span id="walletAddress" class="wallet-address" title="Click to copy">${
        activeWallet?.slice(0, 6) + "..." + activeWallet?.slice(-4) || ""
      }</span>
    </div>
    <button id="createAddressBtn" class="btn-secondary btn-small">➕ New Address</button>
    <div class="wallet-row">
      <span>Total Balance:</span>
      <span class="balance">${suiBalance} SUI</span>
    </div>
    ${gasCoinsHtml}
    ${
      gasCoins.length > 0
        ? `<div class="section" id="coinToolsSection">
            <div class="gas-coins-header">
              <span>🧰 Coin Tools</span>
              <button class="gas-coins-toggle" onclick="toggleCoinTools()">▼ Show</button>
            </div>
            <div id="coinToolsContainer" style="display: none;">
              ${
                gasCoins.length > 1
                  ? `<div style="margin-top:6px;">
                      <div class="section-title" style="margin-bottom:6px;">🪙 Merge Coins</div>
                      <div class="compact-row" style="margin-bottom:6px;">
                        <select id="primaryCoinSelect" class="flex-1">
                          ${gasCoins
                            .map(
                              (c) => `<option value="${c.gasCoinId}">${c.gasCoinId.slice(0,8)}...${c.gasCoinId.slice(-8)} (${c.suiBalance} SUI)</option>`
                            )
                            .join("")}
                        </select>
                      </div>
                      <div class="compact-row" style="margin-bottom:6px;">
                        <select id="coinToMergeSelect" class="flex-1">
                          ${gasCoins
                            .map(
                              (c) => `<option value="${c.gasCoinId}">${c.gasCoinId.slice(0,8)}...${c.gasCoinId.slice(-8)} (${c.suiBalance} SUI)</option>`
                            )
                            .join("")}
                        </select>
                      </div>
                      <button id="mergeCoinsBtn" class="btn-secondary btn-small btn-disabled" disabled>Merge into Primary</button>
                      <div class="input-help">Select a primary coin to keep, and a coin to merge into it.</div>
                    </div>`
                  : ""
              }
              <div style="margin-top:8px;">
                <div class="section-title" style="margin-bottom:6px;">✂️ Split Coin</div>
                <div class="compact-row" style="margin-bottom:6px;">
                  <select id="splitCoinSelect" class="flex-1">
                    ${gasCoins
                      .map(
                        (c) => `<option value="${c.gasCoinId}">${c.gasCoinId.slice(0,8)}...${c.gasCoinId.slice(-8)} (${c.suiBalance} SUI)</option>`
                      )
                      .join("")}
                  </select>
                </div>
                <div class="input-group">
                  <label class="input-label">Amounts (comma-separated) or Count</label>
                  <input id="splitAmounts" placeholder="e.g., 1000,2000,3000 (amount units per CLI)" inputmode="numeric" />
                  <div class="input-help">Provide either specific amounts; if both provided, amounts are used.</div>
                  <input id="splitCount" placeholder="Number of equal coins (count)" type="number" min="1" step="1" />
                </div>
                <button id="splitCoinBtn" class="btn-secondary btn-small btn-disabled" disabled>Split Coin</button>
              </div>
              <div style="margin-top:8px;">
                <div class="section-title" style="margin-bottom:6px;">📤 Transfer SUI</div>
                <div class="compact-row" style="margin-bottom:6px;">
                  <select id="transferSuiCoinSelect" class="flex-1">
                    ${gasCoins
                      .map(
                        (c) => `<option value="${c.gasCoinId}">${c.gasCoinId.slice(0,8)}...${c.gasCoinId.slice(-8)} (${c.suiBalance} SUI)</option>`
                      )
                      .join("")}
                  </select>
                </div>
                <div class="input-group">
                  <label class="input-label">Recipient Address</label>
                  <input id="transferTo" placeholder="0x... or keystore alias" />
                  <label class="input-label">Amount (optional)</label>
                  <input id="transferAmount" placeholder="If omitted, whole coin transfers" type="number" min="0" step="1" />
                </div>
                <button id="transferSuiBtn" class="btn-secondary btn-small btn-disabled" disabled>Transfer SUI</button>
              </div>
            </div>
          </div>`
        : ""
    }
    
  </div>

  ${
    !isMoveProject
      ? `<div class="section">
    <div class="section-title">📦 Create Package</div>
    <input id="packageName" placeholder="Package name (e.g., my_package)" />
    <span id="packageNameError" class="error-message" style="display: none;"></span>
    <button id="createPackageBtn" onclick="sendCreate()" class="btn-primary btn-disabled" disabled>Create</button>
  </div>`
      : ""
  }

  ${
    isMoveProject
      ? `<div class="section">
      <div class="section-title">🛠️ Build</div>
      <button onclick="sendBuild()" class="btn-primary">Build Package</button>
    </div>

    <div class="section">
      <div class="section-title">🚀 Publish</div>
      <button onclick="sendPublish()" class="btn-primary">${
        pkg ? "Re-publish" : "Publish"
      }</button>
    </div>

    ${
      upgradeCapInfo
        ? `<div class="section">
        <div class="section-title">⬆️ Upgrade</div>
        <button onclick="sendUpgrade()" class="btn-primary">Upgrade Package</button>
      </div>`
        : ""
    }

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
    </div>`
      : ""
  }

  <script>
    const vscode = acquireVsCodeApi();
    const argsMapping = ${JSON.stringify(argsMapping)};

    // Gas coins functionality
    function toggleGasCoins() {
      const section = document.getElementById('gasCoinsSection');
      const container = section.querySelector('.gas-coins-container');
      const toggle = section.querySelector('.gas-coins-toggle');
      
      if (container.style.display === 'none') {
        container.style.display = 'block';
        toggle.textContent = '▲ Hide';
        section.classList.remove('collapsed');
      } else {
        container.style.display = 'none';
        toggle.textContent = '▼ Show';
        section.classList.add('collapsed');
      }
    }

    function toggleCoinTools() {
      const section = document.getElementById('coinToolsSection');
      const container = document.getElementById('coinToolsContainer');
      const toggle = section ? section.querySelector('.gas-coins-toggle') : null;
      if (!container || !toggle) return;

      if (container.style.display === 'none') {
        container.style.display = 'block';
        toggle.textContent = '▲ Hide';
        section.classList.remove('collapsed');
        // Re-validate forms on open
        try { validateMergeForm(); } catch {}
        try { validateSplitForm(); } catch {}
        try { validateTransferForm(); } catch {}
      } else {
        container.style.display = 'none';
        toggle.textContent = '▼ Show';
        section.classList.add('collapsed');
      }
    }

    function copyGasCoinId(coinId) {
      navigator.clipboard.writeText(coinId).then(() => {
        setStatusMessage('Gas coin ID copied!');
        setTimeout(() => setStatusMessage(''), 2000);
      }).catch(() => {
        setStatusMessage('Failed to copy gas coin ID');
      });
    }

    function sendMergeCoin() {
      const primary = (document.getElementById('primaryCoinSelect') || { value: '' }).value;
      const toMerge = (document.getElementById('coinToMergeSelect') || { value: '' }).value;
      if (!primary || !toMerge) {
        setStatusMessage('Select both coins');
        return;
      }
      if (primary === toMerge) {
        setStatusMessage('Coins must be different');
        return;
      }
      setStatusMessage('Merging coins...');
      vscode.postMessage({ command: 'merge-coin', primaryCoin: primary, coinToMerge: toMerge });
    }

    function sendSplitCoin() {
      const coinId = (document.getElementById('splitCoinSelect') || { value: '' }).value;
      const amountsStr = (document.getElementById('splitAmounts') || { value: '' }).value.trim();
      const countStr = (document.getElementById('splitCount') || { value: '' }).value.trim();
      if (!coinId) {
        setStatusMessage('Select a coin to split');
        return;
      }
      const hasAmounts = amountsStr.length > 0;
      const hasCount = countStr.length > 0;
      if (!hasAmounts && !hasCount) {
        setStatusMessage('Provide either amounts or count');
        return;
      }
      let payload = { command: 'split-coin', coinId };
      if (hasAmounts) {
        const amounts = amountsStr.split(',').map(v => v.trim()).filter(v => v.length > 0);
        if (amounts.length === 0) {
          setStatusMessage('Enter at least one amount');
          return;
        }
        payload = { ...payload, amounts };
        if (hasCount) {
          setStatusMessage('Using amounts; count will be ignored');
        }
      } else {
        const count = parseInt(countStr, 10);
        if (!Number.isFinite(count) || count <= 0) {
          setStatusMessage('Count must be a positive integer');
          return;
        }
        payload = { ...payload, count };
      }
      setStatusMessage('Splitting coin...');
      vscode.postMessage(payload);
    }

    function sendTransferSui() {
      const coinId = (document.getElementById('transferSuiCoinSelect') || { value: '' }).value;
      const to = (document.getElementById('transferTo') || { value: '' }).value.trim();
      const amountStr = (document.getElementById('transferAmount') || { value: '' }).value.trim();
      if (!coinId) {
        setStatusMessage('Select a SUI coin to transfer');
        return;
      }
      if (!to) {
        setStatusMessage('Enter a recipient');
        return;
      }
      const payload = { command: 'transfer-sui', coinId, to };
      if (amountStr) {
        payload.amount = amountStr;
      }
      setStatusMessage('Transferring SUI...');
      vscode.postMessage(payload);
    }

    function validatePackageName(name) {
    const packageNameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    
    if (!name) {
      return { valid: false, message: '' };
    }
    
    if (!packageNameRegex.test(name)) {
      if (!/^[a-zA-Z]/.test(name)) {
        return { valid: false, message: 'Package name must start with a letter' };
      }
      if (/[^a-zA-Z0-9_]/.test(name)) {
        return { valid: false, message: 'Package name can only contain letters, numbers, and underscores' };
      }
      return { valid: false, message: 'Invalid package name format' };
    }
    
    return { valid: true, message: '' };
  }

  function updatePackageValidation() {
    const input = document.getElementById('packageName');
    const errorSpan = document.getElementById('packageNameError');
    const createBtn = document.getElementById('createPackageBtn');
    
    if (!input || !errorSpan || !createBtn) return;
    
    const name = input.value.trim();
    const validation = validatePackageName(name);
    
    if (validation.valid && name) {
      // Valid name
      input.classList.remove('input-error');
      errorSpan.style.display = 'none';
      createBtn.disabled = false;
      createBtn.classList.remove('btn-disabled');
    } else {
      // Invalid name
      if (name) {
        input.classList.add('input-error');
        errorSpan.textContent = validation.message;
        errorSpan.style.display = 'block';
      } else {
        input.classList.remove('input-error');
        errorSpan.style.display = 'none';
      }
      createBtn.disabled = true;
      createBtn.classList.add('btn-disabled');
    }
  }

  document.getElementById('packageName')?.addEventListener('input', updatePackageValidation);
  document.getElementById('packageName')?.addEventListener('blur', updatePackageValidation);

    function setStatusMessage(msg) {
      const statusEl = document.getElementById('statusMessage');
      statusEl.textContent = msg || 'Ready';
    }

    function setButtonEnabled(btn, enabled) {
      if (!btn) return;
      if (enabled) {
        btn.disabled = false;
        btn.classList.remove('btn-disabled');
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-primary');
      } else {
        btn.disabled = true;
        btn.classList.add('btn-disabled');
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
      }
    }

    function validateMergeForm() {
      const primary = (document.getElementById('primaryCoinSelect') || { value: '' }).value;
      const toMerge = (document.getElementById('coinToMergeSelect') || { value: '' }).value;
      const valid = Boolean(primary && toMerge && primary !== toMerge);
      const btn = document.getElementById('mergeCoinsBtn');
      setButtonEnabled(btn, valid);
    }

    function validateSplitForm() {
      const coinId = (document.getElementById('splitCoinSelect') || { value: '' }).value;
      const amountsStr = (document.getElementById('splitAmounts') || { value: '' }).value.trim();
      const countStr = (document.getElementById('splitCount') || { value: '' }).value.trim();
      const hasAmounts = amountsStr.length > 0;
      const hasCount = countStr.length > 0;

      let amountsValid = false;
      if (hasAmounts) {
        const parts = amountsStr.split(',').map(v => v.trim()).filter(Boolean);
        amountsValid = parts.length > 0 && parts.every(v => Number.isFinite(Number(v)) && Number(v) >= 0 && /^\d+$/.test(v));
      }

      let countValid = false;
      if (hasCount) {
        const n = Number(countStr);
        countValid = Number.isFinite(n) && Number.isInteger(n) && n >= 1;
      }

      const valid = Boolean(coinId) && (amountsValid || countValid);
      const btn = document.getElementById('splitCoinBtn');
      setButtonEnabled(btn, valid);
    }

    function validateTransferForm() {
      const coinId = (document.getElementById('transferSuiCoinSelect') || { value: '' }).value;
      const to = (document.getElementById('transferTo') || { value: '' }).value.trim();
      const amountStr = (document.getElementById('transferAmount') || { value: '' }).value.trim();
      let valid = Boolean(coinId && to);
      if (amountStr) {
        valid = valid && /^\d+$/.test(amountStr);
      }
      const btn = document.getElementById('transferSuiBtn');
      setButtonEnabled(btn, valid);
    }

    function sendCreate() {
    const packageName = document.getElementById('packageName').value.trim();
    const validation = validatePackageName(packageName);
    
    if (!validation.valid || !packageName) {
      setStatusMessage('Please enter a valid package name');
      return;
    }
    
    setStatusMessage('Creating package...');
    vscode.postMessage({ command: 'create', packageName });
  }

    function sendBuild() {
      setStatusMessage('Building...');
      vscode.postMessage({ command: 'build' });
    }

    function sendPublish() {
      setStatusMessage('Publishing...');
      vscode.postMessage({ command: 'publish' });
    }

    function sendUpgrade() {
      setStatusMessage('Upgrading...');
      vscode.postMessage({ command: 'upgrade' });
    }

    function sendTest() {
      const funcName = document.getElementById('testFuncName').value.trim();
      setStatusMessage('Running tests...');
      vscode.postMessage({ command: 'test', functionName: funcName });
    }

    function extractOptionType(type) {
      const match = type.match(/Option<(.+)>/);
      if (match) {
        return cleanupTypeName(match[1]);
      }
      return null;
    }

    function cleanupTypeName(type) {
      if (!type) return 'value';
      
      // For struct types, preserve the full path but shorten the address
      if (type.includes('::')) {
        // Replace long addresses with shortened form
        const cleaned = type.replace(/0x[a-fA-F0-9]{40,}/g, (match) => {
          return match.slice(0, 5) + '...' + match.slice(-3);
        });
        return cleaned;
      }
      
      // For simple types, return as is
      return type;
    }

    // Extract inner type from Coin<T>
    function extractCoinType(type) {
      const match = String(type).match(/Coin<\s*(.+?)\s*>/);
      return match ? match[1] : null;
    }

    // Extract inner type from vector<T>
    function extractVectorType(type) {
      const match = String(type).match(/vector<\s*(.+?)\s*>/);
      return match ? match[1] : null;
    }

    function sendCall() {
  const pkg = document.getElementById('pkg').value;
  const selected = document.getElementById('functionSelect').selectedOptions[0];
  
  if (!selected) {
    setStatusMessage('Please select a function');
    return;
  }

  const module = selected.getAttribute('data-mod');
  const func = selected.value;
  const key = module + '::' + func;
  const { typeParams } = argsMapping[key] || { typeParams: [] };

  const argElements = Array.from(document.querySelectorAll('#argsContainer input'));
  const args = argElements.map(input => {
    let value = input.value.trim();
    
    // Handle special cases for empty values
    if (!value && input.placeholder.includes('auto-provided')) {
      return ''; // TxContext and similar are auto-provided
    }
    
    // Handle vector inputs (comma-separated values)
    if (input.placeholder.includes('comma-separated') && value) {
      return value.split(',').map(v => v.trim()).join(' ');
    }
    
    return value;
  }).filter(arg => arg !== ''); // Remove empty arguments

  const typeArgElements = Array.from(document.querySelectorAll('#typeArgsContainer input'));
  const typeArgs = typeArgElements.map(input => input.value.trim()).filter(arg => arg !== '');

  setStatusMessage('Executing...');
  vscode.postMessage({ command: 'call', pkg, module, func, args, typeArgs });
}

  function getArgumentPlaceholderAndDefault(type, index) {
    // Handle the common Clock type - make it readonly
    if (type === '0x2::clock::Clock' || type.includes('clock::Clock')) {
      return {
        placeholder: 'Clock object (0x6 for shared clock)',
        defaultValue: '0x6',
        readonly: true,
      };
    }
    
    // Handle other common Sui system objects
    if (type === '0x2::tx_context::TxContext' || type.includes('TxContext')) {
      return {
        placeholder: 'Transaction context (auto-provided)',
        defaultValue: '',
        readonly: true,
      };
    }
    
    // Handle coin types
    if (type.includes('0x2::coin::Coin') || type.includes('coin::Coin')) {
      const coinType = extractCoinType(type);
      return {
        placeholder: 'Coin object ID' + (coinType ? ' (' + cleanupTypeName(coinType) + ')' : ''),
        defaultValue: ''
      };
    }
    
    // Handle treasury cap
    if (type.includes('TreasuryCap')) {
      return {
        placeholder: 'Treasury capability object ID (' + cleanupTypeName(type) + ')',
        defaultValue: ''
      };
    }
    
    // Handle upgrade cap
    if (type.includes('UpgradeCap')) {
      return {
        placeholder: 'Upgrade capability object ID (' + cleanupTypeName(type) + ')',
        defaultValue: ''
      };
    }
    
    // Handle vectors
    if (type.startsWith('vector<') || type.includes('vector')) {
      const innerType = extractVectorType(type);
      return {
        placeholder: 'Vector of ' + cleanupTypeName(innerType || 'items') + ' (comma-separated)',
        defaultValue: ''
      };
    }
    
    // Handle option types
    if (type.startsWith('0x1::option::Option') || type.includes('Option')) {
      const innerType = extractOptionType(type);
      return {
        placeholder: 'Optional ' + cleanupTypeName(innerType || 'value') + ' (or leave empty for None)',
        defaultValue: ''
      };
    }
    
    // Handle strings
    if (type === '0x1::string::String' || type.includes('string::String') || type === 'vector<u8>') {
      return {
        placeholder: 'String value',
        defaultValue: ''
      };
    }
    
    // Handle addresses
    if (type === 'address') {
      return {
        placeholder: '0x... (wallet address)',
        defaultValue: ''
      };
    }
    
    // Handle basic numeric types
    if (['u8', 'u16', 'u32', 'u64', 'u128', 'u256'].includes(type)) {
      return {
        placeholder: 'Number (' + type + ')',
        defaultValue: ''
      };
    }
    
    // Handle boolean
    if (type === 'bool') {
      return {
        placeholder: 'true or false',
        defaultValue: ''
      };
    }
    
    // Handle generic object references
    if (type.includes('0x2::object::') || type.includes('object::')) {
      return {
        placeholder: 'Object ID (' + cleanupTypeName(type) + ')',
        defaultValue: ''
      };
    }
    
    // For struct types (custom objects), show the full type path
    if (type.includes('::')) {
      const cleanType = cleanupTypeName(type);
      return {
        placeholder: 'Object ID (' + cleanType + ')',
        defaultValue: ''
      };
    }
    
    // Clean up the type display for other complex types
    const cleanType = cleanupTypeName(type);
    
    // Default case
    return {
      placeholder: cleanType + ' (argument ' + (index + 1) + ')',
      defaultValue: ''
    };
  }

  document.getElementById('functionSelect')?.addEventListener('change', () => {
  const selected = document.getElementById('functionSelect').selectedOptions[0];
  const mod = selected?.getAttribute('data-mod');
  const func = selected?.value;
  const key = mod + '::' + func;
  const { argTypes, typeParams } = argsMapping[key] || { argTypes: [], typeParams: [] };

  const argsContainer = document.getElementById('argsContainer');
  const typeArgsContainer = document.getElementById('typeArgsContainer');
  
  if (argsContainer) argsContainer.innerHTML = '';
  if (typeArgsContainer) typeArgsContainer.innerHTML = '';

  if (typeParams.length > 0) {
    const typeArgsHeader = document.createElement('div');
    typeArgsHeader.className = 'input-label';
    typeArgsHeader.textContent = 'Type Arguments';
    typeArgsContainer.appendChild(typeArgsHeader);

    typeParams.forEach((tp, i) => {
      const input = document.createElement('input');
      input.placeholder = tp && tp.length > 0 ? tp : 'Type ' + (i + 1);
      typeArgsContainer.appendChild(input);
    });
  }

  if (argTypes.length > 0) {
    const argsHeader = document.createElement('div');
    argsHeader.className = 'input-label';
    argsHeader.textContent = 'Arguments';
    argsContainer.appendChild(argsHeader);

    argTypes.forEach((type, index) => {
      const input = document.createElement('input');
      
      // Enhanced placeholder and auto-fill logic
      const { placeholder, defaultValue, readonly } = getArgumentPlaceholderAndDefault(type, index);
      
      input.placeholder = placeholder;
      if (defaultValue) {
        input.value = defaultValue;
      }
      
      // Make input readonly if specified
      if (readonly) {
        input.readOnly = true;
        input.style.backgroundColor = 'var(--vscode-input-background)';
        input.style.color = 'var(--vscode-descriptionForeground)';
        input.style.cursor = 'not-allowed';
        input.title = 'This value is automatically provided';
      }
      
      // Add helpful styling for auto-filled values
      if (defaultValue && !readonly) {
        input.style.fontStyle = 'italic';
        input.style.color = 'var(--vscode-descriptionForeground)';
        
        // Reset styling when user starts typing
        input.addEventListener('input', () => {
          input.style.fontStyle = 'normal';
          input.style.color = 'var(--vscode-dropdown-foreground)';
        });
      }
      
      argsContainer.appendChild(input);
    });
  }
});

    // Initialize function selector
    window.addEventListener('load', () => {
    updatePackageValidation();

      const functionSelect = document.getElementById('functionSelect');
      if (functionSelect) {
        functionSelect.dispatchEvent(new Event('change'));
      }
    });

    // Environment switcher
    document.getElementById('envSwitcher')?.addEventListener('change', (e) => {
      const val = e.target.value;
      vscode.postMessage({ command: 'switch-env', env: val });
    });

    // Wallet switcher
    document.getElementById('walletSwitcher')?.addEventListener('change', (e) => {
      const address = e.target.value;
      const shortAddress = address.slice(0, 6) + '...' + address.slice(-4);
      setStatusMessage('Switching wallet...');
      vscode.postMessage({ command: 'switch-wallet', address });
    });

    // Wallet address copy
    document.getElementById('walletAddress')?.addEventListener('click', () => {
      const walletAddress = '${activeWallet}';
      navigator.clipboard.writeText(walletAddress).then(() => {
        setStatusMessage('Address copied!');
        vscode.postMessage({ command: 'showCopyNotification' });
      });
    });

    // Create address button
    document.getElementById('createAddressBtn')?.addEventListener('click', () => {
      setStatusMessage('Creating address...');
      vscode.postMessage({ command: 'create-address' });
    });

    // Refresh button
    document.getElementById('refreshBtn')?.addEventListener('click', () => {
      setStatusMessage('Refreshing wallets, environments, and checking for updates...');
      vscode.postMessage({ command: 'refresh' });
    });

    // Start Localnet button
    document.getElementById('startLocalnetBtn')?.addEventListener('click', () => {
      setStatusMessage('Starting local network...');
      vscode.postMessage({ command: 'start-localnet' });
    });

    // Faucet button
    document.getElementById('getFaucetBtn')?.addEventListener('click', () => {
      setStatusMessage('Requesting faucet...');
      vscode.postMessage({ command: 'get-faucet' });
    });

    // Update Sui CLI button
    document.getElementById('updateSuiBtn')?.addEventListener('click', () => {
      setStatusMessage('Updating Sui CLI...');
      vscode.postMessage({ command: 'update-sui' });
    });

    // Defer binding of dynamic buttons until DOM is ready
    window.addEventListener('load', () => {
      const mergeBtn = document.getElementById('mergeCoinsBtn');
      if (mergeBtn) {
        mergeBtn.addEventListener('click', () => {
          sendMergeCoin();
        });
      }
      const splitBtn = document.getElementById('splitCoinBtn');
      if (splitBtn) {
        splitBtn.addEventListener('click', () => {
          sendSplitCoin();
        });
      }
      const transferBtn = document.getElementById('transferSuiBtn');
      if (transferBtn) {
        transferBtn.addEventListener('click', () => {
          sendTransferSui();
        });
      }

      // Attach validation listeners
      document.getElementById('primaryCoinSelect')?.addEventListener('change', validateMergeForm);
      document.getElementById('coinToMergeSelect')?.addEventListener('change', validateMergeForm);

      document.getElementById('splitCoinSelect')?.addEventListener('change', validateSplitForm);
      document.getElementById('splitAmounts')?.addEventListener('input', validateSplitForm);
      document.getElementById('splitAmounts')?.addEventListener('keyup', validateSplitForm);
      document.getElementById('splitCount')?.addEventListener('input', validateSplitForm);
      document.getElementById('splitCount')?.addEventListener('keyup', validateSplitForm);

      document.getElementById('transferSuiCoinSelect')?.addEventListener('change', validateTransferForm);
      document.getElementById('transferTo')?.addEventListener('input', validateTransferForm);
      document.getElementById('transferTo')?.addEventListener('keyup', validateTransferForm);
      document.getElementById('transferAmount')?.addEventListener('input', validateTransferForm);
      document.getElementById('transferAmount')?.addEventListener('keyup', validateTransferForm);

      // Initial validation
      validateMergeForm();
      validateSplitForm();
      validateTransferForm();
    });


    // Listen for extension messages
    window.addEventListener('message', event => {
  const message = event.data;
  switch(message.command) {
    case 'switch-env-done':
      setStatusMessage("Switched to" + message.alias);
      break;
    case 'switch-wallet-done':
      const shortAddress = message.address.slice(0, 6) + '...' + message.address.slice(-4);
      setStatusMessage("Switched to" + shortAddress);
      break;
    case 'set-status':
      setStatusMessage(message.message);
      break;
    case 'gas-coin-copied':
      setStatusMessage('📋 Gas coin ID copied to clipboard!');
      // Auto-clear the message after 2 seconds
      setTimeout(() => setStatusMessage(''), 2000);
      break;
    default:
      break;
  }
});
  </script>
</body>
</html>`;
}
