import readline from "readline/promises";
import { ReadlineFactory as ReadlineFactoryInterface } from "./types.js";

export class ReadlineFactory implements ReadlineFactoryInterface {
    create(): readline.Interface {
        return readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
    }
}