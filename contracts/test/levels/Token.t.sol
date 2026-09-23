// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {LuxTest} from "../Base.t.sol";
import {TokenFactory} from "../../src/levels/TokenFactory.sol";
import {Token} from "../../src/levels/Token.sol";

contract TokenLevel is LuxTest {
    TokenFactory factory;
    address player = makeAddr("player");

    function setUp() public {
        _deployCore();
        factory = new TokenFactory();
        _register(factory);
    }

    function test_solve() public {
        address instance = _create(factory, player, 0);
        assertEq(Token(instance).balanceOf(player), 20);
        _assertUnsolved(instance, player);

        // Transfer more than the balance: the unchecked subtraction underflows.
        vm.prank(player, player);
        Token(instance).transfer(makeAddr("sink"), 21);

        assertGt(Token(instance).balanceOf(player), 20);
        _assertSolved(factory, instance, player);
    }
}
