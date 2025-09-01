import { McpClient } from "../mcp/index.js";

export interface Llm {
    readonly clients: McpClient[];
    chat(messages: string[], history: any[]): Promise<string[]>;
}

export interface LlmService {
    engage(): Promise<Llm>;
    retire(llm: Llm): Promise<void>;
}
