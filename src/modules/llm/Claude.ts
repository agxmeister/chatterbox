import Anthropic from "@anthropic-ai/sdk";
import { Llm } from "./types.js";
import { Toolbox } from "@chatterbox/module/toolbox/types.js";
import { Breadcrumbs } from "@chatterbox/module/breadcrumbs/index.js";

export class Claude implements Llm {
    constructor(
        readonly toolbox: Toolbox,
        readonly anthropic: Anthropic,
        readonly breadcrumbs: Breadcrumbs
    ) {}

    async chat(messages: string[], history: any[], images: string[]): Promise<string[]> {
        for (const message of messages) {
            history.push({
                role: "user",
                content: message,
            });
        }

        try {
            const allTools = await this.toolbox.getTools();

            const messages = [...history, ...images.map(image => ({
                role: "user",
                content: [{
                    type: "image",
                    source: {
                        type: "url",
                        url: `https://breadcrumbs.agxmeister.services/screenshots/${image}`,
                    },
                }],
            }))];
            const response = await this.anthropic.messages.create({
                model: "claude-sonnet-4-20250514",
                max_tokens: 10000,
                messages: messages,
                tools: allTools
            });

            const output = [];

            for (const message of response.content) {
                if (message.type === "text") {
                    output.push(`${message.text}`);
                    history.push({
                        role: "assistant",
                        content: message.text,
                    });
                    continue;
                }
                if (message.type === "tool_use") {
                    const tool = message.name;
                    const args = message.input as Record<string, any> || {};


                    const result = await this.toolbox.callTool(tool, args);

                    const content = result.content;

                    const messages = content
                        .filter(message => message.type === "text")
                        .map(message => message.text);

                    images.length = 0;
                    for (const {data} of content.filter(message => message.type === "image")) {
                        try {
                            images.push(await this.breadcrumbs.upload(data));
                        } catch (error) {
                        }
                    }

                    output.push(...(await this.chat(
                        [`You asked to run the tool ${tool} with args ${JSON.stringify(args)}, and it returned the following:\n\n${messages.join("\n\n")}`],
                        history,
                        images,
                    )));
                }
            }

            return output;
        } catch (error) {
            console.error("Error chatting with Claude:", error);
            throw error;
        }
    }
}