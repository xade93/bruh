import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseGwei } from "viem";

describe("Lock", function () {

  async function prepareDutchAuction() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.viem.getWalletClients();

    const lock = await hre.viem.deployContract("DutchAuction", [1000n, 500n, 25n, 100n]);

    const publicClient = await hre.viem.getPublicClient();

    return {
      lock,
      owner,
      otherAccount,
      publicClient
    };
  }

  describe("Deployment", function () {
    it("Should init prepareDutchAuction", async function () {
      const { lock, owner, otherAccount, publicClient } = await loadFixture(prepareDutchAuction);

      expect(lock === lock);
    });
    it("Should set correct initial values", async function () {
      const { lock } = await loadFixture(prepareDutchAuction);
      // console.log("Lock object:", lock);
      await expect(lock.read.currentPrice()).rejectedWith("auction is not running");
      // Add more checks here
    });
    it("Should correctly initiate auction process", async function () {
      const { lock } = await loadFixture(prepareDutchAuction);
      await lock.write.startAuction();
      expect(await lock.read.currentPrice()).to.equal(1000n);
    });
    it("Should correctly decrease price when no transaction is made", async function () {
      const { lock } = await loadFixture(prepareDutchAuction);
      await lock.write.startAuction();
      const waitingTime = BigInt((await time.latest()) + 256); // waiting 256 seconds
      await time.increaseTo(waitingTime)
      expect(await lock.read.currentPrice()).to.equal(990n);
    });
  });


});
