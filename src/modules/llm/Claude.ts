import Anthropic from "@anthropic-ai/sdk";
import { Llm } from "./types.js";
import { Toolbox } from "@chatterbox/module/toolbox/types.js";
import { Breadcrumbs } from "@chatterbox/module/breadcrumbs/index.js";
import { ToolUseBlock } from "@anthropic-ai/sdk/resources/messages";

export class Claude implements Llm {
    constructor(
        readonly toolbox: Toolbox,
        readonly anthropic: Anthropic,
        readonly breadcrumbs: Breadcrumbs
    ) {}

    async chat(messages: string[], attachments: string[], thread: any[]): Promise<void> {
        for (const message of messages) {
            thread.push({
                role: "user",
                content: message,
            });
        }

        const request = {
            model: "claude-sonnet-4-20250514",
            max_tokens: 10000,
            messages: [
                ...thread,
                ...attachments.map(attachment => ({
                    role: "user",
                    content: [{
                        type: "image",
                        source: {
                            type: "url",
                            url: `https://breadcrumbs.agxmeister.services/screenshots/${attachment}`,
                        },
                    }],
                }))
            ],
            tools: await this.toolbox.getTools(),
        }
        const response = await this.anthropic.messages.create(request);

        thread.push({
            role: "assistant",
            content: response.content,
        });

        const toolCallRequests = response.content
            .filter((message: any) => message.type === "tool_use") as ToolUseBlock[];
        for (const toolCallRequest of toolCallRequests) {
            const toolCallResult = await this.toolbox.callTool(
                toolCallRequest.name,
                toolCallRequest.input as Record<string, any> || {}
            );
            const content = toolCallResult.content;

            thread.push({
                role: "user",
                content: [{
                    type: "tool_result",
                    tool_use_id: toolCallRequest.id,
                    content: content,
                }],
            })

            attachments.length = 0;
            for (const {data} of content.filter(message => message.type === "image")) {
                try {
                    attachments.push(await this.breadcrumbs.upload(data));
                } catch (error) {
                }
            }

            await this.chat([], attachments, thread)
        }
    }
}