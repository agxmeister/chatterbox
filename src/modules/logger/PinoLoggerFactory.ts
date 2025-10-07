import pino from "pino";
import { Logger, LoggerFactory } from "./types.js";

export class PinoLoggerFactory implements LoggerFactory {
    constructor(private logsDir: string = './logs') {}

    createLogger(): Logger {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const logFile = `${this.logsDir}/session-${timestamp}.log`;

        return pino({
            level: 'debug',
            transport: {
                targets: [
                    {
                        target: 'pino-pretty',
                        options: {
                            destination: logFile,
                            colorize: false,
                            translateTime: 'SYS:standard',
                            ignore: 'pid,hostname',
                        }
                    },
                ],
            },
        });
    }
}
