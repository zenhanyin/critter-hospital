import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const sourceRoot = new URL("../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const csvPath = `${sourceRoot}data/cases.csv`;
const outputPath = `${sourceRoot}data/cases.xlsx`;
const csvText = await fs.readFile(csvPath, "utf8");

const workbook = await Workbook.fromCSV(csvText, { sheetName: "Cases" });
const sheet = workbook.worksheets.getItem("Cases");
sheet.showGridLines = false;
sheet.freezePanes.freezeRows(1);

const used = sheet.getUsedRange(true);
used.format.font = { name: "Aptos", size: 10, color: "#1F2937" };
used.format.wrapText = true;
used.format.borders = {
  insideHorizontal: { style: "thin", color: "#E5E7EB" },
  top: { style: "thin", color: "#D1D5DB" },
  bottom: { style: "thin", color: "#D1D5DB" }
};

const header = sheet.getRange("A1:M1");
header.format = {
  fill: "#172033",
  font: { bold: true, color: "#FFF7EA" },
  wrapText: true
};

sheet.getRange("A:A").format.columnWidth = 24;
sheet.getRange("B:C").format.columnWidth = 16;
sheet.getRange("D:D").format.columnWidth = 18;
sheet.getRange("E:G").format.columnWidth = 13;
sheet.getRange("H:M").format.columnWidth = 42;
sheet.getRange("1:1").format.rowHeight = 28;
sheet.getRange("2:200").format.rowHeight = 64;

sheet.dataValidations.add({
  range: "G2:G200",
  rule: { type: "list", values: ["listen", "soothe", "bottle", "wake"] }
});
sheet.dataValidations.add({
  range: "F2:F200",
  rule: { type: "list", values: ["is-soft", "is-ache", "is-sharp", "is-gift"] }
});

const notes = workbook.worksheets.add("Guide");
notes.showGridLines = false;
notes.getRange("A1:B1").values = [["Field", "How to edit"]];
notes.getRange("A2:B10").values = [
  ["need", "Choose listen, soothe, bottle, or wake. This is the correct player action."],
  ["intro", "The opening dream symptom shown to the player."],
  ["clue_1..3", "Short dream traces that imply the real emotional need."],
  ["dream_gift", "The symbolic dream repair shown on success."],
  ["morning_anchor", "A concrete future-facing action after waking."],
  ["tone", "Small label: soft ache, quiet regret, sky wish, sealed fear, etc."],
  ["color", "Hex color used by the temporary CSS critter."],
  ["mist", "Visual aura class: is-soft, is-ache, is-sharp, is-gift."],
  ["Workflow", "Edit this workbook, export/save as CSV over data/cases.csv, then run the content build."]
];
notes.getRange("A1:B1").format = {
  fill: "#172033",
  font: { bold: true, color: "#FFF7EA" }
};
notes.getRange("A:A").format.columnWidth = 18;
notes.getRange("B:B").format.columnWidth = 72;
notes.getRange("A1:B10").format.wrapText = true;
notes.getRange("A1:B10").format.borders = { preset: "inside", style: "thin", color: "#E5E7EB" };

await workbook.inspect({
  kind: "table",
  range: "Cases!A1:M7",
  include: "values",
  tableMaxRows: 8,
  tableMaxCols: 13
});

const preview = await workbook.render({ sheetName: "Cases", range: "A1:M7", scale: 1, format: "png" });
await fs.writeFile(`${sourceRoot}data/cases-preview.png`, new Uint8Array(await preview.arrayBuffer()));

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);

await fs.rm(`${outputPath}.inspect.ndjson`, { force: true });
