import { WebviewParams } from './webview/types';
import { webviewStyles } from './webview/styles';
import { webviewScript } from './webview/script';
import {
  generateHeader,
  generateStatusBar,
  generateSuiVersionSection,
  generateRefreshSection,
  generateEnvironmentDisplay,
  generateLocalnetSection,
  generateFaucetSection,
  generateEnvironmentSection,
  generateWalletSection,
  generateImportWalletSection,
  generateCreatePackageSection,
  generateMoveProjectSections,
  generateCoinPortfolioSection,
} from './webview/templates';

export { GasCoin } from './webview/types';

export function getWebviewContent(params: WebviewParams): string {
  const {
    activeEnv,
    availableEnvs,
    wallets,
    activeWallet,
    suiBalance,
    gasCoins,
    isMoveProject,
    pkg,
    upgradeCapInfo,
    modulesHtml,
    argsMapping,
    iconUri,
    localnetRunning = true,
    showFaucet = false,
    suiVersion = "Unknown",
    latestSuiVersion = "Unknown",
    isSuiOutdated = false,
    coinPortfolio = null,
  } = params;

  // Generate the script with proper variable substitution
  const script = webviewScript.replace('${JSON.stringify(argsMapping)}', JSON.stringify(argsMapping));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${webviewStyles}
  </style>
</head>
<body>
  ${generateHeader(iconUri)}
  ${generateStatusBar()}
  ${generateSuiVersionSection(params)}
  ${generateRefreshSection()}
  ${generateEnvironmentDisplay(activeEnv)}
  ${generateLocalnetSection(params)}
  ${generateFaucetSection(showFaucet)}
  ${generateEnvironmentSection(availableEnvs, activeEnv)}
  ${generateWalletSection(params)}
  ${generateImportWalletSection()}
  ${generateCreatePackageSection(isMoveProject)}
  ${generateMoveProjectSections(params)}

  <script>
    ${script}
  </script>
</body>
</html>`;
}
