// import { NextRequest, NextResponse } from "next/server";
// import neynarClient from "../../neynarClient";
// import { createHmac } from "crypto";
// import { ReactionType, } from "@neynar/nodejs-sdk";
// import { WebhookPayload } from "@/app/types";

// export async function POST(req: NextRequest, res: NextResponse) {
//     console.log("//////////////////////////");
//     console.log(req);

//     try {
//         const body: WebhookPayload = await req.json();
//         const webhookSecret = process.env.ALCHEMY_WEBHOOK_SECRET;

//         if (
//             !webhookSecret
//         ) {
//             throw new Error(
//                 "Make sure you set Webhook Secret in .env file"
//             );
//         }

//         // Verify the webhook signature
//         /////////////////////////////////

//         const sig = req.headers.get("x-alchemy-signature");
//         console.log("SIG\n" + sig);

//         if (!sig) {
//             throw new Error("Alchemy signature missing from request headers");
//         }

//         const hmac = createHmac("sha256", webhookSecret);
//         // hmac.update(body);

//         const generatedSignature = hmac.digest("hex");
//         console.log("generatedSignature\n" + generatedSignature);


//         // if (generatedSignature !== sig) {
//         //     throw new Error("Invalid webhook signature");
//         // }

//         /////////////////////////////////

//         console.log("BODY");
//         console.log(body);
//         // Check for the fromAddress 

//         if (!body?.event?.activity[0]?.fromAddress) {
//             return NextResponse.json({
//                 message: "No fromAddress found",
//             });
//         }


//         const fromAddress = body?.event?.activity[0]?.fromAddress

//         const user = await neynarClient.fetchBulkUsersByEthereumAddress([fromAddress]);
//         // User can have 2 types 1 failed and 1 success so we need to know the status code it returns
//         console.log("user \n");
//         console.log(user);

//         if (!user?.address[0]?.username) {
//             return NextResponse.json({
//                 message: "User not found",
//             });
//         }

//         // const hash = await neynarClient.publishCast(process.env.SIGNER_UUID || "", `Our hero @${user.address[0].username} has funded our faucet bot on ${body.event.network} network. Big thanks to them. `);
//         // console.log(hash);
//         return NextResponse.json({
//             message: "Success+ ",
//         });

//     } catch (e) {
//         console.log(e);
//         return NextResponse.json({
//             message: 'Something went wrong. Please check the logs for more information."',
//         });
//     }
// }

import { NextRequest, NextResponse } from "next/server";
import neynarClient from "../../neynarClient";
import { createHmac } from "crypto";
import { WebhookPayload } from "@/app/types";
import { getTransactionURL } from "@/app/utils/webhooksUtils";

export async function POST(req: NextRequest, res: NextResponse) {
    console.log("//////////////////////////");
    console.log(req);

    try {
        const body: WebhookPayload = await req.json();
        const webhookSecret = process.env.ALCHEMY_WEBHOOK_SECRET;

        if (!webhookSecret) {
            throw new Error("Make sure you set Webhook Secret in .env file");
        }

        // Verify the webhook signature
        const sig = req.headers.get("x-alchemy-signature");
        console.log("SIG\n" + sig);

        if (!sig) {
            throw new Error("Alchemy signature missing from request headers");
        }

        const hmac = createHmac("sha256", webhookSecret);
        hmac.update(JSON.stringify(body));

        const generatedSignature = hmac.digest("hex");
        console.log("generatedSignature\n" + generatedSignature);

        if (generatedSignature !== sig) {
            throw new Error("Invalid webhook signature");
        }

        console.log("BODY");
        console.log(body);

        // Check for the fromAddress
        if (!body?.event?.activity[0]?.fromAddress) {
            return NextResponse.json({
                message: "No fromAddress found",
            });
        }

        console.log("BODY EVENT");
        console.log(body.event);


        const fromAddress = body.event.activity[0].fromAddress;

        try {
            const userResponse = await neynarClient.fetchBulkUsersByEthereumAddress([fromAddress]);
            console.log("user \n");
            console.log(userResponse);

            // Check if userResponse contains the address and has at least one user object
            if (!userResponse[fromAddress] || userResponse[fromAddress].length === 0) {
                return NextResponse.json({
                    message: "User not found",
                });
            }

            const user = userResponse[fromAddress][0];
            const username = user.username;

            // Log the user details
            console.log(`Fetched user: ${username}`);

            const msg = `Our hero @${username} has funded ${body.event.activity[0].value} ETH to our faucet bot on ${body.event.network} network. Big thanks to them. Hash: ${getTransactionURL(body.event.network, body.event.activity[0].hash)}`
            console.log("Message");
            console.log(msg);


            const hash = await neynarClient.publishCast(
                process.env.SIGNER_UUID || "",
                msg
            );
            console.log(hash);
            return NextResponse.json({
                message: "Success",
                user: user,
                hash: hash,
            });

        } catch (error: any) {
            console.log(error);
            if (error.response?.status === 404) {
                return NextResponse.json({
                    message: "No users found for the given Ethereum address",
                });
            } else {
                throw error;
            }
        }
    } catch (e) {
        console.log(e);
        return NextResponse.json({
            message: 'Something went wrong. Please check the logs for more information."',
        });
    }
}
