// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {LuxTest} from "../Base.t.sol";
import {TelephoneFactory} from "../../src/levels/TelephoneFactory.sol";
import {Telephone} from "../../src/levels/Telephone.sol";
import {TelephoneAttack} from "../../src/attacks/TelephoneAttack.sol";

contract TelephoneLevel is LuxTest {
    TelephoneFactory factory;
    address player = makeAddr("player");

    function setUp() public {
        _deployCore();
        factory = new TelephoneFactory();
        _register(factory);
    }

    function test_solve() public {
        address instance = _create(factory, player, 0);
        _assertUnsolved(instance, player);

        // tx.origin (player) != msg.sender (attack contract).
        TelephoneAttack attack = new TelephoneAttack();
        vm.prank(player, player);
        attack.attack(instance, player);

        assertEq(Telephone(instance).owner(), player);
        _assertSolved(factory, instance, player);
    }
}
