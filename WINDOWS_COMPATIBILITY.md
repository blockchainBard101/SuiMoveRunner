# Windows Compatibility Fixes

## Issues Fixed

### 1. Command Execution Shell Compatibility
- **Problem**: The `runCommand` function used default shell which doesn't work properly on Windows
- **Solution**: Added Windows-specific shell detection and configuration
- **Code**: Uses `cmd.exe` on Windows, default shell on Unix systems

### 2. Terminal Command Path Handling
- **Problem**: Unix-style `cd "path" && command` doesn't work on Windows
- **Solution**: Use Windows-specific `cd /d "path" && command` syntax
- **Affected Commands**:
  - Build commands (`sui move build`)
  - Test commands (`sui move test`)
  - Call commands (`sui client call`)

### 3. Environment Variable Setting
- **Problem**: Unix-style `VAR=value command` doesn't work on Windows
- **Solution**: Use Windows-specific `set VAR=value && command` syntax
- **Affected**: RUST_LOG environment variable for localnet startup

### 4. Process Execution
- **Problem**: `exec()` calls didn't specify Windows-compatible shell
- **Solution**: Added shell specification for all `exec()` calls
- **Affected Commands**:
  - Publish commands (`sui client publish`)
  - Upgrade commands (`sui client upgrade`)

## Technical Details

### Shell Detection
```typescript
const isWindows = process.platform === 'win32';
```

### Command Execution
```typescript
exec(command, { 
  cwd, 
  shell: isWindows ? 'cmd.exe' : undefined
}, ...)
```

### Terminal Commands
```typescript
// Windows
const cmd = `cd /d "${rootPath}" && ${command}`;

// Unix/Linux/macOS
const cmd = `cd "${rootPath}" && ${command}`;
```

### Environment Variables
```typescript
// Windows
const cmd = 'set RUST_LOG=off,sui_node=info && sui start --with-faucet --force-regenesis';

// Unix/Linux/macOS
const cmd = 'RUST_LOG="off,sui_node=info" sui start --with-faucet --force-regenesis';
```

## Commands Fixed

1. **Build Command**: `sui move build`
2. **Test Command**: `sui move test`
3. **Call Command**: `sui client call`
4. **Publish Command**: `sui client publish`
5. **Upgrade Command**: `sui client upgrade`
6. **Localnet Startup**: `sui start --with-faucet --force-regenesis`
7. **Environment Switching**: `sui client switch --env`
8. **Environment Creation**: `sui client new-env`

## Testing

The extension has been tested on:
- ✅ Windows (cmd.exe)
- ✅ Linux (bash)
- ✅ macOS (bash)

## Result

All Sui CLI commands should now work properly on Windows systems without throwing errors. The extension automatically detects the operating system and uses the appropriate command syntax and shell configuration.
