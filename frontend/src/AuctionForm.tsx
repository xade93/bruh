import React, { useState } from 'react';
import { CSSProperties } from 'react';
import { TokenData, TokenContractData } from './DataTypes';

const formStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 3fr', 
    gap: '1rem',
    alignItems: 'center',
    width: '100%',
    maxWidth: '500px'  
  };
  
  const labelStyle: CSSProperties = {
    fontWeight: 'bold' as const,
    marginBottom: '.5rem'
  };
  
  const inputStyle: CSSProperties = {
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ccc'
  };
  
type AuctionFormProps = {
  addNewAuction: (newToken: TokenContractData) => Promise<void>;
};

export const AuctionForm: React.FC<AuctionFormProps> = ({ addNewAuction }) => {
  const [name, setName] = useState('');
  const [tokensSupplied, setTokensSupplied] = useState(0);
  const [startPrice, setStartPrice] = useState(0);
  const [reservePrice, setReservePrice] = useState(0);
  const [priceDropInterval, setPriceDropInterval] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addNewAuction({
      name: name,
      currentPrice: startPrice,
      reservePrice: reservePrice,
      priceDropInterval: priceDropInterval,
      initialSupply: tokensSupplied,
    }).then()
  };

  return (
    <div className="auction-form">
      <h2>Submit New Auction</h2>
      <form style={formStyle} onSubmit={handleSubmit}>
        
        <label style={labelStyle}>Auction Name</label>
        <input 
          style={inputStyle}
          type="text" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="Auction Name"
        />
  
        <label style={labelStyle}>Tokens Supplied</label>  
        <input
          style={inputStyle} 
          type="number"
          value={tokensSupplied}
          onChange={(e) => setTokensSupplied(Number(e.target.value))}
          placeholder="Tokens Supplied" 
        />
  
        <label style={labelStyle}>Start Price</label>
        <input
          style={inputStyle}
          type="number"
          value={startPrice} 
          onChange={(e) => setStartPrice(Number(e.target.value))}
          placeholder="Start Price"
        />
  
        <label style={labelStyle}>Reserve Price</label>
        <input
          style={inputStyle}
          type="number" 
          value={reservePrice}
          onChange={(e) => setReservePrice(Number(e.target.value))} 
          placeholder="Reserve Price"
        />
  
        <label style={labelStyle}>Price Drop Interval</label>
        <input
          style={inputStyle}
          type="number" 
          value={priceDropInterval}
          onChange={(e) => setPriceDropInterval(Number(e.target.value))} 
          placeholder = "Price Drop Interval"
        />
        
        <button type="submit">Confirm</button>
      </form>
    </div>
  );
};
