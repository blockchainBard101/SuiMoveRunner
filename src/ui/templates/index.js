"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebviewContent = getWebviewContent;
const styles_1 = require("./webview/styles");
const script_1 = require("./webview/script");
const templates_1 = require("./webview/templates");
// Export GasCoin included in import above
function getWebviewContent(params) {
    const { activeEnv, availableEnvs, wallets, activeWallet, suiBalance, gasCoins, isMoveProject, pkg, upgradeCapInfo, modulesHtml, argsMapping, iconUri, localnetRunning = true, showFaucet = false, suiVersion = "Unknown", latestSuiVersion = "Unknown", isSuiOutdated = false, isSuiInstalled = false, installMethod = "none", osPlatform = "linux", coinPortfolio = null, } = params;
    // Generate the script with proper variable substitution
    const script = script_1.webviewScript.replace('${JSON.stringify(argsMapping)}', JSON.stringify(argsMapping));
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${styles_1.webviewStyles}
  </style>
</head>
<body>
  ${(0, templates_1.generateHeader)(iconUri)}
  ${(0, templates_1.generateStatusBar)()}
  ${(0, templates_1.generateSuiStatusSection)(params)}
  ${(0, templates_1.generateRefreshSection)()}
  ${(0, templates_1.generateEnvironmentDisplay)(activeEnv)}
  ${(0, templates_1.generateLocalnetSection)(params)}
  ${(0, templates_1.generateFaucetSection)(showFaucet)}
  ${(0, templates_1.generateEnvironmentSection)(availableEnvs, activeEnv)}
  ${(0, templates_1.generateWalletSection)(params)}
  ${(0, templates_1.generateImportWalletSection)()}
  ${(0, templates_1.generateMoveProjectSelectionSection)(params)}
  ${(0, templates_1.generateCreatePackageSection)(isMoveProject)}
  ${(0, templates_1.generateMoveProjectSections)(params)}

  <script>
    ${script}
  </script>
</body>
</html>`;
}
//# sourceMappingURL=index.js.map