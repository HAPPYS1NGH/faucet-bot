import {
  arbitrumClient,
  arbitrumSepoliaClient,
  mainnetClient,
  sepoliaClient,
  baseClient,
  baseSepoliaClient,
  walletArbitrumClient,
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
    case "base":
      client = baseClient;
      break;
    case "base-sepolia":
      client = baseSepoliaClient;
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
      parseFloat(arbitrumBalance) < 0.001 && parseFloat(mainnetBalance) < 0.001
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

// export async function sendTransaction(address: string, value: bigint) {
//   try {
//     const hash = await walletArbitrumClient.sendTransaction({
//       to: address as `0x${string}`,
//       value: value,
//     });
//     return hash;
//   } catch (error) {
//     console.error("Error in sendTransaction", error);
//     return false;
//   }
// }
// Suggest good name for this function
export async function checkLastTokenDripWithin24Hours(address: `0x${string}`) {
  console.log("GET request made");
  console.log("toAddress", address);
  const RPC = `https://arb-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;
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
        id: 1,
        jsonrpc: "2.0",
        method: "alchemy_getAssetTransfers",
        params: [
          {
            fromBlock: blockNumberHex,
            toBlock: "latest",
            fromAddress: "0x926a19D7429F9AD47b2cB2b0e5c46A9E69F05a3e",
            toAddress: address,
            category: ["external"],
            order: "asc",
            withMetadata: true,
            excludeZeroValue: true,
            maxCount: "0x3e8",
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
      const date = new Date(tx.metadata.blockTimestamp);
      const timestamp = BigInt(date.getTime() / 1000);
      console.log("TIMESTAMP", timestamp);
      if (currentTimestamp - timestamp < 86400n) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("Error in getLastTransactionTimestampForAddress", error);
    return true;
  }
}

export async function analyseCastText(data: string) {
  const text = data.toLowerCase();

  // Define regex patterns with broader matching for each faucet
  const baseSepoliaPattern = /\b(b[a|e]s[ae]?|base[- ]?sepolia)\b/;
  const arbitrumSepoliaPattern = /\b(a?r?b[i|t|r|u|m]*|arbitrum[- ]?sepolia)\b/;
  // Check for words like how to use or guide
  // const guidePattern = /\b(guide|how to use)\b/;

  // Test the patterns against the input text
  const isBaseSepolia = baseSepoliaPattern.test(text);
  const isArbitrumSepolia = arbitrumSepoliaPattern.test(text);
  console.log("isBaseSepolia", isBaseSepolia);
  console.log("isArbitrumSepolia", isArbitrumSepolia);
  if (isBaseSepolia && isArbitrumSepolia) {
    return "both-found";
  }

  if (isBaseSepolia) {
    return "base-sepolia";
  } else if (isArbitrumSepolia) {
    return "arbitrum-sepolia";
  } else return "not-found";
}

export function replyMessage(
  isNewAccount: boolean,
  isWithin24Hours: boolean,
  hasEnoughBalance: boolean,
  network: string
) {
  if (hasEnoughBalance) {
    return `You already have more than 0.5 ETH, so not transferring.`;
  } else if (isWithin24Hours) {
    return `You have already received funds in the last 24 hours, so not transferring.`;
  } else if (isNewAccount) {
    return `You are a new user, so transferring 0.05 ETH.\n`;
  } else if (network === "not-found") {
    return `The Guide to use the Faucet:
  \n 1. Tag faucetbot to get the faucet.
  \n 2. To get faucet on Arbitrum, use the keyword 'Arbitrum' or 'Arb'
  \n 3. To get faucet on Base, use the keyword 'Base' or 'Based'
  \n 4. The faucet will be sent to your verified wallet address.
  \n 5. You can only get faucet once in 24 hours.
  `;
  }
}
