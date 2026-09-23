// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {LuxTest} from "../Base.t.sol";
import {DoubleEntryPointFactory} from "../../src/levels/DoubleEntryPointFactory.sol";
import {DoubleEntryPoint, Forta} from "../../src/levels/DoubleEntryPoint.sol";
import {DetectionBot} from "../../src/attacks/DetectionBot.sol";

contract DoubleEntryPointLevel is LuxTest {
    DoubleEntryPointFactory factory;
    address player = makeAddr("player");

    function setUp() public {
        _deployCore();
        factory = new DoubleEntryPointFactory();
        _register(factory);
    }

    function test_solve() public {
        address instance = _create(factory, player, 0);
        _assertUnsolved(instance, player);

        // Register a detection bot that raises an alert when the vault's sweep
        // routes through DoubleEntryPoint's delegateTransfer.
        Forta forta = DoubleEntryPoint(instance).forta();
        DetectionBot bot = new DetectionBot(address(forta));
        vm.prank(player, player);
        forta.setDetectionBot(address(bot));

        _assertSolved(factory, instance, player);
    }
}
