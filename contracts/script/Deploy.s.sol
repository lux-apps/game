// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {Script} from "forge-std/Script.sol";
import {ERC1967Utils} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Utils.sol";

import {Lux} from "../src/Lux.sol";
import {Statistics} from "../src/metrics/Statistics.sol";
import {ProxyStats} from "../src/proxy/ProxyStats.sol";
import {Level} from "../src/levels/base/Level.sol";

import {InstanceFactory} from "../src/levels/InstanceFactory.sol";
import {FallbackFactory} from "../src/levels/FallbackFactory.sol";
import {FalloutFactory} from "../src/levels/FalloutFactory.sol";
import {CoinFlipFactory} from "../src/levels/CoinFlipFactory.sol";
import {TelephoneFactory} from "../src/levels/TelephoneFactory.sol";
import {TokenFactory} from "../src/levels/TokenFactory.sol";
import {DelegationFactory} from "../src/levels/DelegationFactory.sol";
import {ForceFactory} from "../src/levels/ForceFactory.sol";
import {VaultFactory} from "../src/levels/VaultFactory.sol";
import {KingFactory} from "../src/levels/KingFactory.sol";
import {ReentranceFactory} from "../src/levels/ReentranceFactory.sol";
import {ElevatorFactory} from "../src/levels/ElevatorFactory.sol";
import {PrivacyFactory} from "../src/levels/PrivacyFactory.sol";
import {GatekeeperOneFactory} from "../src/levels/GatekeeperOneFactory.sol";
import {GatekeeperTwoFactory} from "../src/levels/GatekeeperTwoFactory.sol";
import {NaughtCoinFactory} from "../src/levels/NaughtCoinFactory.sol";
import {PreservationFactory} from "../src/levels/PreservationFactory.sol";
import {RecoveryFactory} from "../src/levels/RecoveryFactory.sol";
import {MagicNumFactory} from "../src/levels/MagicNumFactory.sol";
import {AlienCodexFactory} from "../src/levels/AlienCodexFactory.sol";
import {DenialFactory} from "../src/levels/DenialFactory.sol";
import {ShopFactory} from "../src/levels/ShopFactory.sol";
import {DexFactory} from "../src/levels/DexFactory.sol";
import {DexTwoFactory} from "../src/levels/DexTwoFactory.sol";
import {PuzzleWalletFactory} from "../src/levels/PuzzleWalletFactory.sol";
import {MotorbikeFactory} from "../src/levels/MotorbikeFactory.sol";
import {DoubleEntryPointFactory} from "../src/levels/DoubleEntryPointFactory.sol";
import {GoodSamaritanFactory} from "../src/levels/GoodSamaritanFactory.sol";
import {GatekeeperThreeFactory} from "../src/levels/GatekeeperThreeFactory.sol";
import {SwitchFactory} from "../src/levels/SwitchFactory.sol";

/// @dev Deploys Lux, the Statistics implementation and its transparent proxy,
/// then every level factory in gamedata.json (deployId) order, registering each
/// with Lux, and writes client/src/gamedata/deploy.<network>.json in the shape
/// the client reads: keys "0".."29" plus lux/implementation/proxyAdmin/proxyStats.
contract Deploy is Script {
    uint256 constant LEVEL_COUNT = 30;

    function run() external {
        string memory network = _networkName();
        string memory path =
            string.concat("../client/src/gamedata/deploy.", network, ".json");

        vm.startBroadcast();

        Lux lux = new Lux();
        Statistics implementation = new Statistics();
        ProxyStats proxyStats =
            new ProxyStats(address(implementation), msg.sender, address(lux));
        lux.setStatistics(address(proxyStats));

        address[LEVEL_COUNT] memory levels = _deployLevels();
        for (uint256 i; i < LEVEL_COUNT; i++) {
            lux.registerLevel(Level(levels[i]));
        }

        vm.stopBroadcast();

        // The transparent proxy stores its ProxyAdmin in the ERC1967 admin slot.
        address proxyAdmin =
            address(uint160(uint256(vm.load(address(proxyStats), ERC1967Utils.ADMIN_SLOT))));

        _write(path, levels, address(lux), address(implementation), proxyAdmin, address(proxyStats));
    }

    function _deployLevels() internal returns (address[LEVEL_COUNT] memory levels) {
        levels[0] = address(new InstanceFactory());
        levels[1] = address(new FallbackFactory());
        levels[2] = address(new FalloutFactory());
        levels[3] = address(new CoinFlipFactory());
        levels[4] = address(new TelephoneFactory());
        levels[5] = address(new TokenFactory());
        levels[6] = address(new DelegationFactory());
        levels[7] = address(new ForceFactory());
        levels[8] = address(new VaultFactory());
        levels[9] = address(new KingFactory());
        levels[10] = address(new ReentranceFactory());
        levels[11] = address(new ElevatorFactory());
        levels[12] = address(new PrivacyFactory());
        levels[13] = address(new GatekeeperOneFactory());
        levels[14] = address(new GatekeeperTwoFactory());
        levels[15] = address(new NaughtCoinFactory());
        levels[16] = address(new PreservationFactory());
        levels[17] = address(new RecoveryFactory());
        levels[18] = address(new MagicNumFactory());
        levels[19] = address(new AlienCodexFactory());
        levels[20] = address(new DenialFactory());
        levels[21] = address(new ShopFactory());
        levels[22] = address(new DexFactory());
        levels[23] = address(new DexTwoFactory());
        levels[24] = address(new PuzzleWalletFactory());
        levels[25] = address(new MotorbikeFactory());
        levels[26] = address(new DoubleEntryPointFactory());
        levels[27] = address(new GoodSamaritanFactory());
        levels[28] = address(new GatekeeperThreeFactory());
        levels[29] = address(new SwitchFactory());
    }

    function _networkName() internal view returns (string memory) {
        string memory env = vm.envOr("NETWORK", string(""));
        if (bytes(env).length != 0) return env;
        if (block.chainid == 1337) return "local";
        return vm.toString(block.chainid);
    }

    function _write(
        string memory path,
        address[LEVEL_COUNT] memory levels,
        address lux,
        address implementation,
        address proxyAdmin,
        address proxyStats
    ) internal {
        string memory obj = "deploy";
        string memory json;
        for (uint256 i; i < LEVEL_COUNT; i++) {
            json = vm.serializeAddress(obj, vm.toString(i), levels[i]);
        }
        vm.serializeAddress(obj, "lux", lux);
        vm.serializeAddress(obj, "implementation", implementation);
        vm.serializeAddress(obj, "proxyAdmin", proxyAdmin);
        json = vm.serializeAddress(obj, "proxyStats", proxyStats);
        vm.writeJson(json, path);
    }
}
