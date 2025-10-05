import { LlmService } from "@chatterbox/module/llm/index.js";
import { Cli, Color } from "@chatterbox/module/cli/types.js";

export async function chatLoop(llmService: LlmService, cli: Cli): Promise<void> {
    let llm = null;
    
    try {
        llm = await llmService.engage();

        cli.output("Type your queries or 'quit' to exit.", Color.Gray);

        const thread: any[] = [];
        const attachments: string[] = [];
        while (true) {
            const message = await cli.input("> ");
            if (!message.trim()) {
                continue;
            }

            if (message.toLowerCase() === "quit") {
                break;
            }

            await llm.chat([message], attachments, thread);
            cli.output(JSON.stringify(thread, null, 2), Color.Default);
        }
    } catch (error) {
        cli.output(`Error: ${error}`, Color.Orange);
    } finally {
        if (llm) {
            await llmService.retire(llm);
        }
        cli.close();
    }
}