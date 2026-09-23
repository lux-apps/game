// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {LuxTest} from "../Base.t.sol";
import {NaughtCoinFactory} from "../../src/levels/NaughtCoinFactory.sol";
import {NaughtCoin} from "../../src/levels/NaughtCoin.sol";
import {NaughtCoinAttack} from "../../src/attacks/NaughtCoinAttack.sol";

contract NaughtCoinLevel is LuxTest {
    NaughtCoinFactory factory;
    address player = makeAddr("player");

    function setUp() public {
        _deployCore();
        factory = new NaughtCoinFactory();
        _register(factory);
    }

    function test_solve() public {
        address instance = _create(factory, player, 0);
        uint256 bal = NaughtCoin(instance).balanceOf(player);
        assertGt(bal, 0);
        _assertUnsolved(instance, player);

        // The timelock only guards transfer(), not transferFrom().
        NaughtCoinAttack attack = new NaughtCoinAttack();
        vm.prank(player, player);
        NaughtCoin(instance).approve(address(attack), bal);
        attack.attack(instance, player);

        assertEq(NaughtCoin(instance).balanceOf(player), 0);
        _assertSolved(factory, instance, player);
    }
}
