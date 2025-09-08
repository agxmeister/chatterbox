import readline from "readline/promises";

export enum Color {
    Default = "\x1b[0m",
    Gray = "\x1b[90m",
    Orange = "\x1b[38;5;167m"
}

export interface Cli {
    input(prompt: string, color?: Color): Promise<string>;
    output(message: string, color?: Color): void;
    close(): void;
}

export interface ReadlineFactory {
    create(): readline.Interface;
}

export interface CliService {
    create(): Cli;
}