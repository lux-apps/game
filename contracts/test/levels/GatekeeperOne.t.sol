// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {LuxTest} from "../Base.t.sol";
import {GatekeeperOneFactory} from "../../src/levels/GatekeeperOneFactory.sol";
import {GatekeeperOne} from "../../src/levels/GatekeeperOne.sol";
import {GatekeeperOneAttack} from "../../src/attacks/GatekeeperOneAttack.sol";

contract GatekeeperOneLevel is LuxTest {
    GatekeeperOneFactory factory;
    address player = makeAddr("player");

    function setUp() public {
        _deployCore();
        factory = new GatekeeperOneFactory();
        _register(factory);
    }

    function test_solve() public {
        address instance = _create(factory, player, 0);
        _assertUnsolved(instance, player);

        // The key derives from tx.origin, so deploy (and enter) as the player;
        // the attacker brute-forces the gas to satisfy gasleft() % 8191 == 0.
        vm.prank(player, player);
        new GatekeeperOneAttack(instance);

        assertEq(GatekeeperOne(instance).entrant(), player);
        _assertSolved(factory, instance, player);
    }
}
