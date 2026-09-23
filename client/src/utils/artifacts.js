// Forge artifacts: contracts/out/<File>.sol/<Contract>.json, where the
// contract is named after its file unless given.
export const loadArtifact = async (file, name = file.split(".")[0]) =>
  require(`contracts/out/${file}/${name}.json`);
