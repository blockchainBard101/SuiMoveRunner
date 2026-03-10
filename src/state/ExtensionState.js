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
exports.ExtensionState = void 0;
const vscode = __importStar(require("vscode"));
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const toml = __importStar(require("toml"));
const shell_1 = require("../utils/shell");
const parsing_1 = require("../utils/parsing");
const RpcService_1 = require("../services/RpcService");
const VersionService_1 = require("../services/VersionService");
const FileService_1 = require("../services/FileService");
class ExtensionState {
    context;
    activeEnv = "";
    availableEnvs = [];
    activeWallet = "";
    wallets = [];
    suiBalance = "0";
    gasCoins = [];
    coinPortfolio = null;
    moveModules = null;
    suiVersion = "";
    latestSuiVersion = "";
    isSuiOutdated = false;
    isSuiInstalled = false;
    installMethod = "none";
    osPlatform = process.platform;
    suiPath = "sui"; // Default to just 'sui'
    foundMoveProjects = [];
    activeMoveProjectRoot = "";
    publishedTomlData = null;
    // Callback to refresh the UI
    onRefreshView = async () => { };
    defaultEnvs = [
        { alias: "localnet", rpc: "http://127.0.0.1:9000" },
        { alias: "testnet", rpc: "https://fullnode.testnet.sui.io:443" },
        { alias: "devnet", rpc: "https://fullnode.devnet.sui.io:443" },
        { alias: "mainnet", rpc: "https://fullnode.mainnet.sui.io:443" },
    ];
    constructor(context) {
        this.context = context;
    }
    async refreshWallets() {
        try {
            const addrOutput = await (0, shell_1.runCommand)(`${this.suiPath} client addresses --json`, undefined, 5000);
            const parsed = (0, parsing_1.safeJsonParse)(addrOutput);
            this.activeWallet = parsed.activeAddress || "";
            this.wallets = parsed.addresses.map((arr) => ({
                name: arr[0],
                address: arr[1],
            }));
            await this.fetchWalletBalance(); // This will trigger refresh if needed
            await this.onRefreshView();
        }
        catch {
            this.activeWallet = "Unavailable";
            this.wallets = [];
            this.suiBalance = "0";
            await this.onRefreshView();
        }
    }
    async fetchWalletBalance() {
        if (!this.activeWallet || this.activeWallet === "Unavailable") {
            return;
        }
        // Find RPC for current env
        const currentRpc = this.availableEnvs.find(e => e.alias === this.activeEnv)?.rpc;
        if (currentRpc) {
            try {
                const { balance, gasCoins } = await (0, RpcService_1.getWalletBalanceRpc)(currentRpc, this.activeWallet);
                this.suiBalance = balance;
                this.gasCoins = gasCoins;
            }
            catch (error) {
                console.error("Failed to fetch balance:", error);
                this.suiBalance = "0";
                this.gasCoins = [];
            }
        }
    }
    async refreshEnvs() {
        try {
            const envOutput = await (0, shell_1.runCommand)(`${this.suiPath} client envs --json`, undefined, 5000);
            const [envsList, currentEnv] = (0, parsing_1.safeJsonParse)(envOutput);
            this.activeEnv = currentEnv;
            // Merge defaultEnvs with user's envs, avoiding duplicates
            const userEnvs = envsList.map((e) => ({
                alias: e.alias,
                rpc: e.rpc,
            }));
            const merged = [...this.defaultEnvs];
            for (const env of userEnvs) {
                if (!merged.some((e) => e.alias === env.alias)) {
                    merged.push(env);
                }
            }
            this.availableEnvs = merged;
            // Verify current environment is healthy via RPC
            if (this.activeEnv && this.activeEnv !== "None") {
                const currentRpc = this.availableEnvs.find(e => e.alias === this.activeEnv)?.rpc;
                if (currentRpc) {
                    const isHealthy = await (0, RpcService_1.checkRpcHealth)(currentRpc);
                    if (!isHealthy) {
                        console.warn(`Environment ${this.activeEnv} appears to be unhealthy`);
                    }
                }
            }
            await this.onRefreshView();
        }
        catch {
            this.activeEnv = "None";
            this.availableEnvs = [...this.defaultEnvs];
            await this.onRefreshView();
        }
    }
    async checkSuiVersion() {
        try {
            const currentVersion = await (0, VersionService_1.getSuiVersion)();
            this.isSuiInstalled = !!currentVersion;
            if (this.isSuiInstalled) {
                await this.detectInstallMethod();
                const latestVersion = await (0, VersionService_1.getLatestSuiVersion)();
                this.suiVersion = currentVersion || "Unknown";
                this.latestSuiVersion = latestVersion || "Unknown";
                if (currentVersion && latestVersion) {
                    this.isSuiOutdated = (0, VersionService_1.compareVersions)(currentVersion, latestVersion);
                }
                else {
                    this.isSuiOutdated = false;
                }
            }
            else {
                this.suiVersion = "";
                this.latestSuiVersion = "";
                this.isSuiOutdated = false;
                this.installMethod = "none";
            }
            await this.onRefreshView();
        }
        catch (error) {
            console.error("Failed to check Sui version:", error);
            this.suiVersion = "Unknown";
            this.latestSuiVersion = "Unknown";
            this.isSuiOutdated = false;
            await this.onRefreshView();
        }
    }
    async detectInstallMethod() {
        const expandHome = (p) => p.startsWith('~') ? p.replace('~', os.homedir()) : p;
        const checkPaths = [
            'sui',
            expandHome('~/.cargo/bin/sui'),
            '/opt/homebrew/bin/sui',
            '/usr/local/bin/sui'
        ];
        for (const path of checkPaths) {
            try {
                const isWindows = process.platform === 'win32';
                const whichCmd = isWindows ? `where ${path}` : `which ${path}`;
                const suiPath = (await (0, shell_1.runCommand)(whichCmd, undefined, 2000)).trim();
                if (suiPath.includes('.suiup')) {
                    this.installMethod = "suiup";
                }
                else if (suiPath.includes('homebrew') || suiPath.includes('Cellar')) {
                    this.installMethod = "homebrew";
                }
                else if (suiPath.includes('Chocolatey')) {
                    this.installMethod = "chocolatey";
                }
                else if (suiPath.includes('.cargo/bin')) {
                    this.installMethod = "source";
                }
                else {
                    this.installMethod = "binary";
                }
                this.suiPath = path;
                return; // Found it
            }
            catch {
                // Try next path
            }
        }
        this.installMethod = "none";
    }
    async scanForMoveProjects() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            this.foundMoveProjects = [];
            return;
        }
        const rootPath = workspaceFolder.uri.fsPath;
        this.foundMoveProjects = await (0, FileService_1.scanForMoveProjects)(rootPath);
        // Set active project root to the first found project if none is set
        if (this.foundMoveProjects.length > 0 && !this.activeMoveProjectRoot) {
            this.activeMoveProjectRoot = this.foundMoveProjects[0].path;
        }
        await this.onRefreshView();
    }
    async fetchCoinPortfolio() {
        if (!this.activeWallet || this.activeWallet === "Unavailable") {
            this.coinPortfolio = null;
            return;
        }
        const currentRpc = this.availableEnvs.find(e => e.alias === this.activeEnv)?.rpc;
        if (currentRpc) {
            try {
                this.coinPortfolio = await (0, RpcService_1.getCoinPortfolio)(currentRpc, this.activeWallet);
            }
            catch (error) {
                console.error("Failed to fetch coin portfolio:", error);
                this.coinPortfolio = null;
            }
        }
        await this.onRefreshView();
    }
    async fetchModules(pkgId) {
        if (!pkgId) {
            this.moveModules = null;
            await this.onRefreshView();
            return;
        }
        // Find RPC for current env
        const currentRpc = this.availableEnvs.find(e => e.alias === this.activeEnv)?.rpc ||
            this.defaultEnvs.find(e => e.alias === this.activeEnv)?.rpc ||
            "https://fullnode.testnet.sui.io:443";
        try {
            // Use RPC helper function directly here
            const modules = await (0, RpcService_1.makeRpcCall)(currentRpc, "sui_getNormalizedMoveModulesByPackage", [pkgId]);
            this.moveModules = modules;
        }
        catch (error) {
            console.error("Failed to fetch modules:", error);
            this.moveModules = null;
        }
        await this.onRefreshView();
    }
    async isLocalnetRunning() {
        try {
            return await (0, RpcService_1.checkRpcHealth)("http://127.0.0.1:9000");
        }
        catch {
            return false;
        }
    }
    async getChainIdentifier() {
        try {
            const output = await (0, shell_1.runCommand)(`${this.suiPath} client chain-identifier`, undefined, 5000);
            return output.trim();
        }
        catch (e) {
            console.error("Failed to get chain identifier:", e);
            return "";
        }
    }
    extractPackageId(rootPath, activeEnv) {
        let pkg = "";
        // 1. Try Move.lock (Legacy/Existing way)
        try {
            const lockPath = path.join(rootPath, "Move.lock");
            if (fs.existsSync(lockPath)) {
                const lockFile = fs.readFileSync(lockPath, "utf-8");
                const lockData = toml.parse(lockFile);
                const envSection = lockData.env?.[activeEnv] || lockData.env?.default || {};
                pkg =
                    envSection["latest-published-id"] ||
                        envSection["original-published-id"] ||
                        "";
            }
        }
        catch (e) {
            console.error("Error reading Move.lock:", e);
        }
        if (pkg)
            return pkg;
        // 2. Try Published.toml (New Sui way)
        try {
            const publishedPath = path.join(rootPath, "Published.toml");
            if (fs.existsSync(publishedPath)) {
                const publishedFile = fs.readFileSync(publishedPath, "utf-8");
                const publishedData = toml.parse(publishedFile);
                pkg = publishedData.published?.[activeEnv]?.["published-at"] || "";
            }
        }
        catch (e) {
            console.error("Error reading Published.toml:", e);
        }
        if (pkg)
            return pkg;
        // 3. Try Ephemeral Pub.<env>.toml (New Sui way for devnet/localnet)
        try {
            const pubPath = path.join(rootPath, `Pub.${activeEnv}.toml`);
            if (fs.existsSync(pubPath)) {
                const pubFile = fs.readFileSync(pubPath, "utf-8");
                const pubData = toml.parse(pubFile);
                // Ephemeral files use [[published]] array
                if (Array.isArray(pubData.published)) {
                    // Find the one that matches our rootPath if possible, otherwise take latest
                    const latest = pubData.published[pubData.published.length - 1];
                    pkg = latest?.["published-at"] || "";
                }
            }
        }
        catch (e) {
            console.error(`Error reading Pub.${activeEnv}.toml:`, e);
        }
        if (pkg)
            return pkg;
        // 3. Try Move.toml (Fallback to addresses)
        try {
            const moveTomlPath = path.join(rootPath, "Move.toml");
            if (fs.existsSync(moveTomlPath)) {
                const moveFile = fs.readFileSync(moveTomlPath, "utf-8");
                const moveData = toml.parse(moveFile);
                const pkgName = moveData.package?.name;
                if (pkgName && moveData.addresses?.[pkgName]) {
                    const addr = moveData.addresses[pkgName];
                    if (addr && addr !== "0x0") {
                        pkg = addr;
                    }
                }
            }
        }
        catch (e) {
            console.error("Error reading Move.toml:", e);
        }
        return pkg;
    }
    extractUpgradeCap(rootPath, activeEnv, pkgId) {
        let upgradeCap = "";
        // 1. Try Published.toml (New Sui way)
        try {
            const publishedPath = path.join(rootPath, "Published.toml");
            if (fs.existsSync(publishedPath)) {
                const publishedFile = fs.readFileSync(publishedPath, "utf-8");
                const publishedData = toml.parse(publishedFile);
                const envData = publishedData.published?.[activeEnv];
                if (envData?.["published-at"] === pkgId || !pkgId) {
                    upgradeCap = envData?.["upgrade-capability"] || "";
                }
            }
        }
        catch (e) {
            console.error("Error reading Published.toml for upgrade cap:", e);
        }
        if (upgradeCap)
            return upgradeCap;
        // 2. Try Ephemeral Pub.<env>.toml
        try {
            const pubPath = path.join(rootPath, `Pub.${activeEnv}.toml`);
            if (fs.existsSync(pubPath)) {
                const pubFile = fs.readFileSync(pubPath, "utf-8");
                const pubData = toml.parse(pubFile);
                if (Array.isArray(pubData.published)) {
                    const latest = pubData.published[pubData.published.length - 1];
                    if (latest?.["published-at"] === pkgId || !pkgId) {
                        upgradeCap = latest?.["upgrade-cap"] || "";
                    }
                }
            }
        }
        catch (e) {
            console.error(`Error reading Pub.${activeEnv}.toml for upgrade cap:`, e);
        }
        return upgradeCap;
    }
}
exports.ExtensionState = ExtensionState;
//# sourceMappingURL=ExtensionState.js.map