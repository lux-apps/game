import { localhost, sepolia } from "viem/chains";

export const DEBUG = import.meta.env.DEV;
export const DEBUG_REDUX = DEBUG;
export const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

// Networks the game runs on. `chain` is what the wallet is asked to switch
// to; `explorer` verifies level instances.
export const NETWORKS = {
  UNDEFINED: undefined,
  LOCAL: {
    name: "local",
    id: "1337",
    chain: localhost,
  },
  SEPOLIA: {
    name: "sepolia",
    id: "11155111",
    chain: sepolia,
    explorer: {
      apiKey: import.meta.env.VITE_SEPOLIA_EXPLORER_API_KEY,
      apiHost: "https://api.etherscan.io/v2",
    },
  },
};

// Deprectated networks
// status: {deprecated | deprecation-planned}
export const NETWORKS_DEPRECATION = {};

// Misc
export const CLEAR_CONSOLE = !DEBUG;

// Owner addresses
export const ADDRESSES = {
  [NETWORKS.LOCAL.name]: undefined,
  [NETWORKS.SEPOLIA.name]: "0x09902A56d04a9446601a0d451E07459dC5aF0820",
};

// Core contract keys
export const CORE_CONTRACT_NAMES = [
  "lux",
  "proxyAdmin",
  "implementation",
  "proxyStats",
];

// Storage
export const VERSION = "0.1.0";
export const STORAGE_PLAYER_DATA_KEY = `lux_player_data_${VERSION}_`;
export const STORAGE_CONTRACT_DATA_KEY = `lux_contract_data_`;

// Paths
export const PATH_ROOT = "/";
export const PATH_NOT_FOUND = "/404";
export const PATH_HELP = "/help";
export const PATH_LEVEL_ROOT = `${PATH_ROOT}level/`;
export const PATH_LEVEL = `${PATH_LEVEL_ROOT}:address`;
export const PATH_STATS = `${PATH_ROOT}stats`;
export const PATH_LEADERBOARD = `${PATH_ROOT}leaderboard`

// RELEASE SENSITIVE
// -----------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------
export const CUSTOM_LOGGING = true; /* TRUE on production */
export const SHOW_ALL_COMPLETE_DESCRIPTIONS = false; /* FALSE on production */
export const SHOW_VERSION = true;

// export const ACTIVE_NETWORK = NETWORKS.SEPOLIA
// export const ACTIVE_NETWORK = NETWORKS.LOCAL;

let id_to_network = {};
Object.keys(NETWORKS)
  .filter(
    (network) => NETWORKS[network] /*&& NETWORKS[network].name !== 'local'*/
  )
  .forEach(
    (network) => (id_to_network[NETWORKS[network].id] = NETWORKS[network].name)
  );

export const ID_TO_NETWORK = id_to_network;
// -----------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------

export const ALIAS_PATH = "https://raw.githubusercontent.com/luxdefi/game-leaderboard/update/boards/aliases.json"

export const getLeaderboardPath = (network) => {
  return `https://raw.githubusercontent.com/luxdefi/game-leaderboard/update/boards/networkleaderboards/${network}LeaderBoard.json`
}