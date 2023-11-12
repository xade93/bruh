export type TokenData = {
    name: string;
    currentPrice: number;
    remainingTime: string;
    remainingTokens: number;
    auctionId: number;
  };
  
export type TokenContractData = {
    name: string;
    currentPrice: number;
    reservePrice: number;
    priceDropInterval: number;
    initialSupply: number;
    auctionId: number;
};
