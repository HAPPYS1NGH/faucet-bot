import { NextRequest, NextResponse } from "next/server";
import neynarClient from "../../neynarClient";
import { Cast as CastV2 } from "@neynar/nodejs-sdk/build/neynar-api/v2/openapi-farcaster/models/cast.js";
import { createHmac } from "crypto";
import {
  isNewAccount,
  alreadyAptFunds,
  sendTransaction,
  checkLastTokenDripWithin24Hours,
} from "@/app/utils";

/**
 * Post to /webhooks/reply?secret=.... with body type: { data: { author: { username: string }, hash: string } }
 * One way to do this is to use a neynar webhook.
 */
export async function POST(req: NextRequest, res: NextResponse) {
  console.log("//////////////////////////");
  try {
    const body = await req.text();

    const webhookSecret = process.env.NEYNAR_WEBHOOK_SECRET;

    if (
      !process.env.SIGNER_UUID ||
      !process.env.NEYNAR_API_KEY ||
      !webhookSecret
    ) {
      throw new Error(
        "Make sure you set SIGNER_UUID , NEYNAR_API_KEY and  NEYNAR_WEBHOOK_SECRET in your .env file"
      );
    }

    const sig = req.headers.get("X-Neynar-Signature");
    if (!sig) {
      throw new Error("Neynar signature missing from request headers");
    }

    const hmac = createHmac("sha512", webhookSecret);
    hmac.update(body);
    const generatedSignature = hmac.digest("hex");

    const isValid = generatedSignature === sig;
    if (!isValid) {
      throw new Error("Invalid webhook signature");
    }

    const hookData = JSON.parse(body) as {
      created_at: number;
      type: "cast.created";
      data: CastV2;
    };
    console.log("hookData:", hookData);

    let replyMsg = "";
    let failed = true;
    let fundsToSend = 10000000000000000n;

    const userAddress =
      hookData.data.author.verified_addresses.eth_addresses[0];

    console.log("userAddress:", userAddress);
    if (!userAddress) {
      replyMsg = "No ethereum address found for this user";
      failed = true;
    }

    if (await checkLastTokenDripWithin24Hours(userAddress as `0x${string}`)) {
      replyMsg =
        "You have already received funds in the last 24 hours, so not transferring.";
      failed = true;
    }
    if (await alreadyAptFunds(userAddress)) {
      replyMsg = "You already have more than 0.5 ETH, so not transferring.";
      failed = true;
    }
    // Checks if the user does not have funds in the mainnet or arbitrum and limits the funds to 0.005 ETH for new users
    if (await isNewAccount(userAddress)) {
      replyMsg = "You are a new user, so transferring 0.005 ETH.";
      fundsToSend = 5000000000000000n;
      failed = false;
    }

    if (!failed) {
      try {
        const hash = await sendTransaction(userAddress, fundsToSend);
        if (!hash) {
          throw new Error("Error sending transaction");
        }
        replyMsg += `  \nTransaction sent: https://sepolia.arbiscan.io/tx/${hash}`;
      } catch (e) {
        console.log("Error sending transaction:", e);
        failed = true;
        replyMsg = "Error sending you funds";
      }
    }

    const reply = await neynarClient.publishCast(
      process.env.SIGNER_UUID,
      `${replyMsg} @${hookData.data.author.username}`,
      {
        replyTo: hookData.data.hash,
      }
    );
    console.log("reply:", reply);

    return NextResponse.json({
      message: reply,
    });
  } catch (e) {
    console.log(e);
    const reply = await neynarClient.publishCast(
      process.env.SIGNER_UUID || "",
      `Error Occurred: @happysingh look into this`
    );
    return NextResponse.json({
      message: reply,
    });
  }
}
