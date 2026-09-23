// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {LuxTest} from "../Base.t.sol";
import {InstanceFactory} from "../../src/levels/InstanceFactory.sol";
import {Instance} from "../../src/levels/Instance.sol";

contract InstanceLevel is LuxTest {
    InstanceFactory factory;
    address player = makeAddr("player");

    function setUp() public {
        _deployCore();
        factory = new InstanceFactory();
        _register(factory);
    }

    function test_solve() public {
        address instance = _create(factory, player, 0);
        _assertUnsolved(instance, player);

        // The password is a public state variable; read it and authenticate.
        string memory password = Instance(instance).password();
        vm.prank(player, player);
        Instance(instance).authenticate(password);

        _assertSolved(factory, instance, player);
    }
}
