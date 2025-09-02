import { McpClientFactory } from "../mcp/index.js";
import { Toolbox } from "./Toolbox.js";
import { ToolboxService as IToolboxService } from "./types.js";

export class ToolboxService implements IToolboxService {
    constructor(
        private mcpClientFactories: McpClientFactory[]
    ) {}

    getToolbox(): Toolbox {
        const mcpClients = this.mcpClientFactories.map(factory => factory.create());
        return new Toolbox(mcpClients);
    }
}