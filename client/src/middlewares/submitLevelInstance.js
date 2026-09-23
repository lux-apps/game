import { isAddressEqual, parseEventLogs } from 'viem'
import * as actions from '../actions';
import { loadTranslations } from '../utils/translations'
import { getPercentageOfLevelsSolvedByPlayer } from '../utils/statsContract'

let language = localStorage.getItem('lang')
let strings = loadTranslations(language)

const submitLevelInstance = store => next => async action => {
  if (action.type !== actions.SUBMIT_LEVEL_INSTANCE) return next(action)
  if (action.completed) return next(action)

  const state = store.getState()
  if (
    !state.network.connected ||
    !state.contracts.lux ||
    !state.contracts.levels[action.level.deployedAddress] ||
    !state.player.address
  ) return next(action)

  console.asyncInfo(`@good ${strings.submitLevelMessage}`)
  let completed = await submitLevelInstanceUtil(
    state.contracts.lux,
    action.level.deployedAddress,
    state.contracts.levels[action.level.deployedAddress].address,
    state.player.address
  )
  if (completed) {
    console.victory(`@good ${strings.wellDoneMessage}, ${strings.completedLevelMessage}`);
    const percentage = await getPercentageOfLevelsSolvedByPlayer(state.player.address, state.network.networkId);
    if(percentage) {
      if( Number(percentage) < 51 && Number(percentage) >= 49) {
        console.info(`${strings.FifthyPercentMessage}`)
      } else if ( Number(percentage) < 76 && Number(percentage) > 74) {
        console.info(`${strings.SeventyFivePercentMessage}`)
      } else if ( Number(percentage) < 91 && Number(percentage) > 89) {
        console.info(`${strings.NinetyPercentMessage}`)
      } else if ( Number(percentage) > 99 ) {
        console.info(`${strings.HundredPercentMessage}`)
      }
    }
  }
  else {
    console.error(`@bad ${strings.uncompletedLevelMessage} @bad`)
  }

  action.completed = completed
  next(action)
}

export default submitLevelInstance

async function submitLevelInstanceUtil(lux, levelAddress, instanceAddress, player) {
  try {
    const receipt = await lux.submitLevelInstance(instanceAddress)
    return parseEventLogs({ abi: lux.abi, eventName: 'LevelCompletedLog', logs: receipt.logs })
      .some(({ args }) => isAddressEqual(args.player, player) && isAddressEqual(args.level, levelAddress))
  } catch (error) {
    console.error(error)
    return false
  }
}
