# ArbitrageScanner

This project is an Arbitrage Scanner that detects price differences between Binance and Solana DEXes for various tokens. The scanner identifies potential arbitrage opportunities and computes profitability for users to execute trades across exchanges.

Features
	•	Fetches real-time prices for tokens from Binance and Solana DEXes.
	•	Identifies arbitrage opportunities by calculating the price difference between exchanges.
	•	Computes profitability considering exchange fees and transaction costs.
	•	Provides recommendations on whether to buy on Binance and sell on Solana DEX, or vice versa.

Installation
 	1.	Clone the repository
  2.	Install dependencies
  3.  Run the application:
      • node backend.js
      • Open the frontend.html 

Usage

Once the server is up and running, visit the frontend in your browser:
The frontend will display arbitrage opportunities for various tokens with details such as price differences, profitability, and recommendations for trades.

The following tokens are currently supported:
	•	SOL (Solana)
	•	RAY (Raydium)
	•	BONK (Bonk)
	•	ORCA (Orca)

 Backend API endpoint returns the arbitrage opportunities for all supported tokens.
  • Sample Response:
  [
  {
    "token": "SOL",
    "name": "Solana",
    "binancePrice": 216.32,
    "dexPrice": 216.1872821778015,
    "priceDifference": "0.06%",
    "profitability": {
      "binanceToDex": "0.25",
      "dexToBinance": "0.18"
    },
    "recommendation": "Buy on Binance, sell on Solana DEX for 0.25 USDC profit"
  },
  ...
]

The frontend is a simple static HTML/CSS/JS application without using any frameworks. It fetches the arbitrage data from the backend API and displays the following information:
	•	Token Symbol & Name: The name of the token.
	•	Binance Price: The price of the token on Binance.
	•	Solana DEX Price: The price of the token on Solana’s DEX.
	•	Price Difference: The percentage difference between the two prices.
	•	Profitability: Potential profits when buying and selling between exchanges.
	•	Trade Recommendation: Whether to buy on Binance and sell on Solana DEX, or vice versa.
