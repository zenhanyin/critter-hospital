import fs from "node:fs";
import path from "node:path";

const sourceRoot = path.resolve(process.argv[2] || process.cwd());
const dataDir = path.join(sourceRoot, "data");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }

  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((cells) => cells.some((value) => value.trim() !== ""));
}

function rowToObject(headers, values) {
  return Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
}

function buildCases() {
  const csvPath = path.join(dataDir, "cases.csv");
  const csv = fs.readFileSync(csvPath, "utf8");
  const [headers, ...rows] = parseCsv(csv);
  const patients = rows.map((row) => {
    const item = rowToObject(headers, row);
    return {
      id: item.id,
      name: item.name,
      species: item.species,
      tone: item.tone,
      color: item.color,
      mist: item.mist,
      intro: item.intro,
      clues: [item.clue_1, item.clue_2, item.clue_3].filter(Boolean),
      need: item.need,
      dreamGift: item.dream_gift,
      morningAnchor: item.morning_anchor
    };
  });

  const config = {
    nights: 3,
    casesPerNight: 5,
    patients
  };
  fs.writeFileSync(path.join(dataDir, "cases.json"), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

buildCases();
