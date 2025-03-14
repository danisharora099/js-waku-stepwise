import { createDecoder, createEncoder, DecodedMessage, LightNode } from "@waku/sdk";
import { ProtoChatMessage, ChatMessage } from "./proto";
import { CHAT_TOPIC } from "../../constants";
import { MessageWithMetadata } from "../../types";
import { v4 as uuidv4 } from "uuid";

/**
 * MessageManager class for handling Waku message operations
 */
export class MessageManager {
  /**
   * Encode a chat message to a Protocol Buffer binary format
   */
  encodeMessage(message: ChatMessage): Uint8Array {
    return ProtoChatMessage.encode(message).finish();
  }

  /**
   * Decode a Protocol Buffer binary format to a chat message
   */
  decodeMessage(data: Uint8Array): ChatMessage {
    return ProtoChatMessage.decode(data) as unknown as ChatMessage;
  }

  /**
   * Create a Waku encoder for chat messages
   */
  createChatEncoder() {
    return createEncoder({
      contentTopic: CHAT_TOPIC,
      ephemeral: false
    });
  }

  /**
   * Create a Waku decoder for chat messages
   */
  createChatDecoder() {
    return createDecoder(CHAT_TOPIC);
  }

  /**
   * Create a new chat message
   */
  createMessage(sender: string, message: string): ChatMessage {
    return {
      timestamp: Date.now(),
      sender,
      message
    };
  }

  /**
   * Process a decoded message and convert it to a MessageWithMetadata
   */
  processMessage(decodedMessage: DecodedMessage): MessageWithMetadata | null {
    try {
      const chatMessage = this.decodeMessage(decodedMessage.payload);
      
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
   * Send a chat message using Waku's LightPush protocol
   */
  async sendMessage(
    node: LightNode,
    message: ChatMessage
  ): Promise<{ success: boolean; error?: Error }> {
    if (!node) {
      return { 
        success: false, 
        error: new Error("Waku node is not available") 
      };
    }

    try {
      // Encode the message
      const payload = this.encodeMessage(message);
      
      // Create the encoder
      const encoder = this.createChatEncoder();
      
      // Send the message using LightPush
      await node.lightPush.send(encoder, { payload });
      
      console.log("Message sent successfully");
      return { success: true };
    } catch (error) {
      console.error("Failed to send message:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error(String(error)) 
      };
    }
  }
}

// Create and export singleton instance
export const messageManager = new MessageManager(); 