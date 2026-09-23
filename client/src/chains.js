import { defineChain } from "viem";

// Lux C-Chain testnet. The node serves every chain under /v1/chain/<alias>.
export const luxTestnet = defineChain({
  id: 96368,
  name: "Lux Testnet",
  nativeCurrency: { name: "Lux", symbol: "LUX", decimals: 18 },
  rpcUrls: { default: { http: ["https://api.lux-test.network/v1/chain/C/rpc"] } },
  blockExplorers: { default: { name: "Lux Explorer", url: "https://explore.lux-test.network" } },
  testnet: true,
});
