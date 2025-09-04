export interface ServerConfig {
    args: string[];
    env: Record<string, string>;
}

export interface Config {
    servers: Record<string, ServerConfig>;
}