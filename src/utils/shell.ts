import { exec } from "child_process";
import * as process from "process";

export function runCommand(command: string, cwd?: string, timeout: number = 10000): Promise<string> {
    return new Promise((resolve, reject) => {
        // Use proper shell for Windows compatibility
        const isWindows = process.platform === 'win32';

        const child = exec(command, {
            cwd,
            shell: isWindows ? 'cmd.exe' : undefined
        }, (error: any, stdout: any, stderr: any) => {
            if (error) {
                reject(stderr || error.message);
            } else {
                resolve(stdout);
            }
        });

        // Add timeout
        if (timeout > 0) {
            setTimeout(() => {
                child.kill();
                reject(new Error(`Command timed out after ${timeout}ms: ${command}`));
            }, timeout);
        }
    });
}
