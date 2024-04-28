import env
import argparse

from apryse_sdk.PDFNetPython import PDFNet
from apryse_sdk.PDFNetPython import Convert
from apryse_sdk.PDFNetPython import StructuredOutputModule
from apryse_sdk.PDFNetPython import ExcelOutputOptions


def main(input: str, output: str, config: str) -> None:
    PDFNet.Initialize(env.LICENSE_KEY)
    # PDFNet.AddResourceSearchPath("../../../PDFNetC/Lib/")

    if not StructuredOutputModule.IsModuleAvailable():
        print("Unable to run the sample: PDFTron SDK Structured Output module not available.")
        return

    try:
        print("Converting PDF to Excel")
        Convert.ToExcel(input, output)
        print("Result saved in " + output)
    except Exception as e:
        print("Unable to convert PDF document to Excel, error: " + str(e))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        prog="Schedule WIEIK - Parser",
        usage="python main.py [-h] [--input INPUT] [--config CONFIG] [--output OUTPUT]",
    )
    parser.add_argument("--input", help="Path to the input file")
    parser.add_argument("--config", help="Path to the config file")
    parser.add_argument("--output", help="Path to the output file")
    args = parser.parse_args()

    main(input=args.input, output=args.output, config=args.config)
