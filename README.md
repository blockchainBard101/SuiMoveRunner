# Sui Move Runner

A Visual Studio Code extension to simplify development, build, publish, upgrade, test, and function calls for **Sui Move** smart contracts — all from an intuitive sidebar UI.

---

## Features

* Create new Sui Move packages with a single click.
* Build your Move package inside VS Code with live output.
* Publish packages and automatically track upgrade capabilities.
* Upgrade published packages using saved upgrade capabilities.
* Run tests for your Move package and view test results.
* Call Move functions with flexible argument and type argument inputs.
* Manage and switch between multiple Sui environments (testnet, devnet, mainnet, or custom).
* Manage and switch wallets connected to the Sui client.
* Display your current wallet address and SUI balance.
* Clean, dark-themed UI with responsive inputs and buttons.

---

## Requirements

* **Sui client** and **Move toolchain** installed and available in your system PATH.
* A VS Code workspace opened with a Sui Move package (Move.toml) to enable build/publish/upgrade/test functionality.
* Network access to Sui fullnode RPC endpoints for fetching package module info.

---

## Installation

Install directly from the VSIX or publish your own version in the VS Code Marketplace.

---

## Extension Settings

Currently, this extension does not expose any additional VS Code settings.

---

## Known Issues

* RPC endpoints for fullnode are hardcoded for `testnet`, `devnet`, and `mainnet`. Custom environments require manual RPC input on first creation.
* Some long-running commands may freeze the UI briefly until completion.
* The upgrade capability tracking depends on correct output parsing and may fail if the Sui client output format changes.

---

## Release Notes

### 1.0.0

* Initial release of Sui Move Runner.
* Sidebar UI with commands for package creation, building, publishing, upgrading, testing, and calling Move functions.
* Environment and wallet management.
* Displays wallet balance and active environment.

---

## Contributing

Contributions and feedback are welcome! Feel free to open issues or submit pull requests.

---

## Additional Resources

* [Sui Blockchain Docs](https://docs.sui.io/)
* [Move Language](https://move-language.github.io/move/)
* [VS Code Extension API](https://code.visualstudio.com/api)

---

## License

MIT License © BlockchainBard

---

**Enjoy building on Sui with ease! 🚀**

