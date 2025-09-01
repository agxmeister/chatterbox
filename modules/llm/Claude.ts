import Anthropic from "@anthropic-ai/sdk";
import { Llm } from "./types.js";
import { McpClient } from "../mcp/index.js";

export class Claude implements Llm {
    constructor(
        private anthropic: Anthropic,
        readonly clients: McpClient[]
    ) {}

    async chat(messages: string[], history: any[]): Promise<string[]> {
        for (const message of messages) {
            history.push({
                role: "user",
                content: message,
            });
        }

        try {
            const allTools = await this.getTools();
            const response = await this.anthropic.messages.create({
                model: "claude-sonnet-4-20250514",
                max_tokens: 10000,
                messages: history,
                tools: allTools
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


                    const result = await this.callTool(tool, args);

                    const content = result.content as { type: string; text: string }[];
                    const messages = content.map(message => message.text);
                    output.push(...(await this.chat(
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

    private async getTools() {
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

    private async callTool(toolName: string, parameters: Record<string, any> = {}): Promise<any> {
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
}