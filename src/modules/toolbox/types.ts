import { Tool } from "@anthropic-ai/sdk/resources/messages/messages.mjs";

export interface Toolbox {
    getTools(): Promise<Tool[]>;
    callTool(toolName: string, parameters: Record<string, any>): Promise<any>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
}

export interface ToolboxService {
    getToolbox(): Toolbox;
}