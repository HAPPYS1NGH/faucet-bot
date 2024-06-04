import { NextRequest, NextResponse } from "next/server";
import neynarClient from "../../neynarClient";
import { Cast as CastV2 } from "@neynar/nodejs-sdk/build/neynar-api/v2/openapi-farcaster/models/cast.js";
import { createHmac } from "crypto";
import {
  isNewAccount,
  alreadyAptFunds,
  // sendTransaction,
  checkLastTokenDripWithin24Hours,
  analyseCastText,
} from "@/app/utils";
import {
  isTokenDrippedToAddressInLast24Hours,
  isBalanceAboveThreshold,
  isTokenDrippedToFidInLast24Hours,
  dripTokensToAddress,
} from "@/app/utils/contract";
import { replyMessageError } from "@/app/constants";

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
        "Make sure you set SIGNER_UUID, NEYNAR_API_KEY, and NEYNAR_WEBHOOK_SECRET in your .env file"
      );
    }

    // const sig = req.headers.get("X-Neynar-Signature");
    // if (!sig) {
    //   throw new Error("Neynar signature missing from request headers");
    // }

    // const hmac = createHmac("sha512", webhookSecret);
    // hmac.update(body);
    // const generatedSignature = hmac.digest("hex");

    // if (generatedSignature !== sig) {
    //   throw new Error("Invalid webhook signature");
    // }

    const hookData = JSON.parse(body) as {
      created_at: number;
      type: "cast.created";
      data: CastV2;
    };
    console.log("hookData:", hookData);

    let replyMsg = "";
    let failed = false;
    let fundsToSend = 100000000000000000n;

    const userAddress = hookData.data.author.verified_addresses.eth_addresses[0];

    if (!userAddress) {
      replyMsg = replyMessageError("no-address");
      const reply = await publishAndExit(
        replyMsg,
        hookData.data.author.username,
        hookData.data.hash
      );
      return NextResponse.json({
        message: reply,
      });
    }

    const network = await analyseCastText(hookData.data.text);

    if (network === "not-found" || "both-found") {
      replyMsg = replyMessageError("not-found");
      const reply = await publishAndExit(
        replyMsg,
        hookData.data.author.username,
        hookData.data.hash
      );
      return NextResponse.json({
        message: reply,
      });
    }

    const hasDrippedToAddress = await isTokenDrippedToAddressInLast24Hours(
      userAddress,
      network
    );
    console.log("hasDrippedToAddress", hasDrippedToAddress);

    if (hasDrippedToAddress) {
      replyMsg = replyMessageError("already-dripped-to-address") + userAddress;
      const reply = await publishAndExit(
        replyMsg,
        hookData.data.author.username,
        hookData.data.hash
      );
      return NextResponse.json({
        message: reply,
      });
    }

    const hasDrippedToFID = await isTokenDrippedToFidInLast24Hours(
      hookData.data.author.fid,
      network
    );
    console.log("hasDrippedToFID", hasDrippedToFID);

    if (hasDrippedToFID) {
      replyMsg =
        replyMessageError("already-dripped") + hookData.data.author.fid;
      const reply = await publishAndExit(
        replyMsg,
        hookData.data.author.username,
        hookData.data.hash
      );
      return NextResponse.json({
        message: reply,
      });
    }

    const hasEnoughFunds = await isBalanceAboveThreshold(userAddress, network);
    console.log("hasEnoughFunds", hasEnoughFunds);
    if (hasEnoughFunds) {
      replyMsg = replyMessageError("enough-funds");
      const reply = await publishAndExit(
        replyMsg,
        hookData.data.author.username,
        hookData.data.hash
      );
      return NextResponse.json({
        message: reply,
      });
    }

    // TODO: Check if the person has mainnet balance than drip more

    console.log("///////////////////////");
    console.log("DRIPPING TOKENS");
    try {
      const hash = await dripTokensToAddress(
        userAddress,
        hookData.data.author.fid,
        fundsToSend,
        network
      );
      console.log("hash", hash);
      if (!hash) {
        replyMsg = replyMessageError("error-sending-transaction");
        const reply = await publishAndExit(
          replyMsg,
          hookData.data.author.username,
          hookData.data.hash
        );
        return NextResponse.json({
          message: reply,
        });
      }
      replyMsg = replyMessageSuccess(network);
      const reply = await publishAndExit(
        replyMsg,
        hookData.data.author.username,
        hookData.data.hash
      );
      return NextResponse.json({
        message: reply,
      });
    } catch (error) {
      console.error("Error in dripTokensToAddress", error);
      replyMsg = replyMessageError("error-sending-transaction");
      const reply = await publishAndExit(
        replyMsg,
        hookData.data.author.username,
        hookData.data.hash
      );
      return NextResponse.json({
        message: reply,
      });
    }


    // const reply = await neynarClient.publishCast(
    //   process.env.SIGNER_UUID,
    //   `${replyMsg} @${hookData.data.author.username} ${
    //     failed
    //       ? "❌ \n You can get faucets from here:  https://warpcast.com/happysingh/0x59b89007"
    //       : "✅"
    //   }`,
    //   {
    //     replyTo: hookData.data.hash,
    //   }
    // );
    // console.log("reply:", reply);

    // return NextResponse.json({
    //   message: reply,
    // });

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

async function publishAndExit(message: string, username: string, hash: string) {
  if (process.env.SIGNER_UUID === undefined) {
    throw new Error("SIGNER_UUID is not set in .env");
  }
  const reply = await neynarClient.publishCast(
    process.env.SIGNER_UUID,
    `${message} @${username}`,
    { replyTo: hash }
  );
  console.log("reply:", reply);

  return NextResponse.json({ message: reply });
}
