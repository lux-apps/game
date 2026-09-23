// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {LuxTest} from "../Base.t.sol";
import {ForceFactory} from "../../src/levels/ForceFactory.sol";
import {ForceAttack} from "../../src/attacks/ForceAttack.sol";

contract ForceLevel is LuxTest {
    ForceFactory factory;
    address player = makeAddr("player");

    function setUp() public {
        _deployCore();
        factory = new ForceFactory();
        _register(factory);
    }

    function test_solve() public {
        address instance = _create(factory, player, 0);
        _assertUnsolved(instance, player);

        // selfdestruct forces ether into a contract with no payable entry point.
        ForceAttack attack = (new ForceAttack){value: 1 wei}();
        attack.attack(payable(instance));

        assertGt(instance.balance, 0);
        _assertSolved(factory, instance, player);
    }
}
