export type TokenData = {
    name: string;
    currentPrice: number;
    remainingTime: string;
  };
  
export type TokenContractData = {
    name: string;
    currentPrice: number;
    reservePrice: number;
    priceDropInterval: number;
    initialSupply: number;
};
