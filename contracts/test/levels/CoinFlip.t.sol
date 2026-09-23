// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {LuxTest} from "../Base.t.sol";
import {CoinFlipFactory} from "../../src/levels/CoinFlipFactory.sol";
import {CoinFlip} from "../../src/levels/CoinFlip.sol";
import {CoinFlipAttack} from "../../src/attacks/CoinFlipAttack.sol";

contract CoinFlipLevel is LuxTest {
    CoinFlipFactory factory;
    address player = makeAddr("player");

    function setUp() public {
        _deployCore();
        factory = new CoinFlipFactory();
        _register(factory);
    }

    function test_solve() public {
        address instance = _create(factory, player, 0);
        _assertUnsolved(instance, player);

        // Predict the flip with the same blockhash/FACTOR formula; roll a block
        // between flips so CoinFlip's lastHash guard passes.
        CoinFlipAttack attack = new CoinFlipAttack();
        for (uint256 i; i < 10; i++) {
            vm.roll(block.number + 1);
            attack.attack(instance);
        }

        assertGe(CoinFlip(instance).consecutiveWins(), 10);
        _assertSolved(factory, instance, player);
    }
}
