import readline from "readline/promises";
import { LlmService } from "./modules/llm/index.js";

export async function chatLoop(llmService: LlmService): Promise<void> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    let llm = null;
    
    try {
        llm = await llmService.engage();

        rl.write(`\x1b[90mType your queries or 'quit' to exit.\n`);

        const history: any[] = [];
        while (true) {
            const message = await rl.question(`\x1b[38;5;167m> `);
            if (!message.trim()) {
                continue;
            }

            if (message.toLowerCase() === "quit") {
                break;
            }

            const response = await llm.chat([message], history);
            rl.write(`\x1b[0m${response.join("\n")}\n`);
        }
    } finally {
        if (llm) {
            await llmService.retire(llm);
        }
        rl.close();
    }
}