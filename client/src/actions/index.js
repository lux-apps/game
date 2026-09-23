export const CONNECT_WALLET = "CONNECT_WALLET";
export const connectWallet = () => ({ type: CONNECT_WALLET })

export const SET_NETWORK_ID = "SET_NETWORK_ID";
export const setNetworkId = id => ({ type: SET_NETWORK_ID, id })

export const SET_PLAYER_ADDRESS = "SET_PLAYER_ADDRESS";
export const setPlayerAddress = address => ({ type: SET_PLAYER_ADDRESS, address })

export const LOAD_GAME_DATA = "LOAD_GAME_DATA";
export const loadGamedata = () => ({ type: LOAD_GAME_DATA, levels: undefined })

export const LOAD_LUX_CONTRACT = "LOAD_LUX_CONTRACT";
export const loadLuxContract = () => ({ type: LOAD_LUX_CONTRACT, contract: undefined })

export const ACTIVATE_LEVEL = "ACTIVATE_LEVEL";
export const activateLevel = address => ({ type: ACTIVATE_LEVEL, address })

export const DEACTIVATE_LEVEL = "DEACTIVATE_LEVEL";
export const deactivateLevel = level => ({ type: DEACTIVATE_LEVEL, level })

export const LOAD_LEVEL_INSTANCE = "LOAD_LEVEL_INSTANCE";
export const loadLevelInstance = (level, reuse, reset) => ({ type: LOAD_LEVEL_INSTANCE, level, reuse, instance: undefined, reset })

export const SUBMIT_LEVEL_INSTANCE = "SUBMIT_LEVEL_INSTANCE";
export const submitLevelInstance = (level, completed) => ({ type: SUBMIT_LEVEL_INSTANCE, level, completed })

export const SYNC_PLAYER_PROGRESS = "SYNC_PLAYER_PROGRESS";
export const syncPlayerProgress = () => ({ type: SYNC_PLAYER_PROGRESS })

export const SET_LANG = "SET_LANG";
export const setLang = (lang) => ({ type: SET_LANG, lang }) 

export const CLEAR_SOLVED_LEVELS = "CLEAR_SOLVED_LEVELS";
export const clearSolvedLevels = () => ({ type: CLEAR_SOLVED_LEVELS }) 

export const CHECK_ALL_COMPLETED = "CHECK_ALL_COMPLETED";


