import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseGwei } from "viem";

describe("DutchAuction", function () {

  async function prepareDutchAuction() {
    // Contracts are deployed using the first signer/account by default
    const [owner, accountA, accountB, accountC] = await hre.viem.getWalletClients();

    const DUT = await hre.viem.deployContract("DUT", [2048n]);

    const auction = await hre.viem.deployContract("DutchAuction", [DUT.address]);

    const publicClient = await hre.viem.getPublicClient();

    return {
      DUT,
      auction,
      owner,
      accountA,
      accountB,
      accountC,
      publicClient
    };
  }

  describe("Deployment", function () {
    it("Should init prepareDutchAuction", async function () {
      const { DUT, auction, owner, accountA, accountB, accountC, publicClient } = await loadFixture(prepareDutchAuction);
      expect(DUT).to.be.not.null;
      expect(auction).to.be.not.null;
    });
    it("Can run a DutchAuction", async function () {
      const { DUT, auction, owner, accountA, accountB, accountC, publicClient } = await loadFixture(prepareDutchAuction);

      expect(await DUT.read.auctionHouse()).to.equal(getAddress(owner.account.address));
      const ownerAuction = await (hre.viem.getContractAt(
        "DutchAuction",
        auction.address,
        { walletClient: owner }
      ));
      const userA = await (hre.viem.getContractAt(
        "DutchAuction",
        auction.address,
        { walletClient: accountA }
      ));
      const userADUT = await (hre.viem.getContractAt(
        "DUT",
        DUT.address,
        { walletClient: accountA }
      ));
      const userB = await (hre.viem.getContractAt(
        "DutchAuction",
        auction.address,
        { walletClient: accountB }
      ));
      await expect(
        userA.write.createAuction([100n, 10n, 100n, 1n])
      ).rejectedWith("allowance is not enough");
      await expect(
        DUT.write.transfer([accountA.account.address, 1000n])
      ).to.be.fulfilled;
      await expect(
        DUT.write.transfer([accountB.account.address, 1000n])
      ).to.be.fulfilled;
      await expect(
        userA.write.createAuction([100n, 10n, 100n, 1n])
      ).to.be.rejected;
      await expect(userADUT.write.approve([auction.address, 1000n])).to.be.fulfilled;
      await expect(
        userA.write.createAuction([1000n, 500n, 25n, 100n])
      ).to.be.fulfilled;
    
      const waitingTime = BigInt((await time.latest()) + 60); // waiting 60 seconds
      await time.increaseTo(waitingTime)
      expect(await auction.read.currentPrice([0n])).to.equal(975n);
      await expect(
        userA.write.endAuction([0n])
      ).to.be.rejected;
      const waitingTime2 = BigInt((await time.latest()) + 60 * 20); // waiting 20 minutes
      await time.increaseTo(waitingTime2)
      await expect(
        userB.write.completeAuction([0n])
      ).to.be.rejected;
      await expect(
        userA.write.endAuction([0n])
      ).to.be.fulfilled;
      await expect(
        userB.write.completeAuction([0n])
      ).to.be.fulfilled;
      await expect(
        ownerAuction.write.burnToken([accountA.account.address])
      ).to.be.fulfilled;
    });
    it("Should able to pay", async function () {
      const { DUT, auction, owner, accountA, accountB, accountC, publicClient } = await loadFixture(prepareDutchAuction);

      expect(await DUT.read.auctionHouse()).to.equal(getAddress(owner.account.address));
      const ownerAuction = await (hre.viem.getContractAt(
        "DutchAuction",
        auction.address,
        { walletClient: owner }
      ));
      const userA = await (hre.viem.getContractAt(
        "DutchAuction",
        auction.address,
        { walletClient: accountA }
      ));
      const userADUT = await (hre.viem.getContractAt(
        "DUT",
        DUT.address,
        { walletClient: accountA }
      ));
      const userB = await (hre.viem.getContractAt(
        "DutchAuction",
        auction.address,
        { walletClient: accountB }
      ));
      await expect(
        DUT.write.transfer([accountA.account.address, 1000n])
      ).to.be.fulfilled;
      await expect(userADUT.write.approve([auction.address, 1000n])).to.be.fulfilled;
      await expect(
        userA.write.createAuction([1000n, 500n, 25n, 100n])
      ).to.be.fulfilled;
      await expect(
        userB.write.bid([0n], { value: 100000n })
      ).to.fulfilled;
      expect(await auction.read.totalCommitment([0n])).to.equal(100000n);
      expect(await auction.read.finalPrice([0n])).to.equal(1000n);
      await expect(
        userB.write.completeAuction([0n])
      ).to.be.fulfilled;
      expect(await DUT.read.balanceOf([accountB.account.address])).to.equal(100n);
    });
  });


});
