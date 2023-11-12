# CZ4153/SC4053 Development Project: Dutch Auction

## Overview

This project presents a decentralized application built on the Ethereum blockchain. It comprises two principal smart contracts: `DUT` (Token.sol) and `DutchAuction` (Auction.sol). The DUT contract is responsible for implementing a new token, aptly named "DUT," which adheres to the ERC20 token standard. Concurrently, the DutchAuction contract manages the distribution of the DUT token through a Dutch auction mechanism.

## Dependencies

The project is developed using Node.js and Hardhat. Below are the stpes to install the necessary dependencies.

### Pre-requisites

+ Node.js: https://nodejs.org/en/download/
+ npm: https://www.npmjs.com/get-npm
+ npx: https://www.npmjs.com/package/npx

### Installation

Install the dependencies using npm under root directory:
```shell
npm install
```

This will install all the dependencies listed under `dependencies` and `devDependencies` in the `package.json` file. This includes:
+ `"@openzepplin/contracts"`
+ `"hardhat"`
+ `"@nomicfoundation/hardhat-toolbox-viem"`

## Quick Start

Compile the contracts and deploy to local chain
```shell
npx hardhat compile                                    # Compile the contracts
npx hardhat node                                       # Connect to localhost Hardhar network
npx hardhat run scripts/deploy.ts --network localhost  # Deploy contracts to local chain
```
Run the frontend application
```shell
cd frontend
npm install  # Install frontend app dependencies
npm start    # Start frontend on localhost portal
```

## Testing

```shell
npx hardhat compile                    # Compile the contracts
npx hardhat test test/Token.ts         # This tests the DUT token distribution
npx hardhat test test/DutchAuction.ts  # This includes a test for the Dutch Auction contract
```
