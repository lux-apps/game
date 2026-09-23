// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {LuxTest} from "../Base.t.sol";
import {MotorbikeFactory} from "../../src/levels/MotorbikeFactory.sol";
import {Engine} from "../../src/levels/Motorbike.sol";
import {MotorbikeAttack} from "../../src/attacks/MotorbikeAttack.sol";

/// @dev Motorbike's completion predicate is "the Engine implementation has no
/// code left". The vulnerability — an uninitialised implementation behind the
/// proxy — is real and the exploit seizes it: `takeControl()` initialises the
/// implementation in its own context and makes the attacker the upgrader, after
/// which `destroy()` would upgrade to a selfdestructing contract.
///
/// That final step cannot record completion under the Cancun EVM baseline:
/// EIP-6780 only deletes code when the target was created in the same
/// transaction, and the Engine is created when the instance is minted, one
/// transaction before the attack — so its code survives and validateInstance
/// (engine has no code) stays false. It is also, at the current forge/revm
/// version, a selfdestruct that trips an internal journaling panic. Both are
/// tooling/EVM facts, not faults in the port, so the test proves the decisive
/// seizure and pins the limitation in comments.
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

    function test_seizesImplementation() public {
        address instance = _create(factory, player, 0);
        _assertUnsolved(instance, player);

        address engine = address(uint160(uint256(vm.load(instance, IMPL_SLOT))));
        assertGt(engine.code.length, 0);

        // The implementation was never initialised in its own context, so the
        // attacker initialises it and becomes the upgrader — full control of the
        // logic contract, which is the level's vulnerability.
        MotorbikeAttack attack = new MotorbikeAttack(engine);
        attack.takeControl();
        assertEq(Engine(engine).upgrader(), address(attack), "did not seize the engine");

        // attack.destroy() would now upgrade the engine to a selfdestructing
        // implementation; under EIP-6780 that cannot delete the pre-existing
        // engine's code, so the "engine destroyed" completion is unreachable on
        // the Cancun baseline. See the contract-level comment.
    }
}
