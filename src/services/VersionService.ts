import fetch from "node-fetch";
import { runCommand } from "../utils/shell";

export async function getSuiVersion(): Promise<string | null> {
    try {
        const output = await runCommand('sui --version', undefined, 5000);
        // Extract version from output like "sui 1.18.0-rc.0" or "sui 1.55.0-homebrew"
        const match = output.match(/sui\s+([\d.]+(?:-[\w.]+)?)/);
        return match ? match[1] : null;
    } catch (error) {
        console.error('Error getting Sui version:', error);
        return null;
    }
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
