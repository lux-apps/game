// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {LuxTest} from "../Base.t.sol";
import {MagicNumFactory} from "../../src/levels/MagicNumFactory.sol";
import {MagicNum} from "../../src/levels/MagicNum.sol";
import {MagicNumSolver} from "../../src/attacks/MagicNumSolver.sol";

contract MagicNumLevel is LuxTest {
    MagicNumFactory factory;
    address player = makeAddr("player");

    function setUp() public {
        _deployCore();
        factory = new MagicNumFactory();
        _register(factory);
    }

    function test_solve() public {
        address instance = _create(factory, player, 0);
        _assertUnsolved(instance, player);

        // A 10-byte runtime that returns 0x2a.
        MagicNumSolver solver = new MagicNumSolver();
        assertLe(address(solver).code.length, 10);
        vm.prank(player, player);
        MagicNum(instance).setSolver(address(solver));

        _assertSolved(factory, instance, player);
    }
}
