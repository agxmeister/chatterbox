import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import Anthropic from "@anthropic-ai/sdk";
import * as dotenv from "dotenv";
import {Tool} from "@anthropic-ai/sdk/resources/messages/messages.mjs";
import readline from "readline/promises";

dotenv.config();

export class McpClient {
    private readonly anthropic: Anthropic;
    private readonly mcp: Client;
    private readonly transport: StdioClientTransport;
    private tools: Tool[] = [];

    constructor() {
        this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
        });

        this.mcp = new Client({
            name: "chatterbox-client",
            version: "1.0.0"
        });

        this.transport = new StdioClientTransport({
            command: process.execPath,
            args: ["/Users/alexeyfilatev/Documents/Projects/agxmeister/whispr/dist/index.js"],
            env: {
                "EDGE_JIRA_DOMAIN": "webpros",
                "EDGE_JIRA_CREDENTIALS": "YWxla3NleS5maWxhdGV2QHdlYnByb3MuY29tOkFUQVRUM3hGZkdGMFlhb0RhM2h1c2dhWV8zbWloT3hjVFk2RTJTaFpvOVVoT2VsbW9SZy1XM0h5TWVyc1JnZWFJRE1ab3ZKYm1BMDNSWURmNUtpSERqZzhVUEhNNUFVZDlHeV9hcjZFMjJqTUlOMmF3YlpMZi1wU3ZKTGJySlh3UWVxR0diUXhKalREeWVYV01yaXBWVldWcndidFhwOVRPbkU4UlRKMl9NMGdZQTF1eGdWWGJOVT1BNzhFRDU1MQ==",
            },
        });
    }

    async connect() {
        console.log("Connecting to MCP server...");
        try {
            await this.mcp.connect(this.transport);
            console.log("Connected to MCP server successfully");
            await this.listAvailableTools();
        } catch (error) {
            console.error("Failed to connect to MCP server:", error);
            throw error;
        }
    }

    async listAvailableTools() {
        try {
            const response = await this.mcp.listTools();
            this.tools = response.tools!.map(tool => ({
                name: tool.name,
                description: tool.description || "",
                input_schema: tool.inputSchema || {}
            }));
            console.log(`Available tools: ${this.tools.map(tool => tool.name).join(", ")}`);
        } catch (error) {
            console.error("Error listing tools:", error);
        }
    }

    async callTool(toolName: string, parameters: Record<string, any> = {}) {
        try {
            return await this.mcp.callTool({
                name: toolName,
                arguments: parameters
            });
        } catch (error) {
            console.error(`Error calling tool ${toolName}:`, error);
            throw error;
        }
    }

    async chatWithClaude(messages: string[], history: any[]): Promise<string[]> {
        for (const message of messages) {
            history.push({
                role: "user",
                content: message,
            });
        }
        try {
            const response = await this.anthropic.messages.create({
                model: "claude-sonnet-4-20250514",
                max_tokens: 10000,
                messages: history,
                tools: this.tools
            });

            const output = [];

            for (const message of response.content) {
                if (message.type === "text") {
                    output.push(`[Claude] ${message.text}`);
                    history.push({
                        role: "assistant",
                        content: message.text,
                    });
                    continue;
                }
                if (message.type === "tool_use") {
                    const tool = message.name;
                    const args = message.input as Record<string, any> | undefined;

                    console.log(`calling tool ${tool} with args ${JSON.stringify(args)}`);

                    const result = await this.callTool(tool, args);

                    const content = result.content as { type: string; text: string }[];
                    const messages = content.map(message => message.text);
                    output.push(...(await this.chatWithClaude(
                        [`You asked to run the tool ${tool} with args ${JSON.stringify(args)}, and it returned the following:\n\n${messages.join("\n\n")}`],
                        history,
                    )));
                }
            }

            return output;
        } catch (error) {
            console.error("Error chatting with Claude:", error);
            throw error;
        }
    }

    async disconnect() {
        try {
            await this.mcp.close();
            console.log("Disconnected from MCP server");
        } catch (error) {
            console.error("Error disconnecting:", error);
        }
    }

    async chatLoop() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        try {
            console.log("\nMCP Client Started!");
            console.log("Type your queries or 'quit' to exit.");

            while (true) {
                const message = await rl.question("\nQuery: ");
                if (message.toLowerCase() === "quit") {
                    break;
                }
                const response = await this.chatWithClaude([message], []);
                console.log("\n" + response);
            }
        } finally {
            rl.close();
        }
    }
}

(async () => {
    const mcpClient = new McpClient();
    try {
        await mcpClient.connect();
        await mcpClient.chatLoop();
    } finally {
        await mcpClient.disconnect();
        process.exit(0);
    }
})();
