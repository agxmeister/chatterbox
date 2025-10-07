export interface Logger {
    info(obj: any, msg?: string): void;
    info(msg: string): void;
    error(obj: any, msg?: string): void;
    error(msg: string): void;
    debug(obj: any, msg?: string): void;
    debug(msg: string): void;
    warn(obj: any, msg?: string): void;
    warn(msg: string): void;
}

export interface LoggerFactory {
    createLogger(): Logger;
}
