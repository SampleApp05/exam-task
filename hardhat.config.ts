import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

import "./tasks/index.ts";

require("@openzeppelin/hardhat-upgrades");

dotenv.config();

const config: HardhatUserConfig = {
  // defaultNetwork: "localhost",
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  networks: {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`, // Alchemy API KEY
      accounts: [`0x${process.env.WALLET_PRIVATE_KEY}`], // Your wallet private key
    },
  },

  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY, // Etherscan API KEY
  },

  gasReporter: {
    enabled: true,
    currency: "USD", // Show gas cost in USD
    gasPrice: 20, // Simulate gas price (in Gwei)
    coinmarketcap: process.env.COINMARKETCAP_API_KEY, // Optional: Get real-time gas prices
  },
};

export default config;
