import { ChatMessage } from "./lib/waku/proto";

/**
 * Message with metadata
 */
export interface MessageWithMetadata {
  message: ChatMessage;
  timestamp: number;
  id: string;
} 