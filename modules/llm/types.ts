import { Toolbox } from "../toolbox/types.js";

export interface Llm {
    readonly toolbox: Toolbox;
    chat(messages: string[], history: any[]): Promise<string[]>;
}

export interface LlmService {
    engage(): Promise<Llm>;
    retire(llm: Llm): Promise<void>;
}
