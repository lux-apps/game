import { parseEventLogs } from 'viem';
import * as actions from '../actions';
import { loadTranslations } from '../utils/translations';
import { loadContract, toWei } from '../utils/ethutil';
import { loadArtifact } from '../utils/artifacts';
import { verifyContract } from '../utils/contractutil';

let language = localStorage.getItem('lang');
let strings = loadTranslations(language);

const loadLevelInstance = (store) => (next) => async (action) => {
  if (action.type !== actions.LOAD_LEVEL_INSTANCE) return next(action);

  const state = store.getState();
  if (!state.network.connected || !state.contracts.lux) {
    console.error(`@bad ${strings.luxNotFoundMessage}`);
    return next(action);
  } else if (!state.player.address) {
    console.error(`@bad ${strings.noPlayerAddressMessage}`);
    return next(action);
  }

  // Recover old instance address from local cache?
  let instanceAddress;

  if (action.instanceAddress) instanceAddress = action.instanceAddress;
  else if (action.reuse) {
    const cache = state.player.emittedLevels[action.level.deployedAddress];
    if (cache) instanceAddress = cache;
  }

  // Get a new instance address
  if (!instanceAddress && !action.reuse) {
    console.asyncInfo(`@good ${strings.requestingNewInstanceMessage}`);

    const showErr = function (error) {
      console.error(
        `@bad ${strings.unableToRetrieveLevelMessage}`,
        error || ''
      );
    };

    const lux = state.contracts.lux;
    try {
      const receipt = await lux.createLevelInstance(action.level.deployedAddress, {
        value: toWei(action.level.deployFunds),
      });
      const [log] = parseEventLogs({
        abi: lux.abi,
        eventName: 'LevelInstanceCreatedLog',
        logs: receipt.logs,
      });
      if (!log) return showErr(strings.transactionNoLogsMessage);
      action.instanceAddress = log.args.instance;
      store.dispatch(action);
      // Wait for the contract to index in the explorer
      setTimeout(() => {
        verifyContract(log.args.instance, action.level, state.network.networkId);
      }, 30000);
    } catch (error) {
      showErr(error);
    }
    return;
  }

  // Get instance from address
  if (!instanceAddress) return;
  console.info(`=> ${strings.instanceAddressMessage}\n${instanceAddress}`);
  const { abi } = await loadArtifact(action.level.instanceContract);
  loadContract(abi, instanceAddress)
    .then((instance) => {
      window.instance = instance.address;
      window.contract = instance;
      action.instance = instance;
      next(action);
    })
    .catch(() => {
      console.log(`waiting`);
      setTimeout(() => {
        store.dispatch(action);
      }, 1000);
    });
};

export default loadLevelInstance;
