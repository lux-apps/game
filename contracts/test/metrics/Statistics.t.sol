// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {Test} from "forge-std/Test.sol";
import {Statistics} from "../../src/metrics/Statistics.sol";

/// @dev The test contract is the Lux caller (initialize sets it as `lux`), so
/// the onlyLux-guarded write path is exercised directly, as the JS suite did.
abstract contract StatsBase is Test {
    Statistics internal statistics;

    address internal LEVEL1 = makeAddr("level1");
    address internal LEVEL2 = makeAddr("level2");
    address internal LEVEL3 = makeAddr("level3");
    address internal PLAYER1 = makeAddr("player1");
    address internal PLAYER2 = makeAddr("player2");
    address internal PLAYER3 = makeAddr("player3");
    address internal INST1 = makeAddr("inst1");
    address internal INST2 = makeAddr("inst2");
    address internal INST3 = makeAddr("inst3");
    address internal INST4 = makeAddr("inst4");
    address internal INST5 = makeAddr("inst5");

    function _newStats() internal {
        statistics = new Statistics();
        statistics.initialize(address(this));
    }
}

contract PlayerMetrics is StatsBase {
    function setUp() public {
        _newStats();
    }

    function test_addNewLevelFactory() public {
        statistics.saveNewLevel(LEVEL1);
        assertTrue(statistics.doesLevelExist(LEVEL1));
    }

    function test_preventsDuplicateLevel() public {
        statistics.saveNewLevel(LEVEL1);
        vm.expectRevert("Level already exists");
        statistics.saveNewLevel(LEVEL1);
        assertFalse(statistics.doesLevelExist(LEVEL2));
    }

    function test_createInstanceRegistersPlayer() public {
        statistics.saveNewLevel(LEVEL1);
        statistics.createNewInstance(INST1, LEVEL1, PLAYER1);
        assertTrue(statistics.doesPlayerExist(PLAYER1));
    }

    function test_createInstanceUnknownLevelReverts() public {
        statistics.saveNewLevel(LEVEL1);
        vm.expectRevert("Level doesn't exist");
        statistics.createNewInstance(INST1, LEVEL2, PLAYER1);
    }

    function test_submitSuccessMarksCompleted() public {
        statistics.saveNewLevel(LEVEL1);
        statistics.createNewInstance(INST1, LEVEL1, PLAYER1);
        vm.warp(block.timestamp + 5);
        statistics.submitSuccess(INST1, LEVEL1, PLAYER1);
        assertTrue(statistics.isLevelCompleted(PLAYER1, LEVEL1));
        assertGt(statistics.getTimeElapsedForCompletionOfLevel(PLAYER1, LEVEL1), 0);
    }

    function test_submitSuccessUnknownPlayerReverts() public {
        statistics.saveNewLevel(LEVEL1);
        statistics.createNewInstance(INST1, LEVEL1, PLAYER1);
        vm.expectRevert("Player doesn't exist");
        statistics.submitSuccess(INST1, LEVEL1, PLAYER2);
    }

    function test_submitWithoutInstanceReverts() public {
        statistics.saveNewLevel(LEVEL1);
        statistics.saveNewLevel(LEVEL2);
        statistics.createNewInstance(INST1, LEVEL1, PLAYER1);
        statistics.createNewInstance(INST2, LEVEL2, PLAYER2);
        vm.expectRevert("Instance for the level is not created");
        statistics.submitSuccess(INST1, LEVEL1, PLAYER2);
    }

    function test_cannotResubmitCompleted() public {
        statistics.saveNewLevel(LEVEL1);
        statistics.createNewInstance(INST1, LEVEL1, PLAYER1);
        statistics.submitSuccess(INST1, LEVEL1, PLAYER1);
        vm.expectRevert("Level already completed");
        statistics.submitSuccess(INST1, LEVEL1, PLAYER1);
    }

    function test_playerTotalsAndPercentage() public {
        statistics.saveNewLevel(LEVEL1);
        statistics.saveNewLevel(LEVEL2);
        // player1: complete L1, two failures on L2
        statistics.createNewInstance(INST1, LEVEL1, PLAYER1);
        statistics.submitSuccess(INST1, LEVEL1, PLAYER1);
        statistics.createNewInstance(INST2, LEVEL2, PLAYER1);
        statistics.submitFailure(INST2, LEVEL2, PLAYER1);
        statistics.submitFailure(INST2, LEVEL2, PLAYER1);

        assertEq(statistics.getTotalNoOfLevelInstancesCreatedByPlayer(PLAYER1), 2);
        assertEq(statistics.getTotalNoOfLevelInstancesCompletedByPlayer(PLAYER1), 1);
        assertEq(statistics.getTotalNoOfFailedSubmissionsByPlayer(PLAYER1), 2);
        // 1 of 2 levels completed == 50% == 5e17
        assertEq(statistics.getPercentageOfLevelsCompleted(PLAYER1), 5e17);
    }

    function test_timeTakenForCompletion() public {
        statistics.saveNewLevel(LEVEL1);
        statistics.createNewInstance(INST1, LEVEL1, PLAYER3);
        statistics.createNewInstance(INST2, LEVEL1, PLAYER3);
        statistics.createNewInstance(INST3, LEVEL1, PLAYER3);
        vm.warp(block.timestamp + 3);
        statistics.submitSuccess(INST3, LEVEL1, PLAYER3);
        assertEq(statistics.getTimeElapsedForCompletionOfLevel(PLAYER3, LEVEL1), 3);
    }
}

