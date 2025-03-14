import { createLightNode, waitForRemotePeer, type LightNode } from "@waku/sdk";
import { CUSTOM_BOOTSTRAP_NODES } from "../../constants";

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
    defaultBootstrap = true,
    customBootstrapNodes = CUSTOM_BOOTSTRAP_NODES,
  }: {
    defaultBootstrap?: boolean;
    customBootstrapNodes?: string[];
  }): Promise<LightNode> {
    try {
      // Create a Waku Light Node
      this.node = await createLightNode({ defaultBootstrap, bootstrapPeers: customBootstrapNodes });
      
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
  async stopWakuNode(): Promise<void> {

    
    if (!this.node) {
      console.warn("No Waku node to stop");
      return;
    }
    
    try {
      await this.node.stop();
      console.log("Waku node stopped");
      this.node = null;
    } catch (error) {
      console.error("Error stopping Waku node:", error);
      throw error;
    }
  }

  /**
   * Gets the number of peers the node is connected to
   * @returns The number of connected peers
   */
  getPeerCount(): number {
    if (!this.node) {
      console.warn("Cannot get peer count: No Waku node available");
      return 0;
    }
    
    // Get the number of peers
    const peers = this.node.libp2p.getPeers();
    
    return peers.length;
  }

  /**
   * Checks if the node is connected to any peers
   * @returns True if connected to at least one peer
   */
  isConnected(): boolean {
    if (!this.node) {
      console.warn("Cannot check connection status: No Waku node available");
      return false;
    }
    
    return this.getPeerCount() > 0;
  }
}

// Create and export singleton instance for backward compatibility
export const wakuNodeManager = new WakuNodeManager();
