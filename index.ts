import Anthropic from "@anthropic-ai/sdk";
import * as dotenv from "dotenv";
import readline from "readline/promises";
import { ConfigRepository, ConfigService } from "./modules/config/index.js";
import {ClaudeService, Llm, LlmService} from "./modules/llm/index.js";
import { ToolboxService } from "./modules/toolbox/index.js";
import { McpClientFactory } from "./modules/mcp/index.js";

dotenv.config();

async function chatLoop(llmService: LlmService): Promise<void> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    let llm = null;
    
    try {
        llm = await llmService.engage();

        console.log("Type your queries or 'quit' to exit.");

        const history: any[] = [];
        while (true) {
            const message = await rl.question("\nQuery: ");

            if (message.toLowerCase() === "quit") {
                break;
            }

            const response = await llm.chat([message], history);
            console.log("\n" + response.join("\n"));
        }
    } finally {
        if (llm) {
            await llmService.retire(llm);
        }
        rl.close();
    }
}

(async () => {
    const configRepository = new ConfigRepository('config.json');
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
