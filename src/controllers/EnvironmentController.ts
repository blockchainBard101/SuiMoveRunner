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
                const envOutput = await runCommand(`sui client envs --json`);
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
                        `sui client new-env --alias ${alias} --rpc ${rpc}`
                    );
                    vscode.window.showInformationMessage(
                        `✅ Created new environment: ${alias}`
                    );
                }
            }

            // Now switch to the environment
            await runCommand(`sui client switch --env ${alias}`);

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

    async handleUpdateSui() {
        const isWindows = process.platform === 'win32';
        const isMacOS = process.platform === 'darwin';
        const terminal = vscode.window.createTerminal({
            name: "Sui CLI Update",
        });
        terminal.show(true);

        let updateCmd = "";
        if (isWindows) {
            // Windows: Use Chocolatey
            updateCmd = 'choco upgrade sui';
        } else if (isMacOS) {
            // macOS: Use Homebrew
            updateCmd = 'brew upgrade sui';
        } else {
            // Linux: Use Cargo
            updateCmd = 'cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui --features tracing';
        }

        terminal.sendText(updateCmd, true);
        vscode.window.showInformationMessage(
            "🔄 Updating Sui CLI... Check the terminal for progress."
        );

        // Refresh version check after a delay
        setTimeout(async () => {
            await this.state.checkSuiVersion();
            this.postMessage("refresh");
        }, 15000);
    }
}
