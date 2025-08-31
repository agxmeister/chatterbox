import {ServerConfig} from "../config/types.js";
import {McpClient} from "./McpClient.js";

export class McpClientFactory {
    constructor(
        private serverName: string,
        private serverConfig: ServerConfig
    ) {}

    create(): McpClient {
        return new McpClient(this.serverName, this.serverConfig);
    }
}