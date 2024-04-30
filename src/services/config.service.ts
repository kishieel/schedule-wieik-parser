import { Config } from '@app/services/config.types';
import * as fs from 'fs';
import * as YAML from 'yaml';

export class ConfigService {
    static loadConfig(path: string): Config {
        const file = fs.readFileSync(path, 'utf-8');
        const config = YAML.parse(file);

        if (ConfigService.isConfigValid(config)) {
            return config;
        }

        throw new Error('Invalid config');
    }

    static isConfigValid(config: unknown): config is Config {
        if (typeof config !== 'object') {
            return false;
        }

        if (
            !('lectures' in config) ||
            !Array.isArray(config.lectures) ||
            config.lectures.some(
                (l) =>
                    typeof l !== 'object' ||
                    !('name' in l) ||
                    typeof l.name !== 'string' ||
                    !('id' in l) ||
                    typeof l.id !== 'number',
            )
        ) {
            return false;
        }

        if (
            !('lecturers' in config) ||
            !Array.isArray(config.lecturers) ||
            config.lecturers.some((l) => typeof l !== 'string')
        ) {
            return false;
        }

        if (
            !('groups' in config) ||
            !Array.isArray(config.groups) ||
            config.groups.some(
                (g) =>
                    typeof g !== 'object' ||
                    !('type' in g) ||
                    typeof g.type !== 'string' ||
                    !('set' in g) ||
                    !Array.isArray(g.set) ||
                    g.set.some((s) => typeof s !== 'string'),
            )
        ) {
            return false;
        }

        if (!('rooms' in config) || !Array.isArray(config.rooms) || config.rooms.some((r) => typeof r !== 'string')) {
            return false;
        }

        if (
            !('dateOfFirstLecture' in config) ||
            typeof config.dateOfFirstLecture !== 'string' ||
            config.dateOfFirstLecture.match(/^\d{4}-\d{2}-\d{2}$/) === null
        ) {
            return false;
        }

        return true;
    }
}
