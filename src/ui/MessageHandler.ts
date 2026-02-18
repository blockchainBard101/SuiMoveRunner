import * as vscode from "vscode";
import { ExtensionState } from "../state/ExtensionState";
import { PackageController } from "../controllers/PackageController";
import { WalletController } from "../controllers/WalletController";
import { EnvironmentController } from "../controllers/EnvironmentController";
import { TransactionController } from "../controllers/TransactionController";

export class MessageHandler {
    private packageController: PackageController;
    private walletController: WalletController;
    private envController: EnvironmentController;
    private txController: TransactionController;

    constructor(
        private state: ExtensionState,
        private webview: vscode.Webview
    ) {
        this.packageController = new PackageController(state, webview);
        this.walletController = new WalletController(state, webview);
        this.envController = new EnvironmentController(state, webview);
        this.txController = new TransactionController(state, webview);
    }

    public async handleMessage(message: any) {
        switch (message.command) {
            // Package Operations
            case "create":
                await this.packageController.handleCreate(message);
                break;
            case "build":
                await this.packageController.handleBuild();
                break;
            case "publish":
                await this.packageController.handlePublish();
                break;
            case "upgrade":
                await this.packageController.handleUpgrade(message);
                break;
            case "test":
                await this.packageController.handleTest(message);
                break;
            case "scan-move-projects":
                await this.packageController.handleScanMoveProjects();
                break;
            case "select-move-project":
                await this.packageController.handleSelectMoveProject(message);
                break;
            case "reset-deployment":
                await this.packageController.handleResetDeployment();
                break;

            // Environment Operations
            case "switch-env":
                await this.envController.handleSwitchEnv(message);
                break;
            case "start-localnet":
                // Logic to start localnet is inside handleSwitchEnv partially, 
                // but explicit call reuse logic if needed or direct check.
                // Original code had direct check.
                await this.envController.handleSwitchEnv({ env: "localnet" });
                break;
            case "update-sui":
                await this.envController.handleUpdateSui();
                break;

            // Wallet Operations
            case "switch-wallet":
                await this.walletController.handleSwitchWallet(message);
                break;
            case "create-address":
                await this.walletController.handleCreateAddress();
                break;
            case "export-wallet":
                await this.walletController.handleExportWallet();
                break;
            case "import-wallet":
                await this.walletController.handleImportWallet(message);
                break;
            case "view-coin-portfolio":
                await this.walletController.handleViewCoinPortfolio();
                break;
            case "showGasCoinCopyNotification":
                this.walletController.handleShowGasCoinCopyNotification(message);
                break;
            case "showCopyNotification":
                this.walletController.handleShowCopyNotification();
                break;

            // Transaction Operations
            case "call":
                await this.txController.handleCall(message);
                break;
            case "get-faucet":
                await this.txController.handleGetFaucet();
                break;
            case "merge-coin":
                await this.txController.handleMergeCoin(message);
                break;
            case "split-coin":
                await this.txController.handleSplitCoin(message);
                break;
            case "transfer-sui":
                await this.txController.handleTransferSui(message);
                break;
            case "transfer-coin":
                await this.txController.handleTransferCoin(message);
                break;

            // General
            case "refresh":
                // Base controller logic to trigger state refresh
                // We can just call state refresh methods and let the provider re-render via callback
                await this.state.refreshEnvs();
                await this.state.refreshWallets();
                await this.state.checkSuiVersion();

                // Also refresh project info if needed
                // await this.state.scanForMoveProjects(); // Maybe overkill on every refresh, but safer

                await this.state.onRefreshView();
                break;
        }
    }
}
