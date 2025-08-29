import * as fs from 'fs';
import { Config } from './types.js';

export class ConfigRepository {
    constructor(private configPath: string) {}

    getConfig(): Config {
        try {
            const configData = fs.readFileSync(this.configPath, 'utf8');
            return JSON.parse(configData);
        } catch (error) {
            throw new Error(`Failed to load config from ${this.configPath}: ${error}`);
        }
    }
}