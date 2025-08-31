import { McpClient } from "../mcp/index.js";
import { Toolbox } from "../mcp/types.js";

export interface Llm {
    readonly clients: McpClient[];
    readonly toolbox: Toolbox;
    chat(messages: string[], history: any[]): Promise<string[]>;
}

export interface LlmService {
    engage(): Promise<Llm>;
    retire(llm: Llm): Promise<void>;
}
