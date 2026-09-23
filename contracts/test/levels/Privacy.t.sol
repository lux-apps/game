// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {LuxTest} from "../Base.t.sol";
import {PrivacyFactory} from "../../src/levels/PrivacyFactory.sol";
import {Privacy} from "../../src/levels/Privacy.sol";

contract PrivacyLevel is LuxTest {
    PrivacyFactory factory;
    address player = makeAddr("player");

    function setUp() public {
        _deployCore();
        factory = new PrivacyFactory();
        _register(factory);
    }

    function test_solve() public {
        address instance = _create(factory, player, 0);
        _assertUnsolved(instance, player);

        // data[2] sits at slot 5; the key is its high 16 bytes.
        bytes16 key = bytes16(vm.load(instance, bytes32(uint256(5))));
        vm.prank(player, player);
        Privacy(instance).unlock(key);

        assertFalse(Privacy(instance).locked());
        _assertSolved(factory, instance, player);
    }
}
