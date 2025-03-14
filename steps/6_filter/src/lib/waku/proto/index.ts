import { Field, Type } from "protobufjs";

/**
 * Protocol Buffer schema for a chat message
 */
export const ProtoChatMessage = new Type("ChatMessage")
  .add(new Field("timestamp", 1, "uint64"))
  .add(new Field("sender", 2, "string"))
  .add(new Field("message", 3, "string"));

/**
 * TypeScript type corresponding to the ProtoChatMessage schema
 */
export type ChatMessage = {
  timestamp: number;
  sender: string;
  message: string;
}; 