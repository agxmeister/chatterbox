import { Tool } from "@anthropic-ai/sdk/resources/messages/messages.mjs";
import { McpClient } from "../mcp/index.js";
import { Toolbox as IToolbox } from "./types.js";

export class Toolbox implements IToolbox {
    constructor(
        private readonly clients: McpClient[]
    ) {}

    async getTools(): Promise<Tool[]> {
        return (await Promise.all(
            this.clients.map(async client => {
                try {
                    return await client.getTools();
                } catch (error) {
                    console.error(`Error getting tools from ${client.serverName}:`, error);
                    return [];
                }
            })
        )).flat();
    }

    async callTool(toolName: string, parameters: Record<string, any> = {}): Promise<any> {
        for (const client of this.clients) {
            try {
                const tools = await client.getTools();
                if (tools.some(tool => tool.name === toolName)) {
                    return await client.callTool(toolName, parameters);
                }
            } catch (error) {
                console.error(`Error getting tools from ${client.serverName}:`, error);
            }
        }

        throw new Error(`Tool ${toolName} not found or client not connected`);
    }

    async connect(): Promise<void> {
        const results = await Promise.allSettled(
            this.clients.map(client => client.connect())
        );

        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.error(`Failed to connect to ${this.clients[index].serverName}:`, result.reason);
            }
        });
    }

    async disconnect(): Promise<void> {
        await Promise.allSettled(
            this.clients.map(client => client.disconnect())
        );
    }
}