import fs from "node:fs";
import path from "node:path";

const sourceRoot = path.resolve(process.argv[2] || process.cwd());
const dataDir = path.join(sourceRoot, "data");
const i18nDir = path.join(dataDir, "i18n");
const baseLocale = "zh-CN";
const targets = {
  en: "en",
  "ja-JP": "ja",
  "ko-KR": "ko",
  "es-ES": "es",
  "fr-FR": "fr"
};

const sourceCopy = {
  title: "晚安诊所",
  description: "一款温馨轻怪谈梦境诊所游戏：回收小动物的噩梦，再把它们送回能面对明天的美梦里。",
  hero: { eyebrow: "午夜梦境修复", title: "晚安诊所" },
  status: { nightPrefix: "第", nightSuffix: "夜", case: "病例", hope: "希望" },
  meters: { warmth: "暖意", nightmares: "噩梦", dust: "梦尘" },
  actions: {
    listen: { label: "倾听", help: "找到真正的愿望", past: "倾听" },
    soothe: { label: "安抚", help: "稳住颤抖的噩梦", past: "安抚" },
    bottle: { label: "收瓶", help: "封存刺人的梦", past: "收瓶" },
    wake: { label: "唤醒", help: "回到明天早晨", past: "唤醒" }
  },
  aria: {
    dreamPatient: "梦境患者",
    currentCritter: "当前梦境小动物",
    dreamChart: "梦境病历",
    choices: "梦境处方选择",
    dreamLog: "梦境日志"
  },
  log: { eyebrow: "梦境日志", title: "今晚修好的梦" },
  language: "语言",
  audio: { on: "声音开", off: "声音关" },
  clinic: {
    startPrompt: "月亮升到窗边时，晚安诊所就开门。",
    open: "开门值夜",
    nextDream: "下一场梦",
    closeNight: "结束今夜",
    restart: "重新开诊",
    nextNight: "开启下一夜",
    readTrace: "阅读梦痕，然后选择最温柔也最有用的修复方式。",
    loadError: "梦境病例加载失败。",
    miss: "{action}还不够适合{name}。噩梦变小了一点，但它仍然露着刺。",
    logSuccess: "{name}：带着一个面向明天的小锚点回家了。",
    logFail: "{name}：一枚噩梦碎片被暂时收进瓶里。",
    dawnReport: "黎明报告",
    quietReport: "安静报告",
    goodCloseTitle: "诊所撑到了清晨",
    hardCloseTitle: "诊所还需要下一个夜晚",
    hopeful: "有希望",
    unfinished: "未完成",
    goodClose: "被修好的梦不会改变现实，但每位患者都带走了一个愿意面对现实的小理由。",
    hardClose: "今晚有些梦太尖了。诊所会把它们的名字留在暖灯下，等下一次再试。",
    warmthAtDawn: "黎明暖意",
    dustGathered: "收集梦尘",
    fragmentsBottled: "封存噩梦碎片",
    birds: "月窗外，第一声鸟鸣已经亮起来。",
    moonWaits: "月亮会多停一会儿，以防还有谁需要灯。"
  }
};

function flatten(value, prefix, output = {}) {
  if (typeof value === "string") {
    output[prefix] = value;
    return output;
  }

  for (const [key, child] of Object.entries(value || {})) {
    flatten(child, `${prefix}:${key}`, output);
  }
  return output;
}

function buildSourceStrings() {
  const cases = JSON.parse(fs.readFileSync(path.join(dataDir, "cases.json"), "utf8"));
  const strings = flatten(sourceCopy, "ui");

  for (const patient of cases.patients) {
    for (const field of ["species", "tone", "intro", "dreamGift", "morningAnchor"]) {
      strings[`case:${patient.id}:${field}`] = patient[field] || "";
    }
    patient.clues.forEach((clue, index) => {
      strings[`case:${patient.id}:clue${index + 1}`] = clue;
    });
  }

  return strings;
}

