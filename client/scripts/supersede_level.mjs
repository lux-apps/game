// Replaces a deployed level with a fresh deployment of its current code and
// moves its statistics to the new address (see docs/supersede_level.md).
//
//   NETWORK=local|lux-testnet  RPC_URL=<url>  [PRIV_KEY=0x… | FROM=0x…]  node supersede_level.mjs
//
// Without PRIV_KEY the node signs for FROM, or for its first unlocked
// account (anvil). The signer operates the migration, so it must own Lux
// and the ProxyAdmin.
import { readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { styleText } from "node:util";
import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  getAddress,
  getContract,
  http,
  isAddressEqual,
  toHex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { localhost } from "viem/chains";
import { luxTestnet } from "../src/chains.js";

const CHAINS = { local: localhost, "lux-testnet": luxTestnet };
const NETWORK = process.env.NETWORK ?? "local";
const RPC_URL = process.env.RPC_URL ?? "http://127.0.0.1:8545";
const chain = CHAINS[NETWORK];
if (!chain) fail(`Unknown NETWORK ${NETWORK}; one of ${Object.keys(CHAINS).join(", ")}`);

const DEPLOY_DATA_PATH = new URL(`../src/gamedata/deploy.${NETWORK}.json`, import.meta.url);
const OUT = new URL("../../contracts/out/", import.meta.url);
const { levels } = JSON.parse(readFileSync(new URL("../src/gamedata/gamedata.json", import.meta.url)));
const DeployData = JSON.parse(readFileSync(DEPLOY_DATA_PATH, "utf8"));

// Statistics keeps onMaintenance at storage slot 17 while superseding.
const MAINTENANCE_SLOT = 17;
// The dump functions work until gasleft() runs low, so gas sets the batch.
const DUMP_GAS = 4_000_000n;

// Dump stages enum (StatisticsLevelSuperseder.DumpStage)
const DumpStage = {
  INIT: 0,
  SET_ADDRESSES: 1,
  LEVEL_FIRST_INSTANCE_CREATION_TIME: 2,
  LEVEL_FIRST_COMPLETION_TIME: 3,
  PLAYER_STATS: 4,
  LEVEL_STATS: 5,
  LEVEL_EXISTS_AND_LEVELS_ARRAY_FIX: 6,
  DUMP_DONE: 7,
};

const transport = http(RPC_URL);
const client = createPublicClient({ chain, transport });
const account = process.env.PRIV_KEY
  ? privateKeyToAccount(process.env.PRIV_KEY)
  : process.env.FROM ?? (await client.request({ method: "eth_accounts" }))[0];
if (!account) fail("No signer: set PRIV_KEY or use a node with unlocked accounts");
const wallet = createWalletClient({ account, chain, transport });
const operator = wallet.account.address;

const artifact = (file, name = file.split(".")[0]) =>
  JSON.parse(readFileSync(new URL(`${file}/${name}.json`, OUT), "utf8"));

const at = (address, file, name) =>
  getContract({ address, abi: artifact(file, name).abi, client: { public: client, wallet } });

const lux = at(DeployData.lux, "Lux.sol");
const proxyAdmin = at(DeployData.proxyAdmin, "ProxyAdmin.sol");
// The proxy, called through the ABIs of the implementations behind it.
const stats = at(DeployData.proxyStats, "Statistics.sol");
const superseder = at(DeployData.proxyStats, "StatisticsLevelSuperseder.sol");

// Answers are read line by line, so they can also be piped in.
const prompt = createInterface({ input: process.stdin });
const answers = prompt[Symbol.asyncIterator]();

async function ask(question) {
  process.stdout.write(styleText(["bold", "yellow"], question));
  const { value = "" } = await answers.next();
  return value.trim();
}

await supersede();

async function supersede() {
  let oldAddress;
  let newAddress;
  // check if there is a pending process
  if (await onMaintenance()) {
    console.log(styleText(["bold", "red"], "Pending level replacement detected, resuming..."));
    oldAddress = await superseder.read.oldLevelContractAddress();
    newAddress = await superseder.read.newLevelContractAddress();
    console.log(styleText("gray", ` DumpStage: ${await superseder.read.dumpStage()}`));
    console.log(styleText("gray", ` From: ${oldAddress}`));
    console.log(styleText("gray", ` To: ${newAddress}`));
  } else {
    // Print available levels list
    console.log(styleText(["bold", "yellow"], "\nLux level replacement tool, available levels:\n"));
    levels.forEach((level) => {
      console.log(` ${styleText("red", level.deployId)}) ${styleText("cyan", level.name)}`);
    });

    // Get operator's level choice
    const level = await getLevelToBeSuperseded();
    // Check if level is registered into lux and is not already superseded
    if (!(await lux.read.registeredLevels([DeployData[level.deployId]]))) {
      fail("Level is not registered in Lux");
    }
    if (!(await stats.read.doesLevelExist([DeployData[level.deployId]]))) {
      fail("Level is already superseded");
    }

    await printLevelInfo(level);

    // Confirm substitution by operator
    if (!(await confirm("\nConfirm substitution?"))) {
      fail("Substitution not confirmed by operator");
    }

    await upgradeStatisticsToSuperseder();

    const newLevel = await deployLevel(level);
    ({ oldAddress, newAddress } = storeSubstitutionInDeployData(newLevel, level));

    await registerLevelInLux(newAddress, level);
    await setSubstitutionAddresses(oldAddress, newAddress);
  }

  await dumpData();
  await cleanStorage();
  await printEditedStorageSlots(oldAddress, newAddress);
  await downgradeSupersederToStatistics();

  prompt.close();
}

async function onMaintenance() {
  const slot = await client.getStorageAt({
    address: DeployData.proxyStats,
    slot: toHex(MAINTENANCE_SLOT),
  });
  return slot?.endsWith("1");
}

// Sends a transaction and resolves to its receipt, failing on a revert.
async function send(hash) {
  const receipt = await client.waitForTransactionReceipt({ hash: await hash });
  if (receipt.status !== "success") fail(`Transaction ${receipt.transactionHash} reverted`);
  return receipt;
}

async function getLevelToBeSuperseded() {
  const deployId = await ask("\nWhich deployId do you want to supersede? ");
  const level = levels.find((l) => l.deployId === deployId);
  if (!level) fail("deployId entered must be in the list");
  return level;
}

async function confirm(question) {
  return /^y$/i.test(await ask(`${question} (y/n) `));
}

async function printLevelInfo(level) {
  const levelAddress = DeployData[level.deployId];
  const failed = await stats.read.getNoOfFailedSubmissionsForLevel([levelAddress]);
  const completed = await stats.read.getNoOfCompletedSubmissionsForLevel([levelAddress]);
  const instances = await stats.read.getNoOfInstancesForLevel([levelAddress]);

  console.log(styleText(["bold", "yellow"], `\nSelected level data:`));
  console.log(` Network: ${styleText("green", NETWORK)}`);
  console.log(` Name: ${styleText("green", level.name)}`);
  console.log(` Address: ${styleText("green", levelAddress)}`);
  console.log(` Failed submissions: ${styleText("green", failed.toString())}`);
  console.log(` Completed submissions: ${styleText("green", completed.toString())}`);
  console.log(` Instances: ${styleText("green", instances.toString())}`);
}

async function upgradeStatisticsToSuperseder() {
  console.log(styleText(["bold", "yellow"], "\nDeploying and upgrading Statistics to StatisticsLevelSuperseder..."));

  console.log(styleText("gray", ` Deploying StatisticsLevelSuperseder.sol...`));
  const { abi, bytecode } = artifact("StatisticsLevelSuperseder.sol");
  const { contractAddress } = await send(wallet.deployContract({ abi, bytecode: bytecode.object }));
  console.log(styleText("gray", " Done!"), "✅");
  console.log(` SupersederImplementation: ${contractAddress}`);

  // Upgrade, setting the operator and the on maintenance flag
  console.log(styleText("gray", ` Upgrading Proxy...`));
  const setOperator = encodeFunctionData({ abi, functionName: "setOperator", args: [operator] });
  await send(proxyAdmin.write.upgradeAndCall([DeployData.proxyStats, contractAddress, setOperator]));
  console.log(styleText("gray", ` Proxy is upgraded! ✅`));

  if (!(await onMaintenance())) fail("Error onMaintenance not set");
}

async function deployLevel(level) {
  console.log(styleText(["bold", "yellow"], `\nDeploying ${level.levelContract}, deployId: ${level.deployId}...`));
  const { abi, bytecode } = artifact(level.levelContract);
  const { contractAddress } = await send(
    wallet.deployContract({ abi, bytecode: bytecode.object, args: level.deployParams })
  );
  console.log(styleText("gray", " Done!"), "✅");
  console.log(" new Address:", styleText(["bold", "green"], contractAddress));
  return getAddress(contractAddress);
}

// Records the substitution; implementation keeps naming Statistics, which
// the proxy returns to at the end.
function storeSubstitutionInDeployData(newAddress, level) {
  console.log(styleText("gray", ` Registering operation in ${DEPLOY_DATA_PATH.pathname}`));
  console.log(styleText("gray", ` ${DeployData[level.deployId]} --> ${newAddress}`));

  DeployData.supersededAddresses ??= [];
  const substitution = { oldAddress: DeployData[level.deployId], newAddress };
  DeployData.supersededAddresses.push(substitution);
  DeployData[level.deployId] = newAddress;

  storeDeployData();
  return substitution;
}

async function registerLevelInLux(newAddress, level) {
  console.log(styleText(["bold", "yellow"], "\nRegistering level in Lux contract..."));
  await send(lux.write.registerLevel([newAddress]));
  if (!(await lux.read.registeredLevels([DeployData[level.deployId]]))) {
    fail("New address level not registered in Lux");
  }
  if (!(await stats.read.doesLevelExist([DeployData[level.deployId]]))) {
    fail("New address level not registered in Statistics");
  }
  console.log(styleText("gray", " Done!"), "✅");
}

async function setSubstitutionAddresses(oldAddress, newAddress) {
  console.log(styleText("gray", " Setting substitution addresses in StatisticsLevelSuperseder..."));
  await send(superseder.write.setSubstitutionAddresses([oldAddress, newAddress]));

  if (!isAddressEqual(oldAddress, await superseder.read.oldLevelContractAddress())) {
    fail("Old address is not set correctly");
  }
  if (!isAddressEqual(newAddress, await superseder.read.newLevelContractAddress())) {
    fail("New address is not set correctly");
  }
  console.log(styleText("gray", " Done!"), "✅");
}

// Runs one dump function until the stage moves past `until`.
async function dumpUntil(name, until) {
  console.log(styleText("gray", ` Dumping ${name}`));
  do {
    console.log(styleText("gray", ` Dumped ${await superseder.read.usersArrayIndex()} Players`));
    await send(superseder.write[name]({ gas: DUMP_GAS }));
  } while ((await superseder.read.dumpStage()) !== until);
  console.log(styleText("gray", " Done!"), "✅");
}

async function dumpData() {
  console.log(styleText(["bold", "yellow"], "\nDumping statistics data..."));
  let dumpStage;
  do {
    dumpStage = await superseder.read.dumpStage();
    switch (dumpStage) {
      case DumpStage.SET_ADDRESSES:
      case DumpStage.LEVEL_FIRST_INSTANCE_CREATION_TIME:
        await dumpUntil("dumpLevelFirstInstanceCreationTime", DumpStage.LEVEL_FIRST_COMPLETION_TIME);
        break;
      case DumpStage.LEVEL_FIRST_COMPLETION_TIME:
        await dumpUntil("dumpLevelFirstCompletionTime", DumpStage.PLAYER_STATS);
        break;
      case DumpStage.PLAYER_STATS:
        await dumpUntil("dumpPlayerStats", DumpStage.LEVEL_STATS);
        break;
      case DumpStage.LEVEL_STATS:
        await dumpUntil("dumpLevelStats", DumpStage.LEVEL_EXISTS_AND_LEVELS_ARRAY_FIX);
        break;
      case DumpStage.LEVEL_EXISTS_AND_LEVELS_ARRAY_FIX:
        await dumpUntil("fixLevelExistAndLevelsArray", DumpStage.DUMP_DONE);
        break;
    }
  } while (dumpStage !== DumpStage.DUMP_DONE);
}

async function cleanStorage() {
  console.log(styleText(["bold", "yellow"], " Cleaning used storage slots..."));
  await send(superseder.write.cleanStorage());
  console.log(styleText("gray", " Done!"), "✅");
}

async function printEditedStorageSlots(oldAddress, newAddress) {
  console.log(styleText(["bold", "yellow"], " Checking operation..."));
  console.log(`old address: ${oldAddress} new address: ${newAddress}`);
  const totalPlayers = await superseder.read.getTotalNoOfPlayers();

  const perPlayer = async (getter) => {
    for (const [label, level] of [["old", oldAddress], ["new", newAddress]]) {
      for (let i = 0n; i < totalPlayers; i++) {
        const player = await superseder.read.getPlayerAtIndex([i]);
        console.log(`${label}: player ${i} : ${player}`, await superseder.read[getter]([player, level]));
      }
    }
    console.log("-------------------------------------------------");
  };
  await perPlayer("getLevelFirstInstanceCreationTime");
  await perPlayer("getLevelFirstCompletionTime");
  await perPlayer("getPlayerStats");

  console.log("Levels stats");
  console.log(`LevelStats[${oldAddress}]`, await superseder.read.getLevelStats([oldAddress]));
  console.log(`LevelStats[${newAddress}]`, await superseder.read.getLevelStats([newAddress]));
  console.log("-------------------------------------------------");
  console.log("Levels Exist");
  console.log(`levelExists[${oldAddress}]`, await superseder.read.getLevelExists([oldAddress]));
  console.log(`levelExists[${newAddress}]`, await superseder.read.getLevelExists([newAddress]));
  console.log("-------------------------------------------------");
  console.log("Levels array");
  const levelsArrayLength = await superseder.read.getTotalNoOfLuxLevels();
  console.log(`length ${levelsArrayLength}`);
  for (let i = 0n; i < levelsArrayLength; i++) {
    console.log(`arrayIndex: ${i}`, await superseder.read.getLevelAddress([i]));
  }
}

async function downgradeSupersederToStatistics() {
  console.log(styleText(["bold", "yellow"], "\nDowngrading StatisticsLevelSuperseder to Statistics..."));
  console.log(styleText("gray", ` Upgrading Proxy to ${DeployData.implementation}...`));
  await send(proxyAdmin.write.upgradeAndCall([DeployData.proxyStats, DeployData.implementation, "0x"]));
  console.log(styleText("gray", ` Proxy is downgraded! ✅`));
}

function storeDeployData() {
  console.log(styleText("green", `Writing updated deploy data: ${DEPLOY_DATA_PATH.pathname}`));
  writeFileSync(DEPLOY_DATA_PATH, JSON.stringify(DeployData, null, 2) + "\n", "utf8");
}

function fail(message) {
  console.log(styleText(["bold", "red"], message));
  process.exit(1);
}
