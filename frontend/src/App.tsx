import React, { useState, useEffect } from 'react';
import './App.css';
import { AuctionForm } from './AuctionForm'; 
import { BuyDialog } from './BuyDialog';
import { ethers } from 'ethers';
import { Numbers } from 'web3';

// TODO: update after deployment
const contractABI = require("../artifacts/contracts/Auction.sol/DutchAuction.json").abi; 
const contractAddress = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512";

type TokenData = {
  name: string;
  currentPrice: number;
  reservePrice: number;
  priceDropInterval: number;
  initialSupply: Numbers;
  remainingTime: number;
};

const initialTokens: TokenData[] = [
  // { name: 'MyToken', currentPrice: 1.82, remainingTime: 30 },
  // { name: 'DogeToken', currentPrice: 302.12, remainingTime: 30 },
];

const App: React.FC = () => {
  const [tokens, setTokens] = useState<TokenData[]>(initialTokens);
  const [showForm, setShowForm] = useState(false);
  const [buyDiag, setBuyDiag] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTokens((currentTokens) =>
        currentTokens.map((token) => ({
          ...token,
          remainingTime: Math.max(token.remainingTime - 1, 0),
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);


  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const auctionContract = new ethers.Contract(contractAddress, contractABI, signer);

  const addNewAuction = async (newToken: TokenData) => {
    try {
      const name = ethers.utils.parseEther(newToken.name);
      const startPrice = ethers.utils.parseEther(newToken.currentPrice.toString());
      const reservePrice = ethers.utils.parseEther(newToken.reservePrice.toString());
      const priceDropInterval = ethers.utils.parseEther(newToken.priceDropInterval.toString());
      const initialSupply = ethers.BigNumber.from(newToken.initialSupply);
      const transaction = await auctionContract.createAuction(
        startPrice,
        reservePrice,
        priceDropInterval,
        initialSupply
      );
      await transaction.wait();
      setShowForm(false); 
    } catch (error) {
      console.error("Error adding new auction:", error);
    }
  };

  const handleBuy = async (auctionId: number) => {
    try {
      const currentPrice = await auctionContract.currentPrice(auctionId);
      const transaction = await auctionContract.bid(auctionId, {
        value: currentPrice // Send the current price as the bid amount
      });
      await transaction.wait(); 
      setBuyDiag(false);

    } catch (error) {
      console.error("Error placing a bid:", error);
    }
  };

  return (
    <div className="App">
      <div className="top-bar">
        AuctionTrader™
         <button className="add-button" onClick={() => setShowForm(true)}>+</button>
      </div>
      {showForm && <AuctionForm addNewAuction={addNewAuction} />}
      <div className="token-container">
        {tokens.map((token, index) => (
          <div key={index} className="token-display">
            <h2>{token.name}</h2>
            <p>Current Price: ${token.currentPrice.toFixed(2)}</p>
            <p>Remaining Time: {token.remainingTime}s</p>
            <button className="buy-button" onClick={() => setBuyDiag(true)}>Buy</button>
          </div>
        ))}
      </div>
      {buyDiag && 
        <BuyDialog // FIXME
          token="1"
          onBuy={handleBuy}
          onCancel={() => setBuyDiag(false)}
        />}
    </div>
  );
};

export default App;
