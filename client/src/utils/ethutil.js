import {
  createPublicClient,
  createWalletClient,
  custom,
  formatEther,
  getAbiItem,
  isAddress,
  parseEther,
  toFunctionSignature,
  toHex,
  zeroAddress,
} from "viem";
import { NETWORKS } from "../constants";

let publicClient;
let walletClient;
let player;

// Binds the game to the browser wallet (EIP-1193): reads go through the
// public client, transactions are signed by the wallet.
export const connect = (provider) => {
  const transport = custom(provider);
  publicClient = createPublicClient({ transport });
  walletClient = createWalletClient({ transport });
};

// Default sender for transactions: the console's `player`.
export const setPlayer = (address) => {
  player = address;
};

export const getPlayer = () => player;

export const requestAccount = async () => {
  const [account] = await walletClient.requestAddresses();
  return account;
};

// Transaction fields a trailing options object may carry, as the console
// has always taken them: contract.fn(arg, { value: toWei("1") }).
const OPTIONS = ["from", "value", "gas", "gasPrice", "maxFeePerGas", "maxPriorityFeePerGas", "nonce"];

const isOptions = (arg) =>
  arg !== null &&
  typeof arg === "object" &&
  !Array.isArray(arg) &&
  Object.keys(arg).every((key) => OPTIONS.includes(key));

// Converts decimal or hex strings and numbers to what viem expects.
const txFields = ({ from, value, gas, gasPrice, maxFeePerGas, maxPriorityFeePerGas, nonce }) => {
  const fields = { account: from ?? player };
  if (value !== undefined) fields.value = BigInt(value);
  if (gas !== undefined) fields.gas = BigInt(gas);
  if (gasPrice !== undefined) fields.gasPrice = BigInt(gasPrice);
  if (maxFeePerGas !== undefined) fields.maxFeePerGas = BigInt(maxFeePerGas);
  if (maxPriorityFeePerGas !== undefined) fields.maxPriorityFeePerGas = BigInt(maxPriorityFeePerGas);
  if (nonce !== undefined) fields.nonce = Number(nonce);
  return fields;
};

const confirm = async (hash) => {
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status === "reverted") throw new Error(`Transaction ${hash} reverted`);
  return receipt;
};

const invoke = async (address, fn, args, options) => {
  const { account, ...tx } = txFields(options);
  const request = { address, abi: [fn], functionName: fn.name, args, account };
  if (fn.stateMutability === "view" || fn.stateMutability === "pure") {
    return publicClient.readContract(request);
  }
  return confirm(await walletClient.writeContract({ ...request, ...tx, chain: null }));
};

// Picks the overload whose arity matches the arguments, then by argument
// types; a trailing options object is taken off when no overload takes it.
const resolve = (overloads, args) => {
  for (const withOptions of [false, true]) {
    if (withOptions && !isOptions(args[args.length - 1])) break;
    const params = withOptions ? args.slice(0, -1) : args;
    const candidates = overloads.filter((fn) => fn.inputs.length === params.length);
    if (candidates.length === 0) continue;
    const fn =
      candidates.length === 1
        ? candidates[0]
        : getAbiItem({ abi: candidates, name: candidates[0].name, args: params });
    return [fn, params, withOptions ? args[args.length - 1] : {}];
  }
  throw new Error(`${overloads[0].name}: no overload takes ${args.length} arguments`);
};

// The object the console exposes as `contract` and `lux`: contract.fn(...args)
// reads view and pure functions and sends a transaction from `player` for the
// rest, resolving to its receipt. contract.methods["fn(uint256)"] names one
// overload exactly.
export const contractAt = (abi, address) => {
  const functions = abi.filter((item) => item.type === "function");
  const contract = {
    abi,
    address,
    methods: {},
    sendTransaction: (options = {}) => sendTransaction({ to: address, ...options }),
    send: (value, options = {}) => sendTransaction({ to: address, value, ...options }),
  };
  for (const fn of functions) {
    contract.methods[toFunctionSignature(fn)] = (...args) => {
      const options = args.length > fn.inputs.length ? args.pop() : {};
      return invoke(address, fn, args, options);
    };
  }
  for (const name of new Set(functions.map((fn) => fn.name))) {
    if (name in contract) continue;
    const overloads = functions.filter((fn) => fn.name === name);
    contract[name] = (...args) => invoke(address, ...resolve(overloads, args));
  }
  return contract;
};

// Resolves to the contract at `address`, or rejects when no code is there.
export const loadContract = async (abi, address) => {
  const code = await publicClient.getCode({ address });
  if (!code) throw new Error(`No contract code at ${address}`);
  return contractAt(abi, address);
};

export const deployContract = async ({ abi, bytecode }, args = []) => {
  const hash = await walletClient.deployContract({
    abi,
    bytecode: bytecode.object,
    args,
    account: player,
    chain: null,
  });
  return (await confirm(hash)).contractAddress;
};

export const getBalance = async (address) =>
  formatEther(await publicClient.getBalance({ address }));

export const getBlockNumber = async () => Number(await publicClient.getBlockNumber());

export const getNetworkId = () => publicClient.getChainId();

export const getStorageAt = (address, slot) =>
  publicClient.getStorageAt({ address, slot: toHex(BigInt(slot)) });

export const sendTransaction = async ({ to, data, ...options } = {}) =>
  confirm(await walletClient.sendTransaction({ to, data, ...txFields(options), chain: null }));

export const toWei = (ether) => parseEther(String(ether)).toString();

export const fromWei = (wei) => formatEther(BigInt(wei));

export const validateAddress = (address) =>
  Boolean(address) && address !== zeroAddress && isAddress(address);

// Asks the wallet to switch to `network`, adding the chain when the wallet
// does not know it yet (EIP-3326 error 4902).
export const switchNetwork = async ({ chain }) => {
  try {
    await walletClient.switchChain({ id: chain.id });
  } catch (error) {
    if (error.code !== 4902) throw error;
    await walletClient.addChain({ chain });
  }
};

export const getNetworkFromId = (networkId) =>
  Object.values(NETWORKS).find((network) => network && network.id === networkId.toString());

export const getNetworkNamefromId = (networkId) => getNetworkFromId(networkId).name;
