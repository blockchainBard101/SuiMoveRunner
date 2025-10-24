import { ArgumentPlaceholder } from './types';

export const webviewScript = `
  const vscode = acquireVsCodeApi();
  const argsMapping = \${JSON.stringify(argsMapping)};

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

  function toggleImportWallet() {
    const container = document.getElementById('importWalletContainer');
    const toggle = document.querySelector('.import-wallet-toggle');
    if (!container || !toggle) return;

    if (container.style.display === 'none') {
      container.style.display = 'block';
      toggle.textContent = '▲ Hide';
      // Re-validate on open to enable/disable button properly
      try { validateImportForm(); } catch {}
    } else {
      container.style.display = 'none';
      toggle.textContent = '▼ Show';
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

  // Import Wallet
  function defaultDerivationFor(scheme) {
    if (scheme === 'ed25519') return "m/44'/784'/0'/0'/0'";
    if (scheme === 'secp256k1') return "m/54'/784'/0'/0/0";
    if (scheme === 'secp256r1') return "m/74'/784'/0'/0/0";
    return '';
  }

  function isAliasValid(alias) {
    return /^[A-Za-z][A-Za-z0-9_-]*$/.test(alias);
  }

  function isInputStringValid(s) {
    if (!s) return false;
    const isBech32 = s.startsWith('suiprivkey');
    if (isBech32) return true;
    const words = s.trim().split(/\s+/);
    return [12,15,18,21,24].includes(words.length);
  }

  function validateImportForm() {
    const input = (document.getElementById('importInputString') || { value: '' }).value.trim();
    const alias = (document.getElementById('importAlias') || { value: '' }).value.trim();
    const btn = document.getElementById('importWalletBtn');
    let valid = isInputStringValid(input);
    if (valid && alias) {
      valid = isAliasValid(alias);
    }
    setButtonEnabled(btn, valid);
  }

  function sendImportWallet() {
    const input = (document.getElementById('importInputString') || { value: '' }).value.trim();
    const scheme = (document.getElementById('importKeyScheme') || { value: 'ed25519' }).value;
    let path = (document.getElementById('importDerivationPath') || { value: '' }).value.trim();
    const alias = (document.getElementById('importAlias') || { value: '' }).value.trim();

    if (!isInputStringValid(input)) {
      setStatusMessage('Invalid mnemonic or key');
      return;
    }
    if (alias && !isAliasValid(alias)) {
      setStatusMessage('Invalid alias format');
      return;
    }
    if (!path) {
      path = defaultDerivationFor(scheme);
    }

    setStatusMessage('Importing wallet...');
    vscode.postMessage({ command: 'import-wallet', inputString: input, keyScheme: scheme, derivationPath: path || undefined, alias: alias || undefined });
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
    const match = String(type).match(/Coin<\\s*(.+?)\\s*>/);
    return match ? match[1] : null;
  }

  // Extract inner type from vector<T>
  function extractVectorType(type) {
    const match = String(type).match(/vector<\\s*(.+?)\\s*>/);
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

    // One-time auto-refresh to ensure balances are up-to-date on first open
    try {
      const state = vscode.getState() || {};
      if (!state.__initialized) {
        vscode.setState({ ...state, __initialized: true });
        setStatusMessage('Initializing...');
        vscode.postMessage({ command: 'refresh' });
      }
    } catch {}
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
    const walletAddress = document.getElementById('walletAddress')?.getAttribute('data-full-address') || '';
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

  // Export wallet button
  document.getElementById('exportWalletBtn')?.addEventListener('click', () => {
    setStatusMessage('Exporting wallet...');
    vscode.postMessage({ command: 'export-wallet' });
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

    const importBtn = document.getElementById('importWalletBtn');
    if (importBtn) {
      importBtn.addEventListener('click', () => {
        sendImportWallet();
      });
    }

    // Move project selection functionality
    const scanMoveProjectsBtn = document.getElementById('scanMoveProjectsBtn');
    if (scanMoveProjectsBtn) {
      scanMoveProjectsBtn.addEventListener('click', () => {
        vscode.postMessage({ command: 'scan-move-projects' });
      });
    }

    const rescanMoveProjectsBtn = document.getElementById('rescanMoveProjectsBtn');
    if (rescanMoveProjectsBtn) {
      rescanMoveProjectsBtn.addEventListener('click', () => {
        vscode.postMessage({ command: 'scan-move-projects' });
      });
    }

    const selectMoveProjectBtn = document.getElementById('selectMoveProjectBtn');
    if (selectMoveProjectBtn) {
      selectMoveProjectBtn.addEventListener('click', () => {
        const select = document.getElementById('moveProjectSelect');
        if (select && select.value) {
          vscode.postMessage({ 
            command: 'select-move-project', 
            projectPath: select.value 
          });
        }
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

    document.getElementById('importInputString')?.addEventListener('input', validateImportForm);
    document.getElementById('importAlias')?.addEventListener('input', validateImportForm);
    document.getElementById('importKeyScheme')?.addEventListener('change', () => {
      const scheme = (document.getElementById('importKeyScheme') || { value: 'ed25519' }).value;
      const pathEl = document.getElementById('importDerivationPath');
      if (pathEl && !pathEl.value.trim()) {
        pathEl.placeholder = defaultDerivationFor(scheme);
      }
      validateImportForm();
    });

    // Initial validation
    validateMergeForm();
    validateSplitForm();
    validateTransferForm();
    validateImportForm();
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

  // Coin Portfolio Functions
  function toggleCoinObjects(coinType) {
    const container = document.getElementById('coin-objects-' + coinType);
    const toggle = container.previousElementSibling.querySelector('.coin-objects-toggle');
    
    if (container.style.display === 'none') {
      container.style.display = 'block';
      toggle.textContent = '▲ Hide';
    } else {
      container.style.display = 'none';
      toggle.textContent = '▼ Show';
    }
  }

  function copyCoinObjectId(coinObjectId) {
    navigator.clipboard.writeText(coinObjectId).then(() => {
      setStatusMessage('Coin object ID copied!');
      setTimeout(() => setStatusMessage(''), 2000);
    }).catch(() => {
      setStatusMessage('Failed to copy coin object ID');
    });
  }

  function copyCoinType(coinType) {
    navigator.clipboard.writeText(coinType).then(() => {
      setStatusMessage('Coin type copied!');
      setTimeout(() => setStatusMessage(''), 2000);
    }).catch(() => {
      setStatusMessage('Failed to copy coin type');
    });
  }

  function toggleCoinPortfolio() {
    const container = document.getElementById('coinPortfolioContainer');
    const toggle = document.querySelector('.coin-portfolio-toggle');
    if (container.style.display === 'none') {
      container.style.display = 'block';
      toggle.textContent = '▲ Hide';
    } else {
      container.style.display = 'none';
      toggle.textContent = '▼ Show';
    }
  }
`;

