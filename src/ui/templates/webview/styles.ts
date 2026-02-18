export const webviewStyles = `
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

  /* Enhanced Wallet Switcher */
  #walletSwitcher {
    background: linear-gradient(135deg, var(--vscode-dropdown-background) 0%, var(--vscode-editor-background) 100%);
    border: 2px solid var(--vscode-panel-border);
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 13px;
    font-weight: 500;
    color: var(--vscode-foreground);
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 16px;
  }

  #walletSwitcher:hover {
    border-color: var(--vscode-focusBorder);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }

  #walletSwitcher:focus {
    outline: none;
    border-color: var(--vscode-focusBorder);
    box-shadow: 0 0 0 3px rgba(var(--vscode-focusBorder), 0.3);
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

  /* Wallet Section - Clean Professional Design */
  .wallet-section {
    background: linear-gradient(135deg, var(--vscode-sideBar-background) 0%, var(--vscode-editor-background) 100%);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 12px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  }

  .wallet-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--vscode-panel-border);
  }

  .wallet-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--vscode-foreground);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .wallet-title::before {
    content: "👤";
    font-size: 14px;
  }

  .wallet-status {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 6px;
    background-color: var(--vscode-badge-background);
    color: var(--vscode-badge-foreground);
    border-radius: 8px;
    font-size: 10px;
    font-weight: 500;
  }

  .wallet-status::before {
    content: "●";
    color: var(--vscode-terminal-ansiGreen);
    font-size: 6px;
  }

  .wallet-info-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
    margin-bottom: 12px;
  }

  .wallet-info-card {
    background-color: var(--vscode-editor-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
    padding: 8px;
    transition: all 0.2s ease;
  }

  .wallet-info-card:hover {
    border-color: var(--vscode-focusBorder);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .wallet-info-label {
    font-size: 10px;
    font-weight: 600;
    color: var(--vscode-descriptionForeground);
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin-bottom: 4px;
  }

  .wallet-address {
    background: linear-gradient(135deg, var(--vscode-textCodeBlock-background) 0%, var(--vscode-editor-background) 100%);
    color: var(--vscode-textPreformat-foreground);
    padding: 6px 8px;
    border-radius: 4px;
    font-family: var(--vscode-editor-font-family, monospace);
    font-size: 11px;
    cursor: pointer;
    user-select: text;
    transition: all 0.2s ease;
    border: 1px solid var(--vscode-panel-border);
    word-break: break-all;
    position: relative;
  }

  .wallet-address:hover {
    background: linear-gradient(135deg, var(--vscode-list-hoverBackground) 0%, var(--vscode-textCodeBlock-background) 100%);
    border-color: var(--vscode-focusBorder);
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }

  .wallet-address::after {
    content: "📋";
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0;
    transition: opacity 0.2s ease;
    font-size: 10px;
  }

  .wallet-address:hover::after {
    opacity: 1;
  }

  .wallet-balance {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(135deg, var(--vscode-editor-background) 0%, var(--vscode-sideBar-background) 100%);
    padding: 8px;
    border-radius: 4px;
    border: 1px solid var(--vscode-panel-border);
  }

  .balance-label {
    font-size: 10px;
    font-weight: 600;
    color: var(--vscode-descriptionForeground);
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .balance-amount {
    font-size: 14px;
    font-weight: 700;
    color: var(--vscode-terminal-ansiGreen);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .wallet-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    margin-bottom: 12px;
  }

  .wallet-action-btn {
    padding: 6px 10px;
    border: 1px solid var(--vscode-button-border, transparent);
    border-radius: 4px;
    font-size: 11px;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-height: 28px;
    font-weight: 500;
    background: linear-gradient(135deg, var(--vscode-button-secondaryBackground) 0%, var(--vscode-button-background) 100%);
    color: var(--vscode-button-secondaryForeground);
  }

  .wallet-action-btn:hover {
    background: linear-gradient(135deg, var(--vscode-button-secondaryHoverBackground) 0%, var(--vscode-button-hoverBackground) 100%);
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }

  .wallet-action-btn:active {
    transform: translateY(0);
  }

  /* Legacy wallet-row for backward compatibility */
  .wallet-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
    font-size: 12px;
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

  /* Enhanced Gas Coins Section */
  .gas-coins-section {
    background: linear-gradient(135deg, var(--vscode-editor-background) 0%, var(--vscode-sideBar-background) 100%);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 6px;
    padding: 10px;
    margin: 8px 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  }

  .gas-coins-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--vscode-panel-border);
  }

  .gas-coins-title {
    font-size: 11px;
    font-weight: 600;
    color: var(--vscode-foreground);
    display: flex;
    align-items: center;
    gap: 4px;
    font-family: var(--vscode-font-family), -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .gas-coins-title::before {
    content: "⛽";
    font-size: 11px;
  }

  .coin-tools-title::before {
    content: "🧰";
    font-size: 11px;
  }

  .gas-coins-toggle {
    background: linear-gradient(135deg, var(--vscode-button-background) 0%, var(--vscode-button-secondaryBackground) 100%);
    border: 1px solid var(--vscode-button-border, transparent);
    color: var(--vscode-button-foreground);
    cursor: pointer;
    font-size: 11px;
    font-weight: 500;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 3px;
    font-family: var(--vscode-font-family), -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .gas-coins-toggle:hover {
    background: linear-gradient(135deg, var(--vscode-button-hoverBackground) 0%, var(--vscode-button-secondaryHoverBackground) 100%);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .gas-coins-container {
    max-height: 120px;
    overflow-y: auto;
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
    background-color: var(--vscode-editor-background);
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.08);
  }

  .gas-coin-item {
    padding: 6px 8px;
    border-bottom: 1px solid var(--vscode-panel-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    transition: all 0.2s ease;
    position: relative;
  }

  .gas-coin-item:last-child {
    border-bottom: none;
  }

  .gas-coin-item:hover {
    background: linear-gradient(135deg, var(--vscode-list-hoverBackground) 0%, var(--vscode-editor-background) 100%);
    transform: translateX(2px);
  }

  .gas-coin-id {
    font-family: var(--vscode-editor-font-family, monospace);
    color: var(--vscode-textPreformat-foreground);
    cursor: pointer;
    user-select: text;
    flex: 1;
    margin-right: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 11px;
    padding: 4px 8px;
    background-color: var(--vscode-textCodeBlock-background);
    border-radius: 4px;
    border: 1px solid var(--vscode-panel-border);
    transition: all 0.2s ease;
  }

  .gas-coin-id:hover {
    background-color: var(--vscode-list-hoverBackground);
    border-color: var(--vscode-focusBorder);
  }

  .gas-coin-balance {
    color: var(--vscode-terminal-ansiGreen);
    font-weight: 600;
    white-space: nowrap;
    font-size: 12px;
    padding: 4px 8px;
    background-color: rgba(var(--vscode-terminal-ansiGreen), 0.1);
    border-radius: 4px;
    border: 1px solid rgba(var(--vscode-terminal-ansiGreen), 0.2);
  }

  .collapsed .gas-coins-container {
    display: none;
  }

  /* Legacy gas coins styles for backward compatibility */
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

  /* Enhanced Coin Portfolio Styles */
  .coin-portfolio-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
  }

  .coin-balance-item {
    background: linear-gradient(135deg, var(--vscode-editor-background) 0%, var(--vscode-sideBar-background) 100%);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 8px;
    padding: 12px;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    position: relative;
    overflow: hidden;
  }

  .coin-balance-item:hover {
    border-color: var(--vscode-focusBorder);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    transform: translateY(-1px);
  }

  .coin-balance-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--vscode-terminal-ansiGreen), var(--vscode-button-background));
    opacity: 0.6;
  }

  .coin-balance-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 10px;
  }

  .coin-info {
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
  }

  .coin-symbol {
    font-weight: 700;
    font-size: 16px;
    color: var(--vscode-foreground);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .coin-symbol::before {
    content: '🪙';
    font-size: 14px;
    opacity: 0.8;
  }

  .coin-name {
    font-size: 11px;
    color: var(--vscode-descriptionForeground);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .coin-balance {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 3px;
    text-align: right;
  }

  .balance-amount {
    font-weight: 700;
    font-size: 18px;
    color: var(--vscode-terminal-ansiGreen);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    line-height: 1;
  }

  .balance-label {
    font-size: 10px;
    color: var(--vscode-descriptionForeground);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .coin-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 10px;
    padding: 8px;
    background-color: var(--vscode-input-background);
    border-radius: 6px;
    border: 1px solid var(--vscode-input-border);
  }

  .coin-detail-row {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .coin-detail-row span:first-child {
    font-size: 9px;
    color: var(--vscode-descriptionForeground);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .coin-detail-row span:last-child {
    font-size: 11px;
    color: var(--vscode-foreground);
    font-weight: 500;
    word-break: break-word;
  }

  .coin-type {
    font-family: var(--vscode-editor-font-family);
    font-size: 10px;
    color: var(--vscode-button-foreground);
    cursor: pointer;
    text-decoration: underline;
    word-break: break-all;
    padding: 2px 4px;
    background-color: var(--vscode-textCodeBlock-background);
    border-radius: 3px;
    transition: all 0.2s ease;
  }

  .coin-type:hover {
    color: var(--vscode-button-hoverBackground);
    background-color: var(--vscode-list-hoverBackground);
    transform: translateY(-1px);
  }

  .coin-objects-section {
    border-top: 1px solid var(--vscode-panel-border);
    padding-top: 8px;
    margin-top: 8px;
  }

  .coin-objects-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .coin-objects-header span {
    font-size: 10px;
    color: var(--vscode-descriptionForeground);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .coin-objects-toggle {
    background: linear-gradient(135deg, var(--vscode-button-background) 0%, var(--vscode-button-secondaryBackground) 100%);
    border: 1px solid var(--vscode-button-border, transparent);
    color: var(--vscode-button-foreground);
    cursor: pointer;
    font-size: 9px;
    font-weight: 500;
    padding: 3px 6px;
    border-radius: 3px;
    transition: all 0.2s ease;
  }

  .coin-objects-toggle:hover {
    background: linear-gradient(135deg, var(--vscode-button-hoverBackground) 0%, var(--vscode-button-secondaryHoverBackground) 100%);
    transform: translateY(-1px);
  }

  .coin-objects-container {
    display: flex;
    flex-direction: column;
    gap: 3px;
    max-height: 120px;
    overflow-y: auto;
  }

  .coin-object-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 8px;
    background: linear-gradient(135deg, var(--vscode-input-background) 0%, var(--vscode-editor-background) 100%);
    border-radius: 4px;
    border: 1px solid var(--vscode-input-border);
    transition: all 0.2s ease;
  }

  .coin-object-item:hover {
    background: linear-gradient(135deg, var(--vscode-list-hoverBackground) 0%, var(--vscode-input-background) 100%);
    border-color: var(--vscode-focusBorder);
    transform: translateX(2px);
  }

  .coin-object-id {
    font-family: var(--vscode-editor-font-family);
    font-size: 9px;
    color: var(--vscode-foreground);
    cursor: pointer;
    flex: 1;
    margin-right: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .coin-object-id:hover {
    color: var(--vscode-button-foreground);
    text-decoration: underline;
  }

  .coin-object-balance {
    font-size: 9px;
    color: var(--vscode-descriptionForeground);
    font-weight: 500;
    white-space: nowrap;
  }

  /* Enhanced Import Wallet Section */
  .import-wallet-section {
    background: linear-gradient(135deg, var(--vscode-editor-background) 0%, var(--vscode-sideBar-background) 100%);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 6px;
    padding: 10px;
    margin: 8px 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  }

  .import-wallet-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--vscode-panel-border);
  }

  .import-wallet-title {
    font-size: 11px;
    font-weight: 600;
    color: var(--vscode-foreground);
    display: flex;
    align-items: center;
    gap: 4px;
    font-family: var(--vscode-font-family), -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .import-wallet-title::before {
    content: "🔑";
    font-size: 11px;
  }

  .import-wallet-toggle {
    background: linear-gradient(135deg, var(--vscode-button-background) 0%, var(--vscode-button-secondaryBackground) 100%);
    border: 1px solid var(--vscode-button-border, transparent);
    color: var(--vscode-button-foreground);
    cursor: pointer;
    font-size: 11px;
    font-weight: 500;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 3px;
    font-family: var(--vscode-font-family), -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .import-wallet-toggle:hover {
    background: linear-gradient(135deg, var(--vscode-button-hoverBackground) 0%, var(--vscode-button-secondaryHoverBackground) 100%);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .import-wallet-form {
    background-color: var(--vscode-editor-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
    padding: 10px;
    margin-top: 8px;
  }

  .import-wallet-form .input-group {
    margin-bottom: 10px;
  }

  .import-wallet-form .input-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--vscode-foreground);
    margin-bottom: 4px;
    display: block;
  }

  .import-wallet-form input,
  .import-wallet-form select {
    background: linear-gradient(135deg, var(--vscode-input-background) 0%, var(--vscode-editor-background) 100%);
    border: 1px solid var(--vscode-input-border);
    border-radius: 4px;
    padding: 6px 8px;
    font-size: 11px;
    transition: all 0.2s ease;
  }

  .import-wallet-form input:focus,
  .import-wallet-form select:focus {
    border-color: var(--vscode-focusBorder);
    box-shadow: 0 0 0 2px rgba(var(--vscode-focusBorder), 0.2);
    transform: translateY(-1px);
  }

  .import-wallet-form .input-help {
    font-size: 9px;
    color: var(--vscode-descriptionForeground);
    margin-top: 3px;
    line-height: 1.3;
  }

  .import-wallet-btn {
    background: linear-gradient(135deg, var(--vscode-button-background) 0%, var(--vscode-button-secondaryBackground) 100%);
    border: 1px solid var(--vscode-button-border, transparent);
    color: var(--vscode-button-foreground);
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
  }

  .import-wallet-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, var(--vscode-button-hoverBackground) 0%, var(--vscode-button-secondaryHoverBackground) 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  .import-wallet-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  /* Enhanced Coin Portfolio Section */
  .coin-portfolio-section {
    background: linear-gradient(135deg, var(--vscode-editor-background) 0%, var(--vscode-sideBar-background) 100%);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 6px;
    padding: 10px;
    margin: 8px 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  }

  .coin-portfolio-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--vscode-panel-border);
  }

  .coin-portfolio-title {
    font-size: 11px;
    font-weight: 600;
    color: var(--vscode-foreground);
    display: flex;
    align-items: center;
    gap: 4px;
    font-family: var(--vscode-font-family), -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .coin-portfolio-title::before {
    content: "💰";
    font-size: 11px;
  }

  .coin-portfolio-toggle {
    background: linear-gradient(135deg, var(--vscode-button-background) 0%, var(--vscode-button-secondaryBackground) 100%);
    border: 1px solid var(--vscode-button-border, transparent);
    color: var(--vscode-button-foreground);
    cursor: pointer;
    font-size: 11px;
    font-weight: 500;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 3px;
    font-family: var(--vscode-font-family), -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .coin-portfolio-toggle:hover {
    background: linear-gradient(135deg, var(--vscode-button-hoverBackground) 0%, var(--vscode-button-secondaryHoverBackground) 100%);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  #coinPortfolioContainer {
    margin-top: 12px;
  }

  .no-coins-message {
    font-size: 12px;
    color: var(--vscode-descriptionForeground);
    text-align: center;
    padding: 32px 24px;
    background: linear-gradient(135deg, var(--vscode-editor-background) 0%, var(--vscode-sideBar-background) 100%);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 8px;
    font-style: italic;
    position: relative;
    overflow: hidden;
  }

  .no-coins-message::before {
    content: '💰';
    display: block;
    font-size: 24px;
    margin-bottom: 8px;
    opacity: 0.5;
  }

  .no-coins-message::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--vscode-terminal-ansiGreen), var(--vscode-button-background));
    opacity: 0.3;
  }

  /* Coin Tools Form Styling */
  .coin-tools-form {
    background-color: var(--vscode-editor-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
    padding: 10px;
    margin: 8px 0;
  }

  .coin-tools-form .input-group {
    margin-bottom: 10px;
  }

  .coin-tools-form .input-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--vscode-foreground);
    margin-bottom: 4px;
    display: block;
  }

  .coin-tools-form input,
  .coin-tools-form select {
    background: linear-gradient(135deg, var(--vscode-input-background) 0%, var(--vscode-editor-background) 100%);
    border: 1px solid var(--vscode-input-border);
    border-radius: 4px;
    padding: 6px 8px;
    font-size: 11px;
    transition: all 0.2s ease;
    width: 100%;
    margin-bottom: 6px;
  }

  .coin-tools-form input:focus,
  .coin-tools-form select:focus {
    border-color: var(--vscode-focusBorder);
    box-shadow: 0 0 0 2px rgba(var(--vscode-focusBorder), 0.2);
    transform: translateY(-1px);
  }

  .coin-tools-form .input-help {
    font-size: 9px;
    color: var(--vscode-descriptionForeground);
    margin-top: 3px;
    line-height: 1.3;
  }

  .coin-tools-btn {
    background: linear-gradient(135deg, var(--vscode-button-background) 0%, var(--vscode-button-secondaryBackground) 100%);
    border: 1px solid var(--vscode-button-border, transparent);
    color: var(--vscode-button-foreground);
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
    margin-top: 8px;
  }

  .coin-tools-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, var(--vscode-button-hoverBackground) 0%, var(--vscode-button-secondaryHoverBackground) 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  .coin-tools-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .coin-tools-section-title {
    font-size: 11px;
    font-weight: 600;
    color: var(--vscode-foreground);
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 4px;
    font-family: var(--vscode-font-family), -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .coin-tools-section-title::before {
    font-size: 11px;
  }

  .merge-title::before {
    content: "🪙";
  }

  .split-title::before {
    content: "✂️";
  }

  .transfer-title::before {
    content: "📤";
  }

  /* Legacy coin portfolio styles for backward compatibility */
  .coin-portfolio-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-top: 1px solid var(--vscode-panel-border);
    margin-top: 8px;
    font-size: 11px;
    color: var(--vscode-foreground);
  }

  .coin-portfolio-toggle {
    background: none;
    border: none;
    color: var(--vscode-button-foreground);
    cursor: pointer;
    font-size: 11px;
    padding: 2px 6px;
  }

  .coin-portfolio-toggle:hover {
    color: var(--vscode-button-hoverBackground);
  }

  #coinPortfolioContainer {
    margin-top: 8px;
  }

  .no-coins-message {
    font-size: 11px;
    color: var(--vscode-descriptionForeground);
    text-align: center;
    padding: 20px;
  }

`;

