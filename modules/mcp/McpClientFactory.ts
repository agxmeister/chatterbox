import {ServerConfig} from "../config/types.js";
import {McpClient} from "./McpClient.js";

export class McpClientFactory {
    constructor(
        readonly serverName: string,
        readonly serverConfig: ServerConfig
    ) {}

    create(): McpClient {
        return new McpClient(this.serverName, this.serverConfig);
    }
}