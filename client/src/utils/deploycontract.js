import * as ethutil from "./ethutil";
import { loadArtifact, loadFactory } from "./artifacts";
import {
  cacheContract,
  restoreContract,
  updateCachedContract,
} from "./contractutil";
import { CORE_CONTRACT_NAMES, ID_TO_NETWORK } from "../constants";
import { loadTranslations } from "../utils/translations";

const logger = (text) => {
  console.dir(`<<  ${text.toUpperCase()}  >>`);
};

async function deploySingleContract(name, artifact) {
  logger(`Deploying ${name} contract`);
  return ethutil.contractAt(artifact.abi, await ethutil.deployContract(artifact));
}

const confirmMainnetDeployment = (chainId) => {
  if (
    chainId === 1 ||
    chainId === 1 || // Eth mainnet
    chainId === 137 || // Polygon
    chainId === 10 || // Optmism
    chainId === 42161 || // Arbitrum
    chainId === 56 // Binance
  ) {
    let language = localStorage.getItem("lang");
    const strings = loadTranslations(language);
    const res = window.confirm(strings.confirmMainnetDeploy);
    return res;
  }
  return true;
}

export async function deployAndRegisterLevel(level) {
  try {
    const chainId = await ethutil.getNetworkId();
    if (!confirmMainnetDeployment(chainId)) {
      return false;
    }
    const levelContract = await deploySingleContract(
      level.levelContract.split(".")[0],
      await loadArtifact(level.levelContract)
    );

    logger(`Registering ${level.name} level on the lux contract `);
    // -- use the factory to register a new level since it owns the lux contract
    const factoryAddress = restoreContract(chainId)["factory"];
    const { abi } = await loadFactory();
    await ethutil.contractAt(abi, factoryAddress).registerLevel(levelContract.address);
    // -- add this level factory instance to state
    updateCachedContract(level.deployId, levelContract.address, chainId);
    return levelContract;
  } catch (err) {
    console.log(err);
    return false;
  }
}

export async function deployAdminContracts() {
  try {
    const chainId = await ethutil.getNetworkId();
    if (!confirmMainnetDeployment(chainId)) {
      return false;
    }
    const gameData = restoreContract(chainId);

    // -- deploy factory contracts
    const factory = await deploySingleContract("Factory", await loadFactory());
    // -- query factory address for lux, proxy, proxyadmin and implementation
    const deployedCoreContracts = await Promise.all(
      CORE_CONTRACT_NAMES.map((coreContractName) => factory[coreContractName]())
    );

    // -- update the game data array with contract values
    CORE_CONTRACT_NAMES.forEach(
      (key, index) => (gameData[key] = deployedCoreContracts[index])
    );
    gameData.factory = factory.address;
    gameData.owner = ethutil.getPlayer();
    cacheContract(gameData, chainId);

    // -- stop loader (unnecessary since refresh?)
    const deployWindow = document.querySelectorAll(".deploy-window-bg");
    deployWindow[0].style.display = "none";

    // -- refresh page after deploying contracts
    document.location.replace(document.location.origin);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  } finally {
    // -- stop the loader
    const elements = document.querySelectorAll(".progress-bar-wrapper");
    elements[0].style.display = "none";
  }
}

// Addresses written by contracts/script/Deploy.s.sol, one file per network.
const deployments = import.meta.glob("../gamedata/deploy.*.json", {
  eager: true,
  import: "default",
});

// The bundled deployment of a network, or else what this browser deployed.
export const getDeployData = (networkId) =>
  deployments[`../gamedata/deploy.${ID_TO_NETWORK[networkId]}.json`] ??
  restoreContract(networkId);
