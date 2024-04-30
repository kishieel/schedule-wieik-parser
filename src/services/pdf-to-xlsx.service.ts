import { tmpdir } from 'os';
import { join } from 'path';
import { PDFNet } from '@pdftron/pdfnet-node';
import { randomUUID } from 'crypto';

export class PdfToXlsxService {
    static async convertPdfToXlsx(input: string, license: string, output?: string): Promise<string> {
        return await PDFNet.runWithCleanup(async () => await this.doConvertPdfToXlsx(input, output), license)
            .catch(console.error)
            .finally(() => PDFNet.shutdown());
    }

    protected static async doConvertPdfToXlsx(input: string, maybeOutput?: string): Promise<string> {
        await PDFNet.setColorManagement();
        await PDFNet.setLogLevel(PDFNet.LogLevel.e_LogLevel_Debug);

        if (!(await PDFNet.StructuredOutputModule.isModuleAvailable())) {
            throw new Error('StructuredOutput module is not available');
        }

        const excelOutputOptions = new PDFNet.Convert.ExcelOutputOptions();
        excelOutputOptions.setPages(1, 1);
        excelOutputOptions.setSingleSheet(true);
        excelOutputOptions.setNonTableContent(true);
        excelOutputOptions.setPreferredOCREngine(PDFNet.Convert.OutputOptionsOCR.PreferredOCREngine.e_engine_tesseract);

        const output = maybeOutput || join(tmpdir(), randomUUID() + '.xlsx');
        await PDFNet.Convert.fileToExcel(input, output, excelOutputOptions);

        return output;
    }
}
