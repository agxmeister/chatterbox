import { LlmService } from "@chatterbox/module/llm/index.js";
import { Cli, Color } from "@chatterbox/module/cli/types.js";

export async function chatLoop(llmService: LlmService, cli: Cli): Promise<void> {
    let llm = null;
    
    try {
        llm = await llmService.engage();

        cli.output("Type your queries or 'quit' to exit.", Color.Gray);

        const history: any[] = [];
        const images: string[] = [];
        while (true) {
            const message = await cli.input("> ");
            if (!message.trim()) {
                continue;
            }

            if (message.toLowerCase() === "quit") {
                break;
            }

            const response = await llm.chat([message], history, images);
            cli.output(response.join("\n"));
        }
    } finally {
        if (llm) {
            await llmService.retire(llm);
        }
        cli.close();
    }
}