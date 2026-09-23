// Forge artifacts: contracts/out/<File>.sol/<Contract>.json, where the
// contract is named after its file unless given. Each loads on demand.
const artifacts = import.meta.glob([
  "../../../contracts/out/*.sol/*.json",
  "!../../../contracts/out/*.t.sol/*.json",
  "!../../../contracts/out/*.s.sol/*.json",
]);

export const loadArtifact = async (file, name = file.split(".")[0]) => {
  const load = artifacts[`../../../contracts/out/${file}/${name}.json`];
  if (!load) throw new Error(`No artifact for ${file}:${name}; run forge build`);
  return (await load()).default;
};

// Solidity sources of the levels, as text, for players to read.
const sources = import.meta.glob("../../../contracts/src/levels/*.sol", {
  query: "?raw",
  import: "default",
});

// A loader resolving to the source of contracts/src/levels/<file>.
export const levelSource = (file) => sources[`../../../contracts/src/levels/${file}`];
