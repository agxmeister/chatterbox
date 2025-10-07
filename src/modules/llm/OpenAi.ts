import OpenAI from "openai";
import { Llm } from "./types.js";
import { Toolbox } from "@chatterbox/module/toolbox/types.js";
import { Breadcrumbs } from "@chatterbox/module/breadcrumbs/index.js";
import { Logger } from "@chatterbox/module/logger/index.js";

export class OpenAi implements Llm {
    private attachments: string[] = [];

    constructor(
        readonly toolbox: Toolbox,
        private openai: OpenAI,
        readonly breadcrumbs: Breadcrumbs,
        readonly logger: Logger
    ) {}

    private augmentSchemaForStrictMode(schema: any): any {
        if (!schema || typeof schema !== 'object') {
            return schema;
        }

        const augmentedSchema = { ...schema };

        if (schema.type === 'object' && schema.properties) {
            augmentedSchema.required = Object.keys(schema.properties);

            augmentedSchema.properties = {};
            for (const [key, value] of Object.entries(schema.properties)) {
                augmentedSchema.properties[key] = this.augmentSchemaForStrictMode(value);
            }
        }

        if (schema.type === 'array' && schema.items) {
            augmentedSchema.items = this.augmentSchemaForStrictMode(schema.items);
        }

        if (schema.oneOf) {
            augmentedSchema.oneOf = schema.oneOf.map((subSchema: any) => 
                this.augmentSchemaForStrictMode(subSchema)
            );
        }
        if (schema.anyOf) {
            augmentedSchema.anyOf = schema.anyOf.map((subSchema: any) => 
                this.augmentSchemaForStrictMode(subSchema)
            );
        }
        if (schema.allOf) {
            augmentedSchema.allOf = schema.allOf.map((subSchema: any) => 
                this.augmentSchemaForStrictMode(subSchema)
            );
        }

        return augmentedSchema;
    }

    async chat(messages: string[], thread: any[]): Promise<void> {
        for (const message of messages) {
            thread.push({
                role: "user",
                content: message,
            });
        }

        const allTools = await this.toolbox.getTools();
        const openaiTools = allTools.map(tool => ({
            type: "function" as const,
            function: {
                name: tool.name,
                description: tool.description,
                parameters: this.augmentSchemaForStrictMode(tool.input_schema),
                strict: true,
            }
        }));

        const request = {
            model: "gpt-5-mini",
            messages: [
                ...thread,
                ...this.attachments.map(attachment => ({
                    role: "user",
                    content: [{
                        type: "image_url",
                        image_url: {
                            url: `https://breadcrumbs.agxmeister.services/screenshots/${attachment}`,
                        },
                    }],
                }))
            ],
            tools: openaiTools.length > 0 ? openaiTools : undefined
        };
        this.logger.info({ request }, 'Sending request to OpenAI API');
        const response = await this.openai.chat.completions.create(request);
        this.logger.info({ response }, 'Received response from OpenAI API');

        const choice = response.choices[0];

        const assistantMessage: any = {
            role: "assistant",
            content: choice.message.content,
        };

        if (choice.message.tool_calls) {
            assistantMessage.tool_calls = choice.message.tool_calls;
        }

        thread.push(assistantMessage);

        if (choice.message.tool_calls) {
            for (const toolCall of choice.message.tool_calls) {
                if (toolCall.type !== "function") {
                    continue;
                }

                const toolCallResult = await this.toolbox.callTool(
                    toolCall.function.name,
                    JSON.parse(toolCall.function.arguments) || {}
                );
                const content = toolCallResult.content;

                thread.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(content.filter((message: any) => message.type !== "image"))
                });

                const images = [];
                for (const message of content.filter((message: any) => message.type === "image")) {
                    try {
                        images.push(await this.breadcrumbs.upload((message as any).data));
                    } catch (error) {
                    }
                }
                if (images.length > 0) {
                    this.attachments = images;
                }

                await this.chat([], thread);
            }
        }
    }
}