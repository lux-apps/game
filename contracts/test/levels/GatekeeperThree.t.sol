// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {LuxTest} from "../Base.t.sol";
import {GatekeeperThreeFactory} from "../../src/levels/GatekeeperThreeFactory.sol";
import {GatekeeperThree} from "../../src/levels/GatekeeperThree.sol";
import {GatekeeperThreeAttack} from "../../src/attacks/GatekeeperThreeAttack.sol";

contract GatekeeperThreeLevel is LuxTest {
    GatekeeperThreeFactory factory;
    address player = makeAddr("player");

    function setUp() public {
        _deployCore();
        factory = new GatekeeperThreeFactory();
        _register(factory);
    }

    function test_solve() public {
        address instance = _create(factory, player, 0);
        _assertUnsolved(instance, player);

        // Attacker becomes owner; entrant is tx.origin, so enter as the player.
        vm.deal(address(this), 1 ether);
        GatekeeperThreeAttack attack =
            (new GatekeeperThreeAttack){value: 0.0011 ether}(payable(instance));
        vm.prank(player, player);
        attack.attack();

        assertEq(GatekeeperThree(payable(instance)).entrant(), player);
        _assertSolved(factory, instance, player);
    }
}
