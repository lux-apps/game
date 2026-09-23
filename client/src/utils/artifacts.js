// Level contracts as forge compiled them, one loader per source in
// contracts/src/levels resolving to { abi, bytecode } (see the artifact
// plugin in vite.config.js).
const artifacts = import.meta.glob("../../../contracts/src/levels/*.sol", {
  query: "?artifact",
});

export const loadArtifact = (file) => {
  const load = artifacts[`../../../contracts/src/levels/${file}`];
  if (!load) throw new Error(`No level contract ${file}`);
  return load();
};

// The one-shot deployer of the core contracts, for networks the game has
// no deployment on.
export const loadFactory = () =>
  import("../../../contracts/src/factory/LocalFactory.sol?artifact=Factory");

// Solidity sources of the levels, as text, for players to read.
const sources = import.meta.glob("../../../contracts/src/levels/*.sol", {
  query: "?raw",
  import: "default",
});

// A loader resolving to the source of contracts/src/levels/<file>.
export const levelSource = (file) => sources[`../../../contracts/src/levels/${file}`];
