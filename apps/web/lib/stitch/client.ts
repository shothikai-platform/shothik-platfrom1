/**
 * Stitch AI MCP Client
 * Integration with Stitch AI's decentralized knowledge hub
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

const STITCH_API_KEY = process.env.NEXT_PUBLIC_STITCH_API_KEY || 'AQ.Ab8RN6KEsiuBo-WBGLAWQ6l3zmYFFppTSlfNzQHfLA1H0VcZRg';
const STITCH_BASE_URL = 'https://api-demo.stitch-ai.co';

class StitchAIClient {
  private client: Client | null = null;
  private connected = false;

  async connect(): Promise<void> {
    try {
      this.client = new Client({
        name: 'shothik-slide-generation',
        version: '1.0.0',
      });

      const transport = new SSEClientTransport(
        new URL(`${STITCH_BASE_URL}/mcp`)
      );

      await this.client.connect(transport);
      this.connected = true;
      console.log('[StitchAI] Connected successfully');
    } catch (error) {
      console.error('[StitchAI] Connection failed:', error);
      // Fallback to local memory if Stitch AI is unavailable
      this.connected = false;
    }
  }

  async createSpace(spaceName: string, type: string = 'presentation'): Promise<string | null> {
    if (!this.connected || !this.client) {
      // Fallback: return local ID
      return `local-${Date.now()}`;
    }

    try {
      const result = await this.client.callTool('create_space', {
        space_name: spaceName,
        type,
      });
      return result.space_id;
    } catch (error) {
      console.error('[StitchAI] create_space failed:', error);
      return `local-${Date.now()}`;
    }
  }

  async getAllSpaces(): Promise<any[]> {
    if (!this.connected || !this.client) {
      // Fallback: return from localStorage
      return this.getLocalSpaces();
    }

    try {
      const result = await this.client.callTool('get_all_spaces', {});
      return result.spaces || [];
    } catch (error) {
      console.error('[StitchAI] get_all_spaces failed:', error);
      return this.getLocalSpaces();
    }
  }

  async uploadMemory(
    space: string,
    message: string,
    memory: Record<string, any>
  ): Promise<boolean> {
    if (!this.connected || !this.client) {
      // Fallback: save to localStorage
      return this.saveLocalMemory(space, message, memory);
    }

    try {
      await this.client.callTool('upload_memory', {
        space,
        message,
        memory: JSON.stringify(memory),
      });
      return true;
    } catch (error) {
      console.error('[StitchAI] upload_memory failed:', error);
      return this.saveLocalMemory(space, message, memory);
    }
  }

  async getAllMemories(space: string, limit: number = 50): Promise<any[]> {
    if (!this.connected || !this.client) {
      return this.getLocalMemories(space);
    }

    try {
      const result = await this.client.callTool('get_all_memories', {
        space,
        limit,
      });
      return result.memories || [];
    } catch (error) {
      console.error('[StitchAI] get_all_memories failed:', error);
      return this.getLocalMemories(space);
    }
  }

  // Fallback: LocalStorage methods
  private getLocalSpaces(): any[] {
    if (typeof window === 'undefined') return [];
    const spaces = localStorage.getItem('shothik-presentation-spaces');
    return spaces ? JSON.parse(spaces) : [];
  }

  private saveLocalMemory(
    space: string,
    message: string,
    memory: Record<string, any>
  ): boolean {
    if (typeof window === 'undefined') return false;
    
    const memories = this.getLocalMemories(space);
    memories.push({
      id: `local-${Date.now()}`,
      space,
      message,
      memory,
      createdAt: new Date().toISOString(),
    });
    
    localStorage.setItem(
      `shothik-memories-${space}`,
      JSON.stringify(memories)
    );
    return true;
  }

  private getLocalMemories(space: string): any[] {
    if (typeof window === 'undefined') return [];
    const memories = localStorage.getItem(`shothik-memories-${space}`);
    return memories ? JSON.parse(memories) : [];
  }
}

// Singleton instance
let stitchClient: StitchAIClient | null = null;

export function getStitchClient(): StitchAIClient {
  if (!stitchClient) {
    stitchClient = new StitchAIClient();
  }
  return stitchClient;
}

export default StitchAIClient;
