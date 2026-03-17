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
exports.SidebarProvider = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const MessageHandler_1 = require("./MessageHandler");
const index_1 = require("./templates/index");
class SidebarProvider {
    _extensionUri;
    state;
    _view;
    constructor(_extensionUri, state) {
        this._extensionUri = _extensionUri;
        this.state = state;
    }
    resolveWebviewView(webviewView, context, _token) {
        console.log("[SidebarProvider] resolveWebviewView called");
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };
        // Initialize MessageHandler
        const messageHandler = new MessageHandler_1.MessageHandler(this.state, webviewView.webview);
        webviewView.webview.onDidReceiveMessage(async (data) => {
            await messageHandler.handleMessage(data);
        });
        // Set up state refresh callback
        // State updates will trigger this, causing a re-render
        this.state.onRefreshView = async () => {
            if (this._view) {
                // Render with whatever state we currently have (non-blocking)
                await this.renderHtml(this._view.webview);
            }
        };
        // Render IMMEDIATELY with initial/empty state
        // This removes the "loading" feeling
        this.renderHtml(webviewView.webview);
        // Then trigger background fetches
        // These will complete independently and trigger onRefreshView()
        // causing the UI to populate progressively
        this.initData();
    }
    async initData() {
        console.log("[SidebarProvider] Initializing data...");
        // 1. Fetch Environments FIRST to unblock the UI (renderHtml checks for activeEnv)
        await this.state.refreshEnvs();
        // 2. Fetch Version (fast usually)
        this.state.checkSuiVersion();
        // 3. Fetch Wallets (might take a moment)
        await this.state.refreshWallets();
        // 4. Scan for projects (slowest, do last)
        await this.state.scanForMoveProjects();
        console.log("[SidebarProvider] Data initialization complete.");
    }
    async renderHtml(webview) {
        console.log(`[SidebarProvider] Rendering HTML. activeEnv: '${this.state.activeEnv}'`);
        // Immediate initial render for responsiveness if state is empty
        if (!this.state.activeEnv) {
            webview.html = this.getLoadingHtml(webview);
            return; // Important: Return here to stop further execution if loading
        }
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const rootPath = workspaceFolder?.uri.fsPath || "";
        // No blocking calls here!
        // Use active Move project root if set, otherwise check current workspace root
        const activeProjectRoot = this.state.activeMoveProjectRoot || rootPath;
        const isMoveProject = fs.existsSync(path.join(activeProjectRoot, "Move.toml"));
        let modulesHtml = "";
        let pkg = "";
        let argsMapping = {};
        pkg = this.state.extractPackageId(activeProjectRoot, this.state.activeEnv);
        // If we have a pkg but no modules, trigger fetch (debounced/idempotent ideally)
        if (pkg && !this.state.moveModules) {
            // Trigger fetch in background, don't await
            // Only fetch if we haven't already/aren't currently (simple check: module is null)
            // ideally we'd track "loadingModules" state, but for now simple null check works 
            // to progressively load.
            // However, this might loop if fetch fails. Let's rely on MessageHandler 'refresh' 
            // or explicit actions mostly. For auto-load, we can do it once.
            this.state.fetchModules(pkg);
        }
        let upgradeCapInfo = null;
        const upgradeCap = this.state.extractUpgradeCap(activeProjectRoot, this.state.activeEnv, pkg);
        if (upgradeCap && pkg) {
            upgradeCapInfo = { upgradeCap, packageId: pkg };
        }
        // Generate Modules HTML from State
        if (this.state.moveModules) {
            try {
                modulesHtml = Object.entries(this.state.moveModules)
                    .map(([modName, modData]) => {
                    const funcs = Object.entries(modData.exposedFunctions || {})
                        .map(([fname, fdata]) => {
                        const argTypes = fdata.parameters
                            .map((t) => {
                            return this.formatType(t);
                        })
                            .filter(Boolean);
                        const typeParams = fdata.typeParameters || [];
                        argsMapping[`${modName}::${fname}`] = { argTypes, typeParams };
                        return `<option value="${fname}" data-mod="${modName}" data-type-params='${JSON.stringify(typeParams)}'>${fname}</option>`;
                    })
                        .join("");
                    return `<optgroup label="${modName}">${funcs}</optgroup>`;
                })
                    .join("");
            }
            catch {
                modulesHtml = "<option disabled selected>Error processing modules</option>";
            }
        }
        else if (pkg) {
            modulesHtml = "<option disabled selected>Loading modules...</option>";
        }
        else {
            modulesHtml = "<option disabled selected>No package found</option>";
        }
        const iconUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "logo2.png"));
        const localnetRunning = true;
        const showFaucet = ["devnet", "localnet"].includes(this.state.activeEnv);
        try {
            webview.html = (0, index_1.getWebviewContent)({
                activeEnv: this.state.activeEnv,
                availableEnvs: this.state.availableEnvs,
                wallets: this.state.wallets,
                activeWallet: this.state.activeWallet,
                suiBalance: this.state.suiBalance,
                gasCoins: this.state.gasCoins,
                isMoveProject,
                pkg,
                upgradeCapInfo,
                modulesHtml,
                argsMapping,
                iconUri: iconUri.toString(),
                localnetRunning,
                showFaucet,
                suiVersion: this.state.suiVersion,
                latestSuiVersion: this.state.latestSuiVersion,
                isSuiOutdated: this.state.isSuiOutdated,
                isSuiInstalled: this.state.isSuiInstalled,
                installMethod: this.state.installMethod,
                osPlatform: this.state.osPlatform,
                coinPortfolio: this.state.coinPortfolio,
                foundMoveProjects: this.state.foundMoveProjects,
                activeMoveProjectRoot: this.state.activeMoveProjectRoot,
            });
        }
        catch (e) {
            console.error("Error rendering HTML:", e);
            webview.html = `<h3>Error rendering view</h3><p>${e}</p>`;
        }
    }
    getLoadingHtml(webview) {
        const iconUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "logo2.png"));
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Loading...</title>
            <style>
                body {
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    font-family: var(--vscode-font-family);
                }
                .loader {
                    border: 4px solid var(--vscode-widget-shadow);
                    border-top: 4px solid var(--vscode-progressBar-background);
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                    margin-bottom: 16px;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        </head>
        <body>
            <img src="${iconUri}" alt="Logo" width="50" style="margin-bottom: 20px; opacity: 0.8;">
            <div class="loader"></div>
            <div>Initializing Sui Move Runner...</div>
        </body>
        </html>`;
    }
    formatType(obj) {
        if (typeof obj === "string") {
            return obj;
        }
        // Handle primitive types that might be represented as object keys in JSON-RPC
        // e.g., {"U8": null}, {"Bool": null}, {"Address": null}
        const primitiveTypes = [
            "Bool", "U8", "U16", "U32", "U64",
            "U128", "U256", "Address", "Signer"
        ];
        for (const pt of primitiveTypes) {
            if (obj[pt] !== undefined) {
                return pt.toLowerCase(); // Returns "u8", "bool", "address", etc.
            }
        }
        if (obj.Struct && obj.Struct.name !== "TxContext") {
            return this.formatStruct(obj.Struct);
        }
        if (obj.Reference?.Struct &&
            obj.Reference.Struct.name !== "TxContext") {
            return this.formatStruct(obj.Reference.Struct);
        }
        if (obj.MutableReference?.Struct &&
            obj.MutableReference.Struct.name !== "TxContext") {
            return this.formatStruct(obj.MutableReference.Struct);
        }
        if (obj.Vector) {
            const inner = this.formatType(obj.Vector);
            return `vector<${inner || 'unknown'}>`;
        }
        if (obj.TypeParameter !== undefined) {
            return `TypeParameter`;
        }
        if (obj.Reference?.TypeParameter !== undefined) {
            return `TypeParameter`;
        }
        if (obj.MutableReference?.TypeParameter !== undefined) {
            return `TypeParameter`;
        }
        if (obj.Reference && typeof obj.Reference === 'string') {
            return obj.Reference;
        }
        if (obj.MutableReference && typeof obj.MutableReference === 'string') {
            return obj.MutableReference;
        }
        return null;
    }
    formatStruct(struct) {
        return `${struct.address}::${struct.module}::${struct.name}`;
    }
}
exports.SidebarProvider = SidebarProvider;
//# sourceMappingURL=SidebarProvider.js.map