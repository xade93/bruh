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
**Below commands were tested on Arch Linux Rolling Release (Nov 12 2023). **

**Install dependencies.**
```shell
sudo pacman -S npm
```
**Compile the contracts and deploy to local chain**
```shell
npx hardhat compile                                    # Compile the contracts
npx hardhat node                                       # Connect to localhost Hardhar network
npx hardhat run scripts/deploy.ts --network localhost  # Deploy contracts to local chain
cp -r artifacts frontend/src/                          # Copy compiled contract ABIs into frontend (react.js forbids accessing file outside root scope)
```

**Capture the test account addresses & private keys, and paste them into `frontend/src/AuctionVars.tsx`:**
![image](https://github.com/xade93/bruh/assets/24752033/f839f002-03e9-40a6-9757-6311e4be5259)
This is the result of `npx hardhat node`, and it goes into `Acc0Addr`.
![image](https://github.com/xade93/bruh/assets/24752033/ad9e4aa6-307e-4e25-a600-6f14393a9669)
This is the output of `npx hardhat node` after executing `npx hardhat run scripts/deploy.ts --network localhost`, and it goes into `TokenAddr` and `AuctionAddr`.

**Run the frontend application**
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

## Feature Checklist

+ [x] New Token using ERC20 standard

+ [x] Dutch Auction logic in another contract

+ [x] Only elapse for 20 minutes

+ [x] Be able to distribute token minted to legitimate bidders at the end of the auction

+ [x] Resistant to reentry attack

  Using the nonReentrant modifier and the Checks-Effects-Interactions pattern in different situations.

+ [x] Enforce auction duration

  Using the timestamp on the block to obtain the current time, and employing a modifier to ensure that the current auction does not time out.

+ [x] Link to token contract with auction contract

  Use the address of the token contract in the constructor function of the auction contract, enabling the auction contract to communicate with the token contract.

+ [x] Burn unsold tokens

  A simple burn involves sending the tokens to address(0), which means that these tokens can never be used by anyone.

+ [x] Enforce successful bidder to pay Ether

  The bid function is a payable function, and the value sent with this function is considered the Ether paid. Consequently, any successful bidder is compelled to pay in Ether.

+ [x] Refund bids that are invalid

  There are two types of invalid bids: either the auction is not active, or the amount paid is either too high or too low. In the first scenario, the function will be rejected and the bids refunded. For the second type, any overpayment will be refunded after updating the state in the bid function. Additionally, a nonReentrant modifier will be used in the final distribute token function to prevent reentry attacks and checks-effects-interactions pattern is used in the bid function to refund.
