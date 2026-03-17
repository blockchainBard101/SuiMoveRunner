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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const SidebarProvider_1 = require("./ui/SidebarProvider");
const ExtensionState_1 = require("./state/ExtensionState");
function activate(context) {
    // Initialize State
    const state = new ExtensionState_1.ExtensionState(context);
    // Initialize Sidebar Provider
    const sidebarProvider = new SidebarProvider_1.SidebarProvider(context.extensionUri, state);
    // Register Webview View
    context.subscriptions.push(vscode.window.registerWebviewViewProvider("suiRunner.sidebarView", // Match contribution ID in package.json
    sidebarProvider));
    context.subscriptions.push(vscode.commands.registerCommand("suimoverunner.createMovePackage", () => {
        vscode.commands.executeCommand("suiRunner.sidebarView.focus");
        // Optionally trigger "create" flow if we could send a message to the webview
        vscode.window.showInformationMessage("Use the sidebar to create a Move package.");
    }));
    context.subscriptions.push(vscode.commands.registerCommand("suimoverunner.compileMovePackage", () => {
        vscode.commands.executeCommand("suiRunner.sidebarView.focus");
        vscode.window.showInformationMessage("Use the sidebar to build the Move package.");
    }));
    context.subscriptions.push(vscode.commands.registerCommand("suimoverunner.publishMovePackage", () => {
        vscode.commands.executeCommand("suiRunner.sidebarView.focus");
        vscode.window.showInformationMessage("Use the sidebar to publish the Move package.");
    }));
    // Initial State Load
    // We can kick off an initial scan or refresh
    state.checkSuiVersion();
    state.scanForMoveProjects();
}
function deactivate() { }
//# sourceMappingURL=extension.js.map