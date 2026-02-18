import * as vscode from "vscode";
import { BaseController } from "./BaseController";
import { runCommand } from "../utils/shell";
import * as process from "process";

export class TransactionController extends BaseController {

    async handleCall(message: any) {
        const { pkg, module, func, args, typeArgs } = message;
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage("No workspace open");
            return;
        }
        const rootPath = this.state.activeMoveProjectRoot || workspaceFolder.uri.fsPath;

        let callCmd = `sui client call --package ${pkg} --module ${module} --function ${func}`;

        if (typeArgs && typeArgs.length > 0) {
            callCmd += " --type-args " + typeArgs.join(" ");
        }
        if (args && args.length > 0) {
            callCmd += " --args " + args.join(" ");
        }

        const terminal = vscode.window.createTerminal({
            name: "Sui Move Call",
        });
        terminal.show(true);
        const isWindows = process.platform === 'win32';
        const callCmdFinal = isWindows
            ? `cd /d "${rootPath}" && ${callCmd}`
            : `cd "${rootPath}" && ${callCmd}`;
        terminal.sendText(callCmdFinal, true);

        vscode.window.showInformationMessage(
            `🧠 Running '${callCmd}' in ${rootPath}...`
        );
    }

    async handleGetFaucet() {
        try {
            // Only allow faucet on devnet or localnet
            if (!['devnet', 'localnet'].includes(this.state.activeEnv)) {
                vscode.window.showWarningMessage("Faucet is only available on devnet or localnet.");
                return;
            }

            const address = this.state.activeWallet || '';
            const cmd = address
                ? `sui client faucet --address ${address}`
                : 'sui client faucet';
            const output = await runCommand(cmd);
            vscode.window.showInformationMessage(
                "💧 Faucet requested:\n" + output
            );
            // Allow time for the faucet transaction to finalize, then refresh
            setTimeout(async () => {
                await this.state.refreshWallets();
                this.postMessage("refresh");
                this.setStatus("");
            }, 4000);
        } catch (err) {
            vscode.window.showErrorMessage("❌ Faucet failed: " + err);
        }
    }

    async handleMergeCoin(message: any) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const rootPath = workspaceFolder?.uri.fsPath;

        const primaryCoin = message.primaryCoin as string;
        const coinToMerge = message.coinToMerge as string;
        if (!primaryCoin || !coinToMerge) {
            vscode.window.showErrorMessage("Select both primary coin and coin to merge");
            return;
        }

        const terminal = vscode.window.createTerminal({ name: "Sui Merge Coin" });
        terminal.show(true);
        const isWindows = process.platform === 'win32';
        const mergeCmd = `sui client merge-coin --primary-coin ${primaryCoin} --coin-to-merge ${coinToMerge}`;
        const finalCmd = rootPath
            ? (isWindows
                ? `cd /d "${rootPath}" && ${mergeCmd}`
                : `cd "${rootPath}" && ${mergeCmd}`)
            : mergeCmd;
        terminal.sendText(finalCmd, true);

        vscode.window.showInformationMessage(
            `🪙 Merging coin ${coinToMerge} into ${primaryCoin}...`
        );

        // Best-effort refresh after a short delay
        setTimeout(async () => {
            await this.state.refreshWallets();
            this.postMessage("refresh");
            this.setStatus("");
        }, 4000);
    }

    async handleSplitCoin(message: any) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const rootPath = workspaceFolder?.uri.fsPath;

        const coinId = message.coinId as string;
        const amounts = message.amounts as string[] | undefined;
        const count = message.count as number | undefined;
        if (!coinId) {
            vscode.window.showErrorMessage("Select a coin to split");
            return;
        }
        if ((!amounts || amounts.length === 0) && (count === undefined)) {
            vscode.window.showErrorMessage("Provide amounts or count");
            return;
        }

        const terminal = vscode.window.createTerminal({ name: "Sui Split Coin" });
        terminal.show(true);
        const isWindows = process.platform === 'win32';
        let splitCmd = `sui client split-coin --coin-id ${coinId}`;
        if (amounts && amounts.length > 0) {
            splitCmd += ` --amounts ${amounts.join(' ')}`;
        }
        if ((!amounts || amounts.length === 0) && (count !== undefined)) {
            splitCmd += ` --count ${count}`;
        }
        const finalCmd = rootPath
            ? (isWindows
                ? `cd /d "${rootPath}" && ${splitCmd}`
                : `cd "${rootPath}" && ${splitCmd}`)
            : splitCmd;
        terminal.sendText(finalCmd, true);

        vscode.window.showInformationMessage(
            `✂️ Splitting coin ${coinId}...`
        );

        setTimeout(async () => {
            await this.state.refreshWallets();
            this.postMessage("refresh");
            this.setStatus("");
        }, 4000);
    }

    async handleTransferSui(message: any) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const rootPath = workspaceFolder?.uri.fsPath;

        const coinId = message.coinId as string;
        const to = message.to as string;
        const amount = message.amount as string | undefined;
        if (!coinId || !to) {
            vscode.window.showErrorMessage("Provide coin and recipient");
            return;
        }

        const terminal = vscode.window.createTerminal({ name: "Sui Transfer SUI" });
        terminal.show(true);
        const isWindows = process.platform === 'win32';
        let transferCmd = `sui client transfer-sui --to ${to} --sui-coin-object-id ${coinId}`;
        if (amount && amount.trim().length > 0) {
            transferCmd += ` --amount ${amount.trim()}`;
        }
        // Default gas budget (in MIST)
        transferCmd += ` --gas-budget 10000000`;
        const finalCmd = rootPath
            ? (isWindows
                ? `cd /d "${rootPath}" && ${transferCmd}`
                : `cd "${rootPath}" && ${transferCmd}`)
            : transferCmd;
        terminal.sendText(finalCmd, true);

        vscode.window.showInformationMessage(
            `📤 Transferring SUI from ${coinId.slice(0, 8)}... to ${to.slice(0, 6)}...`
        );

        setTimeout(async () => {
            await this.state.refreshWallets();
            this.postMessage("refresh");
            this.setStatus("");
        }, 4000);
    }

    async handleTransferCoin(message: any) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const rootPath = workspaceFolder?.uri.fsPath;

        const coinId = message.coinId as string;
        const coinType = message.coinType as string;
        const to = message.to as string;
        const amount = message.amount as string | undefined;
        if (!coinId || !to) {
            vscode.window.showErrorMessage("Provide coin and recipient");
            return;
        }

        const terminal = vscode.window.createTerminal({ name: "Sui Transfer Coin" });
        terminal.show(true);
        const isWindows = process.platform === 'win32';

        // Use transfer-sui for SUI coins, transfer for other coins
        const isSui = coinType === "0x2::sui::SUI";
        let transferCmd: string;

        if (isSui) {
            transferCmd = `sui client transfer-sui --to ${to} --sui-coin-object-id ${coinId}`;
            if (amount && amount.trim().length > 0) {
                transferCmd += ` --amount ${amount.trim()}`;
            }
            transferCmd += ` --gas-budget 10000000`;
        } else {
            // For non-SUI coins, use the generic transfer command
            transferCmd = `sui client transfer --to ${to} --object-id ${coinId}`;
            if (amount && amount.trim().length > 0) {
                transferCmd += ` --amount ${amount.trim()}`;
            }
            // Default gas budget (in MIST)
            transferCmd += ` --gas-budget 10000000`;
        }

        const finalCmd = rootPath
            ? (isWindows
                ? `cd /d "${rootPath}" && ${transferCmd}`
                : `cd "${rootPath}" && ${transferCmd}`)
            : transferCmd;
        terminal.sendText(finalCmd, true);

        const coinName = isSui ? "SUI" : coinType.split("::").pop() || "coin";
        vscode.window.showInformationMessage(
            `📤 Transferring ${coinName} from ${coinId.slice(0, 8)}... to ${to.slice(0, 6)}...`
        );

        setTimeout(async () => {
            await this.state.refreshWallets();
            this.postMessage("refresh");
            this.setStatus("");
        }, 4000);
    }
}
