import fetch from "node-fetch";
import * as os from "os";
import { runCommand } from "../utils/shell";

function expandHome(path: string): string {
    if (path.startsWith('~')) {
        return path.replace('~', os.homedir());
    }
    return path;
}

export async function getSuiVersion(): Promise<string | null> {
    const commands = [
        'sui --version',
        `${expandHome('~/.cargo/bin/sui')} --version`,
        '/usr/local/bin/sui --version',
        '/opt/homebrew/bin/sui --version'
    ];

    for (const cmd of commands) {
        try {
            console.log(`[VersionService] Checking Sui version with: ${cmd}`);
            const output = await runCommand(cmd, undefined, 5000);
            const match = output.match(/sui\s+([^\s]+)/i);
            if (match) {
                console.log(`[VersionService] Found Sui version: ${match[1]}`);
                return match[1];
            }
        } catch (error) {
            console.log(`[VersionService] Command failed or no match: ${cmd}`);
        }
    }
    console.log(`[VersionService] Sui CLI not found after ${commands.length} attempts.`);
    return null;
}

export async function getLatestSuiVersion(): Promise<string | null> {
    try {
        const response = await fetch('https://api.github.com/repos/MystenLabs/sui/releases/latest');
        const data = await response.json();
        // Extract version from tag name like "mainnet-v1.18.0" or "testnet-v1.56.1"
        const match = data.tag_name?.match(/(?:mainnet|testnet)-v([\d.]+)/);
        return match ? match[1] : null;
    } catch (error) {
        console.error('Error getting latest version:', error);
        return null;
    }
}

export function compareVersions(current: string, latest: string): boolean {
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
