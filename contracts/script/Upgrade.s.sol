// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {Script} from "forge-std/Script.sol";
import {ITransparentUpgradeableProxy} from
    "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import {ProxyAdmin} from "../src/proxy/ProxyAdmin.sol";
import {Statistics} from "../src/metrics/Statistics.sol";

/// @dev Deploys a fresh Statistics implementation and points the transparent
/// proxy at it through the ProxyAdmin, then records the new implementation in
/// deploy.<network>.json. Replaces upgrade_proxy.mjs.
contract Upgrade is Script {
    function run() external {
        string memory network = _networkName();
        string memory path =
            string.concat("../client/src/gamedata/deploy.", network, ".json");
        string memory json = vm.readFile(path);

        address proxyAdmin = vm.parseJsonAddress(json, ".proxyAdmin");
        address proxyStats = vm.parseJsonAddress(json, ".proxyStats");

        vm.startBroadcast();
        Statistics implementation = new Statistics();
        ProxyAdmin(proxyAdmin).upgradeAndCall(
            ITransparentUpgradeableProxy(proxyStats), address(implementation), ""
        );
        vm.stopBroadcast();

        vm.writeJson(vm.toString(address(implementation)), path, ".implementation");
    }

    function _networkName() internal view returns (string memory) {
        string memory env = vm.envOr("NETWORK", string(""));
        if (bytes(env).length != 0) return env;
        if (block.chainid == 1337) return "local";
        return vm.toString(block.chainid);
    }
}
