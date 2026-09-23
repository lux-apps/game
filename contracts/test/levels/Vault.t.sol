// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {LuxTest} from "../Base.t.sol";
import {VaultFactory} from "../../src/levels/VaultFactory.sol";
import {Vault} from "../../src/levels/Vault.sol";

contract VaultLevel is LuxTest {
    VaultFactory factory;
    address player = makeAddr("player");

    function setUp() public {
        _deployCore();
        factory = new VaultFactory();
        _register(factory);
    }

    function test_solve() public {
        address instance = _create(factory, player, 0);
        _assertUnsolved(instance, player);

        // "private" only hides from other contracts; the password is slot 1.
        bytes32 password = vm.load(instance, bytes32(uint256(1)));
        vm.prank(player, player);
        Vault(instance).unlock(password);

        assertFalse(Vault(instance).locked());
        _assertSolved(factory, instance, player);
    }
}
