import React, { useState, useEffect } from 'react';
import { ethers } from "ethers";
import './App.css';
import { AuctionForm } from './AuctionForm'; 
import { BuyDialog } from './BuyDialog';
import { TokenData, TokenContractData } from './DataTypes';

const addMoney = (contractWSigner: ethers.Contract, Acc0Addr: string) => {
  contractWSigner.balanceOf(Acc0Addr).then((ba: ethers.BigNumber) => {
    console.log(`ba = ${ba}`)
  });
  contractWSigner.getMoney(Acc0Addr, 0);
  contractWSigner.balanceOf(Acc0Addr).then((ba: ethers.BigNumber) => {
    console.log(`new_ba = ${ba}`)
  });
}

let currTokens: TokenData[] = [
  { name: 'MyToken', currentPrice: 1.82, remainingTime: "01:21" },
  { name: 'DogeToken', currentPrice: 302.12, remainingTime: "02:36" },
];

function formatUnixTimestampToMMSS(unixTimestamp: number): string {
  // Convert the Unix timestamp from milliseconds to seconds
  const seconds = Math.floor(unixTimestamp);

  // Calculate minutes and seconds
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  // Format minutes and seconds to always have two digits
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = remainingSeconds.toString().padStart(2, '0');

  // Return the formatted time
  return `${formattedMinutes}:${formattedSeconds}`;
}


const App: React.FC = () => {
  const TokenAddr = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
  const AuctionAddr = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512";
  const Acc0Addr = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const TokenABI = require("/home/xade/cx4153/bruh/frontend/src/artifacts/contracts/Token.sol/DUT.json").abi;
  const AuctionABI = require("/home/xade/cx4153/bruh/frontend/src/artifacts/contracts/Auction.sol/DutchAuction.json").abi
  
  const [showForm, setShowForm] = useState(false);
  const [buyDiag, setBuyDiag] = useState(false);

  let provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
  let signer = provider.getSigner(Acc0Addr)
  let DUTContract = new ethers.Contract(TokenAddr, TokenABI, provider);
  let AuctionContract = new ethers.Contract(AuctionAddr, AuctionABI, provider);
  const DUTWSigner = DUTContract.connect(signer);
  const AuctionWSigner = AuctionContract.connect(signer);
  let [tokens, setTokens] = useState<TokenData[]>(currTokens);

  // display balance
  provider.getBalance(Acc0Addr).then(bal => { // wei - 1e22 initially
    console.log(`Test Account ETH bal = ${bal} wei`)
  });
  DUTWSigner.balanceOf(Acc0Addr).then((ba: ethers.BigNumber) => {
    console.log(`Test Account DUT bal = ${ba} PCS`)
  });

  // one-time approval of 400
  // DUTWSigner.approve(AuctionAddr, 400).then(
  //   () => {
  //     console.log("Approal of 400 wei")
  //   }
  // )
  const addNewAuction = async (newTokenb: TokenContractData) => {
    const newToken = {currentPrice: 13, reservePrice: 2, priceDropInterval: 1, initialSupply: 2};;
    console.log("allowance successfully transferred");
    const tx = await AuctionWSigner.createAuction(newToken.currentPrice, newToken.reservePrice, newToken.priceDropInterval, newToken.initialSupply);
    const ret = await tx.wait();
    console.log("Auction Created.");
    getAllAuctions().then(); // debug
  };

  const getAllAuctions = async () => {
    const auctionsCount = await AuctionWSigner.auctionCount(); // If you have a method to get the count
    console.log(auctionsCount)
    let auctions = [];

    for (let i = 0; i < auctionsCount; i++) {
        const auction = await AuctionWSigner.auctions(i);
        const aa = auction.toNumber();
        auctions.push(aa);
    }

    let ret = [];
    for (let i = 0; i < auctionsCount; ++i) {
      const ret2 = await AuctionWSigner.getState(i);
      const sp = await AuctionWSigner.startPrice(i);
      const rp = await AuctionWSigner.reservePrice(i);
      const startTime = await AuctionWSigner.startTime(i);
      let duration = "Not Started";
      let currPrice = 0;
      if (ret2 == 1) {
        currPrice = await AuctionWSigner.currentPrice(i);
        console.log(`${Date.now()} and ${startTime} and ${40 * 60 - (Date.now() / 1000 - startTime)}`)
        duration = formatUnixTimestampToMMSS(40 * 60 - (Date.now() / 1000 - startTime));
      }
      console.log(`${i}th auction has state ${ret2} and start price ${sp} reserve price ${rp} with currPrice ${currPrice} and startTime ${duration}`);
      let currObj: TokenData = {
        name: "bruh",
        currentPrice: currPrice,
        remainingTime: duration,
      }
      ret.push(currObj)
    }

    console.log(`All auction IDs: ${auctions}`);

    return ret;
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      getAllAuctions().then((newTokens: TokenData[]) => {
        console.log(`Global token list updated with ${JSON.stringify(newTokens)}`);
        setTokens(newTokens);
      });
    }, 1000); // Refresh every 10000 milliseconds (10 seconds)

    return () => clearInterval(intervalId); // Clear interval on component unmount
  }, []);
  

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
            <p>Current Price: {token.currentPrice.toString()} wei</p>
            <p>Remaining Time: {token.remainingTime}</p>
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
