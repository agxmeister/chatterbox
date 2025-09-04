import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import { ConfigRepository, ConfigService } from "./modules/config/index.js";
import {ClaudeService, LlmService} from "./modules/llm/index.js";
import { ToolboxService } from "./modules/toolbox/index.js";
import { McpClientFactory } from "./modules/mcp/index.js";
import { chatLoop } from "./utils.js";

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
    const claudeService = new ClaudeService(anthropic, toolboxService);
    
    try {
        await chatLoop(claudeService);
    } finally {
        process.exit(0);
    }
})();
