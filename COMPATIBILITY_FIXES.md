# SuiMoveRunner Extension - Compatibility Fixes

## Issues Fixed

### 1. VS Code Version Compatibility
- **Problem**: Extension required VS Code `^1.101.0` but many users have different versions
- **Solution**: Updated to support VS Code `^1.80.0` for broader compatibility
- **Files Changed**: `package.json`

### 2. TypeScript Types Compatibility
- **Problem**: `@types/vscode` was set to `^1.101.0` causing type mismatches
- **Solution**: Updated to `^1.80.0` to match the engines requirement
- **Files Changed**: `package.json`

### 3. Activation Events
- **Problem**: Limited activation events could cause extension to not load properly
- **Solution**: Added multiple activation events for better reliability:
  - `onView:suiRunner.sidebarView`
  - `onCommand:suimoverunner.createMovePackage`
  - `onCommand:suimoverunner.publishMovePackage`
  - `onCommand:suimoverunner.callMoveFunction`
  - `workspaceContains:**/Move.toml`

### 4. Error Handling
- **Problem**: Extension could fail silently without proper error handling
- **Solution**: Added try-catch blocks and proper error logging in the activation function
- **Files Changed**: `src/extension.ts`

## Installation Instructions

### For Development
1. Clone the repository
2. Run `npm install`
3. Run `npm run package`
4. Press `F5` in VS Code to open a new Extension Development Host window
5. The extension should now work in the new window

### For Distribution
1. Run `npm run package` to build the extension
2. The `.vsix` file will be created in the root directory
3. Install using: `code --install-extension suimoverunner-0.1.3.vsix`

## Troubleshooting

### Extension Not Loading
1. Check VS Code version: `code --version`
2. Ensure VS Code version is 1.80.0 or higher
3. Check the Developer Console (Help > Toggle Developer Tools) for errors
4. Try reloading the window (Ctrl+Shift+P > "Developer: Reload Window")

### Sidebar Not Appearing
1. Look for the SuiRunner icon in the Activity Bar (left sidebar)
2. If not visible, try opening a Move project (folder with Move.toml)
3. Check if the extension is enabled in Extensions view

### Commands Not Working
1. Open Command Palette (Ctrl+Shift+P)
2. Type "Sui" to see available commands
3. If commands don't appear, try reloading the window

### Common Error Messages
- **"Extension is not compatible"**: Update VS Code to version 1.80.0 or higher
- **"Failed to activate"**: Check console for specific error details
- **"No workspace open"**: Open a folder in VS Code before using the extension

## System Requirements

- VS Code 1.80.0 or higher
- Node.js 16.0.0 or higher (for development)
- Sui CLI installed and configured (for functionality)

## Testing

The extension has been tested with:
- VS Code 1.103.2 (current stable)
- Node.js 22.19.0
- macOS 22.6.0

## Support

If you continue to experience issues:
1. Check the VS Code Developer Console for error messages
2. Ensure all dependencies are properly installed
3. Try reinstalling the extension
4. Open an issue on the GitHub repository with:
   - VS Code version
   - Operating system
   - Error messages from console
   - Steps to reproduce the issue
