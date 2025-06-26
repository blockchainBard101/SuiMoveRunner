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
    #statusMessage {
      font-weight: bold;
      color: var(--vscode-editor-foreground);
      min-height: 1.2em;
      margin-bottom: 1rem;
      text-align: center;
    }
  </style>
</head>
<body>
  <h3>Sui Move Runner</h3>

  <div id="statusMessage"></div>

  <div class="section" style="text-align:center; font-weight:bold; font-size:1.1rem; color: var(--vscode-editor-focusBorder);">
    ${activeEnv || "None"}
  </div>

  <div class="section">
    <select id="envSwitcher">${envOptions}</select>
  </div>

  <div class="section">
    <p><strong>Wallet</strong></p>
    <select id="walletSwitcher">
      ${wallets
        .map(
          (w) => `<option value="${w.address}" ${
            w.address === activeWallet ? "selected" : ""
          }>${w.name} - ${w.address.slice(0, 6)}...${w.address.slice(-4)}</option>`
        )
        .join("")}
    </select>
    <p>Address: <span id="walletAddress" title="Click to copy">${shortWallet}</span></p>
    <p><strong>Balance:</strong> ${suiBalance} SUI</p>
    <button id="createAddressBtn">➕ Create New Address</button>
  </div>

  ${
    !isMoveProject
      ? `<div class="section">
    <h4>Create Package</h4>
    <input id="packageName" placeholder="Package name" />
    <button onclick="sendCreate()">📦 Create</button>
  </div>`
      : ""
  }

  ${
    isMoveProject
      ? `<div class="section">
    <h4>Build Package</h4>
    <button onclick="sendBuild()">🛠️ Build</button>
  </div>

  <div class="section">
    <h4>Publish Package</h4>
    <button onclick="sendPublish()">🚀 ${pkg ? "Re-publish" : "Publish"}</button>
  </div>

  ${
    upgradeCapInfo
      ? `<div class="section">
    <h4>Upgrade Package</h4>
    <button onclick="sendUpgrade()">⬆️ Upgrade</button>
  </div>`
      : ""
  }

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
  </div>`
      : ""
  }

  <script>
    const vscode = acquireVsCodeApi();
    const argsMapping = ${JSON.stringify(argsMapping)};

    function setStatusMessage(msg) {
      const statusEl = document.getElementById('statusMessage');
      statusEl.textContent = msg || '';
    }

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

    window.addEventListener('load', () => {
      const functionSelect = document.getElementById('functionSelect');
      if (functionSelect) {
        functionSelect.dispatchEvent(new Event('change'));
      }
    });

    document.getElementById('envSwitcher').addEventListener('change', (e) => {
      const alias = e.target.value;
      setStatusMessage('Changing environment to ' + alias + '...');
      vscode.postMessage({ command: 'switch-env', alias });
    });

    document.getElementById('walletSwitcher').addEventListener('change', (e) => {
      const address = e.target.value;
      const shortAddress = address.slice(0, 6) + '...' + address.slice(-4);
      setStatusMessage('Changing wallet to ' + shortAddress + '...');
      vscode.postMessage({ command: 'switch-wallet', address });
    });

    document.getElementById('walletAddress').addEventListener('click', () => {
      const walletAddress = '${activeWallet}';
      navigator.clipboard.writeText(walletAddress).then(() => {
        vscode.postMessage({ command: 'showCopyNotification' });
      });
    });

    document.getElementById('createAddressBtn').addEventListener('click', () => {
      vscode.postMessage({ command: 'create-address' });
    });

    // Listen for extension messages
    window.addEventListener('message', event => {
      const message = event.data;
      if (message.command === 'switch-env-done') {
        setStatusMessage('Environment switched to ' + message.alias);
      } else if (message.command === 'switch-wallet-done') {
        const shortAddress =  message.address.slice(0, 6) + '...' +  message.address.slice(-4);
        setStatusMessage('Wallet switched to ' + shortAddress);
      } else if (message.command === 'set-status') {
        setStatusMessage(message.message);
      }
    });
  </script>
</body>
</html>`;
}
