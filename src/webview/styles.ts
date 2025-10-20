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
`;

