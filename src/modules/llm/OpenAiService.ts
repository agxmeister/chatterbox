import OpenAI from "openai";
import { OpenAi } from "./OpenAi.js";
import { Llm, LlmService } from "./types.js";
import { ToolboxService } from "@chatterbox/module/toolbox/ToolboxService.js";

export class OpenAiService implements LlmService {
    constructor(
        private openai: OpenAI,
        private toolboxService: ToolboxService
    ) {}

    async engage(): Promise<Llm> {
        const toolbox = this.toolboxService.getToolbox();
        await toolbox.connect();
        
        return new OpenAi(this.openai, toolbox);
    }

    async retire(llm: Llm): Promise<void> {
        await llm.toolbox.disconnect();
    }
}