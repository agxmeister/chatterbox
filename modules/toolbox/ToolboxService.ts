import { McpClientFactory } from "../mcp/index.js";
import { Toolbox } from "./Toolbox.js";
import { ToolboxService as ToolboxServiceInterface } from "./types.js";

export class ToolboxService implements ToolboxServiceInterface {
    constructor(
        private mcpClientFactories: McpClientFactory[]
    ) {}

    getToolbox(): Toolbox {
        const mcpClients = this.mcpClientFactories.map(factory => factory.create());
        return new Toolbox(mcpClients);
    }
}