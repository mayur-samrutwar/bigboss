const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ShowContract", function () {
  let showContract;
  let owner;
  let user1;
  let user2;
  let user3;
  let aiAddress;
  let addr1, addr2, addr3, addr4;

  const ENTRY_FEE = ethers.parseEther("0.01");
  const VOTE_FEE = ethers.parseEther("0.01");
  const PLATFORM_FEE_PERCENTAGE = 10;

  beforeEach(async function () {
    [owner, user1, user2, user3, aiAddress, addr1, addr2, addr3, addr4] = await ethers.getSigners();
    
    const ShowContract = await ethers.getContractFactory("ShowContract");
    showContract = await ShowContract.deploy();
    await showContract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await showContract.owner()).to.equal(owner.address);
    });

    it("Should initialize with first show", async function () {
      const currentShow = await showContract.getCurrentShow();
      expect(currentShow.showId).to.equal(1);
      expect(currentShow.isActive).to.be.true;
    });
  });

  describe("Agent Management", function () {
    it("Should register an agent", async function () {
      const agentName = "TestAgent";
      const parameters = [100, 200, 300];
      
      await expect(showContract.connect(user1).registerAgent(agentName, parameters))
        .to.emit(showContract, "AgentRegistered")
        .withArgs(1, user1.address, agentName, parameters);
      
      const agentInfo = await showContract.getAgentInfo(1);
      expect(agentInfo.owner).to.equal(user1.address);
      expect(agentInfo.name).to.equal(agentName);
      expect(agentInfo.isActive).to.be.true;
      expect(agentInfo.isAlive).to.be.true;
    });

    it("Should not register agent with empty name", async function () {
      const parameters = [100, 200, 300];
      
      await expect(showContract.connect(user1).registerAgent("", parameters))
        .to.be.revertedWith("Agent name cannot be empty");
    });

    it("Should not register agent with empty parameters", async function () {
      await expect(showContract.connect(user1).registerAgent("TestAgent", []))
        .to.be.revertedWith("Agent must have parameters");
    });

    it("Should update agent parameters", async function () {
      // Register agent first
      await showContract.connect(user1).registerAgent("TestAgent", [100, 200]);
      
      const newParameters = [150, 250, 350];
      await expect(showContract.connect(user1).updateAgentParams(1, newParameters))
        .to.emit(showContract, "AgentParametersUpdated")
        .withArgs(1, newParameters, user1.address);
      
      const agentInfo = await showContract.getAgentInfo(1);
      expect(agentInfo.parameters.length).to.equal(3);
    });

    it("Should not allow unauthorized parameter update", async function () {
      await showContract.connect(user1).registerAgent("TestAgent", [100, 200]);
      
      await expect(showContract.connect(user2).updateAgentParams(1, [150, 250]))
        .to.be.revertedWith("Not authorized to update agent");
    });
  });

  describe("AI Authorization", function () {
    it("Should authorize AI address", async function () {
      await showContract.authorizeAI(aiAddress.address);
      expect(await showContract.authorizedAI(aiAddress.address)).to.be.true;
    });

    it("Should allow AI to update agent parameters", async function () {
      await showContract.connect(user1).registerAgent("TestAgent", [100, 200]);
      await showContract.authorizeAI(aiAddress.address);
      
      const newParameters = [150, 250];
      await expect(showContract.connect(aiAddress).updateAgentParams(1, newParameters))
        .to.emit(showContract, "AgentParametersUpdated");
    });

    it("Should allow AI to kill agent", async function () {
      await showContract.connect(user1).registerAgent("TestAgent", [100, 200]);
      await showContract.authorizeAI(aiAddress.address);
      
      // First participate in show
      await showContract.connect(user1).participateInShow(1, 1, { value: ENTRY_FEE });
      
      await expect(showContract.connect(aiAddress).killAgent(1, 1))
        .to.emit(showContract, "AgentKilled")
        .withArgs(1, 1, aiAddress.address);
      
      const agentInfo = await showContract.getAgentInfo(1);
      expect(agentInfo.isAlive).to.be.false;
    });
  });

  describe("Show Participation", function () {
    beforeEach(async function () {
      // Register agents for testing
      await showContract.connect(user1).registerAgent("Agent1", [100, 200]);
      await showContract.connect(user2).registerAgent("Agent2", [150, 250]);
      await showContract.connect(user3).registerAgent("Agent3", [200, 300]);
    });

    it("Should participate in show", async function () {
      await expect(showContract.connect(user1).participateInShow(1, 1, { value: ENTRY_FEE }))
        .to.emit(showContract, "AgentParticipated")
        .withArgs(1, 1, user1.address);
      
      const participants = await showContract.getShowParticipants(1);
      expect(participants.agentIds.length).to.equal(1);
      expect(participants.agentIds[0]).to.equal(1);
    });

    it("Should not participate with wrong entry fee", async function () {
      await expect(showContract.connect(user1).participateInShow(1, 1, { value: ethers.parseEther("0.005") }))
        .to.be.revertedWith("Incorrect entry fee");
    });

    it("Should not participate with non-owner agent", async function () {
      await expect(showContract.connect(user2).participateInShow(1, 1, { value: ENTRY_FEE }))
        .to.be.revertedWith("Not the agent owner");
    });

    it("Should not participate when show is full", async function () {
      // Get current agent counter to start from the right ID
      const currentAgentCounter = await showContract.agentCounter();
      
      // Fill up the show with 10 participants
      for (let i = 0; i < 10; i++) {
        const agentId = Number(currentAgentCounter) + i + 1;
        await showContract.connect(user1).registerAgent(`Agent${i}`, [100 + i, 200 + i]);
        await showContract.connect(user1).participateInShow(1, agentId, { value: ENTRY_FEE });
      }
      
      // Register one more agent and try to participate (should fail because show is full)
      const nextAgentId = Number(currentAgentCounter) + 11;
      await showContract.connect(user1).registerAgent("Agent11", [100, 200]);
      
      await expect(showContract.connect(user1).participateInShow(1, nextAgentId, { value: ENTRY_FEE }))
        .to.be.revertedWith("Show is full");
    });
  });

  describe("Voting System", function () {
    beforeEach(async function () {
      await showContract.connect(user1).registerAgent("Agent1", [100, 200]);
      await showContract.connect(user1).participateInShow(1, 1, { value: ENTRY_FEE });
    });

    it("Should vote for agent", async function () {
      await expect(showContract.connect(user2).voteForAgent(1, 1, { value: VOTE_FEE }))
        .to.emit(showContract, "VoteCast")
        .withArgs(1, 1, user2.address, VOTE_FEE);
      
      // Check that the vote was recorded by checking the show's total prize increased
      const show = await showContract.shows(1);
      expect(show.totalPrize).to.be.greaterThan(ENTRY_FEE);
    });

    it("Should not vote with wrong fee", async function () {
      await expect(showContract.connect(user2).voteForAgent(1, 1, { value: ethers.parseEther("0.005") }))
        .to.be.revertedWith("Incorrect vote fee");
    });

    it("Should not vote for non-participating agent", async function () {
      await showContract.connect(user2).registerAgent("Agent2", [150, 250]);
      
      await expect(showContract.connect(user2).voteForAgent(1, 2, { value: VOTE_FEE }))
        .to.be.revertedWith("Agent not participating in this show");
    });
  });

  describe("Show Management", function () {
    beforeEach(async function () {
      await showContract.connect(user1).registerAgent("Agent1", [100, 200]);
      await showContract.connect(user2).registerAgent("Agent2", [150, 250]);
      await showContract.connect(user1).participateInShow(1, 1, { value: ENTRY_FEE });
      await showContract.connect(user2).participateInShow(1, 2, { value: ENTRY_FEE });
    });

    it("Should end show and determine winner", async function () {
      // Fast forward time to end the show
      await ethers.provider.send("evm_increaseTime", [12 * 60 * 60]); // 12 hours
      await ethers.provider.send("evm_mine");
      
      await expect(showContract.endShow(1))
        .to.emit(showContract, "ShowEnded")
        .withArgs(1, 1, ethers.parseEther("0.02")); // 2 * ENTRY_FEE
      
      const show = await showContract.shows(1);
      expect(show.isEnded).to.be.true;
      expect(show.winnerAgentId).to.equal(1);
    });

    it("Should not end show before time", async function () {
      await expect(showContract.endShow(1))
        .to.be.revertedWith("Show has not ended yet");
    });

    it("Should get winner information", async function () {
      // End the show first
      await ethers.provider.send("evm_increaseTime", [12 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      await showContract.endShow(1);
      
      const winnerInfo = await showContract.getWinnerOfShow(1);
      expect(winnerInfo.winnerAgentId).to.equal(1);
      expect(winnerInfo.winnerName).to.equal("Agent1");
    });

    it("Should get reward amount", async function () {
      // End the show first
      await ethers.provider.send("evm_increaseTime", [12 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      await showContract.endShow(1);
      
      const reward = await showContract.getRewardOfShow(1);
      const expectedReward = ethers.parseEther("0.02") - (ethers.parseEther("0.02") * BigInt(PLATFORM_FEE_PERCENTAGE) / BigInt(100));
      expect(reward).to.equal(expectedReward);
    });
  });

  describe("Prize Claiming", function () {
    beforeEach(async function () {
      await showContract.connect(user1).registerAgent("Agent1", [100, 200]);
      await showContract.connect(user1).participateInShow(1, 1, { value: ENTRY_FEE });
      
      // End the show
      await ethers.provider.send("evm_increaseTime", [12 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      await showContract.endShow(1);
    });

    it("Should claim prize", async function () {
      const initialBalance = await ethers.provider.getBalance(user1.address);
      
      await expect(showContract.connect(user1).claimPrize(1))
        .to.emit(showContract, "PrizeClaimed");
      
      const finalBalance = await ethers.provider.getBalance(user1.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should not claim prize twice", async function () {
      await showContract.connect(user1).claimPrize(1);
      
      await expect(showContract.connect(user1).claimPrize(1))
        .to.be.revertedWith("Prize already claimed");
    });

    it("Should not claim prize by non-winner", async function () {
      await expect(showContract.connect(user2).claimPrize(1))
        .to.be.revertedWith("Not the winner's owner");
    });
  });

  describe("Entry Fee Management", function () {
    it("Should update entry fee", async function () {
      const newFee = ethers.parseEther("0.02");
      
      await expect(showContract.updateEntryFee(newFee))
        .to.emit(showContract, "EntryFeeUpdated")
        .withArgs(1, newFee);
      
      const currentShow = await showContract.getCurrentShow();
      expect(currentShow.entryFee).to.equal(newFee);
    });

    it("Should not update entry fee with participants", async function () {
      await showContract.connect(user1).registerAgent("Agent1", [100, 200]);
      await showContract.connect(user1).participateInShow(1, 1, { value: ENTRY_FEE });
      
      await expect(showContract.updateEntryFee(ethers.parseEther("0.02")))
        .to.be.revertedWith("Cannot change fee after participants joined");
    });
  });

  describe("Platform Fees", function () {
    it("Should collect platform fees", async function () {
      await showContract.connect(user1).registerAgent("Agent1", [100, 200]);
      await showContract.connect(user1).participateInShow(1, 1, { value: ENTRY_FEE });
      
      // End the show
      await ethers.provider.send("evm_increaseTime", [12 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      await showContract.endShow(1);
      
      const platformFees = await showContract.totalPlatformFees();
      expect(platformFees).to.be.gt(0);
    });

    it("Should withdraw platform fees", async function () {
      // First collect some fees
      await showContract.connect(user1).registerAgent("Agent1", [100, 200]);
      await showContract.connect(user1).participateInShow(1, 1, { value: ENTRY_FEE });
      
      await ethers.provider.send("evm_increaseTime", [12 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      await showContract.endShow(1);
      
      const initialBalance = await ethers.provider.getBalance(owner.address);
      await showContract.withdrawPlatformFees();
      const finalBalance = await ethers.provider.getBalance(owner.address);
      
      expect(finalBalance).to.be.gt(initialBalance);
    });
  });

  describe("Edge Cases and Error Handling", function () {
    it("Should handle show not existing", async function () {
      await expect(showContract.getWinnerOfShow(999))
        .to.be.revertedWith("Show does not exist");
    });

    it("Should handle agent not existing", async function () {
      await expect(showContract.getAgentInfo(999))
        .to.be.revertedWith("Agent does not exist");
    });

    it("Should handle voting on ended show", async function () {
      await showContract.connect(user1).registerAgent("Agent1", [100, 200]);
      await showContract.connect(user1).participateInShow(1, 1, { value: ENTRY_FEE });
      
      // End the show
      await ethers.provider.send("evm_increaseTime", [12 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      await showContract.endShow(1);
      
      await expect(showContract.connect(user2).voteForAgent(1, 1, { value: VOTE_FEE }))
        .to.be.revertedWith("Show is not active");
    });

    it("Should handle killing dead agent", async function () {
      await showContract.connect(user1).registerAgent("Agent1", [100, 200]);
      await showContract.authorizeAI(aiAddress.address);
      await showContract.connect(user1).participateInShow(1, 1, { value: ENTRY_FEE });
      
      // Kill agent first
      await showContract.connect(aiAddress).killAgent(1, 1);
      
      // Try to kill again
      await expect(showContract.connect(aiAddress).killAgent(1, 1))
        .to.be.revertedWith("Agent is dead");
    });
  });

  describe("Contract State Management", function () {
    it("Should pause and unpause contract", async function () {
      await showContract.pause();
      expect(await showContract.paused()).to.be.true;
      
      await showContract.unpause();
      expect(await showContract.paused()).to.be.false;
    });

    it("Should not allow operations when paused", async function () {
      await showContract.pause();
      
      await expect(showContract.connect(user1).registerAgent("Agent1", [100, 200]))
        .to.be.revertedWithCustomError(showContract, "EnforcedPause");
    });

    it("Should get contract balance", async function () {
      await showContract.connect(user1).registerAgent("Agent1", [100, 200]);
      await showContract.connect(user1).participateInShow(1, 1, { value: ENTRY_FEE });
      
      const balance = await showContract.getContractBalance();
      expect(balance).to.equal(ENTRY_FEE);
    });

    it("Should check if new show can be started", async function () {
      let canStart = await showContract.canStartNewShow();
      expect(canStart).to.be.false; // Current show is active
      
      // Register an agent and participate in the show first
      await showContract.connect(user1).registerAgent("Agent1", [100, 200]);
      await showContract.connect(user1).participateInShow(1, 1, { value: ENTRY_FEE });
      
      // End current show
      await ethers.provider.send("evm_increaseTime", [12 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      await showContract.endShow(1);
      
      canStart = await showContract.canStartNewShow();
      expect(canStart).to.be.true;
    });

    it("Should get time until show ends", async function () {
      const timeLeft = await showContract.getTimeUntilShowEnds();
      expect(timeLeft).to.be.gt(0);
      expect(timeLeft).to.be.lte(12 * 60 * 60); // Should be <= 12 hours
    });
  });
});
