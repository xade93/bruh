import { Injectable } from '@angular/core';
import { ethers } from 'ethers';

@Injectable({
  providedIn: 'root'
})
export class AuctionService {
  private provider: ethers.providers.Web3Provider;
  private auctionContract: ethers.Contract;

  constructor() {
    this.provider = new ethers.providers.Web3Provider(window.ethereum);
    const auctionAddress = 'YOUR_CONTRACT_ADDRESS';
    const auctionAbi = [...]; // Your contract ABI
    this.auctionContract = new ethers.Contract(auctionAddress, auctionAbi, this.provider.getSigner());
  }

  async createAuction(startPrice: number, reservePrice: number, priceDropInterval: number, initialSupply: number) {
    // Call your contract function to create an auction
  }

  async currentPrice(auctionId: number): Promise<number> {
    // Call your contract function to get the current price
  }

  // Add your methods for interacting with the smart contracts here
  async initializeAuction(startPrice: number, reservePrice: number, priceDropInterval: number, initialSupply: number): Promise<void> {
    // Assuming you have a function initializeAuction in your Auction.sol
    const tx = await this.auctionContract.initializeAuction(startPrice, reservePrice, priceDropInterval, initialSupply);
    await tx.wait(); // Wait for the transaction to be mined
  }

  async getTokenPrice(): Promise<number> {
    // Assuming you have a function getTokenPrice in your Token.sol
    const price = await this.auctionContract.getTokenPrice();
    return +price; // Convert BigNumber to number
  }

  async getTokenAmount(): Promise<number> {
    // Assuming you have a function getTokenAmount in your Token.sol
    const amount = await this.auctionContract.getTokenAmount();
    return +amount; // Convert BigNumber to number
  }

  async buyTokens(amount: number): Promise<void> {
    // Assuming you have a function buyToken in your Token.sol
    const tx = await this.auctionContract.buyToken(amount);
    await tx.wait(); // Wait for the transaction to be mined
  }

  // ... Other service methods
}
