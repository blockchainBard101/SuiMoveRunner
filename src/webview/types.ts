export interface GasCoin {
  gasCoinId: string;
  mistBalance: number;
  suiBalance: string;
}

export interface Environment {
  alias: string;
  rpc: string;
}

export interface Wallet {
  name: string;
  address: string;
}

export interface UpgradeCapInfo {
  upgradeCap: string;
  packageId: string;
}

export interface ArgsMapping {
  argTypes: string[];
  typeParams: string[];
}

export interface WebviewParams {
  activeEnv: string;
  availableEnvs: Environment[];
  wallets: Wallet[];
  activeWallet: string;
  suiBalance: string;
  gasCoins: GasCoin[];
  isMoveProject: boolean;
  pkg: string;
  upgradeCapInfo: UpgradeCapInfo | null;
  modulesHtml: string;
  argsMapping: Record<string, ArgsMapping>;
  iconUri: string;
  localnetRunning?: boolean;
  showFaucet?: boolean;
  suiVersion?: string;
  latestSuiVersion?: string;
  isSuiOutdated?: boolean;
  coinPortfolio?: CoinPortfolio | null;
}

export interface ArgumentPlaceholder {
  placeholder: string;
  defaultValue: string;
  readonly?: boolean;
}

// Coin Portfolio Types
export interface CoinBalance {
  coinType: string;
  coinObjectCount: number;
  totalBalance: string;
  lockedBalance: string;
}

export interface CoinObject {
  coinType: string;
  coinObjectId: string;
  version: string;
  digest: string;
  balance: string;
  previousTransaction: string;
}

export interface CoinMetadata {
  decimals: number;
  name: string;
  symbol: string;
  description: string;
  iconUrl: string | null;
  id: string | null;
}

export interface CoinPortfolio {
  balances: CoinBalance[];
  coinObjects: Record<string, CoinObject[]>; // Grouped by coin type
  metadata: Record<string, CoinMetadata>; // Metadata by coin type
}

