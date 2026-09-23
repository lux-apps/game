// SPDX-License-Identifier: MIT

pragma solidity 0.8.37;

import '@openzeppelin/contracts/access/Ownable.sol';

contract Manufactured is Ownable {
    constructor() Ownable(msg.sender) {}
}
