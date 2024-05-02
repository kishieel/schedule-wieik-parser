# :school: Schedule WIEIK - Parser

This is a simple parser for the schedule of the Faculty of Electrical and Computer Engineering at Cracow University of Technology.
It aims to provide a simple way to get the schedule in the JSON format compliant with [Schedule WIEIK](https://github.com/SorrowOfMind/schedule-wieik) application.

### :wrench: Installation

You can install the parser globally using following commands.
The parser depends on the quite heavy Apryse packages, so it may take a while to install.

```bash
npm config set @kishieel:registry "https://npm.pkg.github.com/"
npm config set //npm.pkg.github.com/:_authToken <your-github-token>

npm install -g @kisielk/schedule-wieik-parser
```

### :rocket: Usage

#### PDF to JSON

In the most optimistic scenario, when the PDF schedule is well formatted and can be easily converted to XLSX, you can use the following command to get the JSON schedule:

```bash
schedule-wieik-parser pdf-to-json --input <path-to-pdf> --output <path-to-json> --config <path-to-config> --license <apryse-license-key>
```

Example usage:

```bash
schedule-wieik-parser pdf-to-json \
  --input ./schedule.pdf \
  --output ./schedule.json \
  --config ./config.yaml \
  --license demo:XXXX:YYYY
```

#### PDF to XLSX

In some cases the PDF schedule will be malformed.
The parser will still be able to convert it to XLSX, but the result may not be able to be parsed and converted to JSON correctly.
In this case, you can use the following command to convert the PDF schedule to XLSX, manually fix the issues and then convert it to JSON:

```bash
schedule-wieik-parser pdf-to-xlsx --input <path-to-pdf> --output <path-to-xlsx> --license <apryse-license-key>
```

Example usage:

```bash
schedule-wieik-parser pdf-to-xlsx \
  --input ./schedule.pdf \
  --output ./schedule.xlsx \
  --license demo:XXXX:YYYY
```

#### XLSX to JSON

After you have fixed the XLSX schedule, you can convert it to JSON using the following command:

```bash
schedule-wieik-parser xlsx-to-json --input <path-to-xlsx> --output <path-to-json> --config <path-to-config>
```

Example usage:

```bash
schedule-wieik-parser xlsx-to-json \
  --input ./schedule.xlsx \
  --output ./schedule.json \
  --config ./config.yaml
```

### 🧮 Configuration

This parser performs the conversion of the schedule based on the configuration file in the YAML format.
In the configuration file you have to provide the following information about the schedule:

- date of the first lecture in 'YYYY-MM-DD' format
- names of the lectures with corresponding IDs
- names of the lecturers
- groups with corresponding types
- rooms

All the values except the date of the first lecture, groups types and lectures IDs support regular expressions.

Example configuration file:

```yaml
dateOfFirstLecture: '2024-03-02'
lectures:
  - name: 'SG'
    id: 1
  - name: 'SW'
    id: 2
  - name: 'TI'
    id: 3
  - name: 'PSC'
    id: 4
lecturers:
  - 'dr.*'
  - 'mgr.*'
  - 'inż.*'
groups:
  - type: 'w'
    set: [ 'W' ]
  - type: 'p'
    set: [ 'P1', 'P2' ]
  - type: 'lk'
    set: [ 'LK1', 'LK2' ]
  - type: 'l'
    set: [ 'L1', 'L2', 'L3' ]
rooms:
  - 'MS Teams'
  - 's\..*'
```

### ⚠️ Caveats

#### Apryse License Key

This parser uses the [Apryse](https://apryse.com) solutions to convert the PDF file to XLSX, which is later used to parse the schedule.
The Apryse packages are closed-source and require a trial key to work. You can get a trial key [here](https://docs.apryse.com/documentation/web/get-started/#get-a-trial-key).
The trial key is valid forever and there is no need to provide any payment information.
