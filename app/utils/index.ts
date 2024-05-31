import {
  arbitrumClient,
  arbitrumSepoliaClient,
  mainnetClient,
  sepoliaClient,
  walletClient,
} from "@/app/utils/client";
import { formatEther } from "viem";

async function getBalance(address: string, chain: string) {
  let client;
  switch (chain) {
    case "sepolia":
      client = sepoliaClient;
      break;
    case "arbitrum-sepolia":
      client = arbitrumSepoliaClient;
      break;
    case "mainnet":
      client = mainnetClient;
      break;
    case "arbitrum":
      client = arbitrumClient;
      break;
    default:
      throw new Error(`Unsupported chain ${chain}`);
  }
  const balance = await client.getBalance({
    address: address as `0x${string}`,
  });
  const balanceAsEther = formatEther(balance);
  return balanceAsEther;
}

// Function to return false if the user have more than 0.5 ETH
export async function isUserPoor(address: string, chain: string) {
  const balance = await getBalance(address, chain);
  return parseFloat(balance) < 0.5;
}

export async function sendTransaction(address: string) {
  const hash = await walletClient.sendTransaction({
    to: address as `0x${string}`,
    value: 10000000000000000n,
  });
  return hash;
}
