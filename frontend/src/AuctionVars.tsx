import { ethers } from "ethers";

export const TokenAddr = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
export const AuctionAddr = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512";
export const Acc0Addr = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
export const TokenABI = require("/home/xade/cx4153/bruh/frontend/src/artifacts/contracts/Token.sol/DUT.json").abi;
export const AuctionABI = require("/home/xade/cx4153/bruh/frontend/src/artifacts/contracts/Auction.sol/DutchAuction.json").abi

export let provider: ethers.providers.JsonRpcProvider;
export let signer: ethers.providers.JsonRpcSigner;
export let DUTContract: ethers.Contract;
export let AuctionContract: ethers.Contract;
export let DUTWSigner: ethers.Contract;
export let AuctionWSigner: ethers.Contract;

export function init() {
    provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
    signer = provider.getSigner(Acc0Addr)
    DUTContract = new ethers.Contract(TokenAddr, TokenABI, provider);
    AuctionContract = new ethers.Contract(AuctionAddr, AuctionABI, provider);
    DUTWSigner = DUTContract.connect(signer);
    AuctionWSigner = AuctionContract.connect(signer);
}