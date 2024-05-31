import { NextRequest, NextResponse } from "next/server";
import neynarClient from "../../neynarClient";
import { Cast as CastV2 } from "@neynar/nodejs-sdk/build/neynar-api/v2/openapi-farcaster/models/cast.js";

/**
 * Post to /webhooks/reply?secret=.... with body type: { data: { author: { username: string }, hash: string } }
 * One way to do this is to use a neynar webhook.
 */
export async function POST(req: NextRequest, res: NextResponse) {
  console.log("//////////////////////////");
  console.log("req.body:", req.body);
  console.log("req.bodyUsed:", req.bodyUsed);
  console.log("req.credentials:", req.credentials);

  if (!process.env.SIGNER_UUID || !process.env.NEYNAR_API_KEY) {
    throw new Error(
      "Make sure you set SIGNER_UUID and NEYNAR_API_KEY in your .env file"
    );
  }

  const webhookSecret = req.nextUrl.searchParams.get("secret");

  const hookData = (await req.json()) as {
    created_at: number;
    type: "cast.created";
    data: CastV2;
  };

  const reply = await neynarClient.publishCast(
    process.env.SIGNER_UUID,
    `gm ${hookData.data.author.username}`,
    {
      replyTo: hookData.data.hash,
      //   embeds: [
      //     {
      //       url: frame.link,
      //     },
      //   ],
    }
  );
  console.log("reply:", reply);
  if (process.env.WEBHOOK_SECRET !== webhookSecret) {
    return NextResponse.json({ message: "invalid webhook" }, { status: 401 });
  }
  return NextResponse.json({
    message: reply,
  });
}
