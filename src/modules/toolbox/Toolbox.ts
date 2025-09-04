import { Tool } from "@anthropic-ai/sdk/resources/messages/messages.mjs";
import { McpClient } from "../mcp/index.js";
import { Toolbox as ToolboxInterface } from "./types.js";

export class Toolbox implements ToolboxInterface {
    constructor(
        private readonly clients: McpClient[]
    ) {}

    async getTools(): Promise<Tool[]> {
        return (await Promise.all(
            this.clients.map(async client => {
                try {
                    const tools = await client.getTools();
                    return tools.map(tool => ({
                        ...tool,
                        name: `${client.name.toLowerCase()}-${tool.name}`
                    }));
                } catch (error) {
                    console.error(`Error getting tools from ${client.name}:`, error);
                    return [];
                }
            })
        )).flat();
    }

    async callTool(toolName: string, parameters: Record<string, any> = {}): Promise<any> {
        for (const client of this.clients) {
            try {
                const tools = await client.getTools();
                const tool = tools.find(tool => `${client.name.toLowerCase()}-${tool.name}` === toolName);
                if (tool) {
                    return await client.callTool(tool.name, parameters);
                }
            } catch (error) {
                console.error(`Error getting tools from ${client.name}:`, error);
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
                console.error(`Failed to connect to ${this.clients[index].name}:`, result.reason);
            }
        });
    }

    async disconnect(): Promise<void> {
        await Promise.allSettled(
            this.clients.map(client => client.disconnect())
        );
    }
}