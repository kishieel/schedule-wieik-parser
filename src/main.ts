#!/usr/bin/env node

import { PdfToXlsxService } from '@app/services/pdf-to-xlsx.service';
import { ConfigService } from '@app/services/config.service';
import { DataExtractionService } from '@app/services/data-extraction.service';
import { PdfToJsonOptions, PdfToXlsxOptions, XlsxToJsonOptions } from '@app/types';
import { Command } from 'commander';
import { join } from 'path';
import * as process from 'process';
import * as fs from 'fs';

const library = JSON.parse(fs.readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));
const version = library.version;

export const program = new Command()
    .version(version, '-v, --version')
    .name('schedule-wieik-parser')
    .description('Schedule WIEIK - Parser');

program
    .command('pdf-to-json')
    .description('converts schedule in PDF format to JSON format')
    .requiredOption('-i, --input <path>', 'path to input file in PDF format')
    .requiredOption('-o, --output <path>', 'path to output file in JSON format')
    .requiredOption('-c, --config <path>', 'path to configuration file in JSON format')
    .requiredOption('-l, --license <key>', 'license key for Apryse SDK')
    .action(async (options: PdfToJsonOptions) => {
        const xlsx = await PdfToXlsxService.convertPdfToXlsx(options.input, options.license);
        const config = ConfigService.loadConfig(options.config);
        const data = DataExtractionService.extractFromXlsx(xlsx, config);
        fs.writeFileSync(options.output, JSON.stringify(data, null, 2));
    });

program
    .command('pdf-to-xlsx')
    .description('converts schedule in PDF format to XLSX format')
    .requiredOption('-i, --input <path>', 'path to input file in PDF format')
    .requiredOption('-o, --output <path>', 'path to output file in XLSX format')
    .requiredOption('-l, --license <key>', 'license key for Apryse SDK')
    .action(async (options: PdfToXlsxOptions) => {
        await PdfToXlsxService.convertPdfToXlsx(options.input, options.license, options.output);
    });

program
    .command('xlsx-to-json')
    .description('converts schedule in XLSX format to JSON format')
    .requiredOption('-i, --input <path>', 'path to input file in XLSX format')
    .requiredOption('-o, --output <path>', 'path to output file in JSON format')
    .requiredOption('-c, --config <path>', 'path to configuration file in JSON format')
    .action((options: XlsxToJsonOptions) => {
        const config = ConfigService.loadConfig(options.config);
        const data = DataExtractionService.extractFromXlsx(options.input, config);
        fs.writeFileSync(options.output, JSON.stringify(data, null, 2));
    });

program.parseAsync(process.argv).catch(console.error);
