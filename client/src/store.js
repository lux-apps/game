/* eslint-disable no-underscore-dangle */

import reducer from './reducers';
import { createLogger } from 'redux-logger';
import { createStore, applyMiddleware, compose } from 'redux';

import loadLuxContract from './middlewares/loadLuxContract'
import loadGamedata from './middlewares/loadGamedata'
import loadLevelInstance from './middlewares/loadLevelInstance'
import submitLevelInstance from './middlewares/submitLevelInstance'
import activateLevel from './middlewares/activateLevel'
import setPlayerAddress from './middlewares/setPlayerAddress'
import setNetwork from './middlewares/setNetwork'
import syncPlayerProgress from './middlewares/syncPlayerProgress'
import setLanguage from './middlewares/setLanguage';
import * as constants from '../src/constants';

const middlewares = [
  loadGamedata,
  loadLuxContract,
  loadLevelInstance,
  submitLevelInstance,
  activateLevel,
  setPlayerAddress,
  setNetwork,
  syncPlayerProgress,
  setLanguage,
];
if(constants.DEBUG_REDUX) {
  middlewares.splice( 0, 0, createLogger({collapsed: true}) )
}

// Store
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
export const store = createStore(
  reducer,
  composeEnhancers(applyMiddleware(...middlewares))
);

/* eslint-enable */