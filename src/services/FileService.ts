import * as fs from "fs";
import * as path from "path";
import { MoveProject } from "../types";

export function waitForFolder(folderPath: string, timeout: number): Promise<boolean> {
    const interval = 100;
    let elapsed = 0;
    return new Promise((resolve) => {
        const timer = setInterval(() => {
            if (fs.existsSync(folderPath)) {
                clearInterval(timer);
                resolve(true);
            } else if ((elapsed += interval) >= timeout) {
                clearInterval(timer);
                resolve(false);
            }
        }, interval);
    });
}

export function isMoveProject(directoryPath: string): boolean {
    const moveTomlPath = path.join(directoryPath, "Move.toml");
    return fs.existsSync(moveTomlPath);
}

export async function scanForMoveProjects(rootPath: string, maxDepth: number = 3): Promise<MoveProject[]> {
    const moveProjects: MoveProject[] = [];

    async function scanDirectory(currentPath: string, currentDepth: number, relativePath: string = ""): Promise<void> {
        if (currentDepth > maxDepth) {
            return;
        }

        try {
            const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });

            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const fullPath = path.join(currentPath, entry.name);

                    // Skip hidden folders and common heavy directories
                    if (entry.name.startsWith('.') ||
                        ['node_modules', 'target', 'dist', 'build', 'out'].includes(entry.name)) {
                        continue;
                    }

                    const newRelativePath = relativePath ? path.join(relativePath, entry.name) : entry.name;

                    // Check if this directory is a Move project
                    if (isMoveProject(fullPath)) {
                        moveProjects.push({
                            path: fullPath,
                            name: entry.name,
                            relativePath: newRelativePath
                        });
                    } else {
                        // Recursively scan subdirectories
                        await scanDirectory(fullPath, currentDepth + 1, newRelativePath);
                    }
                }
            }
        } catch (error) {
            console.log(`Error scanning directory ${currentPath}:`, error);
        }
    }

    await scanDirectory(rootPath, 0);
    return moveProjects;
}
