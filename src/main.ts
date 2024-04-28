#!/usr/bin/env node

import {Command, OptionValues} from "commander";
import {PDFNet} from "@pdftron/pdfnet-node";
import * as process from "process";

const program = new Command();

program
    .version('1.0.2')
    .name('Schedule WIEIK - Parser')
    .usage('yarn start --input [INPUT] --output [INPUT] --config [CONFIG]')
    .requiredOption('-i, --input [INPUT]', 'path to input file in PDF format')
    .requiredOption('-o, --output [OUTPUT]', 'path to output file in JSON format')
    .requiredOption('-c, --config [CONFIG]', 'path to configuration file in YAML format')
    .requiredOption('-l, --license [LICENSE]', 'license key for Apryse SDK')
    .parse(process.argv);

const bootstrap = async (options: OptionValues) => {
    await PDFNet.initialize(options.license)

    const available = await PDFNet.StructuredOutputModule.isModuleAvailable();
    if (!available) {
        throw new Error('StructuredOutput module is not available');
    }

    const excelOutputOptions = new PDFNet.Convert.ExcelOutputOptions();
    excelOutputOptions.setPages(1, 1);

    await PDFNet.Convert.fileToExcel(options.input, options.output, excelOutputOptions);
    await PDFNet.terminateEx(0);
}

bootstrap(program.opts()).catch(console.error)
