import { createLightNode, waitForRemotePeer, type LightNode, type CreateNodeOptions } from "@waku/sdk";
import { CUSTOM_BOOTSTRAP_NODES } from "../../constants";
import { peerIdentityManager } from "./identity";

/**
 * WakuNodeManager class for managing a Waku Light Node
 */
export class WakuNodeManager {
  private node: LightNode | null = null;

  /**
   * Creates and starts a Waku Light Node
   * @returns A promise that resolves to the started Waku Light Node
   */
  async initWakuNode({
    usePersistentPeerId = true,
    seed = undefined,
    ...nodeOptions
  }: {
    customBootstrapNodes?: string[];
    usePersistentPeerId?: boolean;
    seed?: string;
  } & Partial<CreateNodeOptions>): Promise<LightNode> {
    try {
      const options: CreateNodeOptions = { 
        ...nodeOptions,
      };
      
      // Get the private key for persistent peer ID if requested
      if (usePersistentPeerId) {
        console.log("Using persistent Waku/libp2p Peer ID");
        const privateKey = await peerIdentityManager.getPrivateKey(seed);
        console.log("Generated private key from seed for Waku/libp2p Peer ID");
        options.libp2p = { 
          ...options.libp2p,
          privateKey 
        };
      } else {
        console.log("Using random Waku/libp2p Peer ID");
      }
      
      // Create a Waku Light Node with the configured options
      this.node = await createLightNode(options);
      
      // Log the peer ID for debugging
      const peerId = this.node.libp2p.peerId.toString();
      console.log("Waku/libp2p Peer ID:", peerId);
      
      // Start the node
      await this.node.start();
      console.log("Waku node started");
      
      // Wait for a connection to a peer
      await waitForRemotePeer(this.node);
      console.log("Connected to a peer");
      
      return this.node;
    } catch (error) {
      console.error("Error initializing Waku node:", error);
      throw error;
    }
  }

  /**
   * Stops the Waku node
   */
  async stopWakuNode(node?: LightNode): Promise<void> {
    const nodeToStop = node || this.node;
    
    if (!nodeToStop) {
      console.warn("No Waku node to stop");
      return;
    }
    
    try {
      await nodeToStop.stop();
      console.log("Waku node stopped");
      if (nodeToStop === this.node) {
        this.node = null;
      }
    } catch (error) {
      console.error("Error stopping Waku node:", error);
      throw error;
    }
  }

  /**
   * Gets the number of peers the node is connected to
   * @returns The number of connected peers
   */
  getPeerCount(node?: LightNode): number {
    const targetNode = node || this.node;
    
    if (!targetNode) {
      console.warn("Cannot get peer count: No Waku node available");
      return 0;
    }
    
    // Get the number of peers
    const peers = targetNode.libp2p.getPeers();
    return peers.length;
  }

  /**
   * Checks if the node is connected to any peers
   * @returns True if connected to at least one peer
   */
  isConnected(node?: LightNode): boolean {
    const targetNode = node || this.node;
    
    if (!targetNode) {
      console.warn("Cannot check connection status: No Waku node available");
      return false;
    }
    
    return this.getPeerCount(targetNode) > 0;
  }

  /**
   * Gets the peer ID of the node
   * @returns The Waku/libp2p Peer ID as a string, or null if no node is available
   */
  getPeerId(node?: LightNode): string | null {
    const targetNode = node || this.node;
    
    if (!targetNode) {
      console.warn("Cannot get Waku/libp2p Peer ID: No Waku node available");
      return null;
    }
    
    return targetNode.libp2p.peerId.toString();
  }
}

// Create and export singleton instance for backward compatibility
export const wakuNodeManager = new WakuNodeManager();
