import { Config } from '@app/services/config.types';

export class RegexService {
    static getUniversityScheduleRegex(config: Config): RegExp {
        let pattern = '';

        pattern += `(${config.lectures.map((l) => l.name).join('|')})`;
        pattern += '.*?';
        pattern += `(${config.groups.map((g) => g.set.join('|')).join('|')})`;
        pattern += '.*?';
        pattern += `(?:(${config.lecturers.join('|')})\\S)`;
        pattern += '.*?';
        pattern += `(${config.rooms.join('|')})`;

        return new RegExp(pattern, 'gmi');
    }
}
