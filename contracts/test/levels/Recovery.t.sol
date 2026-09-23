// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {LuxTest} from "../Base.t.sol";
import {RecoveryFactory} from "../../src/levels/RecoveryFactory.sol";
import {SimpleToken} from "../../src/levels/Recovery.sol";

contract RecoveryLevel is LuxTest {
    RecoveryFactory factory;
    address player = makeAddr("player");

    function setUp() public {
        _deployCore();
        factory = new RecoveryFactory();
        _register(factory);
    }

    function test_solve() public {
        address instance = _create(factory, player, 0.001 ether);
        _assertUnsolved(instance, player);

        // The lost token is the Recovery instance's nonce-1 CREATE.
        address lost = vm.computeCreateAddress(instance, 1);
        assertGt(lost.balance, 0);
        vm.prank(player, player);
        SimpleToken(payable(lost)).destroy(payable(player));

        assertEq(lost.balance, 0);
        _assertSolved(factory, instance, player);
    }
}
