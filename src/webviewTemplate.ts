export function getWebviewContent(params: {
  activeEnv: string;
  availableEnvs: { alias: string; rpc: string }[];
  wallets: { name: string; address: string }[];
  activeWallet: string;
  suiBalance: string;
  isMoveProject: boolean;
  pkg: string;
  upgradeCapInfo: { upgradeCap: string; packageId: string } | null;
  modulesHtml: string;
  argsMapping: Record<string, { argTypes: string[]; typeParams: string[] }>;
}): string {
  const {
    activeEnv,
    availableEnvs,
    wallets,
    activeWallet,
    suiBalance,
    isMoveProject,
    pkg,
    upgradeCapInfo,
    modulesHtml,
    argsMapping,
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
  </style>
</head>
<body>
  <div class="header">
    <h1>⚡ Sui Move Runner</h1>
  </div>

  <div class="status-bar">
    <div id="statusMessage">Ready</div>
  </div>

  <div class="section">
    <button id="refreshBtn" class="btn-secondary">🔄 Refresh</button>
  </div>

  <div class="env-display">
    🌐 ${activeEnv || "No Environment"}
  </div>

  <div class="section">
    <div class="section-title">🔧 Environment</div>
    <select id="envSwitcher">${envOptions}</select>
  </div>

  <div class="section">
    <div class="section-title">👤 Wallet</div>
    <select id="walletSwitcher">
      ${wallets
        .map(
          (w) => `<option value="${w.address}" ${
            w.address === activeWallet ? "selected" : ""
          }>${w.name} - ${w.address.slice(0, 6)}...${w.address.slice(-4)}</option>`
        )
        .join("")}
    </select>
    <div class="wallet-row">
      <span>Address:</span>
      <span id="walletAddress" class="wallet-address" title="Click to copy">${shortWallet}</span>
    </div>
    <div class="wallet-row">
      <span>Balance:</span>
      <span class="balance">${suiBalance} SUI</span>
    </div>
    <button id="createAddressBtn" class="btn-secondary btn-small">➕ New Address</button>
  </div>

  ${
    !isMoveProject
      ? `<div class="section">
      <div class="section-title">📦 Create Package</div>
      <input id="packageName" placeholder="Package name" />
      <button onclick="sendCreate()" class="btn-primary">Create</button>
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
      <button onclick="sendPublish()" class="btn-primary">${pkg ? "Re-publish" : "Publish"}</button>
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

    function setStatusMessage(msg) {
      const statusEl = document.getElementById('statusMessage');
      statusEl.textContent = msg || 'Ready';
    }

    function sendCreate() {
      const packageName = document.getElementById('packageName').value;
      if (!packageName.trim()) {
        setStatusMessage('Please enter package name');
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
      const args = argElements.map(input => input.value);

      const typeArgElements = Array.from(document.querySelectorAll('#typeArgsContainer input'));
      const typeArgs = typeArgElements.map(input => input.value);

      setStatusMessage('Executing...');
      vscode.postMessage({ command: 'call', pkg, module, func, args, typeArgs });
    }

    // Function selector change handler
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
          input.placeholder = tp && tp.length > 0 ? tp : \`Type \${i + 1}\`;
          typeArgsContainer.appendChild(input);
        });
      }

      if (argTypes.length > 0) {
        const argsHeader = document.createElement('div');
        argsHeader.className = 'input-label';
        argsHeader.textContent = 'Arguments';
        argsContainer.appendChild(argsHeader);

        argTypes.forEach((type) => {
          const input = document.createElement('input');
          input.placeholder = type;
          argsContainer.appendChild(input);
        });
      }
    });

    // Initialize function selector
    window.addEventListener('load', () => {
      const functionSelect = document.getElementById('functionSelect');
      if (functionSelect) {
        functionSelect.dispatchEvent(new Event('change'));
      }
    });

    // Environment switcher
    document.getElementById('envSwitcher')?.addEventListener('change', (e) => {
      const alias = e.target.value;
      setStatusMessage(\`Switching to \${alias}...\`);
      vscode.postMessage({ command: 'switch-env', alias });
    });

    // Wallet switcher
    document.getElementById('walletSwitcher')?.addEventListener('change', (e) => {
      const address = e.target.value;
      const shortAddress = address.slice(0, 6) + '...' + address.slice(-4);
      setStatusMessage(\`Switching wallet...\`);
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
      setStatusMessage('Refreshing...');
      vscode.postMessage({ command: 'refresh' });
    });

    // Listen for extension messages
    window.addEventListener('message', event => {
      const message = event.data;
      switch(message.command) {
        case 'switch-env-done':
          setStatusMessage(\`Switched to \${message.alias}\`);
          break;
        case 'switch-wallet-done':
          const shortAddress = message.address.slice(0, 6) + '...' + message.address.slice(-4);
          setStatusMessage(\`Switched to \${shortAddress}\`);
          break;
        case 'set-status':
          setStatusMessage(message.message);
          break;
        default:
          break;
      }
    });
  </script>
</body>
</html>`;
}