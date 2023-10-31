import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseGwei } from "viem";
describe("Token", () => {
  async function prepareDUTToken() {
    const [owner, otherAccount] = await hre.viem.getWalletClients();

    const DUT = await hre.viem.deployContract("DUT", [256]);

    const publicClient = await hre.viem.getPublicClient();

    return {
      DUT,
      owner,
      otherAccount,
      publicClient
    }
  }

  describe("Depolyment", function () {
    it("Should init DUT Token", async function () {
      const { DUT, owner, otherAccount, publicClient } = await loadFixture(prepareDUTToken);
      expect(DUT === DUT);
    });
    it("Should set correct initial values", async function () {
      const { DUT, owner } = await loadFixture(prepareDUTToken);
      expect(await DUT.read.name()).to.equal("DutchToken");
      expect(await DUT.read.symbol()).to.equal("DUT");
      expect(await DUT.read.remainToken()).to.equal(256n);
    });
    it("Owner should be the creater", async function () {
      const { DUT, owner } = await loadFixture(prepareDUTToken);
      expect(await DUT.read.owner()).to.equal(getAddress(owner.account.address));
    });
    it("Should burn after 20 min", async function () {
      const { DUT, owner, otherAccount } = await loadFixture(prepareDUTToken);
      const unlockTime = BigInt((await time.latest()) + 20 * 60);
      await time.increaseTo(unlockTime)
      expect(await DUT.read.burnAfterTime());
      await expect(DUT.read.remainToken()).to.be.rejectedWith("Token is destroyed")
      await expect(
        DUT.write.transferTo([otherAccount.account.address, 10])
      ).to.be.rejectedWith("Token is destroyed");
    });
    it("Other cannot transfer the money to other address", async function () {
      const { DUT, owner, otherAccount } = await loadFixture(prepareDUTToken);
      const userAsOtherAccount = await hre.viem.getContractAt(
        "DUT",
        DUT.address,
        { walletClient: otherAccount }
      );
      await expect(
        userAsOtherAccount.write.transferTo([otherAccount.account.address, 10n])
      ).to.be.rejected;
    });
    it("Owner can transfer money", async function () {
      const { DUT, owner, otherAccount } = await loadFixture(prepareDUTToken);
      await expect(
        DUT.write.transferTo([otherAccount.account.address, 30n])
      ).to.be.fulfilled;
      await expect(await DUT.read.remainToken()).to.equal(226n);
    });
    it("Owner cannot transfer more money than balance", async function () {
      const { DUT, owner, otherAccount } = await loadFixture(prepareDUTToken);
      await expect(
        DUT.write.transferTo([otherAccount.account.address, 300n])
      ).to.be.rejected;
    });
  })
});
