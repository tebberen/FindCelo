import { expect } from "chai";
import { ethers } from "hardhat";
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
    it("Should resolve game when 6 players join", async function () {
      const cost = ethers.utils.parseEther("1");
      const players = [addr1, addr2, addr3, addr4, addr5, addr6];

      for (let i = 0; i < 5; i++) {
        await findCelo.connect(players[i]).joinGame(i + 1, ethers.constants.AddressZero, 0, { value: cost });
      }

      // Last player joins, triggers resolution
      const tx = await findCelo.connect(players[5]).joinGame(6, ethers.constants.AddressZero, 0, { value: cost });
      const receipt = await tx.wait();

      const tableFilledEvent = receipt.events?.find((e: any) => e.event === "TableFilled");
      expect(tableFilledEvent).to.not.be.undefined;

      const winner = tableFilledEvent.args.winner;
      const prize = tableFilledEvent.args.prize;

      expect(players.map(p => p.address)).to.include(winner);
      expect(prize).to.equal(cost.mul(6).mul(5).div(6));

      // Check stats
      const profile = await findCelo.getUserProfile(winner);
      expect(profile.totalWins).to.equal(1);
      expect(profile.totalCELOWon).to.equal(prize);
    });
  });

  describe("Referral System", function () {
    it("Should award XP to referrer on first game", async function () {
      const cost = ethers.utils.parseEther("1");
      await findCelo.connect(addr1).joinGame(1, addr2.address, 0, { value: cost });

      const referrerProfile = await findCelo.getUserProfile(addr2.address);
      expect(referrerProfile.totalXP).to.equal(5);
    });

    it("Should not award referral XP twice for same player", async function () {
        const cost = ethers.utils.parseEther("1");
        await findCelo.connect(addr1).joinGame(1, addr2.address, 0, { value: cost });

        // Join again
        // Need to clear table or use different land
        await findCelo.connect(addr1).joinGame(2, addr2.address, 0, { value: cost });

        const referrerProfile = await findCelo.getUserProfile(addr2.address);
        expect(referrerProfile.totalXP).to.equal(5); // Still 5
    });
  });

  describe("Leaderboard", function () {
      it("Should update leaderboard correctly", async function () {
          const cost = ethers.utils.parseEther("10"); // Gold for more XP
          // Fill 6 gold seats to trigger resolution and XP gain
          const players = [addr1, addr2, addr3, addr4, addr5, addr6];
          for (let i = 0; i < 6; i++) {
              await findCelo.connect(players[i]).joinGame(i + 1, ethers.constants.AddressZero, 2, { value: cost });
          }

          const leaderboard = await findCelo.getLeaderboard();
          expect(leaderboard.length).to.be.at.least(1);
          // Top player should have XP
          const topPlayerProfile = await findCelo.getUserProfile(leaderboard[0]);
          expect(topPlayerProfile.totalXP).to.be.at.least(10);
      });
  });
});
