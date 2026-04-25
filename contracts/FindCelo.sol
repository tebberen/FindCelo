// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FindCelo
 * @dev A treasure island game on Celo blockchain where players buy seats on lands to win CELO.
 * Includes XP system, referral bonuses, and an on-chain leaderboard.
 */
contract FindCelo is Ownable, ReentrancyGuard {
    enum TableType { Bronze, Silver, Gold }

    struct UserProfile {
        uint256 totalGames;
        uint256 totalWins;
        uint256 totalLosses;
        uint256 totalCELOWon;
        uint256 totalXP;
        bool hasJoined;
    }

    struct Table {
        address[7] players; // Index 1-6 for lands
        uint8 seatsFilled;
    }

    // Constants for game rules
    uint256 public constant SEATS_PER_TABLE = 6;
    uint256 public constant BRONZE_COST = 1 ether;
    uint256 public constant SILVER_COST = 5 ether;
    uint256 public constant GOLD_COST = 10 ether;

    uint256 public constant BRONZE_XP = 1;
    uint256 public constant SILVER_XP = 5;
    uint256 public constant GOLD_XP = 10;
    uint256 public constant REFERRAL_XP = 5;

    uint256 public constant LEADERBOARD_SIZE = 100;

    // State variables
    mapping(address => UserProfile) public profiles;
    mapping(TableType => Table) public tables;
    address[] public leaderboard;

    // Events
    event GameJoined(address indexed player, TableType indexed tableType, uint256 landIndex);
    event TableFilled(TableType indexed tableType, uint256 winningLand, address indexed winner, uint256 prize);
    event XPChanged(address indexed player, uint256 newXP);
    event ReferralBonus(address indexed referrer, address indexed recruit, uint256 xpGained);
    event LeaderboardUpdated();

    /**
     * @dev Constructor sets the initial owner.
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @notice Join a game by selecting a land and paying the entry fee.
     * @param landIndex The index of the land (1-6).
     * @param referrer The address of the user who referred the player.
     * @param tableType The type of table (Bronze, Silver, or Gold).
     */
    function joinGame(uint256 landIndex, address referrer, TableType tableType) external payable nonReentrant {
        require(landIndex >= 1 && landIndex <= 6, "Invalid land index");

        uint256 cost = _getTableCost(tableType);
        require(msg.value == cost, "Incorrect CELO entry fee");

        Table storage table = tables[tableType];
        require(table.players[landIndex] == address(0), "Land already occupied in this round");

        // Referral logic
        if (!profiles[msg.sender].hasJoined) {
            profiles[msg.sender].hasJoined = true;
            if (referrer != address(0) && referrer != msg.sender) {
                profiles[referrer].totalXP += REFERRAL_XP;
                _updateLeaderboard(referrer);
                emit ReferralBonus(referrer, msg.sender, REFERRAL_XP);
            }
        }

        // Occupy seat
        table.players[landIndex] = msg.sender;
        table.seatsFilled++;

        emit GameJoined(msg.sender, tableType, landIndex);

        // If table is full, resolve the game
        if (table.seatsFilled == SEATS_PER_TABLE) {
            _resolveTable(tableType);
        }
    }

    /**
     * @dev Internal function to resolve a full table.
     */
    function _resolveTable(TableType tableType) internal {
        Table storage table = tables[tableType];

        // Randomness using Celo's native RANDAO (block.prevrandao)
        uint256 winningLand = (uint256(keccak256(abi.encodePacked(block.prevrandao, block.timestamp, tableType))) % 6) + 1;
        address winner = table.players[winningLand];

        uint256 totalPot = _getTableCost(tableType) * SEATS_PER_TABLE;
        uint256 winnerPrize = (totalPot * 5) / 6;
        uint256 houseFee = totalPot - winnerPrize;

        // Update winner stats
        profiles[winner].totalWins++;
        profiles[winner].totalCELOWon += winnerPrize;

        // Update all players stats and XP
        uint256 xpGain = _getXPGain(tableType);
        for (uint256 i = 1; i <= 6; i++) {
            address player = table.players[i];
            profiles[player].totalGames++;
            profiles[player].totalXP += xpGain;

            if (player != winner) {
                profiles[player].totalLosses++;
            }

            _updateLeaderboard(player);
            emit XPChanged(player, profiles[player].totalXP);

            // Clear seat for next round
            table.players[i] = address(0);
        }

        table.seatsFilled = 0;

        // Transfers
        (bool successWinner, ) = payable(winner).call{value: winnerPrize}("");
        require(successWinner, "Winner transfer failed");

        (bool successHouse, ) = payable(owner()).call{value: houseFee}("");
        require(successHouse, "House transfer failed");

        emit TableFilled(tableType, winningLand, winner, winnerPrize);
    }

    /**
     * @dev Returns the cost for a given table type.
     */
    function _getTableCost(TableType tableType) internal pure returns (uint256) {
        if (tableType == TableType.Bronze) return BRONZE_COST;
        if (tableType == TableType.Silver) return SILVER_COST;
        return GOLD_COST;
    }

    /**
     * @dev Returns the XP gain for a given table type.
     */
    function _getXPGain(TableType tableType) internal pure returns (uint256) {
        if (tableType == TableType.Bronze) return BRONZE_XP;
        if (tableType == TableType.Silver) return SILVER_XP;
        return GOLD_XP;
    }

    /**
     * @dev Updates the leaderboard with the player's current XP.
     * Keeps the leaderboard sorted by totalXP using O(N) insertion/shift.
     */
    function _updateLeaderboard(address player) internal {
        uint256 playerXP = profiles[player].totalXP;
        int256 index = -1;

        // Find if player is already in leaderboard
        for (uint256 i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i] == player) {
                index = int256(i);
                break;
            }
        }

        if (index != -1) {
            // Player already in, shift them up if necessary
            uint256 pos = uint256(index);
            while (pos > 0 && profiles[leaderboard[pos - 1]].totalXP < playerXP) {
                address temp = leaderboard[pos - 1];
                leaderboard[pos - 1] = leaderboard[pos];
                leaderboard[pos] = temp;
                pos--;
            }
        } else {
            // New player, check if qualifies for leaderboard
            if (leaderboard.length < LEADERBOARD_SIZE) {
                leaderboard.push(player);
                uint256 pos = leaderboard.length - 1;
                while (pos > 0 && profiles[leaderboard[pos - 1]].totalXP < playerXP) {
                    address temp = leaderboard[pos - 1];
                    leaderboard[pos - 1] = leaderboard[pos];
                    leaderboard[pos] = temp;
                    pos--;
                }
            } else if (playerXP > profiles[leaderboard[LEADERBOARD_SIZE - 1]].totalXP) {
                leaderboard[LEADERBOARD_SIZE - 1] = player;
                uint256 pos = LEADERBOARD_SIZE - 1;
                while (pos > 0 && profiles[leaderboard[pos - 1]].totalXP < playerXP) {
                    address temp = leaderboard[pos - 1];
                    leaderboard[pos - 1] = leaderboard[pos];
                    leaderboard[pos] = temp;
                    pos--;
                }
            }
        }

        emit LeaderboardUpdated();
    }

    /**
     * @notice Get the top users on the leaderboard.
     * @return List of addresses in the leaderboard.
     */
    function getLeaderboard() external view returns (address[] memory) {
        return leaderboard;
    }

    /**
     * @notice Get full profile of a user.
     * @param user Address of the user.
     */
    function getUserProfile(address user) external view returns (UserProfile memory) {
        return profiles[user];
    }

    /**
     * @notice Get current players in a specific table.
     * @param tableType Type of the table.
     * @return Array of 7 addresses (index 1-6 used for lands).
     */
    function getTablePlayers(TableType tableType) external view returns (address[7] memory) {
        return tables[tableType].players;
    }

    /**
     * @notice Allows owner to withdraw any funds accidentally sent to the contract.
     */
    function withdrawFunds() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdraw failed");
    }

    /**
     * @dev Fallback to receive CELO.
     */
    receive() external payable {}
}
