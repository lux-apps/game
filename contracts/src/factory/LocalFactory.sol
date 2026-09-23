// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ProxyAdmin} from "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import {Lux} from "../Lux.sol";
import {Statistics} from "../metrics/Statistics.sol";
import {ProxyStats} from "../proxy/ProxyStats.sol";
import {Level} from "../levels/base/Level.sol";

/// @dev One-shot deployer for the four core contracts, used by the client for
/// in-browser local deployments. The transparent proxy creates its own
/// ProxyAdmin (OpenZeppelin v5); its address is the first CREATE of the proxy.
contract Factory is Ownable {
    Lux public lux;
    ProxyAdmin public proxyAdmin;
    Statistics public implementation;
    ProxyStats public proxyStats;

    constructor() Ownable(msg.sender) {
        lux = new Lux();
        implementation = new Statistics();
        proxyStats = new ProxyStats(address(implementation), address(this), address(lux));
        // The proxy deploys its ProxyAdmin as its first (nonce 1) CREATE.
        proxyAdmin = ProxyAdmin(_firstCreateOf(address(proxyStats)));
        lux.setStatistics(address(proxyStats));
        // Expose Statistics behind the proxy.
        implementation = Statistics(address(proxyStats));
    }

    function registerLevel(Level _level) public onlyOwner {
        lux.registerLevel(_level);
    }

    function transferContractsOwnership(address _newOwner) public onlyOwner {
        lux.transferOwnership(_newOwner);
        proxyAdmin.transferOwnership(_newOwner);
        transferOwnership(_newOwner);
    }

    /// @dev Address of the contract a deployer creates at nonce 1 (RLP [addr, 0x01]).
    function _firstCreateOf(address deployer) private pure returns (address) {
        return address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(bytes1(0xd6), bytes1(0x94), deployer, bytes1(0x01))
                    )
                )
            )
        );
    }
}
