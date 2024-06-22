// Create String type for Network

type network = "base-sepolia" | "arbitrum-sepolia" | "mode-sepolia";

// Define types for the raw contract and log
interface RawContract {
    rawValue: string;
    address: string;
    decimals: number;
}

interface Log {
    address: string;
    topics: string[];
    data: string;
    blockNumber: string;
    transactionHash: string;
    transactionIndex: string;
    blockHash: string;
    logIndex: string;
    removed: boolean;
}

// Define types for each activity item
interface ActivityItem {
    blockNum: string;
    hash: string;
    fromAddress: string;
    toAddress: string;
    value: number;
    erc721TokenId: string | null;
    erc1155Metadata: string | null;
    asset: string;
    category: string;
    rawContract: RawContract;
    typeTraceAddress: string | null;
    log: Log;
}

// Define the event type
interface WebhookEvent {
    network: string;
    activity: ActivityItem[];
}

// Define the webhook payload type
export interface WebhookPayload {
    webhookId: string;
    id: string;
    createdAt: string;
    type: string;
    event: WebhookEvent;
}
