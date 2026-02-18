import * as vscode from "vscode";
import { BaseController } from "./BaseController";
import { runCommand } from "../utils/shell";
import { safeJsonParse } from "../utils/parsing";

export class WalletController extends BaseController {

    async handleSwitchWallet(message: any) {
        const address = message.address;
        if (!address) {
            return;
        }
        const shortAddress = address.slice(0, 6) + "..." + address.slice(-4);
        this.setStatus(`Changing wallet to ${shortAddress}...`);
        vscode.window.showInformationMessage(
            `Changing wallet to ${shortAddress}...`
        );

        try {
            await runCommand(`sui client switch --address ${address}`);

            await this.state.refreshWallets();
            this.postMessage("switch-wallet-done", { address });
            vscode.window.showInformationMessage(
                `💻 Switched wallet to ${address}`
            );
            this.postMessage("refresh");
        } catch (err) {
            this.setStatus("");
            vscode.window.showErrorMessage(
                `❌ Failed to switch wallet: ${err}`
            );
        }
    }

    async handleCreateAddress() {
        try {
            const keyScheme = await vscode.window.showQuickPick(
                ["ed25519", "secp256k1", "secp256r1"],
                { placeHolder: "Select key scheme for new address" }
            );
            if (!keyScheme) {
                vscode.window.showWarningMessage("Address creation cancelled.");
                return;
            }
            const output = await runCommand(
                `sui client new-address ${keyScheme} --json`
            );
            const parsed = JSON.parse(output);

            await this.state.refreshWallets();
            vscode.window.showInformationMessage(
                `✅ New address created:\nAlias: ${parsed.alias}\nAddress: ${parsed.address}\nRecovery Phrase: ${parsed.recoveryPhrase}`
            );
            this.postMessage("refresh");
        } catch (err) {
            vscode.window.showErrorMessage(
                `❌ Failed to create new address: ${err}`
            );
        }
    }

    async handleImportWallet(message: any) {
        const { inputString, keyScheme, derivationPath, alias } = message;
        if (!inputString) {
            vscode.window.showErrorMessage("Import input required");
            return;
        }

        this.setStatus("Importing wallet...");

        // Construct command
        // sui keytool import [OPTIONS] <INPUT_STRING> <KEY_SCHEME> [DERIVATION_PATH]
        let cmd = `sui keytool import "${inputString}" ${keyScheme}`;

        if (derivationPath) {
            cmd += ` "${derivationPath}"`;
        }

        if (alias) {
            cmd += ` --alias ${alias}`;
        }

        cmd += " --json"; // Request JSON output

        try {
            const output = await runCommand(cmd);
            // Try to parse JSON output to get the address/alias
            // Note: sui keytool import sometimes outputs text even with --json depending on version/errors

            console.log("Import Output:", output);

            await this.state.refreshWallets();

            vscode.window.showInformationMessage(
                `✅ Wallet imported successfully!`
            );

            this.setStatus("Wallet imported");
            this.postMessage("refresh");

        } catch (err) {
            console.error("Import failed:", err);
            vscode.window.showErrorMessage(
                `❌ Failed to import wallet: ${err}`
            );
            this.setStatus("Import failed");
        }
    }

