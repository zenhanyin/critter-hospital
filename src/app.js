const BASE_LOCALE = "zh-CN";
const TRANSLATED_LOCALES = new Set(["en", "ja-JP", "ko-KR", "es-ES", "fr-FR"]);

const state = {
  locale: BASE_LOCALE,
  night: 1,
  caseIndex: 0,
  warmth: 80,
  nightmares: 0,
  dust: 0,
  hope: 3,
  audioEnabled: false,
  audio: null,
  music: null,
  locked: true,
  finished: false,
  lastGentleClose: true,
  cases: [],
  config: null
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

const el = {
  nightValue: document.querySelector("#nightValue"),
  caseValue: document.querySelector("#caseValue"),
  caseTotal: document.querySelector("#caseTotal"),
  hopeValue: document.querySelector("#hopeValue"),
  warmthValue: document.querySelector("#warmthValue"),
  nightmareValue: document.querySelector("#nightmareValue"),
  dustValue: document.querySelector("#dustValue"),
  patientSprite: document.querySelector("#patientSprite"),
  dreamMist: document.querySelector("#dreamMist"),
  patientSpecies: document.querySelector("#patientSpecies"),
  patientName: document.querySelector("#patientName"),
  toneBadge: document.querySelector("#toneBadge"),
  caseIntro: document.querySelector("#caseIntro"),
  clueList: document.querySelector("#clueList"),
  resultPanel: document.querySelector("#resultPanel"),
  nextButton: document.querySelector("#nextButton"),
  dreamLog: document.querySelector("#dreamLog"),
  languageSelect: document.querySelector("#languageSelect"),
  audioToggle: document.querySelector("#audioToggle")
};

const translationCache = new Map();
const translationPending = new Set();

function copyAt(path) {
  return path.split(".").reduce((value, key) => value?.[key], sourceCopy) || path;
}

function cacheKey(locale, key, text) {
  return `goodnight-clinic:${locale}:${key}:${text}`;
}

function readCachedTranslation(key) {
  try {
    return window.localStorage?.getItem(key) || "";
  } catch (error) {
    return "";
  }
}

function writeCachedTranslation(key, value) {
  try {
    window.localStorage?.setItem(key, value);
  } catch (error) {}
}

function requestRerender() {
  window.clearTimeout(requestRerender.timer);
  requestRerender.timer = window.setTimeout(renderCurrentView, 40);
}

function translateText(text, key) {
  const source = String(text || "");
  if (!source || state.locale === BASE_LOCALE || !TRANSLATED_LOCALES.has(state.locale)) return source;
  const keyName = cacheKey(state.locale, key, source);
  if (translationCache.has(keyName)) return translationCache.get(keyName);
  const stored = readCachedTranslation(keyName);
  if (stored) {
    translationCache.set(keyName, stored);
    return stored;
  }
  queueTranslation(state.locale, source, keyName);
  return source;
}

function queueTranslation(locale, text, keyName) {
  if (translationPending.has(keyName)) return;
  translationPending.add(keyName);
  fetch("/api/translate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ lang: locale, text })
  })
    .then((response) => response.ok ? response.json() : Promise.reject(new Error("translation failed")))
    .then((data) => {
      const translated = String(data?.text || "").trim();
      if (!translated) throw new Error("empty translation");
      translationCache.set(keyName, translated);
      writeCachedTranslation(keyName, translated);
      if (locale === state.locale) requestRerender();
    })
    .catch(() => {
      translationCache.set(keyName, text);
    })
    .finally(() => {
      translationPending.delete(keyName);
    });
}

function t(path) {
  return translateText(copyAt(path), `ui:${path}`);
}

function format(template, values) {
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "");
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function patientText(patient, field) {
  const value = patient[field] || "";
  if (field === "name") return value;
  return translateText(value, `case:${patient.id}:${field}`);
}

