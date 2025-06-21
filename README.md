# Sui Move Runner

**Supercharge your Sui Move development workflow with an all-in-one VS Code sidebar UI.**

---

## ✅ Features

* ✅ Create new Sui Move packages with one click
* 🔨 Build Move packages with live output
* 🚀 Publish and upgrade packages seamlessly
* 🧪 Run tests and view results inside VS Code
* 🔁 Call public functions with flexible argument inputs
* 🌐 Manage multiple Sui environments (Testnet, Devnet, Mainnet)
* 👛 Switch between wallets and view balances
* 🌓 Dark-themed, responsive UI for a smooth dev experience

---

## 🔧 Requirements

* **Sui client** and **Move toolchain** installed and available in your system PATH.
* A VS Code workspace opened with a Sui Move package (`Move.toml`) to enable build/publish/upgrade/test functionality.
* Network access to Sui fullnode RPC endpoints for fetching package module info.

---

## 📦 Installation

You can install the extension in one of two ways:

1. **Marketplace**:
   Search for `Sui Move Runner` in the VS Code Extensions Marketplace.

2. **Manual Install**:
   Download the `.vsix` file and run the following command:

   ```bash
   code --install-extension path/to/sui-move-runner.vsix
   ```

---

## ⚙️ Extension Settings

This extension does not expose any custom settings at this time.

---

## 🐞 Known Issues

* RPC endpoints for fullnode are hardcoded for `testnet`, `devnet`, and `mainnet`. Custom environments require manual RPC input on first creation.
* Some long-running commands may briefly freeze the UI until completion.
* Upgrade capability tracking depends on output parsing and may break if the Sui client output format changes.

---

## 🗒️ Release Notes

### 0.0.1

* Initial release of **Sui Move Runner**
* Sidebar UI with commands for:

  * Package creation
  * Build, publish, and upgrade
  * Testing and function calls
* Environment and wallet management
* Wallet balance and network indicator display

---

## 🤝 Contributing

Contributions and feedback are welcome!
Feel free to open issues or submit pull requests.

---

## 📚 Additional Resources

* [Sui Blockchain Docs](https://docs.sui.io/)
* [VS Code Extension API](https://code.visualstudio.com/api)

---

## 📄 License

MIT License © blockchainBard

---

🎉 **Enjoy building on Sui with ease!**