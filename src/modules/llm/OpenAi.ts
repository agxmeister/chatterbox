import OpenAI from "openai";
import { Llm } from "./types.js";
import { Toolbox } from "@chatterbox/module/toolbox/types.js";

export class OpenAi implements Llm {
    constructor(
        private openai: OpenAI,
        readonly toolbox: Toolbox
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

    async chat(messages: string[], history: any[], images: string[]): Promise<string[]> {
        for (const message of messages) {
            history.push({
                role: "user",
                content: message,
            });
        }

        try {
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

            const response = await this.openai.chat.completions.create({
                model: "gpt-5-mini",
                messages: history,
                tools: openaiTools.length > 0 ? openaiTools : undefined
            });

            const output = [];
            const choice = response.choices[0];

            const assistantMessage: any = {
                role: "assistant",
                content: choice.message.content,
            };
            
            if (choice.message.tool_calls) {
                assistantMessage.tool_calls = choice.message.tool_calls;
            }
            
            history.push(assistantMessage);
            
            if (choice.message.content) {
                output.push(choice.message.content);
            }

            if (choice.message.tool_calls) {
                const toolResults = [];
                
                for (const toolCall of choice.message.tool_calls) {
                    if (toolCall.type !== "function") {
                        continue;
                    }
                    
                    const tool = toolCall.function.name;
                    const args = JSON.parse(toolCall.function.arguments) || {};

                    console.log(`[tool] calling tool ${tool} with args ${JSON.stringify(args, null, 2)}`);

                    const result = await this.toolbox.callTool(tool, args);

                    history.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        content: JSON.stringify(result.content)
                    });

                    const content = result.content as { type: string; text: string }[];
                    const messages = content.map(message => message.text);
                    toolResults.push({
                        tool,
                        args,
                        messages
                    });
                }

                if (toolResults.length > 0) {
                    const toolSummary = toolResults.map(({tool, args, messages}) => 
                        `Tool ${tool} with args ${JSON.stringify(args)} returned:\n${messages.join("\n")}`
                    ).join("\n\n");

                    output.push(...(await this.chat(
                        [`The requested tools have been executed. Here are the results:\n\n${toolSummary}`],
                        history,
                        images,
                    )));
                }
            }

            return output;
        } catch (error) {
            console.error("Error chatting with OpenAI:", error);
            throw error;
        }
    }
}