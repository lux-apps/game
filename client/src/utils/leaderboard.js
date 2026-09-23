// Ranks players from the Lux contract's LevelCompletedLog events, oldest
// first: more distinct levels completed ranks higher, and a tie goes to
// whoever reached that count first.
export const rank = (logs) => {
  const players = new Map();
  for (const { args, blockNumber, logIndex } of logs) {
    const p = players.get(args.player) ?? { player: args.player, levels: new Set() };
    if (!p.levels.has(args.level)) {
      p.levels.add(args.level);
      p.reached = [blockNumber, logIndex];
    }
    players.set(args.player, p);
  }
  const earlier = (a, b) => (a[0] === b[0] ? a[1] - b[1] : a[0] < b[0] ? -1 : 1);
  return [...players.values()]
    .sort((a, b) => b.levels.size - a.levels.size || earlier(a.reached, b.reached))
    .map(({ player, levels }, i) => ({ rank: i + 1, player, totalNumberOfLevelsCompleted: levels.size }));
};
