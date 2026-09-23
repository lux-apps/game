import { combineReducers } from 'redux';
import networkReducer from './networkReducer'
import gamedataReducer from './gamedataReducer'
import playerReducer from './playerReducer'
import contractsReducer from './contractsReducer'
import languageReducer from './languageReducer'

const reducer = combineReducers({
  network: networkReducer,
  gamedata: gamedataReducer,
  player: playerReducer,
  contracts: contractsReducer,
  lang: languageReducer,
});

export default reducer;