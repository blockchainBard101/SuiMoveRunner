// Types are implicitly handled in the string injection

export const webviewScript = `
  let vscode;
  try {
    vscode = acquireVsCodeApi();
  } catch (e) { }

  window.onerror = function(msg, url, line, col, error) {
    if (vscode) {
      vscode.postMessage({
        command: 'debug-log',
        message: \`JS Error: \${msg} at \${line}:\${col}. Error: \${error?.stack}\`
      });
    }
    return false;
  };
  
  const argsMapping = \${JSON.stringify(argsMapping)};

  // Event delegation for selectMoveProjectBtn (works even when button is recreated)
  document.addEventListener('click', function(e) {
    const target = e.target;
    // Handle clicks on button or its children
    let button = null;
    if (target.id === 'selectMoveProjectBtn') {
      button = target;
    } else if (target.closest) {
      button = target.closest('#selectMoveProjectBtn');
    } else {
      // Fallback: walk up the parent chain
      let el = target;
      while (el && el !== document) {
        if (el.id === 'selectMoveProjectBtn') {
          button = el;
          break;
        }
        el = el.parentElement;
      }
    }
    
    if (button && !button.disabled) {
      const select = document.getElementById('moveProjectSelect');
      if (select && select.value) {
        // Show loading state on button
        button.disabled = true;
        button.textContent = '⏳ Selecting...';
        button.classList.add('btn-disabled');
        button.classList.remove('btn-primary');
        
        // Disable the select dropdown too
        select.disabled = true;
        
        // Don't modify status text here - renderHtml will set it correctly
        // The button loading state is sufficient feedback
        
        vscode.postMessage({ 
          command: 'select-move-project', 
          projectPath: select.value 
        });
      }
    }
  });

  // Gas coins functionality
  function toggleGasCoins() {
    const section = document.getElementById('gasCoinsSection');
    const container = section.querySelector('.gas-coins-container');
    const toggle = section.querySelector('.gas-coins-toggle');
    const toggleText = toggle ? toggle.querySelector('.toggle-text') : null;
    const icon = toggle ? toggle.querySelector('.toggle-icon') : null;
    
    if (container.style.display === 'none') {
      container.style.display = 'block';
      if (toggleText) toggleText.textContent = 'Hide';
      if (icon) icon.style.transform = 'rotate(180deg)';
      section.classList.remove('collapsed');
    } else {
      container.style.display = 'none';
      if (toggleText) toggleText.textContent = 'Show';
      if (icon) icon.style.transform = 'rotate(0deg)';
      section.classList.add('collapsed');
    }
  }

  function toggleSection(id) {
    const container = document.getElementById(id);
    const toggle = container.parentElement.querySelector('.toggle-btn');
    const toggleText = toggle ? toggle.querySelector('.toggle-text') : null;
    const icon = toggle ? toggle.querySelector('.toggle-icon') : null;

    if (container.style.display === 'none') {
      container.style.display = 'block';
      if (toggleText) toggleText.textContent = 'Hide';
      if (icon) icon.style.transform = 'rotate(180deg)';
    } else {
      container.style.display = 'none';
      if (toggleText) toggleText.textContent = 'Show';
      if (icon) icon.style.transform = 'rotate(0deg)';
    }
  }

  function toggleImportWallet() {
    const container = document.getElementById('importWalletContainer');
    const toggle = document.querySelector('.import-wallet-toggle');
    if (!container || !toggle) return;
    const toggleText = toggle.querySelector('.toggle-text');
    const icon = toggle.querySelector('.toggle-icon');

    if (container.style.display === 'none') {
      container.style.display = 'block';
      if (toggleText) toggleText.textContent = 'Hide';
      if (icon) icon.style.transform = 'rotate(180deg)';
      // Re-validate on open to enable/disable button properly
      try { validateImportForm(); } catch {}
    } else {
      container.style.display = 'none';
      if (toggleText) toggleText.textContent = 'Show';
      if (icon) icon.style.transform = 'rotate(0deg)';
    }
  }


  function handleInstallSui() {
    const method = document.getElementById('installMethodSelector').value;
    setStatusMessage('Starting installation...');
    vscode.postMessage({ command: 'install-sui', method });
  }

  function handleUpdateSui(method) {
    setStatusMessage('Starting update...');
    vscode.postMessage({ command: 'update-sui', method: method === 'none' ? undefined : method });
  }

  function toggleCoinTools() {
    const section = document.getElementById('coinToolsSection');
    const container = document.getElementById('coinToolsContainer');
    const toggle = section ? section.querySelector('.gas-coins-toggle') : null;
    if (!container || !toggle) return;
    const toggleText = toggle.querySelector('.toggle-text');
    const icon = toggle.querySelector('.toggle-icon');

    if (container.style.display === 'none') {
      container.style.display = 'block';
      if (toggleText) toggleText.textContent = 'Hide';
      if (icon) icon.style.transform = 'rotate(180deg)';
      section.classList.remove('collapsed');
      // Re-validate forms on open
      try { validateMergeForm(); } catch {}
      try { validateSplitForm(); } catch {}
      try { validateTransferForm(); } catch {}
    } else {
      container.style.display = 'none';
      if (toggleText) toggleText.textContent = 'Show';
      if (icon) icon.style.transform = 'rotate(0deg)';
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
    const primarySelect = document.getElementById('primaryCoinSelect');
    const toMergeSelect = document.getElementById('coinToMergeSelect');
    if (!primarySelect || !toMergeSelect) {
      setStatusMessage('Coin selects not found');
      return;
    }
    const primary = primarySelect.value;
    const toMerge = toMergeSelect.value;
    if (!primary || !toMerge) {
      setStatusMessage('Select both coins');
      return;
    }
    if (primary === toMerge) {
      setStatusMessage('Coins must be different');
      return;
    }
    const primaryOption = primarySelect.options[primarySelect.selectedIndex];
    const toMergeOption = toMergeSelect.options[toMergeSelect.selectedIndex];
    const primaryType = primaryOption ? primaryOption.getAttribute('data-coin-type') : null;
    const toMergeType = toMergeOption ? toMergeOption.getAttribute('data-coin-type') : null;
    if (primaryType && toMergeType && primaryType !== toMergeType) {
      setStatusMessage('Coins must be of the same type');
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

  function sendTransferCoin() {
    const coinSelect = document.getElementById('transferCoinSelect');
    if (!coinSelect) {
      setStatusMessage('Coin select not found');
      return;
    }
    const coinId = coinSelect.value;
    const selectedOption = coinSelect.options[coinSelect.selectedIndex];
    const coinType = selectedOption ? selectedOption.getAttribute('data-coin-type') : null;
    const to = (document.getElementById('transferTo') || { value: '' }).value.trim();
    const amountStr = (document.getElementById('transferAmount') || { value: '' }).value.trim();
    if (!coinId) {
      setStatusMessage('Select a coin to transfer');
      return;
    }
    if (!to) {
      setStatusMessage('Enter a recipient');
      return;
    }
    const payload = { command: 'transfer-coin', coinId, coinType: coinType || '0x2::sui::SUI', to };
    if (amountStr) {
      payload.amount = amountStr;
    }
    setStatusMessage('Transferring coin...');
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
    const primarySelect = document.getElementById('primaryCoinSelect');
    const toMergeSelect = document.getElementById('coinToMergeSelect');
    if (!primarySelect || !toMergeSelect) {
      return;
    }
    const primary = primarySelect.value;
    const toMerge = toMergeSelect.value;
    let valid = Boolean(primary && toMerge && primary !== toMerge);
    
    // Check if coins are of the same type
    if (valid) {
      const primaryOption = primarySelect.options[primarySelect.selectedIndex];
      const toMergeOption = toMergeSelect.options[toMergeSelect.selectedIndex];
      const primaryType = primaryOption ? primaryOption.getAttribute('data-coin-type') : null;
      const toMergeType = toMergeOption ? toMergeOption.getAttribute('data-coin-type') : null;
      if (primaryType && toMergeType && primaryType !== toMergeType) {
        valid = false;
      }
    }
    
    const btn = document.getElementById('mergeCoinsBtn');
    setButtonEnabled(btn, valid);
  }

  function validateSplitForm() {
    const coinIdEl = document.getElementById('splitCoinSelect');
    const coinId = coinIdEl ? coinIdEl.value : '';
    
    // If no coin selected (or no coins available), invalid
    if (!coinId) {
      setButtonEnabled(document.getElementById('splitCoinBtn'), false);
      return;
    }

    const amountsStr = (document.getElementById('splitAmounts') || { value: '' }).value.trim();
    const countStr = (document.getElementById('splitCount') || { value: '' }).value.trim();
    
    let valid = false;

    // Validate amounts: comma-separated numbers
    if (amountsStr.length > 0) {
      // Allow trailing commas and loose spacing
      const parts = amountsStr.split(',').map(v => v.trim()).filter(v => v.length > 0);
      if (parts.length > 0) {
        // Just check if they look like numbers (positive integers generally, but let backend handle strictness)
        const allNumbers = parts.every(v => !isNaN(Number(v)) && Number(v) > 0);
        if (allNumbers) valid = true;
      }
    } 
    // Validate count: positive integer
    else if (countStr.length > 0) {
      const n = Number(countStr);
      if (Number.isFinite(n) && n >= 1) {
        valid = true;
      }
    }

    const btn = document.getElementById('splitCoinBtn');
    setButtonEnabled(btn, valid);
  }

  function validateTransferForm() {
    const coinId = (document.getElementById('transferCoinSelect') || { value: '' }).value;
    const to = (document.getElementById('transferTo') || { value: '' }).value.trim();
    const amountStr = (document.getElementById('transferAmount') || { value: '' }).value.trim();
    let valid = Boolean(coinId && to);
    if (amountStr) {
      valid = valid && /^\d+$/.test(amountStr);
    }
    const btn = document.getElementById('transferCoinBtn');
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
    return s && s.trim().length > 0;
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

  function sendReset() {
    setStatusMessage('Resetting deployment...');
    vscode.postMessage({ command: 'reset-deployment' });
  }

  function sendUpdateDeps() {
    setStatusMessage('Updating dependencies...');
    vscode.postMessage({ command: 'update-deps' });
  }

  function sendPublishWithDeps() {
    setStatusMessage('Publishing with dependencies...');
    vscode.postMessage({ command: 'publish-with-deps' });
  }

  function sendDumpBytecode() {
    setStatusMessage('Dumping bytecode...');
    vscode.postMessage({ command: 'dump-bytecode' });
  }

  function sendViewPublishedToml() {
    setStatusMessage('Fetching Published.toml...');
    vscode.postMessage({ command: 'view-published-toml' });
  }

  function sendAddDependency() {
    const depType = document.getElementById('depTypeSelector').value;
    const name = document.getElementById('depAlias').value.trim();
    let value = document.getElementById('depValue').value.trim();
    const network = document.getElementById('mvrNetwork').value;
    const subdir = document.getElementById('depSubdir').value.trim();
    const rev = document.getElementById('depRev').value.trim();

    if (!name || !value) {
      setStatusMessage('Please enter both alias and value/url');
      return;
    }

    // Proactive cleaning: strip common command prefixes if pasted
    if (depType === 'mvr') {
      value = value.replace(/^(sui\s+)?mvr\s+add\s+/i, '');
    }

    setStatusMessage('Adding dependency...');
    vscode.postMessage({ 
      command: 'add-dependency', 
      depType, 
      name, 
      value,
      network: depType === 'mvr' ? network : undefined,
      subdir: subdir || undefined, 
      rev: rev || undefined 
    });
  }

  function updateDepForm() {
    const type = document.getElementById('depTypeSelector').value;
    const label = document.getElementById('depValueLabel');
    const mvrOptions = document.getElementById('mvrOptions');
    const gitOptions = document.getElementById('gitOptions');
    const valueInput = document.getElementById('depValue');

    if (type === 'mvr') {
      label.textContent = 'MVR Name (@scope/pkg)';
      valueInput.placeholder = 'e.g., @potatoes/ascii';
      mvrOptions.style.display = 'block';
      gitOptions.style.display = 'none';
    } else if (type === 'git') {
      label.textContent = 'Git Repository URL';
      valueInput.placeholder = 'e.g., https://github.com/...';
      mvrOptions.style.display = 'none';
      gitOptions.style.display = 'block';
    } else if (type === 'local') {
      label.textContent = 'Local File Path';
      valueInput.placeholder = 'e.g., ../my_shared_lib';
      mvrOptions.style.display = 'none';
      gitOptions.style.display = 'none';
    } else if (type === 'system') {
      label.textContent = 'System Package Name';
      valueInput.placeholder = 'e.g., Sui';
      mvrOptions.style.display = 'none';
      gitOptions.style.display = 'none';
    }
  }

  function copyValue(val) {
    navigator.clipboard.writeText(val).then(() => {
      setStatusMessage('Copied to clipboard!');
      setTimeout(() => setStatusMessage(''), 2000);
    });
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

  function sendDevInspect() {
    const pkg = document.getElementById('pkg').value;
    const selected = document.getElementById('functionSelect').selectedOptions[0];
    
    if (!selected) {
      setStatusMessage('Please select a function for Dev Inspect');
      return;
    }

    const module = selected.getAttribute('data-mod');
    const func = selected.value;
    const key = module + '::' + func;
    const { typeParams } = argsMapping[key] || { typeParams: [] };

    const argElements = Array.from(document.querySelectorAll('#argsContainer input'));
    const args = argElements.map(input => {
      let value = input.value.trim();
      if (!value && input.placeholder.includes('auto-provided')) {
        return ''; 
      }
      if (input.placeholder.includes('comma-separated') && value) {
        return value.split(',').map(v => v.trim()).join(' ');
      }
      return value;
    }).filter(arg => arg !== '');

    const typeArgElements = Array.from(document.querySelectorAll('#typeArgsContainer input'));
    const typeArgs = typeArgElements.map(input => input.value.trim()).filter(arg => arg !== '');

    const btn = document.querySelector('button[onclick="sendDevInspect()"]');
    if (btn) btn.innerHTML = '⏳ Inspecting...';
    setStatusMessage('Running Dev Inspect...');
    const container = document.getElementById('devInspectResults');
    if (container) {
      container.style.display = 'block';
      container.innerHTML = '<div style="color: var(--vscode-descriptionForeground);">Running dev inspect...</div>';
    }
    
    vscode.postMessage({ command: 'dev-inspect', pkg, module, func, args, typeArgs });
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
    const transferBtn = document.getElementById('transferCoinBtn');
    if (transferBtn) {
      transferBtn.addEventListener('click', () => {
        sendTransferCoin();
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

    // Note: selectMoveProjectBtn event listener is set up via event delegation at the top level

    // Attach validation listeners
    document.getElementById('primaryCoinSelect')?.addEventListener('change', validateMergeForm);
    document.getElementById('coinToMergeSelect')?.addEventListener('change', validateMergeForm);

    document.getElementById('splitCoinSelect')?.addEventListener('change', validateSplitForm);
    document.getElementById('splitAmounts')?.addEventListener('input', validateSplitForm);
    document.getElementById('splitAmounts')?.addEventListener('keyup', validateSplitForm);
    document.getElementById('splitCount')?.addEventListener('input', validateSplitForm);
    document.getElementById('splitCount')?.addEventListener('keyup', validateSplitForm);

    document.getElementById('transferCoinSelect')?.addEventListener('change', validateTransferForm);
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

    validateImportForm();
  });

  // Helper function to reset select project button state
  function resetSelectProjectButton() {
    const selectMoveProjectBtn = document.getElementById('selectMoveProjectBtn');
    const select = document.getElementById('moveProjectSelect');
    const activeStatus = document.getElementById('activeMoveProjectStatus');
    
    if (selectMoveProjectBtn) {
      selectMoveProjectBtn.disabled = false;
      selectMoveProjectBtn.textContent = '✅ Select Project';
      selectMoveProjectBtn.classList.remove('btn-disabled');
      selectMoveProjectBtn.classList.add('btn-primary');
    }
    
    if (select) {
      select.disabled = false;
    }
    
    // Reset active status (will be updated on next render, but clear loading state)
    if (activeStatus) {
      // Keep it visible but reset color - the actual project name will come from render
      activeStatus.style.color = 'var(--vscode-inputValidation-infoForeground)';
    }
  }

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
        // Reset button if status is cleared (indicates completion or error)
        if (!message.message && document.getElementById('selectMoveProjectBtn')) {
          resetSelectProjectButton();
        }
        break;
      case 'gas-coin-copied':
        setStatusMessage('📋 Gas coin ID copied to clipboard!');
        // Auto-clear the message after 2 seconds
        setTimeout(() => setStatusMessage(''), 2000);
        break;
      case 'move-project-loading':
        // Re-apply loading state after HTML is replaced
        // Note: Don't change status text - it already has the correct project name from renderHtml
        const loadingBtn = document.getElementById('selectMoveProjectBtn');
        const loadingSelect = document.getElementById('moveProjectSelect');
        
        if (loadingBtn) {
          loadingBtn.disabled = true;
          loadingBtn.textContent = '⏳ Selecting...';
          loadingBtn.classList.add('btn-disabled');
          loadingBtn.classList.remove('btn-primary');
        }
        
        if (loadingSelect) {
          loadingSelect.disabled = true;
        }
        
        // Don't modify the status - it already shows the correct project name
        // The button loading state is sufficient feedback
        break;
      case 'move-project-selected':
        resetSelectProjectButton();
        setStatusMessage(message.message || 'Project selected successfully');
        break;
      case 'move-project-error':
        resetSelectProjectButton();
        setStatusMessage(message.message || 'Failed to select project');
        break;
      case 'dev-inspect-result':
        renderDevInspectResult(message.data);
        break;
      case 'dev-inspect-error':
        renderDevInspectError(message.error);
        break;
      default:
        break;
    }
  });

  function renderDevInspectResult(data) {
    const btn = document.querySelector('button[onclick="sendDevInspect()"]');
    if (btn) btn.innerHTML = '🔍 Dev Inspect';

    const container = document.getElementById('devInspectResults');
    if (!container) return;
    container.style.display = 'block';

    if (data.error) {
      container.innerHTML = '<div style="color: var(--vscode-errorForeground);"><strong>Error:</strong> ' + data.error + '</div>';
      return;
    }

    const effects = data.effects || {};
    const events = data.events || [];
    const results = data.results || [];
    
    // Check status
    const executionStatus = effects.status?.status || "unknown";
    const isSuccess = executionStatus === "success";
    const statusColor = isSuccess ? "var(--vscode-testing-iconPassed)" : "var(--vscode-testing-iconFailed)";
    
    let html = '<div style="margin-bottom: 8px; font-size: 13px; border-bottom: 1px solid var(--vscode-widget-border); padding-bottom: 4px;">';
    html += '<strong>Status:</strong> <span style="color: ' + statusColor + ';">' + 
            (isSuccess ? 'Success' : 'Failed (' + (effects.status?.error || 'Unknown Error') + ')') + 
            '</span></div>';

    // Gas Estimation
    if (effects.gasUsed) {
      const comp = parseInt(effects.gasUsed.computationCost || 0);
      const storage = parseInt(effects.gasUsed.storageCost || 0);
      const rebate = parseInt(effects.gasUsed.storageRebate || 0);
      const nonRefundable = parseInt(effects.gasUsed.nonRefundableStorageFee || 0);
      const totalGas = comp + storage - rebate + nonRefundable;
      
      html += '<div style="margin-bottom: 8px;"><strong>Estimated Gas:</strong> ' + totalGas + ' MIST ';
      html += '<span style="font-size: 10px; opacity: 0.7;">(Comp: ' + comp + ', Storage: ' + storage + ', Rebate: ' + rebate + ')</span></div>';
    }

    // Return Values
    if (results.length > 0 && results.some(r => r.returnValues && r.returnValues.length > 0)) {
      html += '<div style="margin-bottom: 4px; color: var(--vscode-terminal-ansiBrightBlue);"><strong>Return Values:</strong></div><ul style="margin: 0 0 8px 16px; padding: 0;">';
      results.forEach((r, i) => {
        if (r.returnValues && r.returnValues.length > 0) {
          r.returnValues.forEach(val => {
            // val is usually [number[], type]
            const typeStr = val[1];
            const bytesArray = val[0];
            html += '<li><code>' + typeStr + '</code> (Bytes: [' + bytesArray.slice(0, 5).join(',') + (bytesArray.length > 5 ? '...' : '') + '])</li>';
          });
        }
      });
      html += '</ul>';
    }

    // Events Emitted
    if (events.length > 0) {
      html += '<div style="margin-bottom: 4px; color: var(--vscode-terminal-ansiBrightCyan);"><strong>Events Emitted:</strong> ' + events.length + '</div>';
      html += '<ul style="margin: 0 0 8px 16px; padding: 0; max-height: 100px; overflow-y: auto;">';
      events.forEach(e => {
        const typeBits = (e.type || "").split('::');
        const shortType = typeBits.length > 2 ? typeBits.slice(-2).join('::') : e.type;
        html += '<li title="'+ e.type +'"><code>' + shortType + '</code></li>';
      });
      html += '</ul>';
    }

    // Object Changes Overview
    const objectChanges = data.objectChanges || [];
    
    // If we have detailed objectChanges from dry run, use them
    if (objectChanges.length > 0) {
      const createdObj = objectChanges.filter(c => c.type === 'created');
      const mutatedObj = objectChanges.filter(c => c.type === 'mutated');
      const deletedObj = objectChanges.filter(c => c.type === 'deleted');
      const publishedObj = objectChanges.filter(c => c.type === 'published');
      
      html += '<div style="margin-top: 8px; border-top: 1px solid var(--vscode-widget-border); padding-top: 4px;"><strong>Object Changes:</strong></div>';
      
      if (publishedObj.length > 0) {
        html += '<details style="margin-top: 4px;"><summary style="cursor: pointer; color: var(--vscode-terminal-ansiBrightMagenta);">Published (' + publishedObj.length + ')</summary>';
        html += '<ul style="margin: 4px 0 4px 16px; padding: 0;">';
        publishedObj.forEach(obj => {
          html += '<li title="Package: ' + obj.packageId + '"><code>' + obj.packageId.slice(0, 8) + '...' + obj.packageId.slice(-8) + '</code></li>';
        });
        html += '</ul></details>';
      }
      
      if (createdObj.length > 0) {
        html += '<details style="margin-top: 4px;"><summary style="cursor: pointer; color: var(--vscode-terminal-ansiBrightGreen);">Created (' + createdObj.length + ')</summary>';
        html += '<ul style="margin: 4px 0 4px 16px; padding: 0;">';
        createdObj.forEach(obj => {
          const id = obj.objectId || 'unknown';
          const typeStr = obj.objectType || 'unknown type';
          html += '<li title="' + typeStr + '"><code>' + id.slice(0, 8) + '...' + id.slice(-8) + '</code> <div style="font-size: 10px; color: var(--vscode-descriptionForeground); margin-left: 8px;">' + typeStr + '</div></li>';
        });
        html += '</ul></details>';
      }
      
      if (mutatedObj.length > 0) {
        html += '<details style="margin-top: 4px;"><summary style="cursor: pointer; color: var(--vscode-terminal-ansiBrightYellow);">Mutated (' + mutatedObj.length + ')</summary>';
        html += '<ul style="margin: 4px 0 4px 16px; padding: 0;">';
        mutatedObj.forEach(obj => {
          const id = obj.objectId || 'unknown';
          const typeStr = obj.objectType || 'unknown type';
          html += '<li title="' + typeStr + '"><code>' + id.slice(0, 8) + '...' + id.slice(-8) + '</code> <div style="font-size: 10px; color: var(--vscode-descriptionForeground); margin-left: 8px;">' + typeStr + '</div></li>';
        });
        html += '</ul></details>';
      }
      
      if (deletedObj.length > 0) {
        html += '<details style="margin-top: 4px;"><summary style="cursor: pointer; color: var(--vscode-terminal-ansiBrightRed);">Deleted (' + deletedObj.length + ')</summary>';
        html += '<ul style="margin: 4px 0 4px 16px; padding: 0;">';
        deletedObj.forEach(obj => {
          const id = obj.objectId || 'unknown';
          const typeStr = obj.objectType || 'unknown type';
          html += '<li title="' + typeStr + '"><code>' + id.slice(0, 8) + '...' + id.slice(-8) + '</code> <div style="font-size: 10px; color: var(--vscode-descriptionForeground); margin-left: 8px;">' + typeStr + '</div></li>';
        });
        html += '</ul></details>';
      }
    } else {
      // Fallback to effects if objectChanges is not available
      const mutated = effects.mutated?.length || 0;
      const created = effects.created?.length || 0;
      const deleted = effects.deleted?.length || 0;
      if (mutated > 0 || created > 0 || deleted > 0) {
        html += '<div style="margin-top: 8px; border-top: 1px solid var(--vscode-widget-border); padding-top: 4px;"><strong>Object Changes:</strong></div>';
        
        if (created > 0) {
          html += '<details style="margin-top: 4px;"><summary style="cursor: pointer; color: var(--vscode-terminal-ansiBrightGreen);">Created (' + created + ')</summary>';
          html += '<ul style="margin: 4px 0 4px 16px; padding: 0;">';
          effects.created.forEach(obj => {
            const id = obj.reference?.objectId || 'unknown';
            html += '<li title="' + id + '"><code>' + id.slice(0, 8) + '...' + id.slice(-8) + '</code></li>';
          });
          html += '</ul></details>';
        }
        
        if (mutated > 0) {
          html += '<details style="margin-top: 4px;"><summary style="cursor: pointer; color: var(--vscode-terminal-ansiBrightYellow);">Mutated (' + mutated + ')</summary>';
          html += '<ul style="margin: 4px 0 4px 16px; padding: 0;">';
          effects.mutated.forEach(obj => {
            const id = obj.reference?.objectId || 'unknown';
            html += '<li title="' + id + '"><code>' + id.slice(0, 8) + '...' + id.slice(-8) + '</code></li>';
          });
          html += '</ul></details>';
        }
        
        if (deleted > 0) {
          html += '<details style="margin-top: 4px;"><summary style="cursor: pointer; color: var(--vscode-terminal-ansiBrightRed);">Deleted (' + deleted + ')</summary>';
          html += '<ul style="margin: 4px 0 4px 16px; padding: 0;">';
          effects.deleted.forEach(obj => {
            const id = obj.objectId || 'unknown';
            html += '<li title="' + id + '"><code>' + id.slice(0, 8) + '...' + id.slice(-8) + '</code></li>';
          });
          html += '</ul></details>';
        }
      }
    }

    container.innerHTML = html;
  }

  function renderDevInspectError(errorMsg) {
    const btn = document.querySelector('button[onclick="sendDevInspect()"]');
    if (btn) btn.innerHTML = '🔍 Dev Inspect';
    
    const container = document.getElementById('devInspectResults');
    if (!container) return;
    
    container.style.display = 'block';
    container.innerHTML = '<div style="color: var(--vscode-errorForeground);"><strong>Error:</strong> ' + errorMsg + '</div>';
  }

  // Coin Portfolio Functions
  function toggleCoinObjects(coinType) {
    const container = document.getElementById('coin-objects-' + coinType);
    const toggle = container.previousElementSibling.querySelector('.coin-objects-toggle');
    const toggleText = toggle ? toggle.querySelector('.toggle-text') : null;
    const icon = toggle ? toggle.querySelector('.toggle-icon') : null;
    
    if (container.style.display === 'none') {
      container.style.display = 'block';
      if (toggleText) toggleText.textContent = 'Hide';
      if (icon) icon.style.transform = 'rotate(180deg)';
    } else {
      container.style.display = 'none';
      if (toggleText) toggleText.textContent = 'Show';
      if (icon) icon.style.transform = 'rotate(0deg)';
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
    const toggleText = toggle ? toggle.querySelector('.toggle-text') : null;
    const icon = toggle ? toggle.querySelector('.toggle-icon') : null;
    
    if (container.style.display === 'none') {
      container.style.display = 'block';
      if (toggleText) toggleText.textContent = 'Hide';
      if (icon) icon.style.transform = 'rotate(180deg)';
    } else {
      container.style.display = 'none';
      if (toggleText) toggleText.textContent = 'Show';
      if (icon) icon.style.transform = 'rotate(0deg)';
    }
  }
  // Expose functions to global scope for inline onclick/onchange handlers
  window.sendBuild = sendBuild;
  window.sendPublish = sendPublish;
  window.sendUpgrade = sendUpgrade;
  window.sendTest = sendTest;
  window.sendReset = sendReset;
  window.sendUpdateDeps = sendUpdateDeps;
  window.sendPublishWithDeps = sendPublishWithDeps;
  window.sendDumpBytecode = sendDumpBytecode;
  window.sendViewPublishedToml = sendViewPublishedToml;
  window.sendAddDependency = sendAddDependency;
  window.updateDepForm = updateDepForm;
  window.mvrNetwork = document.getElementById('mvrNetwork'); // Optional, mainly for debugging if needed
  window.copyValue = copyValue;
  window.sendCall = sendCall;
  window.sendDevInspect = sendDevInspect;
  window.toggleSection = toggleSection;
  window.toggleGasCoins = toggleGasCoins;
  window.toggleImportWallet = toggleImportWallet;
  window.toggleCoinTools = toggleCoinTools;
  window.copyGasCoinId = copyGasCoinId;
  window.sendMergeCoin = sendMergeCoin;
  window.sendSplitCoin = sendSplitCoin;
  window.sendTransferCoin = sendTransferCoin;
  window.toggleCoinObjects = toggleCoinObjects;
  window.copyCoinObjectId = copyCoinObjectId;
  window.copyCoinType = copyCoinType;
  window.toggleCoinPortfolio = toggleCoinPortfolio;
  window.setStatusMessage = setStatusMessage;
  window.handleInstallSui = handleInstallSui;
  window.handleUpdateSui = handleUpdateSui;
`;

