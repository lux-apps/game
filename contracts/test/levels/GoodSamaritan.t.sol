// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {LuxTest} from "../Base.t.sol";
import {GoodSamaritanFactory} from "../../src/levels/GoodSamaritanFactory.sol";
import {GoodSamaritan} from "../../src/levels/GoodSamaritan.sol";
import {GoodSamaritanAttack} from "../../src/attacks/GoodSamaritanAttack.sol";

contract GoodSamaritanLevel is LuxTest {
    GoodSamaritanFactory factory;
    address player = makeAddr("player");

    function setUp() public {
        _deployCore();
        factory = new GoodSamaritanFactory();
        _register(factory);
    }

    function test_solve() public {
        address instance = _create(factory, player, 0);
        _assertUnsolved(instance, player);

        // A NotEnoughBalance() revert from our notify() tricks the wallet into
        // sending its entire remaining balance.
        GoodSamaritanAttack attack = new GoodSamaritanAttack(instance);
        attack.attack();

        assertEq(
            GoodSamaritan(instance).coin().balances(address(GoodSamaritan(instance).wallet())),
            0
        );
        _assertSolved(factory, instance, player);
    }
}
