// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import "@openzeppelin/contracts/access/Ownable.sol";

contract AlienCodex is Ownable {
    bool public contact;
    bytes32[] public codex;

    constructor() Ownable(msg.sender) {}

    modifier contacted() {
        assert(contact);
        _;
    }

    function makeContact() public {
        contact = true;
    }

    function record(bytes32 _content) public contacted {
        codex.push(_content);
    }

    // The bug: retracting past zero underflows the dynamic array length, making
    // every storage slot writable through `revise`. Solidity >=0.6 forbids
    // assigning to `.length`, so the underflow is expressed directly against the
    // length slot. Owner sits in slot 0 (packed with `contact`); the codex data
    // region starts at keccak256(1).
    function retract() public contacted {
        assembly {
            sstore(codex.slot, sub(sload(codex.slot), 1))
        }
    }

    function revise(uint256 i, bytes32 _content) public contacted {
        codex[i] = _content;
    }
}
