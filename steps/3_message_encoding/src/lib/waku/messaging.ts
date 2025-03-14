import { createDecoder, createEncoder, DecodedMessage } from "@waku/sdk";
import { ProtoChatMessage, ChatMessage } from "./proto";
import { CHAT_TOPIC } from "../../constants";
import { MessageWithMetadata } from "../../types";
import { v4 as uuidv4 } from "uuid";

/**
 * Encode a chat message to a Protocol Buffer binary format
 */
export function encodeMessage(message: ChatMessage): Uint8Array {
  return ProtoChatMessage.encode(message).finish();
}

/**
 * Decode a Protocol Buffer binary format to a chat message
 */
export function decodeMessage(data: Uint8Array): ChatMessage {
  return ProtoChatMessage.decode(data) as unknown as ChatMessage;
}

/**
 * Create a Waku encoder for chat messages
 */
export function createChatEncoder() {
  return createEncoder({
    contentTopic: CHAT_TOPIC,
    ephemeral: false
  });
}

/**
 * Create a Waku decoder for chat messages
 */
export function createChatDecoder() {
  return createDecoder(CHAT_TOPIC);
}

/**
 * Process a decoded message and convert it to a MessageWithMetadata
 */
export function processMessage(decodedMessage: DecodedMessage): MessageWithMetadata | null {
  try {
    const chatMessage = decodeMessage(decodedMessage.payload);
    
    return {
      message: chatMessage,
      timestamp: chatMessage.timestamp || Date.now(),
      id: uuidv4()
    };
  } catch (error) {
    console.error("Error processing message:", error);
    return null;
  }
}

/**
 * Create a new chat message
 */
export function createMessage(sender: string, message: string): ChatMessage {
  return {
    timestamp: Date.now(),
    sender,
    message
  };
} 