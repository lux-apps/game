// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {LuxTest} from "../Base.t.sol";
import {GatekeeperTwoFactory} from "../../src/levels/GatekeeperTwoFactory.sol";
import {GatekeeperTwo} from "../../src/levels/GatekeeperTwo.sol";
import {GatekeeperTwoAttack} from "../../src/attacks/GatekeeperTwoAttack.sol";

contract GatekeeperTwoLevel is LuxTest {
    GatekeeperTwoFactory factory;
    address player = makeAddr("player");

    function setUp() public {
        _deployCore();
        factory = new GatekeeperTwoFactory();
        _register(factory);
    }

    function test_solve() public {
        address instance = _create(factory, player, 0);
        _assertUnsolved(instance, player);

        // enter() runs in the attacker's constructor, where extcodesize is 0.
        vm.prank(player, player);
        new GatekeeperTwoAttack(instance);

        assertEq(GatekeeperTwo(instance).entrant(), player);
        _assertSolved(factory, instance, player);
    }
}