function readPack(locale) {
  const file = path.join(i18nDir, `${locale}.json`);
  if (!fs.existsSync(file)) return { strings: {}, sources: {} };
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writePack(locale, strings, sources) {
  fs.mkdirSync(i18nDir, { recursive: true });
  const pack = {
    locale,
    sourceLocale: baseLocale,
    generatedAt: new Date().toISOString(),
    strings,
    sources
  };
  fs.writeFileSync(path.join(i18nDir, `${locale}.json`), `${JSON.stringify(pack, null, 2)}\n`, "utf8");
}

function maskPlaceholders(text) {
  const placeholders = [];
  const masked = text.replace(/\{\w+\}/g, (match) => {
    const token = `__GC_PLACEHOLDER_${placeholders.length}__`;
    placeholders.push([token, match]);
    return token;
  });
  return { masked, placeholders };
}

function restorePlaceholders(text, placeholders) {
  let value = text;
  for (const [token, placeholder] of placeholders) {
    value = value.split(token).join(placeholder);
  }
  return value;
}

function usableTranslation(text) {
  const value = String(text || "").trim();
  if (!value) return false;
  if (value.includes("锟")) return false;
  if (/[?]{4,}/.test(value)) return false;
  return true;
}

async function googleTranslate(target, text) {
  const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=" +
    encodeURIComponent(target) + "&dt=t&q=" + encodeURIComponent(text);
  const response = await fetch(url, {
    headers: {
      accept: "application/json,text/plain,*/*",
      "user-agent": "Mozilla/5.0"
    },
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) return "";
  const data = await response.json();
  return Array.isArray(data?.[0])
    ? data[0].map((part) => Array.isArray(part) ? part[0] : "").join("")
    : "";
}

async function myMemoryTranslate(target, text) {
  const url = "https://api.mymemory.translated.net/get?q=" +
    encodeURIComponent(text) + "&langpair=" + encodeURIComponent(`zh-CN|${target}`);
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "Mozilla/5.0"
    },
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) return "";
  const data = await response.json();
  return data?.responseData?.translatedText || "";
}

async function translate(target, text) {
  const { masked, placeholders } = maskPlaceholders(text);
  for (const provider of [googleTranslate, myMemoryTranslate]) {
    try {
      const translated = restorePlaceholders(await provider(target, masked), placeholders);
      if (usableTranslation(translated)) return translated;
    } catch (error) {}
  }
  return text;
}

function chunkEntries(entries, maxLength = 2800) {
  const chunks = [];
  let current = [];
  let length = 0;

  for (const entry of entries) {
    const nextLength = entry[1].length + 32;
    if (current.length && length + nextLength > maxLength) {
      chunks.push(current);
      current = [];
      length = 0;
    }
    current.push(entry);
    length += nextLength;
  }

  if (current.length) chunks.push(current);
  return chunks;
}

async function translateChunk(target, entries) {
  const source = entries.map(([, text], index) => `<<<GC${index}>>>\n${maskPlaceholders(text).masked}`).join("\n");
  const translated = await googleTranslate(target, source);
  if (!usableTranslation(translated)) return new Map();

  const result = new Map();
  for (let index = 0; index < entries.length; index += 1) {
    const marker = `<<<GC${index}>>>`;
    const nextMarker = `<<<GC${index + 1}>>>`;
    const start = translated.indexOf(marker);
    if (start === -1) continue;
    const contentStart = start + marker.length;
    const end = index + 1 < entries.length ? translated.indexOf(nextMarker, contentStart) : translated.length;
    const raw = translated.slice(contentStart, end === -1 ? translated.length : end).trim();
    const [, sourceText] = entries[index];
    const { placeholders } = maskPlaceholders(sourceText);
    result.set(entries[index][0], restorePlaceholders(raw, placeholders));
  }
  return result;
}

async function buildTargetPack(locale, target, sources) {
  const previous = readPack(locale);
  const strings = {};
  let translatedCount = 0;
  let reusedCount = 0;
  const missing = [];

  for (const [key, text] of Object.entries(sources)) {
    if (previous.sources?.[key] === text && previous.strings?.[key]) {
      strings[key] = previous.strings[key];
      reusedCount += 1;
    } else {
      missing.push([key, text]);
    }
  }

  for (const chunk of chunkEntries(missing)) {
    let translated = new Map();
    try {
      translated = await translateChunk(target, chunk);
    } catch (error) {}

    for (const [key, text] of chunk) {
      strings[key] = translated.get(key) || previous.strings?.[key] || text;
      translatedCount += 1;
    }
  }

  writePack(locale, strings, sources);
  console.log(`Built ${locale}: ${translatedCount} translated, ${reusedCount} reused`);
}

const sources = buildSourceStrings();
writePack(baseLocale, sources, sources);
for (const [locale, target] of Object.entries(targets)) {
  await buildTargetPack(locale, target, sources);
}
