import { Component } from '@angular/core';
import { AuctionService } from './auction.service';

@Component({
  selector: 'app-auction',
  template: `
    <div>
      <h2>Start an Auction</h2>
      <input type="number" [(ngModel)]="startPrice" placeholder="Start Price" />
      <input type="number" [(ngModel)]="reservePrice" placeholder="Reserve Price" />
      <input type="number" [(ngModel)]="priceDropInterval" placeholder="Price Drop Interval" />
      <input type="number" [(ngModel)]="initialSupply" placeholder="Initial Supply" />
      <button (click)="initializeAuction()">Initialize Auction</button>
      
      <h2>Token Operations</h2>
      <button (click)="getTokenPrice()">Get Token Price</button>
      <p>Current Token Price: {{tokenPrice}}</p>
      <button (click)="getTokenAmount()">Get Token Amount</button>
      <p>Current Token Amount: {{tokenAmount}}</p>
      <input type="number" [(ngModel)]="buyAmount" placeholder="Amount to Buy" />
      <button (click)="buyTokens()">Buy Tokens</button>
    </div>
  `
})
export class AuctionComponent {
  startPrice: number;
  reservePrice: number;
  priceDropInterval: number;
  initialSupply: number;
  tokenPrice: number;
  tokenAmount: number;
  buyAmount: number;

  constructor(private auctionService: AuctionService) {}

  initializeAuction() {
    this.auctionService.initializeAuction(this.startPrice, this.reservePrice, this.priceDropInterval, this.initialSupply)
      .then(() => {
        console.log('Auction initialized');
      }).catch(error => {
        console.error('Error initializing auction:', error);
      });
  }

  getTokenPrice() {
    this.auctionService.getTokenPrice()
      .then(price => {
        this.tokenPrice = price;
      }).catch(error => {
        console.error('Error retrieving token price:', error);
      });
  }

  getTokenAmount() {
    this.auctionService.getTokenAmount()
      .then(amount => {
        this.tokenAmount = amount;
      }).catch(error => {
        console.error('Error retrieving token amount:', error);
      });
  }

  buyTokens() {
    if (!this.buyAmount) {
      console.error('Please enter an amount to buy');
      return;
    }
    this.auctionService.buyTokens(this.buyAmount)
      .then(() => {
        console.log('Tokens purchased');
      }).catch(error => {
        console.error('Error purchasing tokens:', error);
      });
  }

  // ... Other component methods
}
