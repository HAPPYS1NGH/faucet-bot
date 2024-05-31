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
  try {
    const arbitrumBalance = await getBalance(address, "arbitrum");
    const mainnetBalance = await getBalance(address, "mainnet");
    return (
      parseFloat(arbitrumBalance) < 0.001 || parseFloat(mainnetBalance) < 0.001
    );
  } catch (error) {
    console.error("Error in isNewAccount", error);
    return false;
  }
}

export async function alreadyAptFunds(address: string) {
  try {
    const arbitrumBalance = await getBalance(address, "arbitrum-sepolia");
    if (parseFloat(arbitrumBalance) > 0.5) {
      return true;
    } else return false;
  } catch (error) {
    console.error("Error in alreadyAptFunds", error);
    return false;
  }
}

export async function sendTransaction(address: string, value: bigint) {
  try {
    const hash = await walletClient.sendTransaction({
      to: address as `0x${string}`,
      value: value,
    });
    return hash;
  } catch (error) {
    console.error("Error in sendTransaction", error);
    return false;
  }
} // Suggest good name for this function
export async function checkLastTokenDripWithin24Hours(address: `0x${string}`) {
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

  console.log("CURRENT BLOCK", currentBlock);
  console.log("CURRENT TIMESTAMP", currentTimestamp);

  // Subtract 436,000 blocks to get the block number almost 24 hours ago and convert to hex string
  const blockNumberHex = "0x" + (currentBlock - 436000n).toString(16);
  console.log("BLOCK NUMBER HEX", blockNumberHex);
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
            fromBlock: blockNumberHex,
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
    for (const tx of data.result.transfers) {
      let timestamp = BigInt(tx.metadata.blockTimestamp);
      console.log("TIMESTAMP", timestamp);
      if (currentTimestamp - timestamp > 86400n) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("Error in getLastTransactionTimestampForAddress", error);
    return false;
  }
}