function patientClues(patient) {
  return patient.clues.map((clue, index) => translateText(clue, `case:${patient.id}:clue${index + 1}`));
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

async function loadCases() {
  const response = await fetch("./data/cases.json", { cache: "no-store" });
  if (!response.ok) throw new Error(t("clinic.loadError"));
  state.config = await response.json();
  el.caseTotal.textContent = state.config.casesPerNight;
}

async function loadAudioConfig() {
  const response = await fetch("./data/audio.json", { cache: "no-store" });
  if (!response.ok) return;
  state.audio = await response.json();
}

function soundSource(kind, key) {
  return state.audio?.[kind]?.[key]?.src || "";
}

function playSfx(key) {
  if (!state.audioEnabled) return;
  const src = soundSource("sfx", key);
  if (!src) return;
  const audio = new Audio(src);
  audio.volume = 0.55;
  audio.play().catch(() => {});
}

function startMusic(key) {
  if (!state.audioEnabled) return;
  const src = soundSource("music", key);
  if (!src) return;
  if (state.music) {
    state.music.pause();
    state.music = null;
  }
  state.music = new Audio(src);
  state.music.loop = true;
  state.music.volume = 0.32;
  state.music.play().catch(() => {});
}

function setChoiceDisabled(disabled) {
  document.querySelectorAll(".choice-button").forEach((button) => {
    button.disabled = disabled;
  });
}

function updateMeters() {
  el.nightValue.textContent = state.night;
  el.caseValue.textContent = Math.min(state.caseIndex + 1, state.config.casesPerNight);
  el.caseTotal.textContent = state.config.casesPerNight;
  el.hopeValue.textContent = state.hope;
  el.warmthValue.textContent = state.warmth;
  el.nightmareValue.textContent = state.nightmares;
  el.dustValue.textContent = state.dust;
}

function applyStaticCopy() {
  document.documentElement.lang = state.locale;
  document.title = t("title");
  document.querySelector("#pageDescription")?.setAttribute("content", t("description"));
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((node) => {
    node.setAttribute("aria-label", t(node.dataset.i18nAria));
  });
  el.languageSelect.setAttribute("aria-label", t("language"));
  el.audioToggle.textContent = state.audioEnabled ? t("audio.on") : t("audio.off");
}

function currentCase() {
  return state.cases[state.caseIndex];
}

function renderCase() {
  const patient = currentCase();
  if (!patient) {
    finishNight();
    return;
  }

  el.patientSprite.style.setProperty("--sprite-color", patient.color);
  el.dreamMist.className = `dream-mist ${patient.mist}`;
  el.patientSpecies.textContent = patientText(patient, "species");
  el.patientName.textContent = patientText(patient, "name");
  el.toneBadge.textContent = patientText(patient, "tone");
  el.caseIntro.textContent = patientText(patient, "intro");
  el.clueList.innerHTML = patientClues(patient).map((clue) => `<li>${escapeHtml(clue)}</li>`).join("");
  el.resultPanel.className = "result-panel";
  el.resultPanel.textContent = t("clinic.readTrace");
  el.nextButton.textContent = t("clinic.nextDream");
  state.locked = false;
  setChoiceDisabled(false);
  updateMeters();
}

function startNight() {
  playSfx("openClinic");
  startMusic("clinicNight");
  state.cases = shuffle(state.config.patients).slice(0, state.config.casesPerNight);
  state.caseIndex = 0;
  state.warmth = 80;
  state.nightmares = 0;
  state.dust = 0;
  state.hope = 3;
  state.finished = false;
  state.locked = false;
  el.dreamLog.innerHTML = "";
  renderCase();
}

function chooseAction(action) {
  if (state.locked || state.finished) return;
  const patient = currentCase();
  const success = action === patient.need;
  state.locked = true;
  setChoiceDisabled(true);

  if (success) {
    playSfx("success");
    state.dust += 2;
    state.warmth = Math.min(100, state.warmth + 6);
    state.hope += 1;
    el.resultPanel.className = "result-panel is-good";
    el.resultPanel.textContent = `${patientText(patient, "dreamGift")} ${patientText(patient, "morningAnchor")}`;
  } else {
    playSfx("mistake");
    state.nightmares += 1;
    state.warmth = Math.max(0, state.warmth - 18);
    state.hope = Math.max(0, state.hope - 1);
    el.resultPanel.className = "result-panel is-hard";
    el.resultPanel.textContent = format(t("clinic.miss"), {
      action: t(`actions.${action}.past`),
      name: patientText(patient, "name")
    });
  }

  const logItem = document.createElement("li");
  logItem.dataset.caseId = patient.id;
  logItem.dataset.success = String(success);
  logItem.textContent = logText(patient, success);
  el.dreamLog.prepend(logItem);
  updateMeters();
  el.nextButton.textContent = state.caseIndex + 1 >= state.config.casesPerNight ? t("clinic.closeNight") : t("clinic.nextDream");
}

function logText(patient, success) {
  return format(success ? t("clinic.logSuccess") : t("clinic.logFail"), {
    name: patientText(patient, "name")
  });
}

function renderDreamLog() {
  el.dreamLog.querySelectorAll("li").forEach((item) => {
    const patient = state.cases.find((entry) => entry.id === item.dataset.caseId);
    if (patient) item.textContent = logText(patient, item.dataset.success === "true");
  });
}

function renderSummary() {
  const gentleClose = state.lastGentleClose;
  el.patientSpecies.textContent = gentleClose ? t("clinic.dawnReport") : t("clinic.quietReport");
  el.patientName.textContent = gentleClose ? t("clinic.goodCloseTitle") : t("clinic.hardCloseTitle");
  el.toneBadge.textContent = gentleClose ? t("clinic.hopeful") : t("clinic.unfinished");
  el.caseIntro.textContent = gentleClose ? t("clinic.goodClose") : t("clinic.hardClose");
  el.clueList.innerHTML = [
    `<li>${escapeHtml(t("clinic.warmthAtDawn"))}: ${state.warmth}</li>`,
    `<li>${escapeHtml(t("clinic.dustGathered"))}: ${state.dust}</li>`,
    `<li>${escapeHtml(t("clinic.fragmentsBottled"))}: ${state.nightmares}</li>`
  ].join("");
  el.resultPanel.className = gentleClose ? "result-panel is-good" : "result-panel is-hard";
  el.resultPanel.textContent = gentleClose ? t("clinic.birds") : t("clinic.moonWaits");
  el.nextButton.textContent = state.night > state.config.nights ? t("clinic.restart") : t("clinic.nextNight");
}

function finishNight() {
  playSfx("closeNight");
  startMusic("dawnReport");
  state.finished = true;
  state.locked = true;
  setChoiceDisabled(true);
  state.lastGentleClose = state.warmth >= 45 && state.hope > 0;
  renderSummary();
  state.night = state.night >= state.config.nights ? 1 : state.night + 1;
}

function nextStep() {
  if (state.finished || state.cases.length === 0) {
    startNight();
    return;
  }
  if (!state.locked) return;
  state.caseIndex += 1;
  renderCase();
}

function renderCurrentView() {
  applyStaticCopy();
  renderDreamLog();
  if (state.finished) {
    renderSummary();
  } else if (state.cases.length) {
    renderCase();
  } else {
    el.resultPanel.textContent = t("clinic.startPrompt");
    el.nextButton.textContent = t("clinic.open");
  }
}

document.querySelectorAll(".choice-button").forEach((button) => {
  button.addEventListener("click", () => {
    playSfx("choice");
    chooseAction(button.dataset.action);
  });
});

el.nextButton.addEventListener("click", nextStep);
el.languageSelect.addEventListener("change", () => {
  state.locale = el.languageSelect.value || BASE_LOCALE;
  renderCurrentView();
});
el.audioToggle.addEventListener("click", () => {
  state.audioEnabled = !state.audioEnabled;
  el.audioToggle.setAttribute("aria-pressed", String(state.audioEnabled));
  el.audioToggle.textContent = state.audioEnabled ? t("audio.on") : t("audio.off");
  if (state.audioEnabled && state.cases.length) {
    startMusic(state.finished ? "dawnReport" : "clinicNight");
  } else if (state.music) {
    state.music.pause();
  }
});

Promise.all([loadCases(), loadAudioConfig()])
  .then(() => {
    setChoiceDisabled(true);
    updateMeters();
    renderCurrentView();
  })
  .catch((error) => {
    el.resultPanel.className = "result-panel is-hard";
    el.resultPanel.textContent = error.message;
  });
