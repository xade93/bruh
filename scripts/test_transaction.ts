import hre from "hardhat";
import { formatEther, parseEther } from "viem";

async function main() {
  // The contract ABI and address
  const [fromWalletClient, toWalletClient] = await hre.viem.getWalletClients();

  const hash = await fromWalletClient.sendTransaction({
    to: toWalletClient.account.address,
    value: parseEther("0.0001"),
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
