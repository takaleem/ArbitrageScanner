const express = require('express');
const  ArbitrageScanner  = require('./arbitrage-scanner');

const app = express();
const PORT = 4618;

app.get('/api/arbitrage-opportunities', async (req, res) => {
    const tokens = require('./token-config.js');
    
    const scanner = new ArbitrageScanner({
        solanaRpcUrl: 'https://api.mainnet-beta.solana.com'
    });

    try {
        const opportunities = await scanner.scanArbitrageOpportunities(tokens);
        res.json(opportunities);
    } catch (error) {
        console.error('Error scanning for arbitrage opportunities:', error);
        res.status(500).json({ error: 'Error scanning for arbitrage opportunities' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});