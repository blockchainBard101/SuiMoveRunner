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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSuiVersion = getSuiVersion;
exports.getLatestSuiVersion = getLatestSuiVersion;
exports.compareVersions = compareVersions;
const node_fetch_1 = __importDefault(require("node-fetch"));
const os = __importStar(require("os"));
const shell_1 = require("../utils/shell");
function expandHome(path) {
    if (path.startsWith('~')) {
        return path.replace('~', os.homedir());
    }
    return path;
}
async function getSuiVersion() {
    const commands = [
        'sui --version',
        `${expandHome('~/.cargo/bin/sui')} --version`,
        '/usr/local/bin/sui --version',
        '/opt/homebrew/bin/sui --version'
    ];
    for (const cmd of commands) {
        try {
            console.log(`[VersionService] Checking Sui version with: ${cmd}`);
            const output = await (0, shell_1.runCommand)(cmd, undefined, 5000);
            const match = output.match(/sui\s+([^\s]+)/i);
            if (match) {
                console.log(`[VersionService] Found Sui version: ${match[1]}`);
                return match[1];
            }
        }
        catch (error) {
            console.log(`[VersionService] Command failed or no match: ${cmd}`);
        }
    }
    console.log(`[VersionService] Sui CLI not found after ${commands.length} attempts.`);
    return null;
}
async function getLatestSuiVersion() {
    try {
        const response = await (0, node_fetch_1.default)('https://api.github.com/repos/MystenLabs/sui/releases/latest');
        const data = await response.json();
        // Extract version from tag name like "mainnet-v1.18.0" or "testnet-v1.56.1"
        const match = data.tag_name?.match(/(?:mainnet|testnet)-v([\d.]+)/);
        return match ? match[1] : null;
    }
    catch (error) {
        console.error('Error getting latest version:', error);
        return null;
    }
}
function compareVersions(current, latest) {
    // Simple version comparison - returns true if current is outdated
    // Strip any suffixes like "-homebrew", "-rc.0", etc.
    const cleanCurrent = current.split('-')[0];
    const cleanLatest = latest.split('-')[0];
    const currentParts = cleanCurrent.split('.').map(Number);
    const latestParts = cleanLatest.split('.').map(Number);
    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
        const currentPart = currentParts[i] || 0;
        const latestPart = latestParts[i] || 0;
        if (currentPart < latestPart) {
            return true;
        }
        if (currentPart > latestPart) {
            return false;
        }
    }
    return false;
}
//# sourceMappingURL=VersionService.js.map