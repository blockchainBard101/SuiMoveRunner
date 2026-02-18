import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as toml from "toml";
import { GasCoin, CoinPortfolio, MoveProject, Environment, Wallet } from "../types";
import { runCommand } from "../utils/shell";
import { safeJsonParse } from "../utils/parsing";
import { checkRpcHealth, getWalletBalanceRpc, getCoinPortfolio, makeRpcCall } from "../services/RpcService";
import { getSuiVersion, getLatestSuiVersion, compareVersions } from "../services/VersionService";
import { scanForMoveProjects } from "../services/FileService";

export class ExtensionState {
    public activeEnv: string = "";
    public availableEnvs: Environment[] = [];
    public activeWallet: string = "";
    public wallets: Wallet[] = [];
    public suiBalance: string = "0";
    public gasCoins: GasCoin[] = [];
    public coinPortfolio: CoinPortfolio | null = null;
    public moveModules: any = null;
    public suiVersion: string = "";
    public latestSuiVersion: string = "";
    public isSuiOutdated: boolean = false;
    public foundMoveProjects: MoveProject[] = [];
    public activeMoveProjectRoot: string = "";
    // Callback to refresh the UI
    public onRefreshView: () => Promise<void> = async () => { };

    public readonly defaultEnvs = [
        { alias: "localnet", rpc: "http://127.0.0.1:9000" },
        { alias: "testnet", rpc: "https://fullnode.testnet.sui.io:443" },
        { alias: "devnet", rpc: "https://fullnode.devnet.sui.io:443" },
        { alias: "mainnet", rpc: "https://fullnode.mainnet.sui.io:443" },
    ];

    constructor(private context: vscode.ExtensionContext) { }

    public async refreshWallets() {
        try {
            const addrOutput = await runCommand(`sui client addresses --json`, undefined, 5000);
            const parsed = safeJsonParse(addrOutput);
            this.activeWallet = parsed.activeAddress || "";
            this.wallets = parsed.addresses.map((arr: any[]) => ({
                name: arr[0],
                address: arr[1],
            }));
            await this.fetchWalletBalance(); // This will trigger refresh if needed
            await this.onRefreshView();
        } catch {
            this.activeWallet = "Unavailable";
            this.wallets = [];
            this.suiBalance = "0";
            await this.onRefreshView();
        }
    }

    public async fetchWalletBalance() {
        if (!this.activeWallet || this.activeWallet === "Unavailable") {
            return;
        }

        // Find RPC for current env
        const currentRpc = this.availableEnvs.find(e => e.alias === this.activeEnv)?.rpc;

        if (currentRpc) {
            try {
                const { balance, gasCoins } = await getWalletBalanceRpc(currentRpc, this.activeWallet);
                this.suiBalance = balance;
                this.gasCoins = gasCoins;
            } catch (error) {
                console.error("Failed to fetch balance:", error);
                this.suiBalance = "0";
                this.gasCoins = [];
            }
        }
    }

    public async refreshEnvs() {
        try {
            const envOutput = await runCommand(`sui client envs --json`, undefined, 5000);
            const [envsList, currentEnv] = safeJsonParse(envOutput);
            this.activeEnv = currentEnv;

            // Merge defaultEnvs with user's envs, avoiding duplicates
            const userEnvs = envsList.map((e: any) => ({
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
                    const isHealthy = await checkRpcHealth(currentRpc);
                    if (!isHealthy) {
                        console.warn(`Environment ${this.activeEnv} appears to be unhealthy`);
                    }
                }
            }
            await this.onRefreshView();
        } catch {
            this.activeEnv = "None";
            this.availableEnvs = [...this.defaultEnvs];
            await this.onRefreshView();
        }
    }

    public async checkSuiVersion() {
        try {
            const currentVersion = await getSuiVersion();
            const latestVersion = await getLatestSuiVersion();

            this.suiVersion = currentVersion || "Unknown";
            this.latestSuiVersion = latestVersion || "Unknown";

            if (currentVersion && latestVersion) {
                this.isSuiOutdated = compareVersions(currentVersion, latestVersion);
            } else {
                this.isSuiOutdated = false;
            }
            await this.onRefreshView();
        } catch (error) {
            console.error("Failed to check Sui version:", error);
            this.suiVersion = "Unknown";
            this.latestSuiVersion = "Unknown";
            this.isSuiOutdated = false;
            await this.onRefreshView();
        }
    }

    public async scanForMoveProjects() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            this.foundMoveProjects = [];
            return;
        }

