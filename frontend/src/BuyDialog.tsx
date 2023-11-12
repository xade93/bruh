import { CSSProperties, useState } from 'react';
import { 
  TokenAddr, 
  AuctionAddr, 
  Acc0Addr, 
  TokenABI, 
  AuctionABI,
  provider,
  signer,
  DUTContract,
  AuctionContract,
  DUTWSigner,
  AuctionWSigner,
  init
} from './AuctionVars';
interface BuyDialogProps {
  auctionId: number;
  unitPrice: number;
}

export const BuyDialog: React.FC<BuyDialogProps> = ({auctionId, unitPrice}) => {
  console.log(`sanity: ${auctionId} and  ${unitPrice}`)
  const [amount, setAmount] = useState(0);

  const totalDeposit = amount * unitPrice;

  const style: CSSProperties = {
    backgroundColor: 'white', 
    padding: '20px',
    borderRadius: '10px'
  };

  const handleConfirm = () => {
    AuctionWSigner.bid(auctionId, {value: totalDeposit}).then(() => {
      console.log("Bid successfully");
    })
  }

  return (
    <dialog open style={style}>
      <h2>Buy Token</h2>
      
      <p>
        <label>Amount:</label>
        <input 
          type="number"
          value={amount}
          onChange={e => setAmount(Number(e.target.value))} 
        />
      </p>

      <p>
        You need to deposit (est.): {totalDeposit.toFixed(2)} wei
      </p>

      <div>
        <button onClick={handleConfirm}>Confirm</button>
        <button>Cancel</button>
      </div>

    </dialog>
  );
}