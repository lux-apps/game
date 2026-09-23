// SPDX-License-Identifier: MIT

pragma solidity 0.8.37;

import "./base/Level.sol";
import "./Motorbike.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract MotorbikeFactory is Level {

  mapping(address => address) private engines;

  function createInstance(address _player) public payable override returns (address) {
    _player;

    Engine engine = new Engine();
    Motorbike motorbike = new Motorbike(address(engine));
    engines[address(motorbike)] = address(engine);

    require(
        keccak256(Address.functionCall(
            address(motorbike),
            abi.encodeWithSignature("upgrader()")
        )) == keccak256(abi.encode(address(this))), 
        "Wrong upgrader address"
    );

    require(
        keccak256(Address.functionCall(
            address(motorbike),
            abi.encodeWithSignature("horsePower()")
        )) == keccak256(abi.encode(uint256(1000))), 
        "Wrong horsePower"
    );

    return address(motorbike);
  }

  // Won when the engine implementation has been initialised in its own context,
  // which only the exploit does: the proxy initialises its own storage, so the
  // implementation's upgrader is zero until someone seizes it. The original check
  // (the engine's code is gone) cannot hold since EIP-6780, which deletes code on
  // selfdestruct only for a contract created in the same transaction.
  function validateInstance(address payable _instance, address _player) public view override returns (bool) {
    _player;
    return Engine(engines[_instance]).upgrader() != address(0);
  }
}