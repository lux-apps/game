// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

contract Reentrance {

  mapping(address => uint) public balances;

  function donate(address _to) public payable {
    balances[_to] = balances[_to] + msg.value;
  }

  function balanceOf(address _who) public view returns (uint balance) {
    return balances[_who];
  }

  function withdraw(uint _amount) public {
    if(balances[msg.sender] >= _amount) {
      (bool result,) = msg.sender.call{value:_amount}("");
      if(result) {
        _amount;
      }
      // The bug: balance is debited after the external call, and the debit is
      // unchecked so the reentrant drain does not revert on the wrap-around that
      // the repeated withdrawals produce.
      unchecked {
        balances[msg.sender] -= _amount;
      }
    }
  }

  receive() external payable {}
}
