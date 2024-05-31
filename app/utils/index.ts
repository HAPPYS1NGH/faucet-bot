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

// Function to return false if the user has new account
export async function isNewAccount(address: string) {
  const arbitrumBalance = await getBalance(address, "arbitrum");
  const mainnetBalance = await getBalance(address, "mainnet");
  return (
    parseFloat(arbitrumBalance) < 0.001 || parseFloat(mainnetBalance) < 0.001
  );
}

export async function alreadyAptFunds(address: string) {
  const arbitrumBalance = await getBalance(address, "arbitrum-sepolia");
  if (parseFloat(arbitrumBalance) > 0.5) {
    return true;
  }
  return false;
}

export async function sendTransaction(address: string, value: bigint) {
  const hash = await walletClient.sendTransaction({
    to: address as `0x${string}`,
    value: value,
  });
  return hash;
}
