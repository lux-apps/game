// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {LuxTest} from "../Base.t.sol";
import {ShopFactory} from "../../src/levels/ShopFactory.sol";
import {Shop} from "../../src/levels/Shop.sol";
import {ShopAttack} from "../../src/attacks/ShopAttack.sol";

contract ShopLevel is LuxTest {
    ShopFactory factory;
    address player = makeAddr("player");

    function setUp() public {
        _deployCore();
        factory = new ShopFactory();
        _register(factory);
    }

    function test_solve() public {
        address instance = _create(factory, player, 0);
        _assertUnsolved(instance, player);

        // price() reports full price while unsold, then 1 once sold.
        ShopAttack attack = new ShopAttack();
        attack.attack(Shop(instance));

        assertLt(Shop(instance).price(), 100);
        _assertSolved(factory, instance, player);
    }
}
