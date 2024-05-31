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
// Suggest good name for this function
export async function lastTokenDrippedWithin24Hours(address: `0x${string}`) {
  console.log("GET request made");
  console.log("toAddress", address);
  const RPC = process.env.ARBITRUM_SEPOLIA_RPC;
  if (!RPC) {
    throw new Error("RPC endpoint not found");
  }
  const currentBlock = await arbitrumSepoliaClient.getBlockNumber();
  const block = await arbitrumSepoliaClient.getBlock({
    blockNumber: currentBlock,
  });
  const currentTimestamp = block.timestamp;

  // suubstarct 4,36,000 blocks to get the block number alomost 24 hours ago in bigint
  const blockNumber = currentBlock - 436000n;
  try {
    const res = await fetch(RPC, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "alchemy_getAssetTransfers",
        params: [
          {
            fromBlock: blockNumber,
            toBlock: "latest",
            fromAddress: "0xd5Ba400e732b3d769aA75fc67649Ef4849774bb1",
            toAddress: address,
            category: ["external"],
            order: "asc",
            withMetadata: true,
            excludeZeroValue: true,
          },
        ],
      }),
      next: {
        revalidate: 600,
      },
    });
    const data = await res.json();
    console.log("DATA IN ARB SDK", data);
    console.log(data.result.transfers);
    data.result.transfers.forEach((tx: any) => {
      let timestamp = tx.metadata.blockTimestamp;
      console.log("TIMESTAMP", timestamp);
      if (currentTimestamp - timestamp > 86400n) {
        return true;
      }
    });
    return false;
  } catch (error) {
    console.error("Error in getLastTransactionTimestampForAddress", error);
    return false;
  }
}
