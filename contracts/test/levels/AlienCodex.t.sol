// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {LuxTest} from "../Base.t.sol";
import {AlienCodexFactory} from "../../src/levels/AlienCodexFactory.sol";
import {AlienCodex} from "../../src/levels/AlienCodex.sol";
import {AlienCodexAttack} from "../../src/attacks/AlienCodexAttack.sol";

contract AlienCodexLevel is LuxTest {
    AlienCodexFactory factory;
    address player = makeAddr("player");

    function setUp() public {
        _deployCore();
        factory = new AlienCodexFactory();
        _register(factory);
    }

    function test_solve() public {
        address instance = _create(factory, player, 0);
        _assertUnsolved(instance, player);

        // Underflow the array length, then write the owner slot.
        AlienCodexAttack attack = new AlienCodexAttack(instance);
        attack.attack(bytes32(uint256(uint160(player))));

        assertEq(AlienCodex(instance).owner(), player);
        _assertSolved(factory, instance, player);
    }
}
