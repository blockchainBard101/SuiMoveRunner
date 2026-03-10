"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageHandler = void 0;
const PackageController_1 = require("../controllers/PackageController");
const WalletController_1 = require("../controllers/WalletController");
const EnvironmentController_1 = require("../controllers/EnvironmentController");
const TransactionController_1 = require("../controllers/TransactionController");
class MessageHandler {
    state;
    webview;
    packageController;
    walletController;
    envController;
    txController;
    constructor(state, webview) {
        this.state = state;
        this.webview = webview;
        this.packageController = new PackageController_1.PackageController(state, webview);
        this.walletController = new WalletController_1.WalletController(state, webview);
        this.envController = new EnvironmentController_1.EnvironmentController(state, webview);
        this.txController = new TransactionController_1.TransactionController(state, webview);
    }
    async handleMessage(message) {
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
            case "update-deps":
                await this.packageController.handleUpdateDeps();
                break;
            case "publish-with-deps":
                await this.packageController.handlePublishWithDeps();
                break;
            case "add-dependency":
                await this.packageController.handleAddDependency(message);
                break;
            case "dump-bytecode":
                await this.packageController.handleDumpBytecode();
                break;
            case "view-published-toml":
                await this.packageController.handleViewPublishedToml();
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
                await this.envController.handleUpdateSui(message);
                break;
            case "install-sui":
                await this.envController.handleInstallSui(message);
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
            case "dev-inspect":
                await this.txController.handleDevInspect(message);
                break;
            case "ptb-execute":
                await this.txController.handlePtbExecute(message);
                break;
            case "ptb-dev-inspect":
                await this.txController.handlePtbDevInspect(message);
                break;
            case "ptb-export":
                await this.txController.handlePtbExport(message);
                break;
            case "ptb-import":
                await this.txController.handlePtbImport();
                break;
            case "get-normalized-function":
                await this.txController.handleGetNormalizedFunction(message);
                break;
            case "get-normalized-modules":
                await this.txController.handleGetNormalizedModules(message);
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
            case "debug-log":
                console.log(`[Webview Debug] ${message.message}`);
                require('fs').appendFileSync('/home/blockchainbard/Documents/Projects/moveRunner/SuiMoveRunner/debug-add-cmd.txt', message.message + '\\n');
                break;
        }
    }
}
exports.MessageHandler = MessageHandler;
//# sourceMappingURL=MessageHandler.js.map