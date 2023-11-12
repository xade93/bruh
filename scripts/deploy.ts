import { formatEther, parseEther } from "viem";
import hre from "hardhat";

async function main() {
  const DUT = await hre.viem.deployContract("DUT", [2048n]);
  console.log(DUT)
  const auction = await hre.viem.deployContract("DutchAuction", [DUT.address]);
  console.log(auction)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
