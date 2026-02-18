import * as vscode from "vscode";
import { SidebarProvider } from "./ui/SidebarProvider";
import { ExtensionState } from "./state/ExtensionState";

export function activate(context: vscode.ExtensionContext) {
  // Initialize State
  const state = new ExtensionState(context);

  // Initialize Sidebar Provider
  const sidebarProvider = new SidebarProvider(context.extensionUri, state);

  // Register Webview View
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "suiRunner.sidebarView", // Match contribution ID in package.json
      sidebarProvider
    )
  );

  // Register Commands
  // These specific commands were originally just calling methods on sidebarInstance or placeholders.
  // We can keep them as placeholders or use them to trigger actions via the provider/handler if accessible.
  // However, the original code mostly used message passing from the webview.
  // The command palette commands existed but mostly showed information messages or were not fully wired to logic 
  // without the webview context. 
  // We will preserve them as basic triggers or information for now to match behavior, 
  // or point them to open the sidebar.

  context.subscriptions.push(
    vscode.commands.registerCommand("suimoverunner.createMovePackage", () => {
      vscode.commands.executeCommand("suiRunner.sidebarView.focus");
      // Optionally trigger "create" flow if we could send a message to the webview
      vscode.window.showInformationMessage("Use the sidebar to create a Move package.");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("suimoverunner.compileMovePackage", () => {
      vscode.commands.executeCommand("suiRunner.sidebarView.focus");
      vscode.window.showInformationMessage("Use the sidebar to build the Move package.");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("suimoverunner.publishMovePackage", () => {
      vscode.commands.executeCommand("suiRunner.sidebarView.focus");
      vscode.window.showInformationMessage("Use the sidebar to publish the Move package.");
    })
  );

  // Initial State Load
  // We can kick off an initial scan or refresh
  state.checkSuiVersion();
  state.scanForMoveProjects();
}

export function deactivate() { }
