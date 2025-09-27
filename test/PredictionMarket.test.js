const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PredictionMarket", function () {
  let predictionMarket;
  let owner;
  let user1;
  let user2;
  let user3;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    predictionMarket = await PredictionMarket.deploy();
    await predictionMarket.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await predictionMarket.owner()).to.equal(owner.address);
    });

    it("Should have correct initial values", async function () {
      expect(await predictionMarket.VOTE_COST()).to.equal(ethers.parseEther("1"));
      expect(await predictionMarket.feePercentage()).to.equal(2);
      expect(await predictionMarket.showCounter()).to.equal(0);
    });
  });

  describe("Show Creation", function () {
    it("Should create a show successfully", async function () {
      const contestantNames = ["Contestant A", "Contestant B", "Contestant C"];
      const duration = 24 * 60 * 60; // 24 hours

      await predictionMarket.createShow("Big Boss Show", contestantNames, duration);

      const showInfo = await predictionMarket.getShowInfo(1);
      expect(showInfo.name).to.equal("Big Boss Show");
      expect(showInfo.isActive).to.be.true;
      expect(showInfo.isEnded).to.be.false;
    });

    it("Should fail to create show with invalid parameters", async function () {
      // Empty show name
      await expect(
        predictionMarket.createShow("", ["A", "B"], 3600)
      ).to.be.revertedWith("Show name cannot be empty");

      // Less than 2 contestants
      await expect(
        predictionMarket.createShow("Show", ["A"], 3600)
      ).to.be.revertedWith("At least 2 contestants required");

      // Too many contestants
      const manyContestants = Array(51).fill("Contestant");
      await expect(
        predictionMarket.createShow("Show", manyContestants, 3600)
      ).to.be.revertedWith("Too many contestants");

      // Invalid duration
      await expect(
        predictionMarket.createShow("Show", ["A", "B"], 0)
      ).to.be.revertedWith("Invalid duration");
    });

    it("Should only allow owner to create shows", async function () {
      await expect(
        predictionMarket.connect(user1).createShow("Show", ["A", "B"], 3600)
      ).to.be.revertedWithCustomError(predictionMarket, "OwnableUnauthorizedAccount");
    });
  });

  describe("Betting", function () {
    beforeEach(async function () {
      const contestantNames = ["Contestant A", "Contestant B"];
      await predictionMarket.createShow("Test Show", contestantNames, 3600);
    });

    it("Should place a bet successfully", async function () {
      const betAmount = ethers.parseEther("2"); // 2 votes
      
      await expect(
        predictionMarket.connect(user1).bet(1, 1, 2, { value: betAmount })
      ).to.emit(predictionMarket, "BetPlaced")
      .withArgs(1, user1.address, 2, 2);

      const userVotes = await predictionMarket.getUserVotes(1, 1, user1.address);
      expect(userVotes).to.equal(2);
    });

    it("Should fail with incorrect payment amount", async function () {
      await expect(
        predictionMarket.connect(user1).bet(1, 1, 2, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Incorrect payment amount");
    });

    it("Should fail with invalid vote amount", async function () {
      await expect(
        predictionMarket.connect(user1).bet(1, 1, 0, { value: ethers.parseEther("0") })
      ).to.be.revertedWith("Invalid vote amount");

      await expect(
        predictionMarket.connect(user1).bet(1, 1, 1001, { value: ethers.parseEther("1001") })
      ).to.be.revertedWith("Invalid vote amount");
    });

    it("Should fail to bet on non-existent show", async function () {
      await expect(
        predictionMarket.connect(user1).bet(999, 1, 1, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Show does not exist");
    });

    it("Should fail to bet on non-existent contestant", async function () {
      await expect(
        predictionMarket.connect(user1).bet(1, 999, 1, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Contestant does not exist");
    });
  });

  describe("Show Ending and Prize Distribution", function () {
    beforeEach(async function () {
      const contestantNames = ["Contestant A", "Contestant B"];
      await predictionMarket.createShow("Test Show", contestantNames, 3600);
      
      // Place bets
      await predictionMarket.connect(user1).bet(1, 1, 2, { value: ethers.parseEther("2") });
      await predictionMarket.connect(user2).bet(1, 1, 1, { value: ethers.parseEther("1") });
      await predictionMarket.connect(user3).bet(1, 2, 3, { value: ethers.parseEther("3") });
    });

    it("Should end show and determine winner", async function () {
      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine");

      await expect(
        predictionMarket.endShow(1, 1)
      ).to.emit(predictionMarket, "ShowEnded")
      .withArgs(1, 1, ethers.parseEther("6"));

      const winnerInfo = await predictionMarket.getWinnerOfShow(1);
      expect(winnerInfo.winnerId).to.equal(1);
      expect(winnerInfo.winnerName).to.equal("Contestant A");
      expect(winnerInfo.totalVotes).to.equal(3);
    });

    it("Should distribute prizes correctly", async function () {
      // End the show
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine");
      await predictionMarket.endShow(1, 1);

      // Check initial balances
      const initialBalance1 = await ethers.provider.getBalance(user1.address);
      const initialBalance2 = await ethers.provider.getBalance(user2.address);

      // Redeem prizes
      const tx1 = await predictionMarket.connect(user1).redeemPrize(1);
      const tx2 = await predictionMarket.connect(user2).redeemPrize(1);

      const receipt1 = await tx1.wait();
      const receipt2 = await tx2.wait();

      const gasUsed1 = receipt1.gasUsed * receipt1.gasPrice;
      const gasUsed2 = receipt2.gasUsed * receipt2.gasPrice;

      const finalBalance1 = await ethers.provider.getBalance(user1.address);
      const finalBalance2 = await ethers.provider.getBalance(user2.address);

      // User1 had 2 votes, User2 had 1 vote, total winner votes = 3
      // Total prize = 6 ETH, platform fee = 0.12 ETH, net prize = 5.88 ETH
      // User1 should get: 5.88 * 2/3 = 3.92 ETH
      // User2 should get: 5.88 * 1/3 = 1.96 ETH
      const expectedPrize1 = ethers.parseEther("3.92");
      const expectedPrize2 = ethers.parseEther("1.96");

      expect(finalBalance1).to.be.closeTo(
        initialBalance1 + expectedPrize1 - gasUsed1,
        ethers.parseEther("0.01")
      );
      expect(finalBalance2).to.be.closeTo(
        initialBalance2 + expectedPrize2 - gasUsed2,
        ethers.parseEther("0.01")
      );
    });

    it("Should prevent double redemption", async function () {
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine");
      await predictionMarket.endShow(1, 1);

      await predictionMarket.connect(user1).redeemPrize(1);
      
      await expect(
        predictionMarket.connect(user1).redeemPrize(1)
      ).to.be.revertedWith("Already redeemed");
    });

    it("Should prevent redemption by non-winners", async function () {
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine");
      await predictionMarket.endShow(1, 1);

      await expect(
        predictionMarket.connect(user3).redeemPrize(1)
      ).to.be.revertedWith("No winning votes");
    });
  });

  describe("Show Cancellation", function () {
    beforeEach(async function () {
      const contestantNames = ["Contestant A", "Contestant B"];
      await predictionMarket.createShow("Test Show", contestantNames, 3600);
      
      await predictionMarket.connect(user1).bet(1, 1, 2, { value: ethers.parseEther("2") });
      await predictionMarket.connect(user2).bet(1, 2, 1, { value: ethers.parseEther("1") });
    });

    it("Should cancel show and refund all bets", async function () {
      const initialBalance1 = await ethers.provider.getBalance(user1.address);
      const initialBalance2 = await ethers.provider.getBalance(user2.address);

      await expect(
        predictionMarket.cancelShow(1)
      ).to.emit(predictionMarket, "ShowCancelled")
      .withArgs(1, ethers.parseEther("3"));

      const finalBalance1 = await ethers.provider.getBalance(user1.address);
      const finalBalance2 = await ethers.provider.getBalance(user2.address);

      // Check that users got refunds (balance increased from initial)
      expect(finalBalance1).to.be.greaterThan(initialBalance1);
      expect(finalBalance2).to.be.greaterThan(initialBalance2);
      
      // Check that the contract balance is now 0 (all refunded)
      const contractBalance = await predictionMarket.getContractBalance();
      expect(contractBalance).to.equal(0);
    });

    it("Should not allow cancellation after show ends", async function () {
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine");

      await expect(
        predictionMarket.cancelShow(1)
      ).to.be.revertedWith("Cannot cancel ended show");
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to end shows", async function () {
      const contestantNames = ["Contestant A", "Contestant B"];
      await predictionMarket.createShow("Test Show", contestantNames, 3600);
      
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine");

      await expect(
        predictionMarket.connect(user1).endShow(1, 1)
      ).to.be.revertedWithCustomError(predictionMarket, "OwnableUnauthorizedAccount");
    });

    it("Should only allow owner to cancel shows", async function () {
      const contestantNames = ["Contestant A", "Contestant B"];
      await predictionMarket.createShow("Test Show", contestantNames, 3600);

      await expect(
        predictionMarket.connect(user1).cancelShow(1)
      ).to.be.revertedWithCustomError(predictionMarket, "OwnableUnauthorizedAccount");
    });
  });

  describe("Pause Functionality", function () {
    it("Should pause and unpause contract", async function () {
      await predictionMarket.pause();
      expect(await predictionMarket.paused()).to.be.true;

      await predictionMarket.unpause();
      expect(await predictionMarket.paused()).to.be.false;
    });

    it("Should prevent betting when paused", async function () {
      const contestantNames = ["Contestant A", "Contestant B"];
      await predictionMarket.createShow("Test Show", contestantNames, 3600);
      
      await predictionMarket.pause();

      await expect(
        predictionMarket.connect(user1).bet(1, 1, 1, { value: ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(predictionMarket, "EnforcedPause");
    });
  });

  describe("Fee Management", function () {
    it("Should allow owner to update fee percentage", async function () {
      await predictionMarket.updateFeePercentage(5);
      expect(await predictionMarket.feePercentage()).to.equal(5);
    });

    it("Should prevent setting fee too high", async function () {
      await expect(
        predictionMarket.updateFeePercentage(11)
      ).to.be.revertedWith("Fee percentage too high");
    });

    it("Should allow owner to withdraw fees", async function () {
      const contestantNames = ["Contestant A", "Contestant B"];
      await predictionMarket.createShow("Test Show", contestantNames, 3600);
      
      await predictionMarket.connect(user1).bet(1, 1, 1, { value: ethers.parseEther("1") });
      
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine");
      await predictionMarket.endShow(1, 1);

      const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
      await predictionMarket.withdrawFees();
      const finalOwnerBalance = await ethers.provider.getBalance(owner.address);

      expect(finalOwnerBalance).to.be.gt(initialOwnerBalance);
    });
  });
});
