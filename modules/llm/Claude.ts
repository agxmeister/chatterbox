import Anthropic from "@anthropic-ai/sdk";
import { Llm } from "./types.js";
import { Toolbox } from "../mcp/types.js";
import { McpClient } from "../mcp/index.js";

export class Claude implements Llm {
    constructor(
        private anthropic: Anthropic,
        readonly clients: McpClient[],
        readonly toolbox: Toolbox
    ) {}

    async chat(messages: string[], history: any[]): Promise<string[]> {
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
                tools: Object.values(this.toolbox).flat()
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

    private async callTool(toolName: string, parameters: Record<string, any> = {}): Promise<any> {
        for (const [clientName, tools] of Object.entries(this.toolbox)) {
            if (tools.some(tool => tool.name === toolName)) {
                const client = this.clients.find(c => c.serverName === clientName);
                if (client) {
                    return await client.callTool(toolName, parameters);
                }
            }
        }

        throw new Error(`Tool ${toolName} not found or client not connected`);
    }
}