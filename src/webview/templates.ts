import { GasCoin, WebviewParams } from './types';

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
  `;
}

export function generateCoinToolsSection(gasCoins: GasCoin[]): string {
  if (gasCoins.length === 0) {
    return "";
  }

  return `
    <div class="section" id="coinToolsSection">
      <div class="gas-coins-header">
        <span>🧰 Coin Tools</span>
        <button class="gas-coins-toggle" onclick="toggleCoinTools()">▼ Show</button>
      </div>
      <div id="coinToolsContainer" style="display: none;">
        ${generateMergeCoinsSection(gasCoins)}
        ${generateSplitCoinSection(gasCoins)}
        ${generateTransferSuiSection(gasCoins)}
      </div>
    </div>
  `;
}

function generateMergeCoinsSection(gasCoins: GasCoin[]): string {
  if (gasCoins.length <= 1) {
    return "";
  }

  return `
    <div style="margin-top:6px;">
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
    </div>
  `;
}

function generateSplitCoinSection(gasCoins: GasCoin[]): string {
  return `
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
  `;
}

function generateTransferSuiSection(gasCoins: GasCoin[]): string {
  return `
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
  `;
}

export function generateWalletSection(params: WebviewParams): string {
  const { wallets, activeWallet, suiBalance, gasCoins } = params;
  const shortWallet = activeWallet?.slice(0, 6) + "..." + activeWallet?.slice(-4) || "";
  
  return `
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
        <span id="walletAddress" class="wallet-address" title="Click to copy">${shortWallet}</span>
      </div>
      <button id="createAddressBtn" class="btn-secondary btn-small">➕ New Address</button>
      <div class="wallet-row">
        <span>Total Balance:</span>
        <span class="balance">${suiBalance} SUI</span>
      </div>
      ${generateGasCoinsHtml(gasCoins)}
      ${generateCoinToolsSection(gasCoins)}

      <div class="gas-coins-header" id="importWalletSection">
        <span>🔑 Import Wallet</span>
        <button class="gas-coins-toggle" onclick="toggleImportWallet()">▼ Show</button>
      </div>
      <div id="importWalletContainer" style="display: none;">
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
        <button id="importWalletBtn" class="btn-secondary btn-small btn-disabled" disabled>Import Wallet</button>
      </div>
    </div>
  `;
}

export function generateImportWalletSection(): string {
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

