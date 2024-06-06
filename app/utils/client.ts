import {
  createPublicClient,
  http,
  fallback,
  createWalletClient,
  publicActions,
} from "viem";
import {
  sepolia,
  baseSepolia,
  arbitrumSepolia,
  mainnet,
  base,
  arbitrum,
  modeTestnet,
  mode
} from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
// import { Alchemy, Network } from "alchemy-sdk";

const sepoliaRpc = process.env.SEPOLIA_RPC;
const baseSepoliaRpc = process.env.BASE_SEPOLIA_RPC;
const arbitrumSepoliaRpc = process.env.ARBITRUM_SEPOLIA_RPC;
const mainnetRpc = process.env.MAINNET_RPC;
const baseRpc = process.env.BASE_RPC;
const arbitrumRpc = process.env.ARBITRUM_RPC;

const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`);

export const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: fallback([
    http(sepoliaRpc, {
      batch: true,
    }),
    http("https://eth-sepolia.public.blastapi.io"),
  ]),
});

export const arbitrumSepoliaClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(arbitrumSepoliaRpc, {
    batch: true,
  }),
});

export const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: fallback([
    http(mainnetRpc, {
      batch: true,
    }),
    http("https://eth-mainnet.public.blastapi.io"),
  ]),
});

export const arbitrumClient = createPublicClient({
  chain: arbitrum,
  transport: fallback([
    http(arbitrumRpc, {
      batch: true,
    }),
    http("https://eth-arbitrum.public.blastapi.io"),
  ]),
});
export const modeClient = createPublicClient({
  chain: mode,
  transport: http("https://mainnet.mode.network"),
})

export const baseSepoliaClient = createPublicClient({
  chain: baseSepolia,
  transport: http(baseSepoliaRpc),
});

export const baseClient = createPublicClient({
  chain: base,
  transport: http(baseRpc),
});

export const modeSepoliaClient = createPublicClient({
  chain: modeTestnet,
  transport: http("https://sepolia.mode.network"),
}).extend(publicActions);

export const walletModeClient = createWalletClient({
  account,
  chain: modeTestnet,
  transport: http("https://sepolia.mode.network"),
}).extend(publicActions);

export const walletArbitrumClient = createWalletClient({
  account,
  chain: arbitrumSepolia,
  transport: http(arbitrumSepoliaRpc),
}).extend(publicActions);

export const walletBaseClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(baseSepoliaRpc),
}).extend(publicActions);
// add default value of isWallet to false

export function getChainClient(chain: string, isWallet = false) {
  switch (chain) {
    case "sepolia":
      return sepoliaClient;
    case "mainnet":
      return mainnetClient;
    case "arbitrum":
      return arbitrumClient;
    case "base":
      return baseClient;
    case "mode":
      return modeClient;
    case "arbitrum-sepolia":
      return isWallet ? walletArbitrumClient : arbitrumSepoliaClient;
    case "base-sepolia":
      return isWallet ? walletBaseClient : baseSepoliaClient;
    case "mode-sepolia":
      return isWallet ? walletModeClient : modeSepoliaClient;
    default:
      throw new Error(`Unsupported chain ${chain}`);
  }
}
