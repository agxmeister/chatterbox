import Anthropic from "@anthropic-ai/sdk";
import { Claude } from "./Claude.js";
import { Llm, LlmService } from "./types.js";
import { ToolboxService } from "@chatterbox/module/toolbox/ToolboxService.js";
import { BreadcrumbsService } from "@chatterbox/module/breadcrumbs/index.js";

export class ClaudeService implements LlmService {
    constructor(
        private anthropic: Anthropic,
        private toolboxService: ToolboxService,
        private breadcrumbsService: BreadcrumbsService
    ) {}

    async engage(): Promise<Llm> {
        const toolbox = this.toolboxService.getToolbox();
        await toolbox.connect();

        return new Claude(this.anthropic, toolbox, this.breadcrumbsService);
    }

    async retire(llm: Llm): Promise<void> {
        await llm.toolbox.disconnect();
    }


}