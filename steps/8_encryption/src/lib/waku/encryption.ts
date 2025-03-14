import { Buffer } from "buffer";
import {
  generatePrivateKey,
  getPublicKey,
  generateSymmetricKey
} from "@waku/message-encryption/crypto";
import { encryptAsymmetric as encryptEcies, decryptAsymmetric as decryptEcies } from "@waku/message-encryption/ecies";
import { encryptSymmetric, decryptSymmetric } from "@waku/message-encryption/symmetric";
import { createEncoder, createDecoder } from "@waku/sdk";
import * as ecies from "@waku/message-encryption/ecies";
import * as symmetric from "@waku/message-encryption/symmetric";
import { CHAT_TOPIC } from "../../constants";

/**
 * Encryption types supported by the application
 */
export enum EncryptionType {
  ECIES = "ecies",
  SYMMETRIC = "symmetric"
}

/**
 * Interface for encryption keys
 */
export interface EncryptionKeys {
  privateKey?: Uint8Array;
  publicKey?: Uint8Array;
  symmetricKey?: Uint8Array;
  peerPublicKey?: Uint8Array; // For ECIES: the public key of the peer we're communicating with
}

/**
 * Generate an ECIES key pair
 */
function generateEciesKeyPair() {
  const privateKey = generatePrivateKey();
  const publicKey = getPublicKey(privateKey);
  return { privateKey, publicKey };
}

/**
 * Class for managing encryption operations
 */
export class EncryptionManager {
  private eciesKeys: {
    privateKey: Uint8Array | null;
    publicKey: Uint8Array | null;
    peerPublicKey: Uint8Array | null;
  } = {
    privateKey: null,
    publicKey: null,
    peerPublicKey: null,
  };

  private symmetricKey: Uint8Array | null = null;
  private _encryptionType: EncryptionType = EncryptionType.ECIES;
  private _isEncryptionEnabled: boolean = false;

  constructor() {}

  /**
   * Get the current encryption type
   */
  get encryptionType(): EncryptionType {
    return this._encryptionType;
  }

  /**
   * Set the encryption type
   */
  set encryptionType(type: EncryptionType) {
    this._encryptionType = type;
  }

  /**
   * Get the current encryption type (for backward compatibility)
   */
  getEncryptionType(): EncryptionType {
    return this._encryptionType;
  }

  /**
   * Check if encryption is enabled
   */
  get isEncryptionEnabled(): boolean {
    return this._isEncryptionEnabled;
  }

  /**
   * Toggle encryption on/off
   */
  toggleEncryption(): void {
    this._isEncryptionEnabled = !this._isEncryptionEnabled;
  }

  /**
   * Get the current encryption keys
   */
  get encryptionKeys() {
    return {
      privateKey: this.eciesKeys.privateKey,
      publicKey: this.eciesKeys.publicKey,
      peerPublicKey: this.eciesKeys.peerPublicKey,
      symmetricKey: this.symmetricKey,
    };
  }

  /**
   * Generate encryption keys based on the current encryption type
   */
  generateKeys(): void {
    if (this._encryptionType === EncryptionType.ECIES) {
      const { privateKey, publicKey } = generateEciesKeyPair();
      this.eciesKeys.privateKey = privateKey;
      this.eciesKeys.publicKey = publicKey;
    } else if (this._encryptionType === EncryptionType.SYMMETRIC) {
      this.symmetricKey = generateSymmetricKey();
    }
  }

  /**
   * Export the public key for ECIES or the symmetric key
   */
  exportKey(): string | null {
    if (this._encryptionType === EncryptionType.ECIES) {
      return this.exportPublicKey();
    } else if (this._encryptionType === EncryptionType.SYMMETRIC) {
      return this.exportSymmetricKey();
    }
    return null;
  }

  /**
   * Export the public key for ECIES
   */
  exportPublicKey(): string | null {
    if (!this.eciesKeys.publicKey) return null;
    return Buffer.from(this.eciesKeys.publicKey).toString("hex");
  }

