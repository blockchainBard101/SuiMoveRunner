"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeRpcCall = makeRpcCall;
exports.getWalletBalanceRpc = getWalletBalanceRpc;
exports.checkRpcHealth = checkRpcHealth;
exports.getCoinPortfolio = getCoinPortfolio;
exports.dryRunTransactionBlock = dryRunTransactionBlock;
exports.getNormalizedMoveFunction = getNormalizedMoveFunction;
exports.getNormalizedMoveModulesByPackage = getNormalizedMoveModulesByPackage;
const node_fetch_1 = __importDefault(require("node-fetch"));
// RPC Helper functions for faster operations
async function makeRpcCall(rpcUrl, method, params = []) {
    try {
        console.log(`Making RPC call: ${method} to ${rpcUrl}`);
        const response = await (0, node_fetch_1.default)(rpcUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method,
                params,
            }),
            // Add timeout to prevent hanging
            signal: AbortSignal.timeout(10000), // 10 second timeout
        });
        if (!response.ok) {
            throw new Error(`RPC call failed: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        if (data.error) {
            throw new Error(`RPC error: ${data.error.message}`);
        }
        console.log(`RPC call successful: ${method}`);
        return data.result;
    }
    catch (error) {
        console.error(`RPC call failed for ${method} to ${rpcUrl}:`, error);
        throw error;
    }
}
async function getWalletBalanceRpc(rpcUrl, address) {
    try {
        console.log(`Fetching balance for address ${address} via RPC ${rpcUrl}`);
        let totalMistBalance = 0;
        const gasCoins = [];
        // Try suix_getBalance first (more specific)
        try {
            const suiBalance = await makeRpcCall(rpcUrl, "suix_getBalance", [address, "0x2::sui::SUI"]);
            console.log("SUI balance response:", suiBalance);
            if (suiBalance && suiBalance.totalBalance) {
                totalMistBalance = parseInt(suiBalance.totalBalance.toString());
            }
        }
        catch (balanceError) {
            console.log("suix_getBalance failed, trying suix_getAllBalances:", balanceError);
            // Fallback to suix_getAllBalances
            const balances = await makeRpcCall(rpcUrl, "suix_getAllBalances", [address]);
            console.log("All balances response:", balances);
            // Find SUI balance
            const suiBalance = balances.find((b) => b.coinType === "0x2::sui::SUI");
            if (suiBalance) {
                totalMistBalance = parseInt(suiBalance.totalBalance || "0");
            }
        }
        // Get all coins for detailed gas coin information
        const coins = await makeRpcCall(rpcUrl, "suix_getAllCoins", [address, null, 100]);
        console.log("Coins response:", coins);
        if (coins.data) {
            coins.data.forEach((coin) => {
                if (coin.coinType === "0x2::sui::SUI" && coin.balance) {
                    const mistBalance = parseInt(coin.balance);
                    gasCoins.push({
                        gasCoinId: coin.coinObjectId,
                        mistBalance: mistBalance,
                        suiBalance: (mistBalance / 1e9).toFixed(6),
                    });
                }
            });
        }
        console.log(`Total balance: ${totalMistBalance} MIST, Gas coins: ${gasCoins.length}`);
        return {
            balance: (totalMistBalance / 1e9).toFixed(6),
            gasCoins,
        };
    }
    catch (error) {
        console.error("Failed to fetch wallet balance via RPC:", error);
        throw error;
    }
}
async function checkRpcHealth(rpcUrl) {
    try {
        console.log(`Checking RPC health for ${rpcUrl}`);
        await makeRpcCall(rpcUrl, "sui_getLatestCheckpointSequenceNumber", []);
        console.log(`RPC health check passed for ${rpcUrl}`);
        return true;
    }
    catch (error) {
        console.log(`RPC health check failed for ${rpcUrl}:`, error);
        return false;
    }
}
async function getCoinPortfolio(rpcUrl, address) {
    try {
        console.log(`Fetching coin portfolio for address ${address} via RPC ${rpcUrl}`);
        // Get all balances
        const balances = await makeRpcCall(rpcUrl, "suix_getAllBalances", [address]);
        console.log("All balances response:", balances);
        // Get all coins with pagination
        const coinObjects = {};
        let cursor = null;
        let hasNextPage = true;
        while (hasNextPage) {
            const coinsResponse = await makeRpcCall(rpcUrl, "suix_getAllCoins", [address, cursor, 100]);
            console.log("Coins response:", coinsResponse);
            if (coinsResponse.data) {
                coinsResponse.data.forEach((coin) => {
                    const coinType = coin.coinType;
                    if (!coinObjects[coinType]) {
                        coinObjects[coinType] = [];
                    }
                    coinObjects[coinType].push({
                        coinType: coin.coinType,
                        coinObjectId: coin.coinObjectId,
                        version: coin.version,
                        digest: coin.digest,
                        balance: coin.balance,
                        previousTransaction: coin.previousTransaction,
                    });
                });
            }
            cursor = coinsResponse.nextCursor;
            hasNextPage = coinsResponse.hasNextPage;
        }
        // Get metadata for each coin type
        const metadata = {};
        const uniqueCoinTypes = [...new Set(Object.keys(coinObjects))];
        for (const coinType of uniqueCoinTypes) {
            try {
                console.log(`Fetching metadata for coin type: ${coinType}`);
                const coinMetadata = await makeRpcCall(rpcUrl, "suix_getCoinMetadata", [coinType]);
                console.log(`Metadata for ${coinType}:`, coinMetadata);
                metadata[coinType] = {
                    decimals: coinMetadata.decimals,
                    name: coinMetadata.name,
                    symbol: coinMetadata.symbol,
                    description: coinMetadata.description,
                    iconUrl: coinMetadata.iconUrl,
                    id: coinMetadata.id,
                };
            }
            catch (error) {
                console.log(`Failed to get metadata for ${coinType}:`, error);
                // Provide default metadata with better defaults
                const coinName = coinType.split('::').pop() || 'Unknown';
                let defaultDecimals = 9; // Default for SUI
                // Special handling for common tokens
                if (coinType.toLowerCase().includes('usdc')) {
                    defaultDecimals = 6;
                }
                else if (coinType.toLowerCase().includes('usdt')) {
                    defaultDecimals = 6;
                }
                else if (coinType.toLowerCase().includes('weth')) {
                    defaultDecimals = 18;
                }
                metadata[coinType] = {
                    decimals: defaultDecimals,
                    name: coinName,
                    symbol: coinName,
                    description: 'No description available',
                    iconUrl: null,
                    id: null,
                };
            }
        }
        console.log(`Coin portfolio fetched: ${balances.length} coin types, ${Object.keys(coinObjects).length} coin types with objects`);
        return {
            balances: balances.map((balance) => ({
                coinType: balance.coinType,
                coinObjectCount: balance.coinObjectCount,
                totalBalance: balance.totalBalance,
                lockedBalance: balance.lockedBalance || "0",
            })),
            coinObjects,
            metadata,
        };
    }
    catch (error) {
        console.error("Failed to fetch coin portfolio via RPC:", error);
        throw error;
    }
}
async function dryRunTransactionBlock(rpcUrl, txBytes) {
    try {
        console.log(`Calling dryRunTransactionBlock on ${rpcUrl}`);
        const result = await makeRpcCall(rpcUrl, "sui_dryRunTransactionBlock", [txBytes]);
        console.log("Dry run result:", result);
        return result;
    }
    catch (error) {
        console.error("Failed to dry run transaction block via RPC:", error);
        throw error;
    }
}
async function getNormalizedMoveFunction(rpcUrl, packageId, moduleName, functionName) {
    try {
        console.log(`Calling sui_getNormalizedMoveFunction for ${packageId}::${moduleName}::${functionName}`);
        const result = await makeRpcCall(rpcUrl, "sui_getNormalizedMoveFunction", [packageId, moduleName, functionName]);
        return result;
    }
    catch (error) {
        console.error("Failed to get normalized move function:", error);
        throw error;
    }
}
async function getNormalizedMoveModulesByPackage(rpcUrl, packageId) {
    try {
        console.log(`Calling sui_getNormalizedMoveModulesByPackage for ${packageId}`);
        const result = await makeRpcCall(rpcUrl, "sui_getNormalizedMoveModulesByPackage", [packageId]);
        return result;
    }
    catch (error) {
        console.error("Failed to get normalized move modules:", error);
        throw error;
    }
}
//# sourceMappingURL=RpcService.js.map