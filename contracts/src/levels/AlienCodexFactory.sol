// SPDX-License-Identifier: MIT

pragma solidity 0.8.37;

import './base/Level.sol';
import './AlienCodex.sol';

contract AlienCodexFactory is Level {

  function createInstance(address _player) public payable override returns (address) {
    _player;
    return address(new AlienCodex());
  }

  function validateInstance(address payable _instance, address _player) public override returns (bool) {
    AlienCodex instance = AlienCodex(_instance);
    return instance.owner() == _player;
  }
}
