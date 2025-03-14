import { createDecoder, createEncoder, DecodedMessage, LightNode, ISubscription } from "@waku/sdk";
import { ProtoChatMessage, ChatMessage } from "./proto";
import { CHAT_TOPIC } from "../../constants";
import { MessageWithMetadata } from "../../types";
import { v4 as uuidv4 } from "uuid";

/**
 * MessageManager class for handling Waku message operations
 */
export class MessageManager {
  // Store active subscriptions for cleanup
  private subscriptions: Map<string, ISubscription> = new Map();

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

  /**
   * Subscribe to messages using Waku's Filter protocol
   * @param node The Waku node
   * @param callback Function to call when a message is received
   * @returns A subscription ID that can be used to unsubscribe
   */
  async subscribeToMessages(
    node: LightNode,
    callback: (message: MessageWithMetadata) => void
  ): Promise<string> {
    if (!node) {
      throw new Error("Waku node is not available");
    }

    try {
      // Create a decoder for the chat content topic
      const decoder = this.createChatDecoder();
      
      // Subscribe to messages using the Filter protocol
      const subscriptionResult = await node.filter.subscribe([decoder], (decodedMessage) => {
        try {
          console.log("Received message:", decodedMessage);
          // Process the message
          const processedMessage = this.processMessage(decodedMessage);
          
          // If the message was processed successfully, call the callback
          if (processedMessage) {
            callback(processedMessage);
          }
        } catch (error) {
          console.error("Error processing received message:", error);
        }
      });

      if (subscriptionResult.results?.successes.length === 0 || !subscriptionResult.subscription) {
        throw new Error("Failed to subscribe to messages");
      }
      
      // Generate a unique ID for this subscription
      const subscriptionId = uuidv4();
      
      // Store the unsubscribe function for later cleanup
      this.subscriptions.set(subscriptionId, subscriptionResult.subscription);
      
      console.log(`Subscribed to messages with ID: ${subscriptionId}`);
      return subscriptionId;
    } catch (error) {
      console.error("Failed to subscribe to messages:", error);
      throw error;
    }
  }

  /**
   * Unsubscribe from messages
   * @param subscriptionId The ID returned from subscribeToMessages
   */
  async unsubscribeFromMessages(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    
    if (!subscription) {
      console.warn(`No subscription found with ID: ${subscriptionId}`);
      return;
    }
    
    try {
      await subscription.unsubscribe([]);
      this.subscriptions.delete(subscriptionId);
      console.log(`Unsubscribed from messages with ID: ${subscriptionId}`);
    } catch (error) {
      console.error(`Failed to unsubscribe from messages with ID: ${subscriptionId}:`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe from all active subscriptions
   */
  async unsubscribeFromAllMessages(): Promise<void> {
    const subscriptionIds = Array.from(this.subscriptions.keys());
    
    for (const subscriptionId of subscriptionIds) {
      await this.unsubscribeFromMessages(subscriptionId);
    }
    
    console.log("Unsubscribed from all message subscriptions");
  }
}

// Create and export singleton instance
export const messageManager = new MessageManager(); 