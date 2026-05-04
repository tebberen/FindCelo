import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;
import { FindCelo } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("FindCelo", function () {
  let findCelo: any;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addr3: SignerWithAddress;
  let addr4: SignerWithAddress;
  let addr5: SignerWithAddress;
  let addr6: SignerWithAddress;
  let addrs: SignerWithAddress[];

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, addr4, addr5, addr6, ...addrs] = await ethers.getSigners();
    const FindCeloFactory = await ethers.getContractFactory("FindCelo");
    findCelo = await FindCeloFactory.deploy();
    await findCelo.deployed();
  });

  describe("Game Entry", function () {
    it("Should allow a player to join a Bronze game", async function () {
      const cost = ethers.utils.parseEther("1");
      await expect(findCelo.connect(addr1).joinGame(1, ethers.constants.AddressZero, 0, { value: cost }))
        .to.emit(findCelo, "GameJoined")
        .withArgs(addr1.address, 0, 1);

      const players = await findCelo.getTablePlayers(0);
      expect(players[1]).to.equal(addr1.address);
    });

    it("Should fail if incorrect entry fee is sent", async function () {
      const cost = ethers.utils.parseEther("0.5");
      await expect(findCelo.connect(addr1).joinGame(1, ethers.constants.AddressZero, 0, { value: cost }))
        .to.be.revertedWith("Incorrect CELO entry fee");
    });

    it("Should fail if land is already occupied", async function () {
      const cost = ethers.utils.parseEther("1");
      await findCelo.connect(addr1).joinGame(1, ethers.constants.AddressZero, 0, { value: cost });
      await expect(findCelo.connect(addr2).joinGame(1, ethers.constants.AddressZero, 0, { value: cost }))
        .to.be.revertedWith("Land already occupied in this round");
    });
  });

  describe("Game Resolution", function () {
    it("Should resolve game when 6 players join and distribute prizes", async function () {
      const cost = ethers.utils.parseEther("1");
      const players = [addr1, addr2, addr3, addr4, addr5, addr6];

      for (let i = 0; i < 5; i++) {
        await findCelo.connect(players[i]).joinGame(i + 1, ethers.constants.AddressZero, 0, { value: cost });
      }

      // Track balances
      const houseInitialBalance = await ethers.provider.getBalance(owner.address);

      // Last player joins, triggers resolution
      const tx = await findCelo.connect(players[5]).joinGame(6, ethers.constants.AddressZero, 0, { value: cost });
      const receipt = await tx.wait();

      const tableFilledEvent = receipt.events?.find((e: any) => e.event === "TableFilled");
      expect(tableFilledEvent).to.not.be.undefined;

      const winner = tableFilledEvent.args.winner;
      const prize = tableFilledEvent.args.prize;

      expect(players.map(p => p.address)).to.include(winner);
      expect(prize).to.equal(cost.mul(6).mul(5).div(6));

      // Check stats for winner
      const profile = await findCelo.getUserProfile(winner);
      expect(profile.totalWins).to.equal(1);
      expect(profile.totalGames).to.equal(1);
      expect(profile.totalCELOWon).to.equal(prize);
      expect(profile.totalXP).to.equal(1); // Bronze XP

      // Check stats for a loser
      const loser = players.find(p => p.address !== winner);
      if (loser) {
          const loserProfile = await findCelo.getUserProfile(loser.address);
          expect(loserProfile.totalLosses).to.equal(1);
          expect(loserProfile.totalGames).to.equal(1);
          expect(loserProfile.totalXP).to.equal(1);
      }

      // Check house fee
      const houseFinalBalance = await ethers.provider.getBalance(owner.address);
      const houseFee = cost.mul(6).div(6); // 1/6 of 6 ether is 1 ether
      // houseFinalBalance should be approx houseInitialBalance + 1 ether
      expect(houseFinalBalance.sub(houseInitialBalance)).to.equal(houseFee);
    });
  });

  describe("Referral System", function () {
    it("Should award XP to referrer on first game", async function () {
      const cost = ethers.utils.parseEther("1");
      await findCelo.connect(addr1).joinGame(1, addr2.address, 0, { value: cost });

      const referrerProfile = await findCelo.getUserProfile(addr2.address);
      expect(referrerProfile.totalXP).to.equal(5);
    });

    it("Should not award referral XP for self-referral", async function () {
        const cost = ethers.utils.parseEther("1");
        await findCelo.connect(addr1).joinGame(1, addr1.address, 0, { value: cost });

        const profile = await findCelo.getUserProfile(addr1.address);
        expect(profile.totalXP).to.equal(0); // No XP gain for joining yet, only on resolution
    });

    it("Should not award referral XP twice for same player", async function () {
        const cost = ethers.utils.parseEther("1");
        await findCelo.connect(addr1).joinGame(1, addr2.address, 0, { value: cost });

        // Clear land 1 manually by resolving or just use another table/land if it was already resolved?
        // Let's use a different land in same table for simplicity if it's not full
        await findCelo.connect(addr1).joinGame(2, addr2.address, 0, { value: cost });

        const referrerProfile = await findCelo.getUserProfile(addr2.address);
        expect(referrerProfile.totalXP).to.equal(5);
    });
  });

  describe("Leaderboard", function () {
      it("Should sort leaderboard by XP", async function () {
          // addr1 gets 5 XP (referral)
          await findCelo.connect(addr2).joinGame(1, addr1.address, 0, { value: ethers.utils.parseEther("1") });

          // addr3 gets 10 XP (Gold game resolution - need 6 players)
          const goldCost = ethers.utils.parseEther("10");
          const players = [addr3, addr4, addr5, addr6, addrs[0], addrs[1]];
          for (let i = 0; i < 6; i++) {
              await findCelo.connect(players[i]).joinGame(i + 1, ethers.constants.AddressZero, 2, { value: goldCost });
          }

          const leaderboard = await findCelo.getLeaderboard();
          expect(leaderboard[0]).to.equal(players[0].address); // addr3 should be first with 10 XP
          expect(leaderboard).to.include(addr1.address); // addr1 should be there with 5 XP

          const addr1Index = leaderboard.indexOf(addr1.address);
          const addr3Index = leaderboard.indexOf(addr3.address);
          expect(addr3Index).to.be.lessThan(addr1Index);
      });
  });

  describe("Admin", function () {
      it("Should allow owner to withdraw funds", async function () {
          // Send some CELO to contract
          await owner.sendTransaction({ to: findCelo.address, value: ethers.utils.parseEther("1") });

          const initialBalance = await ethers.provider.getBalance(owner.address);
          await findCelo.withdrawFunds();
          const finalBalance = await ethers.provider.getBalance(owner.address);

          expect(finalBalance).to.be.gt(initialBalance);
      });

      it("Should not allow non-owner to withdraw funds", async function () {
          await expect(findCelo.connect(addr1).withdrawFunds())
              .to.be.reverted;
      });
  });
});
