import * as vscode from "vscode";
import * as process from "process";
import { BaseController } from "./BaseController";
import { runCommand } from "../utils/shell";
import { safeJsonParse } from "../utils/parsing";

export class EnvironmentController extends BaseController {

    async handleSwitchEnv(message: any) {
        const alias = message.env || message.alias; // support both keys for compatibility
        if (!alias) {
            return;
        }

        this.setStatus(`Changing environment to ${alias}...`);
        vscode.window.showInformationMessage(
            `Changing environment to ${alias}...`
        );

        try {
            // Check if environment exists in default environments
            const isDefaultEnv = this.state.defaultEnvs.some((e) => e.alias === alias);

            // Check if environment exists in user's Sui client
            let envExists = false;
            try {
                const envOutput = await runCommand(`${this.state.suiPath} client envs --json`);
                // We know safeJsonParse returns [envsList, currentEnv]
                const [envsList] = safeJsonParse(envOutput);
                envExists = envsList.some((e: any) => e.alias === alias);
            } catch {
                // If we can't check, assume it doesn't exist
                envExists = false;
            }

            if (alias === "localnet") {
                const running = await this.state.isLocalnetRunning();
                if (!running) {
                    vscode.window.showInformationMessage(
                        "🟢 Starting Sui local network in new terminal..."
                    );
                    const terminal = vscode.window.createTerminal({
                        name: "Sui Local Network",
                    });
                    terminal.show(true);
                    const isWindows = process.platform === 'win32';
                    const localnetCmd = isWindows
                        ? 'set RUST_LOG=off,sui_node=info && sui start --with-faucet --force-regenesis'
                        : 'RUST_LOG="off,sui_node=info" sui start --with-faucet --force-regenesis';
                    terminal.sendText(localnetCmd, true);
                    // Wait a few seconds for the node to start
                    await new Promise((res) => setTimeout(res, 6000));
                }
            }

            // If environment doesn't exist in Sui client, create it
            if (!envExists) {
                let rpc = "";

                if (isDefaultEnv) {
                    // Use the default RPC for predefined environments
                    const defaultEnv = this.state.defaultEnvs.find((e) => e.alias === alias);
                    rpc = defaultEnv?.rpc || "";
                } else {
                    // Ask user for RPC for custom environments
                    const userRpc = await vscode.window.showInputBox({
                        prompt: `RPC for new env '${alias}'`,
                    });
                    if (!userRpc) {
                        this.setStatus("");
                        return;
                    }
                    rpc = userRpc;
                }

                if (rpc) {
                    await runCommand(
                        `${this.state.suiPath} client new-env --alias ${alias} --rpc ${rpc}`
                    );
                    vscode.window.showInformationMessage(
                        `✅ Created new environment: ${alias}`
                    );
                }
            }

            // Now switch to the environment
            await runCommand(`${this.state.suiPath} client switch --env ${alias}`);

            await this.state.refreshEnvs();
            await this.state.refreshWallets();

            this.postMessage("switch-env-done", { alias });
            vscode.window.showInformationMessage(
                `🔄 Switched to env: ${alias}`
            );
            this.postMessage("refresh");
        } catch (err) {
            this.setStatus("");
            vscode.window.showErrorMessage(`❌ Failed to switch env: ${err}`);
        }
    }

    async handleUpdateSui(message?: any) {
        const method = message?.method;
        const terminal = vscode.window.createTerminal({
            name: "Sui CLI Update",
        });
        terminal.show(true);

        let updateCmd = "";
        const detectedMethod = method || this.state.installMethod;

        switch (detectedMethod) {
            case "suiup":
                updateCmd = "suiup update";
                break;
            case "homebrew":
                updateCmd = "brew upgrade sui";
                break;
            case "chocolatey":
                updateCmd = "choco upgrade sui";
                break;
            case "source":
                updateCmd = "cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui --features tracing";
                break;
            default:
                // Fallback to OS-based defaults
                if (process.platform === 'win32') updateCmd = 'choco upgrade sui';
                else if (process.platform === 'darwin') updateCmd = 'brew upgrade sui';
                else updateCmd = 'suiup update'; // Recommend suiup for linux
        }

        terminal.sendText(updateCmd, true);
        vscode.window.showInformationMessage(
            `🔄 Updating Sui CLI via ${detectedMethod}... Check the terminal for progress.`
        );

        // Refresh version check after a delay
        setTimeout(async () => {
            await this.state.checkSuiVersion();
            this.postMessage("refresh");
        }, 20000);
    }

    async handleInstallSui(message: any) {
        const { method } = message;
        const terminal = vscode.window.createTerminal({
            name: "Sui CLI Install",
        });
        terminal.show(true);

        let installCmd = "";
        switch (method) {
            case "suiup":
                installCmd = "curl -sSfL https://raw.githubusercontent.com/Mystenlabs/suiup/main/install.sh | sh && suiup install sui";
                break;
            case "brew":
                installCmd = "brew install sui";
                break;
            case "choco":
                installCmd = "choco install sui";
                break;
            case "source":
                installCmd = "cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui --features tracing";
                break;
            case "binary":
                vscode.window.showInformationMessage("Opening Sui releases page for binary download...");
                vscode.env.openExternal(vscode.Uri.parse("https://github.com/MystenLabs/sui/releases/latest"));
                return;
            default:
                installCmd = "curl -sSfL https://raw.githubusercontent.com/Mystenlabs/suiup/main/install.sh | sh && suiup install sui";
        }

        terminal.sendText(installCmd, true);
        vscode.window.showInformationMessage(
            `🚀 Installing Sui CLI via ${method}... Check the terminal for progress.`
        );

        // Periodically check if installation finished
        const interval = setInterval(async () => {
            await this.state.checkSuiVersion();
            if (this.state.isSuiInstalled) {
                vscode.window.showInformationMessage("✅ Sui CLI installation detected!");
                this.postMessage("refresh");
                clearInterval(interval);
            }
        }, 10000);

        // Stop checking after 5 minutes
        setTimeout(() => clearInterval(interval), 300000);
    }
}
