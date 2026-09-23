import { beforeEach, describe, expect, test } from "vitest";
import {
  decodeFunctionData,
  encodeFunctionResult,
  parseAbi,
  toFunctionSelector,
} from "viem";
import * as ethutil from "./ethutil";

const PLAYER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const OTHER = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const HASH = `0x${"11".repeat(32)}`;

const abi = parseAbi([
  "function info() view returns (string)",
  "function pair() pure returns (uint256, bool)",
  "function authenticate(string passkey)",
  "function contribute() payable",
  "function pick(uint256 a)",
  "function pick(uint256 a, uint256 b)",
  "function mark(address who)",
  "function mark(uint256 id)",
]);

// An EIP-1193 wallet that answers from `results` and records what it sent.
let sent;
let status;
const results = {
  info: () => encodeFunctionResult({ abi, functionName: "info", result: "hello" }),
  pair: () => encodeFunctionResult({ abi, functionName: "pair", result: [7n, true] }),
};
const receipt = () => ({
  blockHash: HASH,
  blockNumber: "0x1",
  contractAddress: null,
  cumulativeGasUsed: "0x5208",
  effectiveGasPrice: "0x1",
  from: PLAYER,
  gasUsed: "0x5208",
  logs: [],
  logsBloom: `0x${"00".repeat(256)}`,
  status,
  to: ADDRESS,
  transactionHash: HASH,
  transactionIndex: "0x0",
  type: "0x2",
});
const provider = {
  async request({ method, params }) {
    switch (method) {
      case "eth_chainId":
        return "0x539";
      case "eth_blockNumber":
        return "0x1";
      case "eth_getBalance":
        return "0x1bc16d674ec80000"; // 2 ether
      case "eth_getStorageAt":
        return `0x${params[1].slice(2).padStart(64, "0")}`;
      case "eth_call": {
        const { functionName } = decodeFunctionData({ abi, data: params[0].data });
        return results[functionName]();
      }
      case "eth_sendTransaction":
        sent.push(params[0]);
        return HASH;
      case "eth_getTransactionReceipt":
        return receipt();
      default:
        throw new Error(`unexpected ${method}`);
    }
  },
};

beforeEach(() => {
  sent = [];
  status = "0x1";
  ethutil.connect(provider);
  ethutil.setPlayer(PLAYER);
});

describe("contractAt", () => {
  const contract = () => ethutil.contractAt(abi, ADDRESS);

  test("exposes the abi and address", () => {
    expect(contract().abi).toBe(abi);
    expect(contract().address).toBe(ADDRESS);
  });

  test("reads view and pure functions", async () => {
    expect(await contract().info()).toBe("hello");
    expect(await contract().pair()).toEqual([7n, true]);
    expect(sent).toEqual([]);
  });

  test("sends other functions from player and resolves to the receipt", async () => {
    const result = await contract().authenticate("lux0");
    expect(result.status).toBe("success");
    expect(result.transactionHash).toBe(HASH);
    expect(sent).toHaveLength(1);
    expect(sent[0].from.toLowerCase()).toBe(PLAYER.toLowerCase());
    expect(sent[0].to.toLowerCase()).toBe(ADDRESS.toLowerCase());
    const call = decodeFunctionData({ abi, data: sent[0].data });
    expect(call).toEqual({ functionName: "authenticate", args: ["lux0"] });
  });

  test("takes a trailing options object for value and sender", async () => {
    await contract().contribute({ value: ethutil.toWei("0.001"), from: OTHER });
    expect(BigInt(sent[0].value)).toBe(10n ** 15n);
    expect(sent[0].from.toLowerCase()).toBe(OTHER.toLowerCase());
  });

  test("resolves overloads by arity", async () => {
    await contract().pick(1n);
    await contract().pick(1n, 2n, { value: 0 });
    expect(sent[0].data.slice(0, 10)).toBe(toFunctionSelector("pick(uint256)"));
    expect(sent[1].data.slice(0, 10)).toBe(toFunctionSelector("pick(uint256,uint256)"));
  });

  test("resolves overloads of one arity by argument type", async () => {
    await contract().mark(OTHER);
    await contract().mark(5n);
    expect(sent[0].data.slice(0, 10)).toBe(toFunctionSelector("mark(address)"));
    expect(sent[1].data.slice(0, 10)).toBe(toFunctionSelector("mark(uint256)"));
  });

  test("names an overload exactly through methods", async () => {
    expect(Object.keys(contract().methods)).toContain("pick(uint256,uint256)");
    await contract().methods["mark(uint256)"](5n);
    expect(sent[0].data.slice(0, 10)).toBe(toFunctionSelector("mark(uint256)"));
  });

  test("rejects a reverted transaction", async () => {
    status = "0x0";
    await expect(contract().authenticate("wrong")).rejects.toThrow(/reverted/);
  });

  test("sends plain transactions to the contract", async () => {
    await contract().sendTransaction({ data: "0xdd365b8b" });
    await contract().send(ethutil.toWei("1"));
    expect(sent[0]).toMatchObject({ data: "0xdd365b8b" });
    expect(sent[0].to.toLowerCase()).toBe(ADDRESS.toLowerCase());
    expect(BigInt(sent[1].value)).toBe(10n ** 18n);
  });
});

describe("console helpers", () => {
  test("getBalance is ether as a decimal string", async () => {
    expect(await ethutil.getBalance(PLAYER)).toBe("2");
  });

  test("toWei and fromWei convert as web3.utils did", () => {
    expect(ethutil.toWei("0.5")).toBe("500000000000000000");
    expect(ethutil.toWei(1)).toBe("1000000000000000000");
    expect(ethutil.fromWei("1500000000000000000")).toBe("1.5");
  });

  test("getStorageAt takes the slot as a number or hex", async () => {
    expect(await ethutil.getStorageAt(ADDRESS, 1)).toBe(`0x${"1".padStart(64, "0")}`);
    expect(await ethutil.getStorageAt(ADDRESS, "0x10")).toBe(`0x${"10".padStart(64, "0")}`);
  });

  test("sendTransaction sends from player and resolves to the receipt", async () => {
    const result = await ethutil.sendTransaction({ to: OTHER, value: ethutil.toWei("1") });
    expect(result.status).toBe("success");
    expect(sent[0].from.toLowerCase()).toBe(PLAYER.toLowerCase());
    expect(BigInt(sent[0].value)).toBe(10n ** 18n);
  });
});
