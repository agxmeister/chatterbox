import * as fs from 'fs';
import { Config } from './types.js';

export class ConfigRepository {
    constructor(readonly configPath: string) {}

    getConfig(): Config {
        try {
            return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        } catch (error) {
            throw new Error(`Failed to load config from ${this.configPath}: ${error}`);
        }
    }
}