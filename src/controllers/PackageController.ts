import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as toml from "toml";
import { exec } from "child_process";
import * as process from "process";
import { BaseController } from "./BaseController";
import { runCommand } from "../utils/shell";
import { waitForFolder } from "../services/FileService";
import { surgicalUpdateToml } from "../utils/parsing";

export class PackageController extends BaseController {

    async handleCreate(message: any) {
        const name = message.packageName;
        if (!name) {
            return;
        }

        const packageNameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
        if (!packageNameRegex.test(name)) {
            vscode.window.showErrorMessage(
                "Invalid package name. Please use only letters, numbers, and underscores, and start with a letter."
            );
            this.postMessage("showWarning");
            return;
        }

        let basePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!basePath) {
            const folderUris = await vscode.window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                openLabel: "Select folder to create Move package in",
            });
            if (!folderUris || folderUris.length === 0) {
                return;
            }
            basePath = folderUris[0].fsPath;
        }

        const targetPath = path.join(basePath, name);
        try {
            await runCommand(`${this.state.suiPath} move new ${name}`, basePath);
            await waitForFolder(targetPath, 2000);
            vscode.commands.executeCommand(
                "vscode.openFolder",
                vscode.Uri.file(targetPath),
                true
            );
        } catch (err) {
            vscode.window.showErrorMessage(
                `❌ Failed to create package: ${err}`
            );
        }
    }

    async handleBuild() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage("No workspace open");
            return;
        }
        const rootPath = this.state.activeMoveProjectRoot || workspaceFolder.uri.fsPath;

        // On devnet/localnet (ephemeral networks), build against testnet's environment
        // definition for stable chain resolution. The local/devnet chain-id changes
        // on each genesis, so using testnet as the env reference is the recommended approach.
        const activeEnv = this.state.activeEnv;
        const isEphemeralEnv = activeEnv === "devnet" || activeEnv === "localnet";
        const buildFlags = isEphemeralEnv ? " -e testnet" : "";
        const buildSuiCmd = `${this.state.suiPath} move build${buildFlags}`;

        // Ensure chain-id is in Move.toml [environments] before building
        const moveTomlPath = path.join(rootPath, "Move.toml");
        if (isEphemeralEnv && fs.existsSync(moveTomlPath)) {
            try {
                let moveTomlContent = fs.readFileSync(moveTomlPath, "utf-8");
                const chainId = await this.state.getChainIdentifier();
                if (chainId) {
                    const result = surgicalUpdateToml(moveTomlContent, "environments", activeEnv, chainId, true);
                    if (result.changed) {
                        fs.writeFileSync(moveTomlPath, result.content);
                    }
                }
            } catch (err) {
                console.warn(`⚠️ Could not update Move.toml chain-id before build: ${err}`);
            }
        }

        const terminal = vscode.window.createTerminal({
            name: "Sui Move Build",
        });
        terminal.show(true);
        const isWindows = process.platform === 'win32';
        const buildCmd = isWindows
            ? `cd /d "${rootPath}" && ${buildSuiCmd}`
            : `cd "${rootPath}" && ${buildSuiCmd}`;
        terminal.sendText(buildCmd, true);

        const envNote = isEphemeralEnv ? ` (resolving against testnet env for ${activeEnv})` : "";
        vscode.window.showInformationMessage(
            `🛠️ Running '${buildSuiCmd}' in ${rootPath}${envNote}...`
        );
    }

    async handlePublish() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage("No workspace open");
            return;
        }
        const rootPath = this.state.activeMoveProjectRoot || workspaceFolder.uri.fsPath;
        const activeEnv = this.state.activeEnv;
        const isEphemeralEnv = activeEnv === "devnet" || activeEnv === "localnet";

        const outputChannel = vscode.window.createOutputChannel("Sui Move Publish");
        outputChannel.show(true);

        if (isEphemeralEnv) {
            outputChannel.appendLine(
                `🌐 Environment: ${activeEnv} (ephemeral network — wiped weekly)\n` +
                `📋 Using '${this.state.suiPath} client test-publish -e ${activeEnv}' instead of '${this.state.suiPath} client publish'.\n` +
                `⚠️  Publication info will NOT be saved to Move.toml to avoid polluting\n` +
                `    Published.toml for others who depend on it.\n`
            );
        } else {
            outputChannel.appendLine(`Running '${this.state.suiPath} client publish' in ${rootPath}...\n`);
        }

        try {
            // Pre-publish: Ensure chain-id is in [environments] section of Move.toml
            const moveTomlPath = path.join(rootPath, "Move.toml");
            if (fs.existsSync(moveTomlPath)) {
                try {
                    let moveTomlContent = fs.readFileSync(moveTomlPath, "utf-8");
                    let changed = false;

                    // Inject chain-id into [environments] section
                    if (activeEnv) {
                        const chainId = await this.state.getChainIdentifier();
                        if (chainId) {
                            const result = surgicalUpdateToml(moveTomlContent, "environments", activeEnv, chainId, true);
                            if (result.changed) {
                                moveTomlContent = result.content;
                                outputChannel.appendLine(`✅ Added/Updated environment '${activeEnv}' with chain-id ${chainId} in Move.toml`);
                                changed = true;
                            }
                        }
                    }

                    if (changed) {
                        fs.writeFileSync(moveTomlPath, moveTomlContent);
                        // Small delay to ensure OS filesystem flush
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                } catch (err) {
                    outputChannel.appendLine(`⚠️ Failed to update Move.toml before publishing: ${err}`);
                }
            }

            const isWindows = process.platform === 'win32';

            // Choose command based on environment:
            //   devnet/localnet → test-publish (ephemeral, no permanent Published.toml entry)
            //     --build-env testnet: resolve deps from testnet (stable), publish to active CLI env
            //   testnet/mainnet → publish (permanent, updates Move.toml)
            const publishCmd = isEphemeralEnv
                ? `${this.state.suiPath} client test-publish --build-env testnet`
                : `${this.state.suiPath} client publish`;

            outputChannel.appendLine(`Running '${publishCmd}' in ${rootPath}...\n`);

            const publishProcess = exec(publishCmd, {
                cwd: rootPath,
                shell: isWindows ? 'cmd.exe' : undefined,
            });
            let fullOutput = "";

            publishProcess.stdout?.on("data", (data) => {
                fullOutput += data.toString();
                outputChannel.append(data.toString());
            });

            publishProcess.stderr?.on("data", (data) => {
                fullOutput += data.toString();
                outputChannel.append(data.toString());
            });

            publishProcess.on("close", async (code) => {
                if (code === 0) {
                    if (isEphemeralEnv) {
                        // Ephemeral publish succeeded — do NOT update Move.toml published-at
                        // or addresses, as this network will be wiped and others should not
                        // depend on these addresses.
                        outputChannel.appendLine(
                            `\n✅ test-publish succeeded on ${activeEnv}.\n` +
                            `ℹ️  Move.toml and Published.toml have NOT been updated (ephemeral network).\n` +
                            `   Package is available on ${activeEnv} until the next genesis.`
                        );
                        vscode.window.showInformationMessage(
                            `✅ test-publish succeeded on ${activeEnv}. Move.toml unchanged (ephemeral).`
                        );

                        // Ensure Pub.*.toml is in .gitignore
                        this.ensureEphemeralGitignore(rootPath, outputChannel);
                    } else {
                        vscode.window.showInformationMessage(
                            '✅ Publish succeeded, see "Sui Move Publish" output.'
                        );

                        // Extract UpgradeCap ObjectID
                        const lines = fullOutput.split("\n");
                        let upgradeCapId = "";

                        for (let i = 0; i < lines.length; i++) {
                            if (lines[i].includes("ObjectType: 0x2::package::UpgradeCap")) {
                                for (let j = i - 1; j >= 0; j--) {
                                    const idMatch = lines[j].match(/ObjectID:\s*(0x[a-fA-F0-9]+)/);
                                    if (idMatch) {
                                        upgradeCapId = idMatch[1];
                                        break;
                                    }
                                }
                                if (upgradeCapId) { break; }
                            }
                        }

                        // Extract package ID from Move.lock / Published.toml
                        let pkg = this.state.extractPackageId(rootPath, activeEnv);

                        // Post-publish: Update Move.toml with new package ID (Surgical)
                        if (pkg && fs.existsSync(moveTomlPath)) {
                            try {
                                let newContent = fs.readFileSync(moveTomlPath, "utf-8");
                                const moveData = toml.parse(newContent);
                                const pkgName = moveData.package?.name;
                                let postChanged = false;

                                // Update published-at in [package] section
                                const pubResult = surgicalUpdateToml(newContent, "package", "published-at", pkg, true);
                                if (pubResult.changed) {
                                    newContent = pubResult.content;
                                    postChanged = true;
                                }

                                // Update package address in [addresses] section (Only if exists)
                                if (pkgName) {
                                    const addrResult = surgicalUpdateToml(newContent, "addresses", pkgName, pkg, false);
                                    if (addrResult.changed) {
                                        newContent = addrResult.content;
                                        postChanged = true;
                                    }
                                }

                                if (postChanged) {
                                    fs.writeFileSync(moveTomlPath, newContent);
                                    outputChannel.appendLine(`✅ Updated Move.toml: published-at = ${pkg}${pkgName ? `, ${pkgName} = ${pkg}` : ""}`);
                                }
                            } catch (err) {
                                outputChannel.appendLine(`⚠️ Failed to update Move.toml after publishing: ${err}`);
                            }
                        }

                        if (!upgradeCapId || !pkg) {
                            vscode.window.showWarningMessage(
                                "⚠️ Could not find UpgradeCap or package ID in publish output."
                            );
                        }
                    }

                    // Trigger a refresh/re-render via message
                    this.postMessage("refresh");
                } else {
                    vscode.window.showErrorMessage(
                        `❌ Publish failed with exit code ${code}, see "Sui Move Publish" output.`
                    );
                }
            });
        } catch (err) {
            vscode.window.showErrorMessage(`❌ Failed to run publish: ${err}`);
        }
    }

    async handleUpgrade(message: any) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage("No workspace open");
            return;
        }
        const rootPath = this.state.activeMoveProjectRoot || workspaceFolder.uri.fsPath;
        const upgradeTomlPath = path.join(rootPath, "upgrade.toml");

        if (!fs.existsSync(upgradeTomlPath)) {
            vscode.window.showErrorMessage(
                "⚠️ No upgrade capability found. Please publish first."
            );
            return;
        }

        let upgradeCapInfo;
        let upgradeData: any;

        try {
            const content = fs.readFileSync(upgradeTomlPath, "utf-8");
            upgradeData = toml.parse(content);

            // Get upgrade info for current environment
            const envData =
                upgradeData.environments?.[this.state.activeEnv] || upgradeData.upgrade; // fallback to old format

            if (!envData) {
                vscode.window.showErrorMessage(
                    `⚠️ No upgrade capability found for environment: ${this.state.activeEnv}`
                );
                return;
            }

            upgradeCapInfo = {
                upgradeCap: envData.upgrade_cap || envData.upgradeCap,
                packageId: envData.package_id || envData.packageId,
            };
        } catch {
            vscode.window.showErrorMessage("⚠️ Invalid upgrade.toml content.");
            return;
        }

        const outputChannel =
            vscode.window.createOutputChannel("Sui Move Upgrade");
        outputChannel.show(true);
        outputChannel.appendLine(
            `Running '${this.state.suiPath} client upgrade --upgrade-capability ${upgradeCapInfo.upgradeCap}' in ${rootPath}...\n`
        );

        try {
            const isWindows = process.platform === 'win32';
            const upgradeProcess = exec(
                `${this.state.suiPath} client upgrade --upgrade-capability ${upgradeCapInfo.upgradeCap}`,
                {
                    cwd: rootPath,
                    shell: isWindows ? 'cmd.exe' : undefined,
                }
            );

            let fullOutput = "";

            upgradeProcess.stdout?.on("data", (data) => {
                fullOutput += data.toString();
                outputChannel.append(data.toString());
            });

            upgradeProcess.stderr?.on("data", (data) => {
                fullOutput += data.toString();
                outputChannel.append(data.toString());
            });

            upgradeProcess.on("close", async (code) => {
                if (code === 0) {
                    vscode.window.showInformationMessage(
                        '✅ Upgrade succeeded, see "Sui Move Upgrade" output.'
                    );

                    // Extract new UpgradeCap ObjectID from output
                    const lines = fullOutput.split("\n");
                    let newUpgradeCapId = "";

                    for (let i = 0; i < lines.length; i++) {
                        if (
                            lines[i].includes("ObjectType: 0x2::package::UpgradeCap")
                        ) {
                            for (let j = i - 1; j >= 0; j--) {
                                const idMatch = lines[j].match(
                                    /ObjectID:\s*(0x[a-fA-F0-9]+)/
                                );
                                if (idMatch) {
                                    newUpgradeCapId = idMatch[1];
                                    break;
                                }
                            }
                            if (newUpgradeCapId) {
                                break;
                            }
                        }
                    }

                    // Extract latest package ID from multiple sources
                    let pkg = this.state.extractPackageId(rootPath, this.state.activeEnv);

                    if (!newUpgradeCapId || !pkg) {
                        vscode.window.showWarningMessage(
                            "⚠️ Could not find UpgradeCap or package ID in upgrade output."
                        );
                    }

                    this.postMessage("refresh");
                } else {
                    vscode.window.showErrorMessage(
                        `❌ Upgrade failed with exit code ${code}, see "Sui Move Upgrade" output.`
                    );
                }
            });
        } catch (err) {
            vscode.window.showErrorMessage(`❌ Failed to run upgrade: ${err}`);
        }
    }

    async handleTest(message: any) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage("No workspace open");
            return;
        }
        const rootPath = this.state.activeMoveProjectRoot || workspaceFolder.uri.fsPath;
        const funcName = message.functionName?.trim() || "";

        const terminal = vscode.window.createTerminal({
            name: "Sui Move Test",
        });
        terminal.show(true);

        let cmd = `${this.state.suiPath} move test`;
        if (funcName) {
            cmd += ` ${funcName}`;
        }
        const isWindows = process.platform === 'win32';
        const testCmd = isWindows
            ? `cd /d "${rootPath}" && ${cmd}`
            : `cd "${rootPath}" && ${cmd}`;
        terminal.sendText(testCmd, true);

        vscode.window.showInformationMessage(
            `🧪 Running '${cmd}' in ${rootPath}...`
        );
    }

    async handleScanMoveProjects() {
        try {
            this.setStatus("Scanning for Move projects...");

            await this.state.scanForMoveProjects();

            this.setStatus("");

            // Trigger re-render in UI
            this.postMessage("refresh");

            if (this.state.foundMoveProjects.length === 0) {
                vscode.window.showInformationMessage(
                    "No Move projects found in the current workspace."
                );
            } else {
                vscode.window.showInformationMessage(
                    `Found ${this.state.foundMoveProjects.length} Move project(s). Check the sidebar to select one.`
                );
            }
        } catch (err) {
            this.setStatus("");
            vscode.window.showErrorMessage(`❌ Failed to scan for Move projects: ${err}`);
        }
    }

    async handleSelectMoveProject(message: any) {
        const projectPath = message.projectPath;
        if (!projectPath) {
            vscode.window.showErrorMessage("No project path provided");
            this.postMessage("move-project-error", { message: "No project path provided" });
            return;
        }

        try {
            this.state.activeMoveProjectRoot = projectPath;

            const projectName = this.state.foundMoveProjects.find(p => p.path === projectPath)?.name || "Unknown";

            // Trigger refresh view
            await this.state.onRefreshView();

            // After HTML is set, the DOM is replaced and button is recreated in default state
            // Send a message to keep the button in loading state
            this.postMessage("move-project-loading", { message: "Loading package..." });

            // Add a delay to ensure webview has fully rendered and processed the loading message
            await new Promise(resolve => setTimeout(resolve, 500));

            // Send success message after render and rendering delay completes
            this.postMessage("move-project-selected", { message: `Project "${projectName}" selected successfully` });

            vscode.window.showInformationMessage(
                `✅ Selected Move project: ${projectName}`
            );
        } catch (err) {
            vscode.window.showErrorMessage(`❌ Failed to select Move project: ${err}`);
            this.postMessage("move-project-error", { message: `Failed to select project: ${err}` });
        }
    }

    async handleResetDeployment() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage("No workspace open");
            return;
        }
        const rootPath = this.state.activeMoveProjectRoot || workspaceFolder.uri.fsPath;

        // WARNING confirmation
        const warningAction = await vscode.window.showWarningMessage(
            "⚠️ Danger Zone: Reset Deployment\n\n" +
            "This will DELETE 'Move.lock' and 'Publish.toml', and remove published addresses from 'Move.toml'.\n\n" +
            "Are you sure you want to proceed?",
            { modal: true },
            "Yes, Reset Deployment",
            "Cancel"
        );

        if (warningAction !== "Yes, Reset Deployment") {
            this.setStatus("");
            return;
        }

        this.setStatus("Resetting deployment files...");

        try {
            // 1. Delete Move.lock
            const moveLockPath = path.join(rootPath, "Move.lock");
            if (fs.existsSync(moveLockPath)) {
                fs.unlinkSync(moveLockPath);
                console.log(`Deleted ${moveLockPath}`);
            }

            // 2. Delete Published.toml (and Publish.toml just in case)
            const publishedTomlPath = path.join(rootPath, "Published.toml");
            if (fs.existsSync(publishedTomlPath)) {
                fs.unlinkSync(publishedTomlPath);
                console.log(`Deleted ${publishedTomlPath}`);
            }
            const publishTomlPath = path.join(rootPath, "Publish.toml"); // Check for typo variant
            if (fs.existsSync(publishTomlPath)) {
                fs.unlinkSync(publishTomlPath);
                console.log(`Deleted ${publishTomlPath}`);
            }

            // 3. Delete Ephemeral Pub.<env>.toml
            const envsToClean = [this.state.activeEnv, "devnet", "localnet", "testnet", "mainnet"];
            for (const env of envsToClean) {
                const pubPath = path.join(rootPath, `Pub.${env}.toml`);
                if (fs.existsSync(pubPath)) {
                    fs.unlinkSync(pubPath);
                    console.log(`Deleted ${pubPath}`);
                }
            }

            // 4. Update Move.toml (Surgical removal)
            const moveTomlPath = path.join(rootPath, "Move.toml");
            if (fs.existsSync(moveTomlPath)) {
                let content = fs.readFileSync(moveTomlPath, "utf-8");
                let changed = false;

                const moveData = toml.parse(content);
                const pkgName = moveData.package?.name;

                // Helper to remove a key from a section
                const removeKey = (section: string, key: string) => {
                    const sectionRegex = new RegExp(`\\[${section}\\][\\s\\S]*?(?=\\[|$)`);
                    const match = content.match(sectionRegex);
                    if (match) {
                        const sectionContent = match[0];
                        const keyRegex = new RegExp(`^\\s*${key}\\s*=.*$`, "m");
                        if (keyRegex.test(sectionContent)) {
                            const newSectionContent = sectionContent.replace(keyRegex, "");
                            content = content.replace(sectionContent, newSectionContent);
                            changed = true;
                        }
                    }
                };

                if (pkgName) {
                    // Remove package address from [addresses]
                    removeKey("addresses", pkgName);
                }

                // Remove published-at from [package]
                removeKey("package", "published-at");

                if (changed) {
                    // Clean up empty lines potentially left behind
                    content = content.replace(/^\s*[\r\n]/gm, "");
                    fs.writeFileSync(moveTomlPath, content);
                    console.log("Updated Move.toml");
                }
            }

            await this.state.refreshWallets();
            this.postMessage("refresh");

            vscode.window.showInformationMessage("✅ Deployment state has been reset.");
            this.setStatus("Reset complete.");

        } catch (err) {
            vscode.window.showErrorMessage(`❌ Failed to reset deployment: ${err}`);
            this.setStatus("Reset failed.");
        }
    }

    private getEffectiveRootPath(): string | undefined {
        if (this.state.activeMoveProjectRoot) {
            return this.state.activeMoveProjectRoot;
        }
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (workspaceFolder) {
            return workspaceFolder.uri.fsPath;
        }
        vscode.window.showErrorMessage("No workspace or Move project selected.");
        return undefined;
    }

    public async handleUpdateDeps() {
        const rootPath = this.getEffectiveRootPath();
        if (!rootPath) return;

        this.setStatus("Updating dependencies...");
        const terminal = vscode.window.createTerminal("Sui Move Update Deps");
        terminal.show();
        const isWindows = process.platform === 'win32';
        const cdCmd = isWindows ? `cd /d "${rootPath}"` : `cd "${rootPath}"`;
        terminal.sendText(`${cdCmd} && ${this.state.suiPath} move update-deps`);
        this.setStatus("Ready");
    }

    public async handlePublishWithDeps() {
        const activeEnv = this.state.activeEnv;
        if (activeEnv !== "devnet" && activeEnv !== "localnet") {
            vscode.window.showErrorMessage("Publish with dependencies is only for ephemeral networks (devnet/localnet).");
            return;
        }

        const rootPath = this.getEffectiveRootPath();
        if (!rootPath) return;

        const outputChannel = vscode.window.createOutputChannel("Sui Move Publish (w/ Deps)");
        outputChannel.show(true);
        outputChannel.appendLine(`🌐 Environment: ${activeEnv} (ephemeral)\n` +
            `🚀 Running 'sui client test-publish --build-env testnet --publish-unpublished-deps'...\n`);

        const isWindows = process.platform === 'win32';
        const cmd = `${this.state.suiPath} client test-publish --build-env testnet --publish-unpublished-deps`;

        const publishProc = exec(cmd, { cwd: rootPath, shell: isWindows ? 'cmd.exe' : undefined });

        publishProc.stdout?.on("data", (data: any) => outputChannel.append(data.toString()));
        publishProc.stderr?.on("data", (data: any) => outputChannel.append(data.toString()));

        publishProc.on("close", (code: number | null) => {
            if (code === 0) {
                outputChannel.appendLine(`\n✅ Publish with dependencies succeeded.`);
                this.ensureEphemeralGitignore(rootPath, outputChannel);
                vscode.window.showInformationMessage("✅ Publish with dependencies succeeded.");
            } else {
                outputChannel.appendLine(`\n❌ Publish with dependencies failed (code ${code}).`);
                vscode.window.showErrorMessage("❌ Publish with dependencies failed.");
            }
            this.state.refreshWallets();
            this.postMessage("refresh");
        });
    }

    public async handleAddDependency(message: any) {
        const { depType, name, value, network, subdir, rev } = message;
        const rootPath = this.getEffectiveRootPath();
        if (!rootPath) return;

        const moveTomlPath = path.join(rootPath, "Move.toml");
        if (!fs.existsSync(moveTomlPath)) {
            vscode.window.showErrorMessage(`Move.toml not found in ${rootPath}`);
            return;
        }

        try {
            let content = fs.readFileSync(moveTomlPath, "utf-8");
            let depValueStr: string;

            switch (depType) {
                case "mvr":
                    const mvrParts = [`r.mvr = "${value}"`];
                    if (network) mvrParts.push(`network = "${network}"`);
                    depValueStr = `{ ${mvrParts.join(", ")} }`;
                    break;
                case "git":
                    const gitParts = [`git = "${value}"`];
                    if (subdir) gitParts.push(`subdir = "${subdir}"`);
                    if (rev) gitParts.push(`rev = "${rev}"`);
                    depValueStr = `{ ${gitParts.join(", ")} }`;
                    break;
                case "local":
                    depValueStr = `{ local = "${value}" }`;
                    break;
                case "system":
                    depValueStr = `"${value}"`; // System deps are usually just a version string or name
                    break;
                default:
                    return;
            }

            const result = surgicalUpdateToml(content, "dependencies", name, depValueStr, false);
            if (result.changed) {
                fs.writeFileSync(moveTomlPath, result.content);
                vscode.window.showInformationMessage(`✅ Added ${depType} dependency '${name}' to Move.toml`);
                this.setStatus(`Dependency ${name} added.`);
            } else {
                vscode.window.showInformationMessage(`ℹ️ Dependency '${name}' already exists in Move.toml with the same value.`);
            }
        } catch (err) {
            vscode.window.showErrorMessage(`❌ Failed to add dependency: ${err}`);
        }
    }

    public async handleDumpBytecode() {
        const rootPath = this.getEffectiveRootPath();
        if (!rootPath) return;

        const activeEnv = this.state.activeEnv;
        const pubFile = `Pub.${activeEnv}.toml`;

        // The --build-env flag is required if the publication file doesn't exist.
        // For ephemeral networks (devnet/localnet), we use 'testnet' for resolution.
        // For others, we use the environment name itself.
        const isEphemeralEnv = activeEnv === "devnet" || activeEnv === "localnet";
        const envForBuild = isEphemeralEnv ? "testnet" : activeEnv;
        const envFlag = ` --build-env ${envForBuild}`;

        const cmd = `${this.state.suiPath} move build --dump-bytecode-as-base64 --pubfile-path ${pubFile}${envFlag}`;

        const terminal = vscode.window.createTerminal("Sui Move Dump Bytecode");
        terminal.show();
        const isWindows = process.platform === 'win32';
        const cdCmd = isWindows ? `cd /d "${rootPath}"` : `cd "${rootPath}"`;
        terminal.sendText(`${cdCmd} && ${cmd}`);
    }

    public async handleViewPublishedToml() {
        const rootPath = this.getEffectiveRootPath();
        if (!rootPath) return;

        const publishedTomlPath = path.join(rootPath, "Published.toml");
        if (!fs.existsSync(publishedTomlPath)) {
            this.state.publishedTomlData = null;
            await this.state.onRefreshView();
            return;
        }

        try {
            const content = fs.readFileSync(publishedTomlPath, "utf-8");
            const data = toml.parse(content);
            this.state.publishedTomlData = data;
            await this.state.onRefreshView();
        } catch (err) {
            vscode.window.showErrorMessage(`❌ Failed to parse Published.toml: ${err}`);
        }
    }

    private ensureEphemeralGitignore(rootPath: string, outputChannel: vscode.OutputChannel) {
        const gitignorePath = path.join(rootPath, ".gitignore");
        const pattern = "Pub.*.toml";

        try {
            let content = "";
            if (fs.existsSync(gitignorePath)) {
                content = fs.readFileSync(gitignorePath, "utf-8");
            }

            if (!content.includes(pattern)) {
                const prefix = content.endsWith("\n") || content === "" ? "" : "\n";
                fs.appendFileSync(gitignorePath, `${prefix}${pattern}\n`);
                outputChannel.appendLine(`\n🛡️  Added '${pattern}' to .gitignore to keep ephemeral addresses out of source control.`);
            }
        } catch (err) {
            outputChannel.appendLine(`\n⚠️  Failed to update .gitignore: ${err}`);
        }
    }
}
