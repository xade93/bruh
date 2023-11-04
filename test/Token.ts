import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseGwei } from "viem";
describe("Token", () => {
  async function prepareDUTToken() {
    const [owner, accountA, accountB, accountC] = await hre.viem.getWalletClients();

    const DUT = await hre.viem.deployContract("DUT", [256]);

    const publicClient = await hre.viem.getPublicClient();

    return {
      DUT,
      owner,
      accountA,
      accountB,
      accountC,
      publicClient
    }
  }

  describe("Depolyment", function () {
    it("Should init DUT Token", async function () {
      const { DUT, owner, accountA, accountB, publicClient } = await loadFixture(prepareDUTToken);
      expect(DUT === DUT);
    });
    it("Should set correct initial values", async function () {
      const { DUT, owner } = await loadFixture(prepareDUTToken);
      expect(await DUT.read.name()).to.equal("DutchToken");
      expect(await DUT.read.symbol()).to.equal("DUT");
      expect(await DUT.read.totalSupply()).to.equal(256n);
    });
    it("AuctionHouse should be the creater", async function () {
      const { DUT, owner } = await loadFixture(prepareDUTToken);
      expect(await DUT.read.auctionHouse()).to.equal(getAddress(owner.account.address));
    });
    it("Other can only transfer the money after allowance", async function () {
      const { DUT, owner, accountA, accountB, accountC } = await loadFixture(prepareDUTToken);
      const userA = await hre.viem.getContractAt(
        "DUT",
        DUT.address,
        { walletClient: accountA }
      );
      const userB = await hre.viem.getContractAt(
        "DUT",
        DUT.address,
        { walletClient: accountB }
      );
      await expect(
        userA.write.transfer([accountB.account.address, 10n])
      ).to.be.rejected;
      await expect(
        DUT.write.transfer([accountA.account.address, 10n])
      ).to.be.fulfilled;
      expect(
        await userA.read.balanceOf([accountA.account.address])
      ).to.equal(10n);
      expect(
        await userA.read.lockedBalanceOf([accountA.account.address])
      ).to.equal(0n);
      await expect(
        userA.write.transfer([accountB.account.address, 10n])
      ).to.be.fulfilled;
      await expect(
        userA.write.transferFrom([accountC.account.address, accountB.account.address, 10n])
      ).to.be.rejectedWith("locked balance is not enough to transfer");
      await expect(
        userB.write.approve([accountA.account.address, 10n])
      ).to.be.fulfilled;
      await expect(
        userA.write.transferFrom([accountB.account.address, accountC.account.address, 10n])
      ).to.be.fulfilled;
 
    });
  })
});
