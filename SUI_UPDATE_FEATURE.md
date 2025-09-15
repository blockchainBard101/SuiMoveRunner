# Sui CLI Update Feature

## Overview
Added automatic detection of outdated Sui CLI versions with a user-friendly update interface.

## Features

### 1. Version Detection
- **Current Version**: Automatically detects the installed Sui CLI version using `sui --version`
- **Latest Version**: Fetches the latest version from GitHub releases API
- **Comparison**: Compares versions to determine if an update is needed

### 2. Visual Warning
- **Warning Banner**: Shows a prominent warning when Sui CLI is outdated
- **Version Display**: Shows current vs latest version numbers
- **Update Button**: One-click update button for easy installation

### 3. Cross-Platform Update
- **Windows**: Uses PowerShell script for installation
- **Unix/Linux/macOS**: Uses curl and tar for installation
- **Automatic Detection**: Detects OS and uses appropriate update method

## Technical Implementation

### Version Detection Functions
```typescript
async function getSuiVersion(): Promise<string | null>
async function getLatestSuiVersion(): Promise<string | null>
function compareVersions(current: string, latest: string): boolean
```

### Update Commands
Based on the [official Sui installation documentation](https://docs.sui.io/guides/developer/getting-started/sui-install):
- **Windows**: `choco upgrade sui` (using Chocolatey)
- **macOS**: `brew upgrade sui` (using Homebrew)  
- **Linux**: `cargo install --git https://github.com/MystenLabs/sui.git --tag mainnet-v[VERSION] sui` (using Cargo)

### Platform Detection
```typescript
const isWindows = process.platform === 'win32';
const isMacOS = process.platform === 'darwin';
// Linux is detected when neither Windows nor macOS
```

### UI Components
- **Warning Section**: Red-themed warning box with version info
- **Update Button**: Styled button that triggers update process
- **Status Messages**: Real-time feedback during update process

## User Experience

### When Sui CLI is Up-to-Date
- No warning is shown
- Normal interface operation

### When Sui CLI is Outdated
- Prominent warning banner appears at the top
- Shows current and latest version numbers
- "Update" button is prominently displayed
- Clicking update opens terminal with update command
- Status message shows "Updating Sui CLI..."
- Version check refreshes after 10 seconds

## Error Handling
- **Version Detection Failure**: Shows "Unknown" for version numbers
- **Network Issues**: Gracefully handles GitHub API failures
- **Update Failures**: Terminal shows error messages for user to see

## Files Modified
- `src/extension.ts`: Added version detection and update logic
- `src/webviewTemplate.ts`: Added UI components and event handlers

## Benefits
1. **Proactive Updates**: Users are notified when updates are available
2. **Easy Installation**: One-click update process
3. **Cross-Platform**: Works on Windows, Linux, and macOS
4. **Non-Intrusive**: Only shows when update is needed
5. **User-Friendly**: Clear visual indicators and status messages

## Future Enhancements
- Optional: Add update check frequency settings
- Optional: Add manual version check button
- Optional: Show changelog or release notes
- Optional: Add update progress indicator
