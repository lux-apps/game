import { describe, expect, test } from "vitest";
import { rank } from "./leaderboard";

const A = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const B = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const C = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
const log = (player, level, blockNumber, logIndex = 0) => ({ args: { player, level }, blockNumber, logIndex });

describe("rank", () => {
  test("orders by distinct levels completed", () => {
    const ranked = rank([log(A, "0x01", 1n), log(B, "0x01", 2n), log(B, "0x02", 3n)]);
    expect(ranked).toEqual([
      { rank: 1, player: B, totalNumberOfLevelsCompleted: 2 },
      { rank: 2, player: A, totalNumberOfLevelsCompleted: 1 },
    ]);
  });

  test("a level completed twice counts once", () => {
    expect(rank([log(A, "0x01", 1n), log(A, "0x01", 2n)])[0].totalNumberOfLevelsCompleted).toBe(1);
  });

  test("a tie goes to whoever reached the count first", () => {
    const ranked = rank([log(A, "0x01", 5n, 1), log(B, "0x01", 5n, 0), log(C, "0x01", 4n)]);
    expect(ranked.map((p) => p.player)).toEqual([C, B, A]);
  });

  test("replaying a solved level does not move a player back", () => {
    const ranked = rank([log(A, "0x01", 1n), log(B, "0x01", 2n), log(A, "0x01", 9n)]);
    expect(ranked.map((p) => p.player)).toEqual([A, B]);
  });
});
