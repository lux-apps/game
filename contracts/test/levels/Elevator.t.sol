// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {LuxTest} from "../Base.t.sol";
import {ElevatorFactory} from "../../src/levels/ElevatorFactory.sol";
import {Elevator} from "../../src/levels/Elevator.sol";
import {ElevatorAttack} from "../../src/attacks/ElevatorAttack.sol";

contract ElevatorLevel is LuxTest {
    ElevatorFactory factory;
    address player = makeAddr("player");

    function setUp() public {
        _deployCore();
        factory = new ElevatorFactory();
        _register(factory);
    }

    function test_solve() public {
        address instance = _create(factory, player, 0);
        _assertUnsolved(instance, player);

        // isLastFloor returns false then true, so top gets set.
        ElevatorAttack attack = new ElevatorAttack();
        attack.attack(instance);

        assertTrue(Elevator(instance).top());
        _assertSolved(factory, instance, player);
    }
}
