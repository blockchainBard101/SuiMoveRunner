import * as vscode from "vscode";
import { ExtensionState } from "../state/ExtensionState";

export abstract class BaseController {
    constructor(
        protected state: ExtensionState,
        protected webview: vscode.Webview
    ) { }

    protected postMessage(command: string, data?: any) {
        this.webview.postMessage({ command, ...data });
    }

    protected setStatus(message: string) {
        this.postMessage("set-status", { message });
    }
}
