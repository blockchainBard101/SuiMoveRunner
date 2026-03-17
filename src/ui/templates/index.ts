import { WebviewParams, GasCoin } from '../../types';
import { webviewStyles } from './webview/styles';
import { webviewScript } from './webview/script';
import { ICONS, getIcon } from './webview/icons';
import {
  generateHeader,
  generateStatusBar,
  generateSuiStatusSection,
  generateRefreshSection,
  generateEnvironmentDisplay,
  generateLocalnetSection,
  generateFaucetSection,
  generateEnvironmentSection,
  generateWalletSection,
  generateImportWalletSection,
  generateMoveProjectSelectionSection,
  generateCreatePackageSection,
  generateMoveProjectSections,
  generateCoinPortfolioSection,
} from './webview/templates';

// Export GasCoin included in import above

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
    isSuiInstalled = false,
    installMethod = "none",
    osPlatform = "linux",
    coinPortfolio = null,
  } = params;

  // Generate the script with proper variable substitution
  const script = webviewScript
    .replace('${JSON.stringify(argsMapping)}', JSON.stringify(argsMapping))
    .replace('${JSON.stringify(gasCoins)}', JSON.stringify(gasCoins || []));

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
  ${generateSuiStatusSection(params)}
  ${generateRefreshSection()}
  ${generateEnvironmentDisplay(activeEnv)}
  ${generateLocalnetSection(params)}
  ${generateFaucetSection(showFaucet)}
  ${generateEnvironmentSection(availableEnvs, activeEnv)}
  ${generateWalletSection(params)}
  ${generateImportWalletSection()}
  ${generateMoveProjectSelectionSection(params)}
  ${generateCreatePackageSection(isMoveProject)}
  ${generateMoveProjectSections(params)}

  <script>
    ${script}
  </script>
</body>
</html>`;
}
