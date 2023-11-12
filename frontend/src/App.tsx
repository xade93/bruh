import React, { useState, useEffect } from 'react';
import { ethers } from "ethers";
import './App.css';
import { AuctionForm } from './AuctionForm'; 
import { BuyDialog } from './BuyDialog';
import { TokenData, TokenContractData } from './DataTypes';
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
  // { name: 'MyToken', currentPrice: 1.82, remainingTime: "01:21", auctionId: 114},
  // { name: 'DogeToken', currentPrice: 302.12, remainingTime: "02:36", auctionId: 514 },
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
  init()
  const [showForm, setShowForm] = useState(false);
  const [buyDiag, setBuyDiag] = useState(false);

  let [tokens, setTokens] = useState<TokenData[]>(currTokens);
  let [activeAuction, setActiveAuction] = useState(0);
  let [unitPrice, setUnitPrice] = useState(0);

  // display balance
  provider.getBalance(Acc0Addr).then(bal => { // wei - 1e22 initially
    console.log(`Test Account ETH bal = ${bal} wei`)
  });
  DUTWSigner.balanceOf(Acc0Addr).then((ba: ethers.BigNumber) => {
    console.log(`Test Account DUT bal = ${ba} PCS`)
  });

  // Give test account some $$$ to test, this is not a bug lol
  DUTWSigner.getMoney(Acc0Addr, 10000).then(
    () => {
      console.log("MONEY!!!!!!!")
      DUTWSigner.approve(AuctionAddr, 400).then(
        () => {
          console.log("Approal of 400 wei")
        }
      )
    }
  )

  // one-time approval of 400 DUTs

  const addNewAuction = async (newToken: TokenContractData) => {
    // const newToken = {currentPrice: 13, reservePrice: 2, priceDropInterval: 1, initialSupply: 2};
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
      let duration = Date.now() / 1000 - startTime; // in seconds
      let currPrice = 0;
      let duration_str = "Not Started";
      let remainingTokens = 0;
      if (ret2 == 1 && duration <= 10 * 60) {
        console.log(`${Date.now() / 1000} and ${startTime} and Duration is: ${duration}`)
        currPrice = await AuctionWSigner.currentPrice(i);
        remainingTokens = (await AuctionWSigner.remainMaximumToken(i)).toNumber();
        duration_str = formatUnixTimestampToMMSS(20 * 60 - duration);
      }
      console.log(`${i}th auction has state ${ret2} and start price ${sp} reserve price ${rp} with currPrice ${currPrice} and startTime ${duration}`);
      let currObj: TokenData = {
        name: "Auction " + i.toString(),
        currentPrice: currPrice,
        remainingTime: duration_str,
        auctionId: i,
        remainingTokens: remainingTokens,
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
            <p>Remaining Tokens (est.): {token.remainingTokens}</p>
            <button className="buy-button" onClick={() => {
              setBuyDiag(true)
              setActiveAuction(token.auctionId)
              setUnitPrice(token.currentPrice)
            }}>Buy</button>
          </div>
        ))}
      </div>
      {buyDiag && <BuyDialog auctionId={activeAuction} unitPrice={unitPrice}/>}
    </div>
  );
};

export default App;
