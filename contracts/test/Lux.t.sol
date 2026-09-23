// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {LuxTest} from "./Base.t.sol";
import {DummyFactory} from "../src/levels/DummyFactory.sol";
import {Dummy} from "../src/levels/Dummy.sol";
import {FallbackFactory} from "../src/levels/FallbackFactory.sol";
import {Manufactured} from "../src/attacks/Manufactured.sol";

contract LuxRegistry is LuxTest {
    address player = makeAddr("player");
    address player2 = makeAddr("player2");

    function setUp() public {
        _deployCore();
    }

    function test_rejectsManufacturedInstance() public {
        _register(new FallbackFactory());
        // A player fabricates a contract with the desired state instead of
        // solving a genuine, Lux-emitted instance.
        Manufactured fake = new Manufactured();
        vm.prank(player, player);
        vm.expectRevert("This instance doesn't belong to the current user");
        lux.submitLevelInstance(payable(address(fake)));
    }

    function test_rejectsAnotherPlayersInstance() public {
        DummyFactory factory = new DummyFactory();
        _register(factory);
        address instance = _create(factory, player, 0);
        Dummy(instance).setCompleted(true);

        vm.prank(player2, player2);
        vm.expectRevert("This instance doesn't belong to the current user");
        lux.submitLevelInstance(payable(instance));
    }

    function test_rejectsDoubleCompletion() public {
        DummyFactory factory = new DummyFactory();
        _register(factory);
        address instance = _create(factory, player, 0);
        Dummy(instance).setCompleted(true);

        _assertSolved(factory, instance, player);

        vm.prank(player, player);
        vm.expectRevert("Level has been completed already");
        lux.submitLevelInstance(payable(instance));
    }

    function test_solvesAndRecordsCompletion() public {
        DummyFactory factory = new DummyFactory();
        _register(factory);
        address instance = _create(factory, player, 0);
        _assertUnsolved(instance, player);

        Dummy(instance).setCompleted(true);
        _assertSolved(factory, instance, player);
    }

    function test_unsolvedInstanceIsNotCompleted() public {
        DummyFactory factory = new DummyFactory();
        _register(factory);
        address instance = _create(factory, player, 0);
        assertFalse(_submit(instance, player));
        assertFalse(stats.isLevelCompleted(player, address(factory)));
    }

    function test_rejectsInstanceFromUnregisteredFactory() public {
        DummyFactory factory = new DummyFactory();
        vm.prank(player, player);
        vm.expectRevert("This level doesn't exists");
        lux.createLevelInstance(factory);
    }

    function test_onlyOwnerRegisters() public {
        DummyFactory factory = new DummyFactory();
        vm.prank(player, player);
        vm.expectRevert();
        lux.registerLevel(factory);
        assertFalse(stats.doesLevelExist(address(factory)));
    }
}
