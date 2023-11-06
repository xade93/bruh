import { Component } from '@angular/core';
import { TokenService } from './token.service';

@Component({
  selector: 'app-token',
  template: `
    <div>
      <h2>Token Wallet</h2>
      <input type="text" [(ngModel)]="userAddress" placeholder="Your Address" />
      <button (click)="getBalance()">Check Balance</button>
      <p>Your Balance: {{userBalance}}</p>

      <h2>Transfer Tokens</h2>
      <input type="text" [(ngModel)]="recipientAddress" placeholder="Recipient Address" />
      <input type="number" [(ngModel)]="transferAmount" placeholder="Amount to Transfer" />
      <button (click)="transferTokens()">Transfer</button>
    </div>
  `
})
export class TokenComponent {
  userAddress: string;
  recipientAddress: string;
  transferAmount: number;
  userBalance: number;

  constructor(private tokenService: TokenService) {}

  getBalance() {
    this.tokenService.getBalance(this.userAddress)
      .then(balance => {
        this.userBalance = balance;
      }).catch(error => {
        console.error('Error retrieving balance:', error);
      });
  }

  transferTokens() {
    this.tokenService.transferTokens(this.userAddress, this.recipientAddress, this.transferAmount)
      .then(() => {
        console.log('Transfer successful');
        this.getBalance(); // Update balance after transfer
      }).catch(error => {
        console.error('Error transferring tokens:', error);
      });
  }

  // ... Other component methods
}
