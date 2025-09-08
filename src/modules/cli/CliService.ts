import { CliService as CliServiceInterface, Cli as CliInterface, ReadlineFactory as ReadlineFactoryInterface } from "./types.js";
import { Cli } from "./Cli.js";

export class CliService implements CliServiceInterface {
    constructor(private readlineFactory: ReadlineFactoryInterface) {}

    create(): CliInterface {
        return new Cli(this.readlineFactory.create());
    }
}