import { ethers } from "hardhat";
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  // Deploy the DUT Token
  const DUTToken = await ethers.getContractFactory("DUT");
  const initialSupply = ethers.utils.parseEther("1000000"); // Example initial supply
  const dutToken = await DUTToken.deploy(initialSupply);
  await dutToken.deployed();

  console.log("DUT Token deployed to address:", dutToken.address);

  // Deploy the DutchAuction Contract
  const DutchAuction = await ethers.getContractFactory("DutchAuction");
  const dutchAuction = await DutchAuction.deploy(dutToken.address);
  await dutchAuction.deployed();

  console.log("DutchAuction deployed to address:", dutchAuction.address);

  // Save the DutchAuction contract address
  const addressFilePath = path.join(__dirname, '../frontend/src/dutchAuction-address.json');
  fs.writeFileSync(addressFilePath, JSON.stringify({ address: dutchAuction.address }));

  // Save the DutchAuction contract ABI
  const artifactsDir = path.join(__dirname, '../artifacts/contracts/');
  const auctionABIPath = path.join(artifactsDir, 'DutchAuction.sol/DutchAuction.json');
  const abiOutputPath = path.join(__dirname, '../frontend/src/contracts');
  
  if (!fs.existsSync(abiOutputPath)) {
    fs.mkdirSync(abiOutputPath, { recursive: true });
  }

  fs.copyFileSync(auctionABIPath, path.join(abiOutputPath, 'DutchAuction.json'));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
