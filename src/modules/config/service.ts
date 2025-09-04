import { ConfigRepository } from './repository.js';
import { Config } from './types.js';

export class ConfigService {
    constructor(private repository: ConfigRepository) {}

    getConfig(): Config {
        return this.repository.getConfig();
    }
}