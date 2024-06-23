import { NextApiRequest } from "next";
import * as crypto from "crypto";

export interface AlchemyRequest extends NextApiRequest {
    alchemy: {
        rawBody: string;
        signature: string;
    };
}

export function isValidSignatureForAlchemyRequest(
    request: AlchemyRequest,
    signingKey: string
): boolean {
    return isValidSignatureForStringBody(
        request.alchemy.rawBody,
        request.alchemy.signature,
        signingKey
    );
}

export function isValidSignatureForStringBody(
    body: string,
    signature: string,
    signingKey: string
): boolean {
    const hmac = crypto.createHmac("sha256", signingKey); // Create a HMAC SHA256 hash using the signing key
    hmac.update(body, "utf8"); // Update the token hash with the request body using utf8
    const digest = hmac.digest("hex");
    return signature === digest;
}

export interface AlchemyWebhookEvent {
    webhookId: string;
    id: string;
    createdAt: Date;
    type: AlchemyWebhookType;
    event: Record<any, any>;
}

export type AlchemyWebhookType =
    | "MINED_TRANSACTION"
    | "DROPPED_TRANSACTION"
    | "ADDRESS_ACTIVITY";




export const getTransactionURL = (
    network: string,
    hash: string
) => {

    if (network === "BASE_SEPOLIA") {
        return `https://sepolia.basescan.org/tx/${hash}`;
    }
    else if (network === "ARB_SEPOLIA") {
        return `https://sepolia.arbiscan.io/tx/${hash}`;
    }
    else {
        return `${hash}`;
    }
};