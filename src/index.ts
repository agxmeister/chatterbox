import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import { ConfigRepository, ConfigService } from "@chatterbox/module/config/index.js";
import { ClaudeService } from "@chatterbox/module/llm/index.js";
import { ToolboxService } from "@chatterbox/module/toolbox/index.js";
import { McpClientFactory } from "@chatterbox/module/mcp/index.js";
import { CliService } from "@chatterbox/module/cli/CliService.js";
import { ReadlineFactory } from "@chatterbox/module/cli/ReadlineFactory.js";
import { BreadcrumbsService } from "@chatterbox/module/breadcrumbs/index.js";
import { chatLoop } from "@/utils.js";

dotenv.config();

(async () => {
    const configRepository = new ConfigRepository('./config.json');
    const configService = new ConfigService(configRepository);

    const config = configService.getConfig();
    const mcpClientFactories = Object.entries(config.servers).map(([name, serverConfig]) => 
        new McpClientFactory(name, serverConfig)
    );

    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
    });
    const toolboxService = new ToolboxService(mcpClientFactories);
    const breadcrumbsService = new BreadcrumbsService(
        "https://breadcrumbs.agxmeister.services/api",
        process.env.BREADCRUMBS_API_KEY!
    );
    const claudeService = new ClaudeService(anthropic, toolboxService, breadcrumbsService);
    
    const readlineFactory = new ReadlineFactory();
    const cliService = new CliService(readlineFactory);
    const cli = cliService.create();
    
    try {
        await chatLoop(claudeService, cli);
    } finally {
        process.exit(0);
    }
})();
