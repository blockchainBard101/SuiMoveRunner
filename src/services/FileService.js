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
exports.waitForFolder = waitForFolder;
exports.isMoveProject = isMoveProject;
exports.scanForMoveProjects = scanForMoveProjects;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function waitForFolder(folderPath, timeout) {
    const interval = 100;
    let elapsed = 0;
    return new Promise((resolve) => {
        const timer = setInterval(() => {
            if (fs.existsSync(folderPath)) {
                clearInterval(timer);
                resolve(true);
            }
            else if ((elapsed += interval) >= timeout) {
                clearInterval(timer);
                resolve(false);
            }
        }, interval);
    });
}
function isMoveProject(directoryPath) {
    const moveTomlPath = path.join(directoryPath, "Move.toml");
    return fs.existsSync(moveTomlPath);
}
async function scanForMoveProjects(rootPath, maxDepth = 3) {
    const moveProjects = [];
    async function scanDirectory(currentPath, currentDepth, relativePath = "") {
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
                    }
                    else {
                        // Recursively scan subdirectories
                        await scanDirectory(fullPath, currentDepth + 1, newRelativePath);
                    }
                }
            }
        }
        catch (error) {
            console.log(`Error scanning directory ${currentPath}:`, error);
        }
    }
    await scanDirectory(rootPath, 0);
    return moveProjects;
}
//# sourceMappingURL=FileService.js.map