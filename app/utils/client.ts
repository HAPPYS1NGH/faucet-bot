import { createPublicClient, http, fallback, createWalletClient } from "viem";
import {
  sepolia,
  baseSepolia,
  arbitrumSepolia,
  mainnet,
  base,
  arbitrum,
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

export const baseSepoliaClient = createPublicClient({
  chain: baseSepolia,
  transport: http(baseSepoliaRpc),
});

export const baseClient = createPublicClient({
  chain: base,
  transport: http(baseRpc),
});

export const walletClient = createWalletClient({
  account,
  chain: arbitrumSepolia,
  transport: http(arbitrumSepoliaRpc),
});
