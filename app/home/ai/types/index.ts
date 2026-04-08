export type MessageRole = "user" | "assistant" | "system";
export type ChatMessage = {
    id: string | number;
    role: MessageRole;
    content: string;
    processing?: boolean;
    timestamp: Date;
};

export type SessionItem = {
    id: number;
    title: string;
    createdAt: Date;
};


export type SimilarityMetric = "cosine" | "euclidean" | "dot_product";