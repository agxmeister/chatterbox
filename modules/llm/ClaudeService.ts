import Anthropic from "@anthropic-ai/sdk";
import { Claude } from "./Claude.js";
import { Llm, LlmService } from "./types.js";
import { Toolbox } from "../mcp/types.js";
import {McpClient, McpClientFactory} from "../mcp/index.js";

export class ClaudeService implements LlmService {
    constructor(
        private anthropic: Anthropic,
        private mcpClientFactories: McpClientFactory[]
    ) {}

    async engage(): Promise<Llm> {
        const mcpClients = this.mcpClientFactories.map(factory => factory.create());
        await this.connect(mcpClients);
        const toolbox = await this.buildToolbox(mcpClients);
        
        return new Claude(this.anthropic, mcpClients, toolbox);
    }

    async retire(llm: Llm): Promise<void> {
        console.log("Retiring LLM and disconnecting from all MCP servers...");
        
        await Promise.allSettled(
            llm.clients.map(client => client.disconnect())
        );
    }

    private async connect(mcpClients: McpClient[]): Promise<void> {
        console.log("Connecting to all MCP servers...");
        
        const results = await Promise.allSettled(
            mcpClients.map(client => client.connect())
        );

        // Log any connection failures
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.error(`Failed to connect to ${mcpClients[index].serverName}:`, result.reason);
            }
        });
    }

    private async buildToolbox(mcpClients: McpClient[]): Promise<Toolbox> {
        console.log("Building toolbox from all connected servers...");
        const toolbox: Toolbox = {};
        
        for (const client of mcpClients) {
            try {
                toolbox[client.serverName] = await client.getTools();
            } catch (error) {
                console.error(`Error getting tools from ${client.serverName}:`, error);
                toolbox[client.serverName] = [];
            }
        }
        
        const totalTools = Object.values(toolbox).flat().length;
        console.log(`Built toolbox with ${totalTools} tools from all servers`);
        return toolbox;
    }
}