"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionController = void 0;
const vscode = __importStar(require("vscode"));
const BaseController_1 = require("./BaseController");
const shell_1 = require("../utils/shell");
const process = __importStar(require("process"));
const RpcService_1 = require("../services/RpcService");
class TransactionController extends BaseController_1.BaseController {
    async handleCall(message) {
        const { pkg, module, func, args, typeArgs } = message;
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage("No workspace open");
            return;
        }
        const rootPath = this.state.activeMoveProjectRoot || workspaceFolder.uri.fsPath;
        let callCmd = `${this.state.suiPath} client call --package ${pkg} --module ${module} --function ${func}`;
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
        vscode.window.showInformationMessage(`🧠 Running '${callCmd}' in ${rootPath}...`);
    }
    async handleDevInspect(message) {
        const { pkg, module, func, args, typeArgs } = message;
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage("No workspace open");
            return;
        }
        const rootPath = this.state.activeMoveProjectRoot || workspaceFolder.uri.fsPath;
        let callCmd = `${this.state.suiPath} client call --package ${pkg} --module ${module} --function ${func}`;
        if (typeArgs && typeArgs.length > 0) {
            callCmd += " --type-args " + typeArgs.join(" ");
        }
        if (args && args.length > 0) {
            callCmd += " --args " + args.join(" ");
        }
        // Add serialize and gas budget constraints to create the unsigned transaction payload
        callCmd += " --gas-budget 500000000 --serialize-unsigned-transaction";
        try {
            const isWindows = process.platform === 'win32';
            const callCmdFinal = isWindows
                ? `cd /d "${rootPath}" && ${callCmd}`
                : `cd "${rootPath}" && ${callCmd}`;
            this.setStatus("Generating transaction block...");
            // Generate unsigned transaction payload (base64)
            const output = await (0, shell_1.runCommand)(callCmdFinal);
            // Extract the base64 output (the last non-empty line usually)
            const lines = output.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            const txBytes = lines[lines.length - 1];
            if (!txBytes) {
                throw new Error("Could not parse transaction bytes from CLI output");
            }
            const sender = this.state.activeWallet;
            if (!sender) {
                vscode.window.showErrorMessage("No active wallet selected for Dev Inspect");
                this.setStatus("");
                return;
            }
            // Determine active RPC
            const currentRpc = this.state.availableEnvs.find(e => e.alias === this.state.activeEnv)?.rpc ||
                this.state.defaultEnvs.find(e => e.alias === this.state.activeEnv)?.rpc;
            if (!currentRpc) {
                throw new Error("Could not determine RPC URL for Dev Inspect");
            }
            this.setStatus("Running Dev Inspect (via Dry Run)...");
            const result = await (0, RpcService_1.dryRunTransactionBlock)(currentRpc, txBytes);
            // Forward the result back to the webview
            this.webview.postMessage({ command: 'dev-inspect-result', data: result });
            this.setStatus("");
        }
        catch (error) {
            vscode.window.showErrorMessage("Dev Inspect Failed: " + error.message);
            this.webview.postMessage({ command: 'dev-inspect-error', error: error.message });
            this.setStatus("");
        }
    }
    buildPtbCliArgs(ptbCommands) {
        const args = [];
        for (const cmd of ptbCommands) {
            switch (cmd.type) {
                case 'moveCall':
                    args.push('--move-call', `"${cmd.target}"`);
                    if (cmd.typeArgs && cmd.typeArgs.length > 0) {
                        args.push(`"<${cmd.typeArgs.join(',')}>"`);
                    }
                    if (cmd.args && cmd.args.length > 0) {
                        args.push(...cmd.args.map((a) => `"${a}"`));
                    }
                    break;
                case 'transferObjects':
                    args.push('--transfer-objects', `"[${cmd.objects.join(',')}]"`, `"${cmd.address}"`);
                    break;
                case 'splitCoins':
                    args.push('--split-coins', `"${cmd.coin}"`, `"[${cmd.amounts.join(',')}]"`);
                    break;
                case 'mergeCoins':
                    args.push('--merge-coins', `"${cmd.targetCoin}"`, `"[${cmd.coinsToMerge.join(',')}]"`);
                    break;
                case 'makeMoveVec':
                    args.push('--make-move-vec', `"<${cmd.typeTag}>"`, `"[${cmd.elements.join(',')}]"`);
                    break;
                case 'publish':
                    args.push('--publish', `"${cmd.packagePath}"`);
                    break;
                case 'upgrade':
                    args.push('--upgrade', `"${cmd.packagePath}"`);
                    break;
            }
            if (cmd.assignedName) {
                args.push('--assign', `"${cmd.assignedName}"`);
            }
        }
        return args;
    }
    async handlePtbExecute(message) {
        const { ptbCommands } = message;
        if (!ptbCommands || ptbCommands.length === 0)
            return;
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const rootPath = this.state.activeMoveProjectRoot || workspaceFolder?.uri.fsPath || "";
        const cliArgs = this.buildPtbCliArgs(ptbCommands);
        const callCmd = `${this.state.suiPath} client ptb ${cliArgs.join(" ")}`;
        const terminal = vscode.window.createTerminal({ name: "Sui PTB Execution" });
        terminal.show(true);
        const isWindows = process.platform === 'win32';
        const callCmdFinal = rootPath ? (isWindows ? `cd /d "${rootPath}" && ${callCmd}` : `cd "${rootPath}" && ${callCmd}`) : callCmd;
        terminal.sendText(callCmdFinal, true);
        this.webview.postMessage({ command: 'ptb-execute-result', data: { success: true } });
    }
    async handlePtbDevInspect(message) {
        const { ptbCommands } = message;
        if (!ptbCommands || ptbCommands.length === 0)
            return;
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const rootPath = this.state.activeMoveProjectRoot || workspaceFolder?.uri.fsPath || "";
        const cliArgs = this.buildPtbCliArgs(ptbCommands);
        // Add serialize-unsigned-transaction flag for inspect
        let callCmd = `${this.state.suiPath} client ptb ${cliArgs.join(" ")} --gas-budget 500000000 --serialize-unsigned-transaction`;
        try {
            const isWindows = process.platform === 'win32';
            const callCmdFinal = rootPath ? (isWindows ? `cd /d "${rootPath}" && ${callCmd}` : `cd "${rootPath}" && ${callCmd}`) : callCmd;
            this.setStatus("Generating PTB block...");
            const output = await (0, shell_1.runCommand)(callCmdFinal);
            const lines = output.split('\\n').map((l) => l.trim()).filter((l) => l.length > 0);
            const txBytes = lines[lines.length - 1];
            if (!txBytes) {
                throw new Error("Could not parse transaction bytes from CLI output");
            }
            // Determine active RPC
            const currentRpc = this.state.availableEnvs.find(e => e.alias === this.state.activeEnv)?.rpc ||
                this.state.defaultEnvs.find(e => e.alias === this.state.activeEnv)?.rpc;
            if (!currentRpc) {
                throw new Error("Could not determine RPC URL for Dev Inspect");
            }
            this.setStatus("Running Dev Inspect on PTB...");
            const result = await (0, RpcService_1.dryRunTransactionBlock)(currentRpc, txBytes);
            this.webview.postMessage({ command: 'ptb-dev-inspect-result', data: result });
            this.setStatus("");
        }
        catch (error) {
            const errorMsg = typeof error === 'string' ? error : (error.message || 'Unknown error');
            vscode.window.showErrorMessage("PTB Dev Inspect Failed: " + errorMsg);
            this.webview.postMessage({ command: 'ptb-dev-inspect-result', error: errorMsg });
            this.setStatus("");
        }
    }
    async handlePtbExport(message) {
        const { ptbCommands } = message;
        const uri = await vscode.window.showSaveDialog({
            filters: { 'JSON': ['json'] },
            saveLabel: 'Export PTB'
        });
        if (uri) {
            try {
                await vscode.workspace.fs.writeFile(uri, Buffer.from(JSON.stringify(ptbCommands, null, 2)));
                vscode.window.showInformationMessage('PTB exported successfully!');
            }
            catch (err) {
                vscode.window.showErrorMessage('Failed to export PTB: ' + err.message);
            }
        }
    }
    async handlePtbImport() {
        const uris = await vscode.window.showOpenDialog({
            canSelectMany: false,
            filters: { 'JSON': ['json'] },
            openLabel: 'Import PTB'
        });
        if (uris && uris.length > 0) {
            try {
                const data = await vscode.workspace.fs.readFile(uris[0]);
                const jsonText = Buffer.from(data).toString('utf-8');
                // Send back to webview
                this.webview.postMessage({ command: 'ptb-imported', data: jsonText });
            }
            catch (err) {
                vscode.window.showErrorMessage('Failed to import PTB: ' + err.message);
            }
        }
    }
    parseSuiType(t) {
        if (typeof t === 'string')
            return t;
        if (t.Reference)
            return this.parseSuiType(t.Reference);
        if (t.MutableReference)
            return this.parseSuiType(t.MutableReference);
        if (t.Vector)
            return `vector<${this.parseSuiType(t.Vector)}>`;
        if (t.TypeParameter !== undefined)
            return `T${t.TypeParameter}`;
        if (t.Struct) {
            let base = `${t.Struct.address}::${t.Struct.module}::${t.Struct.name}`;
            if (t.Struct.typeArguments && t.Struct.typeArguments.length > 0) {
                base += `<${t.Struct.typeArguments.map((arg) => this.parseSuiType(arg)).join(', ')}>`;
            }
            return base;
        }
        return JSON.stringify(t);
    }
    async handleGetNormalizedFunction(message) {
        const { packageId, moduleName, functionName } = message;
        try {
            const currentRpc = this.state.availableEnvs.find(e => e.alias === this.state.activeEnv)?.rpc ||
                this.state.defaultEnvs.find(e => e.alias === this.state.activeEnv)?.rpc;
            if (!currentRpc)
                throw new Error("No active RPC available");
            const result = await (0, RpcService_1.getNormalizedMoveFunction)(currentRpc, packageId, moduleName, functionName);
            const typeParams = result.typeParameters?.map((_, i) => `T${i}`) || [];
            const argTypes = result.parameters?.map((p) => this.parseSuiType(p)) || [];
            this.webview.postMessage({
                command: 'normalized-function-result',
                packageId, moduleName, functionName,
                data: { typeParams, argTypes }
            });
        }
        catch (e) {
            this.webview.postMessage({
                command: 'normalized-function-error',
                packageId, moduleName, functionName,
                error: e.message
            });
        }
    }
    async handleGetNormalizedModules(message) {
        const { packageId } = message;
        try {
            const currentRpc = this.state.availableEnvs.find(e => e.alias === this.state.activeEnv)?.rpc ||
                this.state.defaultEnvs.find(e => e.alias === this.state.activeEnv)?.rpc;
            if (!currentRpc)
                throw new Error("No active RPC available");
            const result = await (0, RpcService_1.getNormalizedMoveModulesByPackage)(currentRpc, packageId);
            const argsMappingUpdates = {};
            for (const [moduleName, mod] of Object.entries(result)) {
                if (mod && mod.exposedFunctions) {
                    for (const [funcName, funcData] of Object.entries(mod.exposedFunctions)) {
                        const typeParams = funcData.typeParameters?.map((_, i) => `T${i}`) || [];
                        const argTypes = funcData.parameters?.map((p) => this.parseSuiType(p)) || [];
                        argsMappingUpdates[`${packageId}::${moduleName}::${funcName}`] = { typeParams, argTypes };
                    }
                }
            }
            this.webview.postMessage({
                command: 'normalized-modules-result',
                packageId,
                data: argsMappingUpdates
            });
        }
        catch (e) {
            this.webview.postMessage({
                command: 'normalized-modules-error',
                packageId,
                error: e.message
            });
        }
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
                ? `${this.state.suiPath} client faucet --address ${address}`
                : `${this.state.suiPath} client faucet`;
            const output = await (0, shell_1.runCommand)(cmd);
            vscode.window.showInformationMessage("💧 Faucet requested:\n" + output);
            // Allow time for the faucet transaction to finalize, then refresh
            setTimeout(async () => {
                await this.state.refreshWallets();
                this.postMessage("refresh");
                this.setStatus("");
            }, 4000);
        }
        catch (err) {
            vscode.window.showErrorMessage("❌ Faucet failed: " + err);
        }
    }
    async handleMergeCoin(message) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const rootPath = workspaceFolder?.uri.fsPath;
        const primaryCoin = message.primaryCoin;
        const coinToMerge = message.coinToMerge;
        if (!primaryCoin || !coinToMerge) {
            vscode.window.showErrorMessage("Select both primary coin and coin to merge");
            return;
        }
        const terminal = vscode.window.createTerminal({ name: "Sui Merge Coin" });
        terminal.show(true);
        const isWindows = process.platform === 'win32';
        const mergeCmd = `${this.state.suiPath} client merge-coin --primary-coin ${primaryCoin} --coin-to-merge ${coinToMerge}`;
        const finalCmd = rootPath
            ? (isWindows
                ? `cd /d "${rootPath}" && ${mergeCmd}`
                : `cd "${rootPath}" && ${mergeCmd}`)
            : mergeCmd;
        terminal.sendText(finalCmd, true);
        vscode.window.showInformationMessage(`🪙 Merging coin ${coinToMerge} into ${primaryCoin}...`);
        // Best-effort refresh after a short delay
        setTimeout(async () => {
            await this.state.refreshWallets();
            this.postMessage("refresh");
            this.setStatus("");
        }, 4000);
    }
    async handleSplitCoin(message) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const rootPath = workspaceFolder?.uri.fsPath;
        const coinId = message.coinId;
        const amounts = message.amounts;
        const count = message.count;
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
        let splitCmd = `${this.state.suiPath} client split-coin --coin-id ${coinId}`;
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
        vscode.window.showInformationMessage(`✂️ Splitting coin ${coinId}...`);
        setTimeout(async () => {
            await this.state.refreshWallets();
            this.postMessage("refresh");
            this.setStatus("");
        }, 4000);
    }
    async handleTransferSui(message) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const rootPath = workspaceFolder?.uri.fsPath;
        const coinId = message.coinId;
        const to = message.to;
        const amount = message.amount;
        if (!coinId || !to) {
            vscode.window.showErrorMessage("Provide coin and recipient");
            return;
        }
        const terminal = vscode.window.createTerminal({ name: "Sui Transfer SUI" });
        terminal.show(true);
        const isWindows = process.platform === 'win32';
        let transferCmd = `${this.state.suiPath} client transfer-sui --to ${to} --sui-coin-object-id ${coinId}`;
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
        vscode.window.showInformationMessage(`📤 Transferring SUI from ${coinId.slice(0, 8)}... to ${to.slice(0, 6)}...`);
        setTimeout(async () => {
            await this.state.refreshWallets();
            this.postMessage("refresh");
            this.setStatus("");
        }, 4000);
    }
    async handleTransferCoin(message) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const rootPath = workspaceFolder?.uri.fsPath;
        const coinId = message.coinId;
        const coinType = message.coinType;
        const to = message.to;
        const amount = message.amount;
        if (!coinId || !to) {
            vscode.window.showErrorMessage("Provide coin and recipient");
            return;
        }
        const terminal = vscode.window.createTerminal({ name: "Sui Transfer Coin" });
        terminal.show(true);
        const isWindows = process.platform === 'win32';
        // Use transfer-sui for SUI coins, transfer for other coins
        const isSui = coinType === "0x2::sui::SUI";
        let transferCmd;
        if (isSui) {
            transferCmd = `${this.state.suiPath} client transfer-sui --to ${to} --sui-coin-object-id ${coinId}`;
            if (amount && amount.trim().length > 0) {
                transferCmd += ` --amount ${amount.trim()}`;
            }
            transferCmd += ` --gas-budget 10000000`;
        }
        else {
            // For non-SUI coins, use the generic transfer command
            transferCmd = `${this.state.suiPath} client transfer --to ${to} --object-id ${coinId}`;
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
        vscode.window.showInformationMessage(`📤 Transferring ${coinName} from ${coinId.slice(0, 8)}... to ${to.slice(0, 6)}...`);
        setTimeout(async () => {
            await this.state.refreshWallets();
            this.postMessage("refresh");
            this.setStatus("");
        }, 4000);
    }
}
exports.TransactionController = TransactionController;
//# sourceMappingURL=TransactionController.js.map