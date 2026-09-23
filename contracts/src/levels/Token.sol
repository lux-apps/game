// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

contract Token {

  mapping(address => uint) balances;
  uint public totalSupply;

  constructor(uint _initialSupply) {
    balances[msg.sender] = totalSupply = _initialSupply;
  }

  function transfer(address _to, uint _value) public returns (bool) {
    // The bug: unchecked subtraction lets a sender underflow past their balance
    // and mint a near-infinite balance. Kept as the 0.8 expression of the
    // original wrap-around (`>= 0` on a uint is always true).
    unchecked {
      require(balances[msg.sender] - _value >= 0);
      balances[msg.sender] -= _value;
      balances[_to] += _value;
    }
    return true;
  }

  function balanceOf(address _owner) public view returns (uint balance) {
    return balances[_owner];
  }
}