  /**
   * Export the symmetric key
   */
  exportSymmetricKey(): string | null {
    if (!this.symmetricKey) return null;
    return Buffer.from(this.symmetricKey).toString("hex");
  }

  /**
   * Import a public key for ECIES
   */
  importPublicKey(publicKeyHex: string): void {
    try {
      this.eciesKeys.peerPublicKey = Buffer.from(publicKeyHex, "hex");
    } catch (error: unknown) {
      console.error("Error importing public key:", error);
      throw new Error("Invalid public key format");
    }
  }

  /**
   * Import a symmetric key
   */
  importSymmetricKey(symmetricKeyHex: string): void {
    try {
      this.symmetricKey = Buffer.from(symmetricKeyHex, "hex");
    } catch (error: unknown) {
      console.error("Error importing symmetric key:", error);
      throw new Error("Invalid symmetric key format");
    }
  }

  /**
   * Check if encryption is ready to be used
   */
  isEncryptionReady(): boolean {
    if (!this._isEncryptionEnabled) return true; // If encryption is disabled, we're always ready
    
    if (this._encryptionType === EncryptionType.ECIES) {
      return !!this.eciesKeys.privateKey && !!this.eciesKeys.publicKey && !!this.eciesKeys.peerPublicKey;
    } else if (this._encryptionType === EncryptionType.SYMMETRIC) {
      return !!this.symmetricKey;
    }
    
    return false;
  }

  /**
   * Get the encryption status message
   */
  getEncryptionStatusMessage(): string {
    if (!this._isEncryptionEnabled) {
      return "Encryption disabled";
    }
    
    if (this._encryptionType === EncryptionType.ECIES) {
      if (!this.eciesKeys.privateKey || !this.eciesKeys.publicKey) {
        return "ECIES: Missing keys - Generate keys first";
      }
      if (!this.eciesKeys.peerPublicKey) {
        return "ECIES: Missing peer key - Import peer's public key";
      }
      return "ECIES: Ready";
    } else if (this._encryptionType === EncryptionType.SYMMETRIC) {
      if (!this.symmetricKey) {
        return "Symmetric: Missing key - Generate or import key";
      }
      return "Symmetric: Ready";
    }
    
    return "Unknown encryption state";
  }

  /**
   * Create an encoder based on the current encryption settings
   */
  createEncoder() {
    if (!this._isEncryptionEnabled) {
      console.log("Creating unencrypted encoder (encryption disabled)");
      return createEncoder({
        contentTopic: CHAT_TOPIC,
        ephemeral: false
      });
    }

    if (this._encryptionType === EncryptionType.ECIES) {
      if (!this.eciesKeys.peerPublicKey) {
        console.warn("Peer public key is required for ECIES encryption. Using unencrypted encoder.");
        return createEncoder({
          contentTopic: CHAT_TOPIC,
          ephemeral: false
        });
      }
      console.log("Creating ECIES encoder with peer public key");
      return ecies.createEncoder({
        contentTopic: CHAT_TOPIC,
        publicKey: this.eciesKeys.peerPublicKey,
        sigPrivKey: this.eciesKeys.privateKey || undefined
      });
    } else if (this._encryptionType === EncryptionType.SYMMETRIC) {
      if (!this.symmetricKey) {
        console.warn("Symmetric key is required for symmetric encryption. Using unencrypted encoder.");
        return createEncoder({
          contentTopic: CHAT_TOPIC,
          ephemeral: false
        });
      }
      console.log("Creating symmetric encoder with key");
      return symmetric.createEncoder({
        contentTopic: CHAT_TOPIC,
        symKey: this.symmetricKey
      });
    }

    // Default to unencrypted
    console.log("Creating default unencrypted encoder");
    return createEncoder({
      contentTopic: CHAT_TOPIC,
      ephemeral: false
    });
  }

