import Anthropic from "@anthropic-ai/sdk";
import { Claude } from "./Claude.js";
import { Llm, LlmService } from "./types.js";
import { ToolboxService } from "@chatterbox/module/toolbox/ToolboxService.js";
import { Breadcrumbs } from "@chatterbox/module/breadcrumbs/index.js";

export class ClaudeService implements LlmService {
    constructor(
        private toolboxService: ToolboxService,
        private anthropic: Anthropic,
        private breadcrumbs: Breadcrumbs
    ) {}

    async engage(): Promise<Llm> {
        const toolbox = this.toolboxService.getToolbox();
        await toolbox.connect();

        return new Claude(toolbox, this.anthropic, this.breadcrumbs);
    }

    async retire(llm: Llm): Promise<void> {
        await llm.toolbox.disconnect();
    }


}