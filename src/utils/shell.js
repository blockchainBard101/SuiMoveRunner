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
exports.runCommand = runCommand;
const child_process_1 = require("child_process");
const process = __importStar(require("process"));
function runCommand(command, cwd, timeout = 10000) {
    return new Promise((resolve, reject) => {
        // Use proper shell for Windows compatibility
        const isWindows = process.platform === 'win32';
        const child = (0, child_process_1.exec)(command, {
            cwd,
            shell: isWindows ? 'cmd.exe' : undefined
        }, (error, stdout, stderr) => {
            if (error) {
                reject(stderr || error.message);
            }
            else {
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
//# sourceMappingURL=shell.js.map