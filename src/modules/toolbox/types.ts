import { Tool } from "@anthropic-ai/sdk/resources/messages/messages.mjs";
import { CallToolResult } from "@chatterbox/module/mcp/types.js";

export interface Toolbox {
    getTools(): Promise<Tool[]>;
    callTool(toolName: string, parameters: Record<string, any>): Promise<CallToolResult>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
}

export interface ToolboxService {
    getToolbox(): Toolbox;
}