
const { Connection, PublicKey } = require('@solana/web3.js');
const axios = require('axios');

class ArbitrageScanner {
    constructor(config = {}) {
        this.binanceApiUrl = 'https://api.binance.com/api/v3';
        this.jupiterApiUrl = 'https://quote-api.jup.ag/v6';
        this.solanaConnection = new Connection(config.solanaRpcUrl || 'https://api.mainnet-beta.solana.com');
        
 
        this.fees = {
            binanceMaker: 0.001,  
            binanceTaker: 0.001, 
            solanaDex: 0.003,    
            solanaTransactionCost: 0.000005 
        };

        // Token decimal mappings
        this.tokenDecimals = {
            'SOL': 9,
            'RAY': 6,
            'SRM': 6,
            'BONK': 5,
            'ORCA': 6,
        };

        this.axiosInstance = axios.create({
            timeout: 10000,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
    }

    async getBinancePrice(symbol) {
        try {
            const response = await this.axiosInstance.get(`${this.binanceApiUrl}/ticker/price`, {
                params: { symbol: `${symbol}USDC` }
            });
            return parseFloat(response.data.price);
        } catch (error) {
            console.error(`Error fetching Binance price for ${symbol}:`, error.message);
            return null;
        }
    }

    async getSolanaDexPrice(token) {
        try {
            const inputDecimals = 6; 
            const outputDecimals = this.tokenDecimals[token.symbol];
            const inputAmount = Math.pow(10, inputDecimals);

            const response = await this.axiosInstance.get(`${this.jupiterApiUrl}/quote`, {
                params: {
                    inputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 
                    outputMint: token.mint,
                    amount: inputAmount.toString(),
                    slippageBps: 50
                }
            });

            if (response.data && response.data.outAmount) {
                const outputAmount = parseInt(response.data.outAmount);
                const price = 1 / (outputAmount / Math.pow(10, outputDecimals));
                return price;
            }
            
            throw new Error('Invalid price data structure received');
        } catch (error) {
            console.error(`Error fetching Solana DEX price for ${token.symbol}:`, error.message);
            return null;
        }
    }

    calculateProfitability(binancePrice, dexPrice, amount) {
        if (!binancePrice || !dexPrice || !amount) return { binanceToDex: 0, dexToBinance: 0 };

        const binanceBuyCost = amount * binancePrice * (1 + this.fees.binanceTaker);
        const dexSellRevenue = amount * dexPrice * (1 - this.fees.solanaDex);
        const profitBinanceToDex = dexSellRevenue - binanceBuyCost - this.fees.solanaTransactionCost;

        const dexBuyCost = amount * dexPrice * (1 + this.fees.solanaDex);
        const binanceSellRevenue = amount * binancePrice * (1 - this.fees.binanceMaker);
        const profitDexToBinance = binanceSellRevenue - dexBuyCost - this.fees.solanaTransactionCost;

        return {
            binanceToDex: profitBinanceToDex,
            dexToBinance: profitDexToBinance
        };
    }

    async scanArbitrageOpportunities(tokens) {
        const opportunities = [];
        console.log('Starting arbitrage scan...');

        for (const token of tokens) {
            console.log(`\nScanning ${token.symbol} (${token.name})...`);
            
            try {
                const [binancePrice, dexPrice] = await Promise.all([
                    this.getBinancePrice(token.symbol),
                    this.getSolanaDexPrice(token)
                ]);

                console.log(`${token.symbol} prices:`, {
                    binance: binancePrice,
                    dex: dexPrice,
                    difference: ((Math.abs(binancePrice - dexPrice) / binancePrice) * 100).toFixed(2) + '%'
                });

                if (!binancePrice || !dexPrice) {
                    console.log(`Skipping ${token.symbol} due to missing price data`);
                    continue;
                }

                const priceDiff = Math.abs(binancePrice - dexPrice) / binancePrice;
                if (priceDiff > 0.05) {
                    console.log(`Skipping ${token.symbol} due to suspicious price difference: ${(priceDiff * 100).toFixed(2)}%`);
                    continue;
                }

                const profitability = this.calculateProfitability(binancePrice, dexPrice, token.tradeAmount);

                if (profitability.binanceToDex > 0 || profitability.dexToBinance > 0) {
                    opportunities.push({
                        token: token.symbol,
                        name: token.name,
                        binancePrice,
                        dexPrice,
                        priceDifference: (priceDiff * 100).toFixed(2) + '%',
                        profitability: {
                            binanceToDex: profitability.binanceToDex.toFixed(2),
                            dexToBinance: profitability.dexToBinance.toFixed(2)
                        },
                        recommendation: this.getTradeRecommendation(profitability)
                    });
                }
            } catch (error) {
                console.error(`Error processing ${token.symbol}:`, error.message);
            }
        }

        return opportunities;
    }

    getTradeRecommendation(profitability) {
        if (profitability.binanceToDex > profitability.dexToBinance) {
            return `Buy on Binance, sell on Solana DEX for ${profitability.binanceToDex} USDC profit`;
        } else {
            return `Buy on Solana DEX, sell on Binance for ${profitability.dexToBinance} USDC profit`;
        }
    }
}

async function main() {
    const tokens = require('./token-config.js');
    
    const scanner = new ArbitrageScanner({
        solanaRpcUrl: 'https://api.mainnet-beta.solana.com'
    });

    try {
        console.log('Initializing arbitrage scan...');
        const opportunities = await scanner.scanArbitrageOpportunities(tokens);
        console.log('\nArbitrage Opportunities Found:', opportunities.length);
        console.log(JSON.stringify(opportunities, null, 2));
    } catch (error) {
        console.error('Error scanning for arbitrage opportunities:', error);
    }
}

if (require.main === module) {
    main();
}

module.exports = ArbitrageScanner;