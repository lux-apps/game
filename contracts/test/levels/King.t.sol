// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {LuxTest} from "../Base.t.sol";
import {KingFactory} from "../../src/levels/KingFactory.sol";
import {King} from "../../src/levels/King.sol";
import {KingAttack} from "../../src/attacks/KingAttack.sol";

contract KingLevel is LuxTest {
    KingFactory factory;
    address player = makeAddr("player");

    function setUp() public {
        _deployCore();
        factory = new KingFactory();
        _register(factory);
    }

    function test_solve() public {
        address instance = _create(factory, player, 0.001 ether);
        _assertUnsolved(instance, player);

        // Become king from a contract with no payable fallback: the game can no
        // longer dethrone us because paying the king reverts.
        KingAttack attack = new KingAttack();
        vm.deal(address(this), 1 ether);
        attack.doYourThing{value: 0.001 ether}(instance);

        assertEq(King(payable(instance))._king(), address(attack));
        _assertSolved(factory, instance, player);
    }
}
