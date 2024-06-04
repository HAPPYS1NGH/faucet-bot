import { formatEther } from "viem";
import { abi } from "./abi";
import { arbitrumSepolia, baseSepolia } from "./address";

export const config = {
  "base-sepolia": {
    address: baseSepolia,
    abi,
  },
  "arbitrum-sepolia": {
    address: arbitrumSepolia,
    abi,
  },
};

export const replyMessageError = (error: string) => {
  if (error == "no-address") {
    return `No Verified Address found for this FID`;
  }
  if (error === "not-found") {
    return `The Guide to use the Faucet:
  \n 1. Tag faucetbot to get the faucet.
  \n 2. To get faucet on Arbitrum, use the keyword 'Arbitrum' or 'Arb'
  \n 3. To get faucet on Base, use the keyword 'Base' or 'Based'
  \n 4. The faucet will be sent to your verified wallet address.
  \n 5. Do not add both networks in the same message.
  \n 6. You can only get faucet once in 24 hours.
  `;
  }
  if (error === "already-dripped-to-address") {
    return `You have already received funds in the last 24 hours, so not transferring to the Address\t `;
  }
  if (error === "already-dripped-to-fid") {
    return `You have already received funds in the last 24 hours, so not transferring to the FID\t `;
  }
  if (error === "enough-funds") {
    return `You already have more than 0.5 ETH, so not transferring.`;
  }
  if (error === "error-sending-transaction") {
    return `Error sending transaction \n
    Meanwhile you can get the faucet from here -> https://faucet-frames.vercel.app/api`;
  }
  else {
    return `The Guide to use the Faucet:
    \n 1. Tag faucetbot to get the faucet.
    \n 2. To get faucet on Arbitrum, use the keyword 'Arbitrum' or 'Arb'
    \n 3. To get faucet on Base, use the keyword 'Base' or 'Based'
    \n 4. The faucet will be sent to your verified wallet address.
    \n 5. Do not add both networks in the same message.
    \n 6. You can only get faucet once in 24 hours.
    `;
  }

};

export const replyMessageSuccess = (
  network: string,
  amount: bigint,
  hash: string
) => {
  const amountInEth = formatEther(amount, "wei");

  if (network === "base-sepolia") {
    return `${amount} transferred successfully. Hash: https://sepolia.basescan.org/tx/${hash}`;
  }
  else {
    return `${amount} transferred successfully. Hash: https://sepolia.arbiscan.io/tx/${hash}`;
  }
};
