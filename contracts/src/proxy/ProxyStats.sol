// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {TransparentUpgradeableProxy} from
    "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

/// @dev Transparent proxy for the Statistics implementation. OpenZeppelin v5
/// deploys the managing {ProxyAdmin} internally, owned by `_initialOwner`.
contract ProxyStats is TransparentUpgradeableProxy {
    constructor(address _impl, address _initialOwner, address _luxAddress)
        TransparentUpgradeableProxy(
            _impl,
            _initialOwner,
            abi.encodeWithSignature("initialize(address)", _luxAddress)
        )
    {}
}
