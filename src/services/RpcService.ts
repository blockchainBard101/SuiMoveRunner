import fetch from "node-fetch";
import { GasCoin, CoinPortfolio, CoinMetadata, CoinObject } from "../types";

// RPC Helper functions for faster operations
export async function makeRpcCall(rpcUrl: string, method: string, params: any[] = []): Promise<any> {
    try {
        console.log(`Making RPC call: ${method} to ${rpcUrl}`);

        const response = await fetch(rpcUrl, {
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
    } catch (error) {
        console.error(`RPC call failed for ${method} to ${rpcUrl}:`, error);
        throw error;
    }
}

export async function getWalletBalanceRpc(rpcUrl: string, address: string): Promise<{ balance: string; gasCoins: GasCoin[] }> {
    try {
        console.log(`Fetching balance for address ${address} via RPC ${rpcUrl}`);

        let totalMistBalance = 0;
        const gasCoins: GasCoin[] = [];

        // Try suix_getBalance first (more specific)
        try {
            const suiBalance = await makeRpcCall(rpcUrl, "suix_getBalance", [address, "0x2::sui::SUI"]);
            console.log("SUI balance response:", suiBalance);

            if (suiBalance && suiBalance.totalBalance) {
                totalMistBalance = parseInt(suiBalance.totalBalance.toString());
            }
        } catch (balanceError) {
            console.log("suix_getBalance failed, trying suix_getAllBalances:", balanceError);

            // Fallback to suix_getAllBalances
            const balances = await makeRpcCall(rpcUrl, "suix_getAllBalances", [address]);
            console.log("All balances response:", balances);

            // Find SUI balance
            const suiBalance = balances.find((b: any) => b.coinType === "0x2::sui::SUI");
            if (suiBalance) {
                totalMistBalance = parseInt(suiBalance.totalBalance || "0");
            }
        }

        // Get all coins for detailed gas coin information
        const coins = await makeRpcCall(rpcUrl, "suix_getAllCoins", [address, null, 100]);
        console.log("Coins response:", coins);

        if (coins.data) {
            coins.data.forEach((coin: any) => {
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
    } catch (error) {
        console.error("Failed to fetch wallet balance via RPC:", error);
        throw error;
    }
}

export async function checkRpcHealth(rpcUrl: string): Promise<boolean> {
    try {
        console.log(`Checking RPC health for ${rpcUrl}`);
        await makeRpcCall(rpcUrl, "sui_getLatestCheckpointSequenceNumber", []);
        console.log(`RPC health check passed for ${rpcUrl}`);
        return true;
    } catch (error) {
        console.log(`RPC health check failed for ${rpcUrl}:`, error);
        return false;
    }
}

export async function getCoinPortfolio(rpcUrl: string, address: string): Promise<CoinPortfolio> {
    try {
        console.log(`Fetching coin portfolio for address ${address} via RPC ${rpcUrl}`);

        // Get all balances
        const balances = await makeRpcCall(rpcUrl, "suix_getAllBalances", [address]);
        console.log("All balances response:", balances);

        // Get all coins with pagination
        const coinObjects: Record<string, CoinObject[]> = {};
        let cursor: string | null = null;
        let hasNextPage = true;

        while (hasNextPage) {
            const coinsResponse = await makeRpcCall(rpcUrl, "suix_getAllCoins", [address, cursor, 100]);
            console.log("Coins response:", coinsResponse);

            if (coinsResponse.data) {
                coinsResponse.data.forEach((coin: any) => {
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
        const metadata: Record<string, CoinMetadata> = {};
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
            } catch (error) {
                console.log(`Failed to get metadata for ${coinType}:`, error);
                // Provide default metadata with better defaults
                const coinName = coinType.split('::').pop() || 'Unknown';
                let defaultDecimals = 9; // Default for SUI

                // Special handling for common tokens
                if (coinType.toLowerCase().includes('usdc')) {
                    defaultDecimals = 6;
                } else if (coinType.toLowerCase().includes('usdt')) {
                    defaultDecimals = 6;
                } else if (coinType.toLowerCase().includes('weth')) {
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
            balances: balances.map((balance: any) => ({
                coinType: balance.coinType,
                coinObjectCount: balance.coinObjectCount,
                totalBalance: balance.totalBalance,
                lockedBalance: balance.lockedBalance || "0",
            })),
            coinObjects,
            metadata,
        };
    } catch (error) {
        console.error("Failed to fetch coin portfolio via RPC:", error);
        throw error;
    }
}
