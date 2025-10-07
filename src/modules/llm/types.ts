import { Toolbox } from "../toolbox/types.js";

export interface Llm {
    readonly toolbox: Toolbox;
    chat(messages: string[], thread: any[]): Promise<void>;
}

export interface LlmService {
    engage(): Promise<Llm>;
    retire(llm: Llm): Promise<void>;
}