contract LevelMetrics is StatsBase {
    function setUp() public {
        _newStats();
        statistics.saveNewLevel(LEVEL1);
        statistics.saveNewLevel(LEVEL2);
        statistics.saveNewLevel(LEVEL3);
        statistics.createNewInstance(INST1, LEVEL1, PLAYER1);
        statistics.createNewInstance(INST2, LEVEL2, PLAYER1);
        statistics.createNewInstance(INST3, LEVEL3, PLAYER1);
        statistics.createNewInstance(INST4, LEVEL1, PLAYER2);
        statistics.createNewInstance(INST5, LEVEL2, PLAYER2);
        statistics.submitSuccess(INST1, LEVEL1, PLAYER1);
        statistics.submitSuccess(INST2, LEVEL2, PLAYER1);
        statistics.submitFailure(INST3, LEVEL3, PLAYER1);
        statistics.submitSuccess(INST4, LEVEL1, PLAYER2);
        statistics.submitFailure(INST5, LEVEL2, PLAYER2);
    }

    function test_totalInstancesAndPlayers() public {
        assertEq(statistics.getTotalNoOfLevelInstancesCreated(), 5);
        assertEq(statistics.getTotalNoOfPlayers(), 2);
    }

    function test_globalCompletedAndFailed() public {
        assertEq(statistics.getTotalNoOfLevelInstancesCompleted(), 3);
        assertEq(statistics.getTotalNoOfFailedSubmissions(), 2);
    }

    function test_perLevelInstanceCounts() public {
        assertEq(statistics.getNoOfInstancesForLevel(LEVEL1), 2);
        assertEq(statistics.getNoOfInstancesForLevel(LEVEL2), 2);
        assertEq(statistics.getNoOfInstancesForLevel(LEVEL3), 1);
    }

    function test_perLevelCompletedCounts() public {
        assertEq(statistics.getNoOfCompletedSubmissionsForLevel(LEVEL1), 2);
        assertEq(statistics.getNoOfCompletedSubmissionsForLevel(LEVEL2), 1);
    }

    function test_perLevelFailedCounts() public {
        assertEq(statistics.getNoOfFailedSubmissionsForLevel(LEVEL2), 1);
        assertEq(statistics.getNoOfFailedSubmissionsForLevel(LEVEL3), 1);
    }
}

contract Leaderboard is StatsBase {
    function setUp() public {
        _newStats();
        statistics.saveNewLevel(LEVEL1);
        statistics.saveNewLevel(LEVEL2);
        statistics.saveNewLevel(LEVEL3);

        statistics.createNewInstance(INST1, LEVEL1, PLAYER1);
        vm.warp(block.timestamp + 10);
        statistics.submitSuccess(INST1, LEVEL1, PLAYER1);

        statistics.createNewInstance(INST2, LEVEL2, PLAYER1);
        vm.warp(block.timestamp + 20);
        statistics.submitSuccess(INST2, LEVEL2, PLAYER1);

        statistics.createNewInstance(INST3, LEVEL3, PLAYER1);
        vm.warp(block.timestamp + 15);
        statistics.submitSuccess(INST3, LEVEL3, PLAYER1);
    }

    function test_perLevelElapsedTimes() public {
        assertEq(statistics.getTimeElapsedForCompletionOfLevel(PLAYER1, LEVEL1), 10);
        assertEq(statistics.getTimeElapsedForCompletionOfLevel(PLAYER1, LEVEL2), 20);
        assertEq(statistics.getTimeElapsedForCompletionOfLevel(PLAYER1, LEVEL3), 15);
    }

    function test_averageCompletionTime() public {
        assertEq(statistics.getAverageTimeTakenToCompleteLevels(PLAYER1), 15);
    }
}
