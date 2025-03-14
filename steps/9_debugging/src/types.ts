import { ChatMessage } from "./lib/waku/proto";
import { EncryptionType } from "./lib/waku/encryption";

/**
 * Message with metadata
 */
export interface MessageWithMetadata {
  message: ChatMessage;
  timestamp: number;
  id: string;
  receivedTime?: number;
  source?: 'store' | 'filter';  // Track the source protocol of the message
  encrypted?: boolean;          // Whether the message was encrypted
  encryptionType?: EncryptionType; // Type of encryption used
} 