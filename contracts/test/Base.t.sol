// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {Test, Vm} from "forge-std/Test.sol";
import {Lux} from "../src/Lux.sol";
import {Statistics} from "../src/metrics/Statistics.sol";
import {ProxyStats} from "../src/proxy/ProxyStats.sol";
import {Level} from "../src/levels/base/Level.sol";

/// @dev Shared harness: a Lux registry with a Statistics implementation behind
/// its transparent proxy, plus helpers that drive the real create/submit flow
/// and read completion out of the emitted logs.
abstract contract LuxTest is Test {
    Lux internal lux;
    Statistics internal stats;

    bytes32 private constant CREATED_SIG =
        keccak256("LevelInstanceCreatedLog(address,address,address)");
    bytes32 private constant COMPLETED_SIG =
        keccak256("LevelCompletedLog(address,address,address)");

    function _deployCore() internal {
        lux = new Lux();
        Statistics impl = new Statistics();
        ProxyStats proxy = new ProxyStats(address(impl), address(this), address(lux));
        lux.setStatistics(address(proxy));
        stats = Statistics(address(proxy));
    }

    /// @dev Deploy the core and register one level factory. Returns the factory.
    function _register(Level factory) internal {
        lux.registerLevel(factory);
        assertTrue(stats.doesLevelExist(address(factory)), "level not registered");
    }

    /// @dev Player requests an instance; returns its address from the log.
    function _create(Level factory, address player, uint256 value)
        internal
        returns (address instance)
    {
        vm.recordLogs();
        vm.deal(player, player.balance + value);
        vm.prank(player, player);
        lux.createLevelInstance{value: value}(factory);
        Vm.Log[] memory logs = vm.getRecordedLogs();
        for (uint256 i; i < logs.length; i++) {
            if (logs[i].topics[0] == CREATED_SIG) {
                return address(uint160(uint256(logs[i].topics[2])));
            }
        }
        revert("no instance created");
    }

    /// @dev Player submits an instance; returns whether Lux recorded completion.
    function _submit(address instance, address player) internal returns (bool solved) {
        vm.recordLogs();
        vm.prank(player, player);
        lux.submitLevelInstance(payable(instance));
        Vm.Log[] memory logs = vm.getRecordedLogs();
        for (uint256 i; i < logs.length; i++) {
            if (logs[i].topics[0] == COMPLETED_SIG) return true;
        }
        return false;
    }

    /// @dev Assert that a freshly created, unexploited instance is not solvable.
    function _assertUnsolved(address instance, address player) internal {
        assertFalse(_submit(instance, player), "fresh instance already solved");
    }

    /// @dev Assert that a submission solves the level and Lux records it.
    function _assertSolved(Level factory, address instance, address player) internal {
        assertTrue(_submit(instance, player), "exploit did not solve the level");
        assertTrue(
            stats.isLevelCompleted(player, address(factory)),
            "completion not recorded in Lux"
        );
    }
}
