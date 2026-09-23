// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {LuxTest} from "../Base.t.sol";
import {DelegationFactory} from "../../src/levels/DelegationFactory.sol";
import {Delegation} from "../../src/levels/Delegation.sol";

contract DelegationLevel is LuxTest {
    DelegationFactory factory;
    address player = makeAddr("player");

    function setUp() public {
        _deployCore();
        factory = new DelegationFactory();
        _register(factory);
    }

    function test_solve() public {
        address instance = _create(factory, player, 0);
        _assertUnsolved(instance, player);

        // The fallback delegatecalls Delegate.pwn(), setting owner = msg.sender.
        vm.prank(player, player);
        (bool ok,) = instance.call(abi.encodeWithSignature("pwn()"));
        require(ok, "pwn failed");

        assertEq(Delegation(instance).owner(), player);
        _assertSolved(factory, instance, player);
    }
}
