// BuyDialog.tsx

import { CSSProperties, useState } from 'react';

type BuyDialogProps = {
  token: string; // FIXME
  onBuy: (amount: number) => void; 
  onCancel: () => void;
};

export const BuyDialog = ({ token, onBuy, onCancel }: BuyDialogProps) => {

  const [amount, setAmount] = useState(0);

  const totalDeposit = amount * 123; // FIXME: token.currPrice

  const style: CSSProperties = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px'   
  };
  // FIXME
  return (
    <dialog open style={style}>
    
      <h2>Buy TOKENNAME</h2> 

      <p>
        <label>Amount:</label>
        <input 
          type="number"
          value={amount}
          onChange={e => setAmount(Number(e.target.value))}
        />  
      </p>

      <p>
        You need to deposit: {totalDeposit.toFixed(2)} 
      </p>

      <div>
        <button onClick={() => onBuy(amount)}>Confirm</button>
        <button onClick={onCancel}>Cancel</button>  
      </div>

    </dialog>
  );

};