import { generateKeyPairFromSeed } from "@libp2p/crypto/keys";
import { fromString } from "uint8arrays";
import { sha256 } from "../../utils/crypto";

/**
 * Class for managing Waku/libp2p peer identity
 */
export class PeerIdentityManager {
  private readonly SEED_STORAGE_KEY = "waku_peer_seed";

  /**
   * Generates a libp2p private key from a seed
   * @param seed Seed to use for generating the Waku/libp2p Peer ID
   */
  async getPrivateKey(seed?: string) {
    let seedToUse = seed;
    
    if (!seedToUse) {
      // If no seed provided, try to get from localStorage
      seedToUse = localStorage.getItem(this.SEED_STORAGE_KEY) || this.SEED_STORAGE_KEY;
    }
    
    // Hash the seed to ensure it's the right format for Ed25519
    const hashedSeed = (await sha256(seedToUse)).slice(0, 32);
    console.log("Using seed for Waku/libp2p Peer ID generation");
    
    // Generate and return the key pair
    return generateKeyPairFromSeed("Ed25519", fromString(hashedSeed));
  }

  /**
   * Stores a seed in localStorage for future Waku/libp2p Peer ID generation
   * @param seed The seed to store
   */
  storeSeed(seed: string): void {
    localStorage.setItem(this.SEED_STORAGE_KEY, seed);
  }

  /**
   * Clears the stored seed, which will result in a new Waku/libp2p Peer ID on next initialization
   */
  clearSeed(): void {
    localStorage.removeItem(this.SEED_STORAGE_KEY);
  }
}

// Create and export a singleton instance
export const peerIdentityManager = new PeerIdentityManager(); 