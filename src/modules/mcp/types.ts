import {Tool} from "@anthropic-ai/sdk/resources/messages/messages.mjs";

export type Toolbox = Record<string, Tool[]>;

export interface CallToolResultContentText {
    type: "text";
    text: string;
}

export interface CallToolResultContentImage {
    type: "image";
    data: string;
    mimeType: string;
}

export type CallToolResultContent = CallToolResultContentText | CallToolResultContentImage;

export interface CallToolResult {
    content: CallToolResultContent[];
    isError?: boolean;
}