# Sample Hardhat Project

This project creates a sample staking token, **StakeX**, and a **StakingPool** contract, which distributes rewards based on the user's stake balance and the elapsed time.

## Project Setup

### Dependencies Installation

1. Initialize a Hardhat TypeScript project by running:
   npx hardhat init
   Follow the instructions to complete the setup.

2. Install the required dependencies:
   OpenZeppelin contracts - npm install @openzeppelin/contracts
   OpenZeppelin Hardhat upgrades plugin - npm install @openzeppelin/hardhat-upgrades
   Etherscan plugin for Hardhat - npm install --save-dev hardhat @nomiclabs/hardhat-etherscan

3. Deployment Instructions
   Run the deployPool task to deploy the StakeX token and the StakingPool contract - npx hardhat deployPool --network <selectedNetwork>
   This task deploys the StakeX token and the StakingPool contract, granting the pool a MINTER_ROLE to distribute rewards.

4. Deploying on Sepolia Testnet:
   Create a .env file and add the required API keys and URLs:
   ALCHEMY_API_KEY=<your_alchemy_api_key>
   WALLET_PRIVATE_KEY=<your_metamask_account_private_key>
   ETHERSCAN_API_KEY=<your_etherscan_api_key>

5. Contract Verification:
   Run the following command to verify deployed contracts on Etherscan:
   npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS "constructor_parameter1" "constructor_parameter2" ...

6. Contract Verification Links
   StakeX Contract
   Sourcify - https://repo.sourcify.dev/contracts/full_match/11155111/0x3C17E0d3a1eb116aB0a8a14C0d1D716fC588ACa6/
   Etherscan - https://sepolia.etherscan.io/address/0x3C17E0d3a1eb116aB0a8a14C0d1D716fC588ACa6#code
   StakingPool Contract
   Sourcify - https://repo.sourcify.dev/contracts/full_match/11155111/0x642d786D8d3816B1239B159E94597033cEc0080f/
   Etherscan - https://sepolia.etherscan.io/address/0x642d786d8d3816b1239b159e94597033cec0080f#code

7. GitHub Link - https://github.com/SampleApp05/exam-task
