import React, { useState, useEffect } from 'react';
import './App.css';
import { AuctionForm } from './AuctionForm'; 
import { BuyDialog } from './BuyDialog';
type TokenData = {
  name: string;
  currentPrice: number;
  remainingTime: number;
};

const initialTokens: TokenData[] = [
  { name: 'MyToken', currentPrice: 1.82, remainingTime: 30 },
  { name: 'DogeToken', currentPrice: 302.12, remainingTime: 30 },
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



  const addNewAuction = (newToken: TokenData) => {
    // TODO interact with ethereum
    setShowForm(false); // Close the form after adding the new auction
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
          onBuy={(am)=>{}}
          onCancel={()=>{}}
        />}
    </div>
  );
};

export default App;
