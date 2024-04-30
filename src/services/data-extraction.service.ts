import * as XLSX from 'xlsx';
import { RegexService } from '@app/services/regex.service';
import { Config } from '@app/services/config.types';
import { deromanize } from 'romans';
import { format, parse } from 'date-fns';

export class DataExtractionService {
    static ExcludedKeys = [
        '!data',
        '!ref',
        '!merges',
        '!cols',
        '!rows',
        '!protect',
        '!autofilter',
        '!type',
        '!margins',
    ];
    static SaturdayKey = 'Sobota';
    static SundayKey = 'Niedziela';

    static extractFromXlsx(path: string, config: Config): Lectures[] {
        const regex = RegexService.getUniversityScheduleRegex(config);

        const workbook = XLSX.readFile(path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        const typeByGroup = this.lookupTypeByGroup(config);
        const idByLecture = this.lookupIdByLecture(config);
        const mergeByCell = this.lookupMergeByCell(sheet);
        const splitByColumn = this.lookupSplitByColumn(sheet);
        const timeByColumn = this.lookupTimeByColumn(sheet, mergeByCell);
        const dateByRow = this.lookupDateByRow(sheet, mergeByCell, splitByColumn);
        const { dateByLeftRow, dateByRightRow } = dateByRow;

        return Object.entries(sheet)
            .filter(([key, value]) => !this.ExcludedKeys.includes(key))
            .map<Xlsx>(([cell, value]) => ({ cell, value: value.v.replaceAll('\n', ' ') }))
            .filter(({ value }) => new RegExp(regex).test(value))
            .map<Lecture & { date: string }>(({ cell, value }) => {
                const info = this.extractInfo(value, regex, idByLecture, typeByGroup);
                const { id, lecture, group, lecturer, room, type } = info;

                const date = this.extractDate(
                    cell,
                    splitByColumn,
                    dateByLeftRow,
                    dateByRightRow,
                    mergeByCell,
                    config,
                    cell,
                );
                const time = this.extractTime(cell, mergeByCell, timeByColumn);
                const { start, end, duration } = time;

                return { id, title: lecture, group, lecturer, room, type, start, end, duration, date };
            })
            .reduce((acc, curr) => {
                const index = acc.findIndex((a) => a.date === curr.date);
                const { date, ...lecture } = curr;

                if (index === -1) acc.push({ date, classes: [lecture] });
                else acc[index].classes.push(lecture);

                return acc;
            }, [] as Lectures[]);
    }

    protected static extractInfo(
        value: string,
        regex: RegExp,
        idByLecture: Record<string, number>,
        typeByGroup: Record<string, string>,
    ) {
        const data = new RegExp(regex).exec(value);
        const lecture = data[1];
        const group = data[2];
        const lecturer = data[3];
        const room = data[4];

        const id = idByLecture[lecture.toUpperCase()];
        const type = typeByGroup[group.toUpperCase()];

        return { id, lecture, group, lecturer, room, type };
    }

    protected static extractTime(
        cell: string,
        mergeByCell: Record<string, XLSX.Range>,
        timeByColumn: Record<string, string>,
    ) {
        const merge = mergeByCell[cell];
        const startTime = timeByColumn[XLSX.utils.encode_col(merge.s.c)];
        const endTime = timeByColumn[XLSX.utils.encode_col(merge.e.c)];

        const startRaw = startTime.split('-')[0];
        const endRaw = endTime.split('-')[1];

        const start = startRaw.substring(0, startRaw.length - 2) + ':' + startRaw.substring(startRaw.length - 2);
        const end = endRaw.substring(0, endRaw.length - 2) + ':' + endRaw.substring(endRaw.length - 2);

        const frames = [];
        for (let i = merge.s.c; i <= merge.e.c; i++) {
            const time = timeByColumn[XLSX.utils.encode_col(i)];
            frames.push(time);
        }

        const duration = new Set(frames).size;

        return { start, end, duration };
    }

    protected static extractDate(
        cell: string,
        splitByColumn: string,
        dateByLeftRow: Record<string, string>,
        dateByRightRow: Record<string, string>,
        mergeByCell: Record<string, XLSX.Range>,
        config: Config,
        key: string,
    ) {
        const merge = mergeByCell[key];

        const keys = new RegExp(/([A-Z]+)(\d+)/gim).exec(cell);
        const column = keys[1];

        const dateRaw = this.isLeftTable(column, splitByColumn)
            ? dateByLeftRow[XLSX.utils.encode_row(merge.s.r)]
            : dateByRightRow[XLSX.utils.encode_row(merge.s.r)];

        const dateOfFirstLecture = parse(config.dateOfFirstLecture, 'yyyy-MM-dd', new Date());
        const year = dateOfFirstLecture.getFullYear();

        const [day, month] = dateRaw.split('.');
        const dateOfThisLecture = parse(`${year}-${deromanize(month)}-${parseInt(day)}`, 'yyyy-M-d', new Date());

        if (dateOfThisLecture < dateOfFirstLecture) {
            dateOfThisLecture.setFullYear(year + 1);
        }

        return format(dateOfThisLecture, 'yyyy-MM-dd');
    }

    protected static lookupTypeByGroup(config: Config): Record<string, string> {
        const lookup: Record<string, string> = {};
        config.groups.forEach((g) => g.set.forEach((s) => (lookup[s.toUpperCase()] = g.type)));

        return lookup;
    }

    protected static lookupIdByLecture(config: Config): Record<string, number> {
        const lookup: Record<string, number> = {};
        config.lectures.forEach((l) => (lookup[l.name.toUpperCase()] = l.id));

        return lookup;
    }

    protected static lookupMergeByCell(sheet: XLSX.WorkSheet): Record<string, XLSX.Range> {
        const lookup: Record<string, XLSX.Range> = {};
        const merges = sheet['!merges'] || [];

        merges.forEach((merge) => {
            const { s, e } = merge;

            for (let i = s.r; i <= e.r; i++) {
                for (let j = s.c; j <= e.c; j++) {
                    const cell = XLSX.utils.encode_cell({ r: i, c: j });
                    lookup[cell] = merge;
                }
            }
        });

        return lookup;
    }

    protected static lookupTimeByColumn(
        sheet: XLSX.WorkSheet,
        mergeByCell: Record<string, XLSX.Range>,
    ): Record<string, string> {
        const lookup: Record<string, string> = {};
        const data = Object.entries(sheet)
            .filter(([key, value]) => !DataExtractionService.ExcludedKeys.includes(key))
            .map<Xlsx>(([key, value]) => ({ cell: key, value: value.v.replaceAll('\n', ' ') }))
            .filter(({ value }) => value.match(`${this.SaturdayKey}|${this.SundayKey}`));

        const keys = data.map((d) => d.cell);
        const key = keys[0];
        const row = key.match(/\d+/)[0];

        const keysInRow = Object.keys(sheet).filter((k) => k.match(new RegExp(`^[A-Z]+${row}$`, 'gmi')));

        keysInRow.forEach((k) => {
            if (sheet[k].v === this.SaturdayKey || sheet[k].v === this.SundayKey) return;

            const merge = mergeByCell[k];
            if (!merge) {
                const column = k.replace(/\d+/, '');
                lookup[column] = sheet[k].v;

                return;
            }

            for (let i = merge.s.c; i <= merge.e.c; i++) {
                const column = XLSX.utils.encode_col(i);
                lookup[column] = sheet[k].v;
            }
        });

        return lookup;
    }

    protected static lookupDateByRow(
        sheet: XLSX.WorkSheet,
        mergeByCell: Record<string, XLSX.Range>,
        splitByColumn: string,
    ): {
        dateByLeftRow: Record<string, string>;
        dateByRightRow: Record<string, string>;
    } {
        const dateByLeftRow: Record<string, string> = {};
        const dateByRightRow: Record<string, string> = {};

        const data = Object.entries(sheet)
            .filter(([key, value]) => !DataExtractionService.ExcludedKeys.includes(key))
            .map<Xlsx>(([key, value]) => ({ cell: key, value: value.v.replaceAll('\n', ' ') }))
            .filter(({ value }) => value.match(`${this.SaturdayKey}|${this.SundayKey}`));

        const keys = data.map((d) => d.cell);
        keys.forEach((key) => {
            const column = key.match(/[A-Z]+/)[0];

            const keysInColumn = Object.keys(sheet).filter((k) => k.match(new RegExp(`^${column}\\d+$`, 'gmi')));

            keysInColumn.forEach((k) => {
                if (!sheet[k].v.match(/\d+\.[IVX]+/)) return;

                const merge = mergeByCell[k];
                if (!merge) {
                    const row = k.match(/\d+/)[0];
                    const column = k.replace(/\d+/, '');

                    this.isLeftTable(column, splitByColumn)
                        ? (dateByLeftRow[row] = sheet[k].v)
                        : (dateByRightRow[row] = sheet[k].v);

                    return;
                }

                for (let i = merge.s.r; i <= merge.e.r; i++) {
                    const cell = XLSX.utils.encode_cell({ r: i, c: merge.s.c });

                    const column = cell.replace(/\d+/, '');
                    const row = cell.replace(/[A-Z]+/, '');

                    this.isLeftTable(column, splitByColumn)
                        ? (dateByLeftRow[row] = sheet[k].v)
                        : (dateByRightRow[row] = sheet[k].v);
                }
            });
        });

        return { dateByLeftRow, dateByRightRow };
    }

    protected static lookupSplitByColumn(sheet: XLSX.WorkSheet): string {
        const data = Object.entries(sheet)
            .filter(([key, value]) => !DataExtractionService.ExcludedKeys.includes(key))
            .map<Xlsx>(([key, value]) => ({ cell: key, value: value.v.replaceAll('\n', ' ') }))
            .filter(({ value }) => value.match(`${this.SundayKey}`));

        const keys = data.map((d) => d.cell);
        const key = keys[0];

        return key.replace(/\d+/, '');
    }

    protected static isLeftTable(column: string, splitByColumn: string): boolean {
        return XLSX.utils.decode_col(column) < XLSX.utils.decode_col(splitByColumn);
    }
}
