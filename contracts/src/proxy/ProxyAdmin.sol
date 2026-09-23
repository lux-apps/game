// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {ProxyAdmin as OZProxyAdmin} from
    "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

// Concrete alias for the OpenZeppelin v5 ProxyAdmin so consumers and artifact
// paths that reference proxy/ProxyAdmin.sol keep resolving. The transparent
// proxy manages upgrades through an instance of this contract via
// `upgradeAndCall`.
contract ProxyAdmin is OZProxyAdmin {
    constructor(address initialOwner) OZProxyAdmin(initialOwner) {}
}
