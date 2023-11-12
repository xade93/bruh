import hre from "hardhat";

async function main() {
  // The contract ABI and address
  const contractABI = require("/home/xade/cx4153/bruh/artifacts/contracts/Auction.sol/DutchAuction.json").abi; // TODO
  const contractAddress = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512";
  const publicClient = await hre.viem.getPublicClient();
  
  const [owner, walletA, walletB] = await hre.viem.getWalletClients();
  const [accountA] = await owner.getAddresses()
  
  // const { request } = await publicClient.simulateContract({
  //   address: contractAddress,
  //   abi: contractABI,
  //   functionName: 'mint',
  // })
  // await accountA.writeContract(request)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});