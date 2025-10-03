import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {Tool} from "@anthropic-ai/sdk/resources/messages/messages.mjs";
import { ServerConfig } from "../config/types.js";
import { CallToolResult } from "./types.js";

export class McpClient {
    private readonly client: Client;
    private readonly transport: StdioClientTransport;
    private toolsCache: Tool[] | null = null;

    constructor(
        readonly name: string,
        readonly config: ServerConfig
    ) {
        this.client = new Client({
            name: `chatterbox-client-${name}`,
            version: "1.0.0"
        });

        this.transport = new StdioClientTransport({
            command: process.execPath,
            ...config,
        });
    }

    async connect(): Promise<void> {
        try {
            await this.client.connect(this.transport);
        } catch (error) {
            console.error(`Failed to connect to ${this.name}:`, error);
            throw error;
        }
    }

    async getTools(): Promise<Tool[]> {
        if (this.toolsCache !== null) {
            return this.toolsCache;
        }

        try {
            const response = await this.client.listTools();
            this.toolsCache = response.tools!.map(tool => ({
                name: tool.name,
                description: tool.description || "",
                input_schema: tool.inputSchema || {}
            }));
            return this.toolsCache;
        } catch (error) {
            console.error(`Failed to list tools provided by ${this.name}:`, error);
            throw error;
        }
    }

    async callTool(toolName: string, parameters: Record<string, any> = {}): Promise<CallToolResult> {
        try {
            const result = await this.client.callTool({
                name: toolName,
                arguments: parameters,
            }) as any;

            return {
                content: (result.content || []).filter((c: any) => c.type === "text" || c.type === "image"),
                isError: result.isError ?? false,
            };
        } catch (error) {
            console.error(`Failed to call tool ${toolName} provided by ${this.name}:`, error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        try {
            await this.client.close();
        } catch (error) {
            console.error(`Failed to disconnect from ${this.name}:`, error);
        }
    }
}