  /**
   * Create a decoder based on the current encryption settings
   */
  createDecoder() {
    if (!this._isEncryptionEnabled) {
      console.log("Creating unencrypted decoder (encryption disabled)");
      return createDecoder(CHAT_TOPIC);
    }

    if (this._encryptionType === EncryptionType.ECIES) {
      if (!this.eciesKeys.privateKey) {
        console.warn("Private key is required for ECIES decryption. Using unencrypted decoder.");
        return createDecoder(CHAT_TOPIC);
      }
      console.log("Creating ECIES decoder with private key");
      return ecies.createDecoder(CHAT_TOPIC, this.eciesKeys.privateKey);
    } else if (this._encryptionType === EncryptionType.SYMMETRIC) {
      if (!this.symmetricKey) {
        console.warn("Symmetric key is required for symmetric decryption. Using unencrypted decoder.");
        return createDecoder(CHAT_TOPIC);
      }
      console.log("Creating symmetric decoder with key");
      return symmetric.createDecoder(CHAT_TOPIC, this.symmetricKey);
    }

    // Default to unencrypted
    console.log("Creating default unencrypted decoder");
    return createDecoder(CHAT_TOPIC);
  }

  /**
   * Encrypt a message
   */
  async encryptMessage(message: string): Promise<Uint8Array | null> {
    if (!this._isEncryptionEnabled) {
      return new TextEncoder().encode(message);
    }

    if (!this.isEncryptionReady()) {
      console.error("Encryption is not ready:", this.getEncryptionStatusMessage());
      throw new Error(`Cannot encrypt: ${this.getEncryptionStatusMessage()}`);
    }

    try {
      if (this._encryptionType === EncryptionType.ECIES) {
        if (!this.eciesKeys.privateKey || !this.eciesKeys.peerPublicKey) {
          throw new Error("Missing ECIES keys");
        }
        const messageBytes = new TextEncoder().encode(message);
        return await encryptEcies(messageBytes, this.eciesKeys.peerPublicKey);
      } else if (this._encryptionType === EncryptionType.SYMMETRIC) {
        if (!this.symmetricKey) {
          throw new Error("Missing symmetric key");
        }
        const messageBytes = new TextEncoder().encode(message);
        return await encryptSymmetric(messageBytes, this.symmetricKey);
      }
    } catch (error: unknown) {
      console.error("Error encrypting message:", error);
      throw new Error("Failed to encrypt message");
    }

    return null;
  }

  /**
   * Decrypt a message
   */
  async decryptMessage(encryptedData: Uint8Array): Promise<string | null> {
    // If encryption is disabled, assume the message is not encrypted
    if (!this._isEncryptionEnabled) {
      try {
        return new TextDecoder().decode(encryptedData);
      } catch (error: unknown) {
        console.error("Error decoding unencrypted message:", error);
        return null;
      }
    }

    if (!this.isEncryptionReady()) {
      console.error("Decryption is not ready:", this.getEncryptionStatusMessage());
      return `[Encrypted message - ${this.getEncryptionStatusMessage()}]`;
    }

    try {
      let decryptedData: Uint8Array | null = null;

      // Try ECIES decryption first
      if (this.eciesKeys.privateKey) {
        try {
          decryptedData = await decryptEcies(encryptedData, this.eciesKeys.privateKey);
        } catch {
          // If ECIES decryption fails, it might be a symmetric encrypted message
          console.log("ECIES decryption failed, trying symmetric...");
        }
      }

      // If ECIES failed or we're using symmetric encryption
      if (!decryptedData && this.symmetricKey) {
        try {
          decryptedData = await decryptSymmetric(encryptedData, this.symmetricKey);
        } catch (error: unknown) {
          console.error("Symmetric decryption failed:", error);
        }
      }

      if (decryptedData) {
        return new TextDecoder().decode(decryptedData);
      }
    } catch (error: unknown) {
      console.error("Error decrypting message:", error);
    }

    // If we couldn't decrypt the message
    return `[Encrypted message - Unable to decrypt]`;
  }
}

export const encryptionManager = new EncryptionManager(); 