import { Injectable } from '@angular/core';
import { ethers } from 'ethers';
import TokenContract from './contracts/Token.json';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private contract: ethers.Contract;

  constructor() {
    // Initialize the ethers.Contract object here with your Token contract's ABI and address
    // You would typically use an Ethereum provider here, like ethers.providers.Web3Provider
    const provider = new ethers.providers.JsonRpcProvider('your_rpc_url');
    const contractAddress = 'your_contract_address';
    this.contract = new ethers.Contract(contractAddress, TokenContract.abi, provider);
  }

  async getBalance(address: string): Promise<number> {
    const balance = await this.contract.balanceOf(address);
    return ethers.utils.formatEther(balance); // Convert from wei to ether
  }

  async transferTokens(fromAddress: string, toAddress: string, amount: number): Promise<void> {
    const signer = this.contract.connect(provider.getSigner(fromAddress));
    const tx = await signer.transfer(toAddress, ethers.utils.parseEther(amount.toString()));
    await tx.wait(); // Wait for the transaction to be mined
  }

  // ... Other service methods
}