    async handleExportWallet() {
        try {
            if (this.state.wallets.length === 0) {
                vscode.window.showErrorMessage("❌ No wallets available to export.");
                return;
            }

            // Create wallet selection options
            const walletOptions = this.state.wallets.map(wallet => ({
                label: `${wallet.name} - ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`,
                description: wallet.address,
                address: wallet.address
            }));

            // Show wallet selection dropdown
            const selectedWallet = await vscode.window.showQuickPick(walletOptions, {
                placeHolder: "Select wallet to export",
                title: "Export Wallet"
            });

            if (!selectedWallet) {
                vscode.window.showInformationMessage("Wallet export cancelled.");
                return;
            }

            const walletAddress = selectedWallet.address;

            // Show security warning before export
            const warningAction = await vscode.window.showWarningMessage(
                `⚠️ Security Warning: Exporting Private Key\n\n` +
                `You are about to export the private key for wallet:\n` +
                `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}\n\n` +
                `⚠️ IMPORTANT SECURITY NOTICE:\n` +
                `• This private key gives FULL ACCESS to your wallet\n` +
                `• Anyone with this key can steal ALL your funds\n` +
                `• Never share this key with anyone\n` +
                `• Store it securely and offline\n` +
                `• Consider using a hardware wallet for better security\n\n` +
                `Are you sure you want to continue?`,
                { modal: true },
                "Yes, I understand the risks",
                "Cancel"
            );

            if (warningAction !== "Yes, I understand the risks") {
                vscode.window.showInformationMessage("Wallet export cancelled for security.");
                return;
            }

            // Get the key identity for the selected wallet
            const keyIdentity = await this.getKeyIdentityForAddress(walletAddress);
            if (!keyIdentity) {
                vscode.window.showErrorMessage("❌ Could not find key identity for selected wallet.");
                return;
            }

            // Export the private key with JSON output
            const output = await runCommand(`sui keytool export --key-identity ${keyIdentity} --json`);
            const exportData = JSON.parse(output);
            const privateKey = exportData.exportedPrivateKey;
            const keyInfo = exportData.key;

            // Show the private key in a dialog
            const action = await vscode.window.showInformationMessage(
                `✅ Private key exported for wallet ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
                "Copy to Clipboard",
                "Show Details"
            );

            if (action === "Copy to Clipboard") {
                await vscode.env.clipboard.writeText(privateKey);
                vscode.window.showInformationMessage("🔐 Private key copied to clipboard!");
            } else if (action === "Show Details") {
                const panel = vscode.window.createWebviewPanel(
                    'walletExport',
                    'Wallet Export Details',
                    vscode.ViewColumn.One,
                    { enableScripts: true }
                );
                panel.webview.html = `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: var(--vscode-font-family); padding: 20px; }
                .warning { background: var(--vscode-inputValidation-warningBackground); 
                          color: var(--vscode-inputValidation-warningForeground); 
                          padding: 10px; border-radius: 4px; margin: 10px 0; }
                .private-key { background: var(--vscode-textCodeBlock-background); 
                              padding: 10px; border-radius: 4px; 
                              font-family: var(--vscode-editor-font-family); 
                              word-break: break-all; margin: 10px 0; }
                button { background: var(--vscode-button-background); 
                        color: var(--vscode-button-foreground); 
                        border: none; padding: 8px 16px; 
                        border-radius: 4px; cursor: pointer; margin: 5px; }
              </style>
            </head>
            <body>
              <h2>🔐 Wallet Export Details</h2>
              <div class="warning">
                ⚠️ <strong>Security Warning:</strong> Keep this private key secure and never share it. 
                Anyone with this key can access your wallet and funds.
              </div>
              <p><strong>Alias:</strong> ${keyInfo.alias}</p>
              <p><strong>Wallet Address:</strong> ${keyInfo.suiAddress}</p>
              <p><strong>Key Identity:</strong> ${keyIdentity}</p>
              <p><strong>Key Scheme:</strong> ${keyInfo.keyScheme}</p>
              <p><strong>Public Key:</strong> ${keyInfo.publicBase64Key}</p>
              <p><strong>Private Key:</strong></p>
              <div class="private-key">${privateKey}</div>
              <button onclick="navigator.clipboard.writeText('${privateKey}')">Copy Private Key</button>
              <button onclick="window.close()">Close</button>
            </body>
            </html>
          `;
            }
        } catch (err) {
            vscode.window.showErrorMessage(
                `❌ Failed to export wallet: ${err}`
            );
        }
    }

    async handleViewCoinPortfolio() {
        try {
            await this.state.fetchCoinPortfolio();
            // Use renderHtml exposed on state to update the view
            await this.state.onRefreshView();

            vscode.window.showInformationMessage(
                "💰 Coin portfolio updated!"
            );
        } catch (err) {
            vscode.window.showErrorMessage(`❌ Failed to fetch coin portfolio: ${err}`);
        }
    }

    handleShowGasCoinCopyNotification(message: any) {
        const coinId = message.coinId;
        const shortId =
            message.shortId || coinId.slice(0, 8) + "..." + coinId.slice(-8);

        vscode.window.showInformationMessage(
            `📋 Gas coin ID copied to clipboard: ${shortId}`
        );
    }

    handleShowCopyNotification() {
        vscode.window.showInformationMessage(
            "📋 Wallet address copied to clipboard!"
        );
    }

    // Helper from Extension.ts
    private async getKeyIdentityForAddress(address: string): Promise<string | null> {
        try {
            // Get all addresses to find the key identity
            const output = await runCommand('sui client addresses --json');
            const parsed = safeJsonParse(output);

            // The addresses format is an array of arrays: [alias, address]
            // The key identity is the alias (first element)
            if (parsed.addresses && Array.isArray(parsed.addresses)) {
                const wallet = parsed.addresses.find((addr: any[]) => addr[1] === address);
                return wallet?.[0] || null; // keyIdentity is the alias at index 0
            }

            console.error('Unexpected addresses response format:', parsed);
            return null;
        } catch (error) {
            console.error('Error getting key identity:', error);
            return null;
        }
    }
}
