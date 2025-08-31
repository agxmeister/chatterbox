import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {Tool} from "@anthropic-ai/sdk/resources/messages/messages.mjs";
import { ServerConfig } from "../config/types.js";

export class McpClient {
    private readonly mcp: Client;
    private readonly transport: StdioClientTransport;
    private connected = false;

    constructor(
        readonly serverName: string,
        private serverConfig: ServerConfig
    ) {
        this.mcp = new Client({
            name: `chatterbox-client-${serverName}`,
            version: "1.0.0"
        });

        this.transport = new StdioClientTransport({
            command: process.execPath,
            ...serverConfig,
        });
    }

    async connect(): Promise<void> {
        if (this.connected) {
            return;
        }

        console.log(`Connecting to MCP server: ${this.serverName}...`);
        try {
            await this.mcp.connect(this.transport);
            console.log(`Connected to MCP server: ${this.serverName}`);
            this.connected = true;
        } catch (error) {
            console.error(`Failed to connect to MCP server ${this.serverName}:`, error);
            throw error;
        }
    }

    async getTools(): Promise<Tool[]> {
        if (!this.connected) {
            throw new Error(`MCP client ${this.serverName} is not connected`);
        }

        try {
            const response = await this.mcp.listTools();
            const tools = response.tools!.map(tool => ({
                name: tool.name,
                description: tool.description || "",
                input_schema: tool.inputSchema || {}
            }));
            console.log(`Available tools from ${this.serverName}: ${tools.map(tool => tool.name).join(", ")}`);
            return tools;
        } catch (error) {
            console.error(`Error listing tools from ${this.serverName}:`, error);
            throw error;
        }
    }

    async callTool(toolName: string, parameters: Record<string, any> = {}): Promise<any> {
        if (!this.connected) {
            throw new Error(`MCP client ${this.serverName} is not connected`);
        }

        try {
            console.log(`Calling tool ${toolName} on ${this.serverName} with args ${JSON.stringify(parameters)}`);
            return await this.mcp.callTool({
                name: toolName,
                arguments: parameters
            });
        } catch (error) {
            console.error(`Error calling tool ${toolName} on ${this.serverName}:`, error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        if (!this.connected) {
            return;
        }

        try {
            await this.mcp.close();
            this.connected = false;
            console.log(`Disconnected from MCP server: ${this.serverName}`);
        } catch (error) {
            console.error(`Error disconnecting from ${this.serverName}:`, error);
        }
    }

    isConnected(): boolean {
        return this.connected;
    }
}