# Sui Move Runner

[![Version](https://img.shields.io/badge/version-0.5.1-blue.svg)](https://marketplace.visualstudio.com/items?itemName=blockchainBard.sui-move-runner)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.80.0+-blue.svg)](https://code.visualstudio.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**A comprehensive VS Code extension that streamlines Sui Move development with an intuitive sidebar interface, automated CLI management, and cross-platform compatibility.**

## 📸 Screenshots

<img src="https://raw.githubusercontent.com/blockchainBard101/SuiMoveRunner/move-project-scan/media/Screenshot-2025-09-15-at-6.49.05-AM.png" alt="Package Creation" width="160" style="display: inline-block; margin-right: 10px;"> <img src="https://raw.githubusercontent.com/blockchainBard101/SuiMoveRunner/move-project-scan/media/Screenshot-2025-09-15-at-6.51.16-AM.png" alt="Build and Test" width="160" style="display: inline-block; margin-right: 10px;"> <img src="https://raw.githubusercontent.com/blockchainBard101/SuiMoveRunner/move-project-scan/media/Screenshot-2025-11-03-at-11.50.31-PM.png" alt="Wallet Management" width="160" style="display: inline-block; margin-right: 10px;"> <img src="https://raw.githubusercontent.com/blockchainBard101/SuiMoveRunner/move-project-scan/media/Screenshot-2025-11-03-at-11.49.12-PM.png" alt="Main Interface" width="160" style="display: inline-block; margin-right: 10px;"> <img src="https://raw.githubusercontent.com/blockchainBard101/SuiMoveRunner/move-project-scan/media/Screenshot-2025-11-03-at-11.52.01-PM.png" alt="Network Operations" width="160" style="display: inline-block; margin-right: 10px;"> <img src="https://raw.githubusercontent.com/blockchainBard101/SuiMoveRunner/move-project-scan/media/Screenshot-2025-11-04-at-12.21.28-AM.png" alt="Screenshot 1" width="160" style="display: inline-block; margin-right: 10px;"> <img src="https://raw.githubusercontent.com/blockchainBard101/SuiMoveRunner/move-project-scan/media/Screenshot-2025-11-04-at-12.27.11-AM.png" alt="Screenshot 2" width="160">

---

## Features

### Package Management

- **One-Click Package Creation**: Create new Sui Move packages instantly
- **Smart Build System**: Build packages with live output and error reporting
- **Seamless Publishing**: Publish packages to any Sui network
- **Package Upgrades**: Upgrade existing packages with version tracking

### 🧪 Development Tools

- **Integrated Testing**: Run Move tests directly in VS Code
- **Function Calls**: Execute public functions with flexible argument inputs
- **Live Output**: Real-time command execution and output display

### 🌐 Network Management

- **Multi-Environment Support**: Switch between Testnet, Devnet, Mainnet, and custom networks
- **Environment Creation**: Automatically create new environments with RPC configuration
- **Network Status**: Visual indicators for current network and connection status

### Wallet Integration

- **Wallet Management**: Create, import, and switch between Sui wallets
- **Balance Tracking**: Real-time balance display for all wallet addresses
- **Gas Management**: View and manage gas coins for transactions

### CLI Management

- **Version Detection**: Automatic detection of Sui CLI version
- **Update Notifications**: Smart notifications when Sui CLI updates are available
- **Platform-Specific Updates**: Automated updates using the appropriate package manager:
  - **macOS**: Homebrew (`brew upgrade sui`)
  - **Windows**: Chocolatey (`choco upgrade sui`)
  - **Linux**: Cargo (`cargo install sui`)

### User Experience

- **Dark Theme Support**: Optimized for VS Code's dark theme
- **Responsive Design**: Clean, intuitive interface that adapts to your workflow
- **Cross-Platform**: Full compatibility with Windows, macOS, and Linux
- **Error Handling**: Comprehensive error reporting and recovery

---

## 📋 Prerequisites

- **VS Code**: Version 1.80.0 or higher
- **Sui CLI**: Installed and available in your system PATH
- **Node.js**: Version 16 or higher (for development)
- **Network Access**: Required for RPC endpoints and package operations

### Sui CLI Installation

The extension can help you update Sui CLI, but initial installation requires:

**macOS (Homebrew):**

```bash
brew install sui
```

**Windows (Chocolatey):**

```bash
choco install sui
```

**Linux (Cargo):**

```bash
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui --features tracing
```

---

## 📦 Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Sui Move Runner"
4. Click Install

### From VSIX File

1. Download the latest `.vsix` file from releases
2. Open VS Code
3. Go to Extensions → More Actions → Install from VSIX
4. Select the downloaded file

### Manual Installation

```bash
code --install-extension sui-move-runner.vsix
```

---

## Quick Start

1. **Open a Sui Move Project**: Open a folder containing a `Move.toml` file
2. **Access the Sidebar**: Look for the "Sui Move Runner" icon in the Activity Bar
3. **Set Up Environment**: The extension will guide you through environment setup
4. **Start Building**: Use the sidebar to build, test, and publish your Move packages

---

## 📖 Usage Guide

### Environment Management

- **Switch Environments**: Use the dropdown to select your target network
- **Create Custom Environments**: Add new RPC endpoints for custom networks
- **Environment Status**: Monitor connection status and network health

### Package Development

1. **Create Package**: Click "Create Move Package" to start a new project
2. **Build Package**: Use "Build" to compile your Move code
3. **Test Package**: Run "Test" to execute your test suite
4. **Publish Package**: Deploy your package to the selected network

### Wallet Operations

- **Create Address**: Generate new Sui addresses
- **View Balances**: Check SUI balances for all addresses
- **Gas Management**: Monitor and manage gas coins

### CLI Updates

- **Automatic Detection**: The extension automatically detects your Sui CLI version
- **Update Notifications**: Get notified when updates are available
- **One-Click Updates**: Update Sui CLI directly from the extension

---

## ⚙️ Configuration

### Extension Settings

The extension works out of the box with default settings. No additional configuration is required.

### Sui Client Configuration

The extension automatically detects and uses your existing Sui client configuration. For custom environments, you can:

1. Use the environment switcher to add new networks
2. Provide custom RPC endpoints when prompted
3. The extension will handle the rest automatically

---

## Troubleshooting

### Common Issues

**Extension Not Loading:**

- Ensure VS Code version is 1.80.0 or higher
- Check that Sui CLI is installed and in PATH
- Restart VS Code after installation

**Commands Not Working:**

- Check that Sui CLI is properly installed
- Ensure network connectivity for RPC operations

**Build/Test Failures:**

- Check Move.toml configuration
- Verify Sui CLI version compatibility
- Review error messages in the output panel

**Windows Compatibility:**

- Ensure Chocolatey is installed for Sui CLI updates
- Use Command Prompt or PowerShell for terminal operations
- Check Windows Defender settings for command execution

### Getting Help

- Check the [Issues](https://github.com/blockchainBard101/SuiMoveRunner/issues) page
- Review the [Sui Documentation](https://docs.sui.io/)
- Join the [Sui Discord](https://discord.gg/sui) community


---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Open in VS Code
4. Press F5 to run the extension in a new window

### Contributing Guidelines

- Fork the repository
- Create a feature branch
- Make your changes
- Add tests if applicable
- Submit a pull request

### Reporting Issues

- Use the GitHub Issues tracker
- Provide detailed reproduction steps
- Include system information and logs

---

## 📚 Resources

- **[Sui Documentation](https://docs.sui.io/)**: Official Sui blockchain documentation
- **[Move Language](https://move-language.github.io/move/)**: Move programming language reference
- **[VS Code Extension API](https://code.visualstudio.com/api)**: VS Code extension development guide
- **[Sui GitHub](https://github.com/MystenLabs/sui)**: Sui blockchain source code

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- **Sui Team**: For the amazing blockchain platform
- **VS Code Team**: For the excellent extension API
- **Community**: For feedback and contributions

---

<div align="center">

**Made with ❤️ for the Sui ecosystem**

[⭐ Star us on GitHub](https://github.com/blockchainBard101/SuiMoveRunner) | [🐛 Report Issues](https://github.com/blockchainBard101/SuiMoveRunner/issues) | [💬 Join Discord](https://discord.gg/sui)

</div>