        const rootPath = workspaceFolder.uri.fsPath;
        this.foundMoveProjects = await scanForMoveProjects(rootPath);

        // Set active project root to the first found project if none is set
        if (this.foundMoveProjects.length > 0 && !this.activeMoveProjectRoot) {
            this.activeMoveProjectRoot = this.foundMoveProjects[0].path;
        }
        await this.onRefreshView();
    }

    public async fetchCoinPortfolio() {
        if (!this.activeWallet || this.activeWallet === "Unavailable") {
            this.coinPortfolio = null;
            return;
        }

        const currentRpc = this.availableEnvs.find(e => e.alias === this.activeEnv)?.rpc;
        if (currentRpc) {
            try {
                this.coinPortfolio = await getCoinPortfolio(currentRpc, this.activeWallet);
            } catch (error) {
                console.error("Failed to fetch coin portfolio:", error);
                this.coinPortfolio = null;
            }
        }
        await this.onRefreshView();
    }

    public async fetchModules(pkgId: string) {
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
            const modules = await makeRpcCall(currentRpc, "sui_getNormalizedMoveModulesByPackage", [pkgId]);
            this.moveModules = modules;
        } catch (error) {
            console.error("Failed to fetch modules:", error);
            this.moveModules = null;
        }
        await this.onRefreshView();
    }

    public async isLocalnetRunning(): Promise<boolean> {
        try {
            return await checkRpcHealth("http://127.0.0.1:9000");
        } catch {
            return false;
        }
    }

    public async getChainIdentifier(): Promise<string> {
        try {
            const output = await runCommand(`sui client chain-identifier`, undefined, 5000);
            return output.trim();
        } catch (e) {
            console.error("Failed to get chain identifier:", e);
            return "";
        }
    }

    public extractPackageId(rootPath: string, activeEnv: string): string {
        let pkg = "";

        // 1. Try Move.lock (Legacy/Existing way)
        try {
            const lockPath = path.join(rootPath, "Move.lock");
            if (fs.existsSync(lockPath)) {
                const lockFile = fs.readFileSync(lockPath, "utf-8");
                const lockData = toml.parse(lockFile);
                const envSection =
                    lockData.env?.[activeEnv] || lockData.env?.default || {};
                pkg =
                    envSection["latest-published-id"] ||
                    envSection["original-published-id"] ||
                    "";
            }
        } catch (e) {
            console.error("Error reading Move.lock:", e);
        }

        if (pkg) return pkg;

        // 2. Try Published.toml (New Sui way)
        try {
            const publishedPath = path.join(rootPath, "Published.toml");
            if (fs.existsSync(publishedPath)) {
                const publishedFile = fs.readFileSync(publishedPath, "utf-8");
                const publishedData = toml.parse(publishedFile);
                pkg = publishedData.published?.[activeEnv]?.["published-at"] || "";
            }
        } catch (e) {
            console.error("Error reading Published.toml:", e);
        }

        if (pkg) return pkg;

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
        } catch (e) {
            console.error(`Error reading Pub.${activeEnv}.toml:`, e);
        }

        if (pkg) return pkg;

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
        } catch (e) {
            console.error("Error reading Move.toml:", e);
        }

        return pkg;
    }

    public extractUpgradeCap(rootPath: string, activeEnv: string, pkgId: string): string {
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
        } catch (e) {
            console.error("Error reading Published.toml for upgrade cap:", e);
        }

        if (upgradeCap) return upgradeCap;

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
        } catch (e) {
            console.error(`Error reading Pub.${activeEnv}.toml for upgrade cap:`, e);
        }

        return upgradeCap;
    }
}
