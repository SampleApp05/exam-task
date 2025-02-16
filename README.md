# Sample Hardhat Project

This project creates a sample staking token - StakeX and a StakingPool contract which distributes rewards based on the user Stake balance and the elapsed time

Project dependencies installation - initialize a hardhat TS project by running 'npm hardhat init' and following the instructions - install OpenZeppelin dependencies by running 'npm install @openzeppelin/contracts' and 'npm install '@openzeppelin/hardhat-upgrades'' - install Etherscan dependency by running 'npm install --save-dev hardhat @nomiclabs/hardhat-etherscan'

Deployment instructions - run the 'deployPool' task as 'npx hardhat deployPool --network <selectedNetwork>'; This task deploys the StakeX token and the StakingPool contract and grants the Pool a MINTER_ROLE in order to distribute rewards - to deploy on Sepolia testnet create a '.env' file and add the needed API Keys and URLS: - ALCHEMY_API_KEY=<key> - WALLET_PRIVATE_KEY=<metamask-account-key> - ETHERSCAN_API_KEY=<key> - To verify deployed contracts run 'npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS "constructor_parameter1" "constructor_parameter2"...'
