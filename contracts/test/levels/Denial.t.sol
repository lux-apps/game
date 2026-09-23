// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {LuxTest} from "../Base.t.sol";
import {DenialFactory} from "../../src/levels/DenialFactory.sol";
import {Denial} from "../../src/levels/Denial.sol";
import {DenialAttack} from "../../src/attacks/DenialAttack.sol";

contract DenialLevel is LuxTest {
    DenialFactory factory;
    address player = makeAddr("player");

    function setUp() public {
        _deployCore();
        factory = new DenialFactory();
        _register(factory);
    }

    function test_solve() public {
        address instance = _create(factory, player, 0.001 ether);
        _assertUnsolved(instance, player);

        // A partner whose fallback burns all forwarded gas makes withdraw revert.
        DenialAttack attack = new DenialAttack();
        vm.prank(player, player);
        Denial(payable(instance)).setWithdrawPartner(address(attack));

        _assertSolved(factory, instance, player);
    }
}
