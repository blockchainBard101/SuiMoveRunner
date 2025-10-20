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
}

export interface ArgumentPlaceholder {
  placeholder: string;
  defaultValue: string;
  readonly?: boolean;
}

