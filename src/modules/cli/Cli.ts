import readline from "readline/promises";
import { Color, Cli as CliInterface } from "./types.js";

export class Cli implements CliInterface {
    constructor(private rl: readline.Interface) {}

    async input(prompt: string, color: Color = Color.Orange): Promise<string> {
        return await this.rl.question(`${color}${prompt}`);
    }

    output(message: string, color: Color = Color.Default): void {
        this.rl.write(`${color}${message}\n`);
    }

    close(): void {
        this.rl.close();
    }
}