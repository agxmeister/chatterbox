import OpenAI from "openai";
import { OpenAi } from "./OpenAi.js";
import { Llm, LlmService } from "./types.js";
import { ToolboxService } from "@chatterbox/module/toolbox/ToolboxService.js";
import { Breadcrumbs } from "@chatterbox/module/breadcrumbs/index.js";
import { LoggerFactory } from "@chatterbox/module/logger/index.js";

export class OpenAiService implements LlmService {
    constructor(
        private toolboxService: ToolboxService,
        private openai: OpenAI,
        private breadcrumbs: Breadcrumbs,
        private loggerFactory: LoggerFactory
    ) {}

    async engage(): Promise<Llm> {
        const toolbox = this.toolboxService.getToolbox();
        await toolbox.connect();
        const logger = this.loggerFactory.createLogger();

        return new OpenAi(toolbox, this.openai, this.breadcrumbs, logger);
    }

    async retire(llm: Llm): Promise<void> {
        await llm.toolbox.disconnect();
    }
}