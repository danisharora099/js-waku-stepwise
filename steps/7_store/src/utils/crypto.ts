import { fromString, toString, SupportedEncodings } from "uint8arrays";

/**
 * Generates a random number for seed creation
 */
export function generateRandomNumber(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Creates a SHA-256 hash of the input string
 */
export async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Converts a string to a Uint8Array
 */
export function stringToUint8Array(str: string): Uint8Array {
  return fromString(str);
}

/**
 * Converts a Uint8Array to a string
 */
export function uint8ArrayToString(arr: Uint8Array, encoding: SupportedEncodings = "hex"): string {
  return toString(arr, encoding);
} 