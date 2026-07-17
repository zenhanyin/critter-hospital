const state = {
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
  cases: [],
  config: null
};

const actions = {
  listen: "Listen",
  soothe: "Soothe",
  bottle: "Bottle",
  wake: "Wake"
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
  audioToggle: document.querySelector("#audioToggle")
};

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

async function loadCases() {
  const response = await fetch("./data/cases.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load dream cases.");
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

function currentCase() {
  return state.cases[state.caseIndex];
}

function renderCase() {
  const patient = currentCase();
  if (!patient) {
    endNight();
    return;
  }

  el.patientSprite.style.setProperty("--sprite-color", patient.color);
  el.dreamMist.className = `dream-mist ${patient.mist}`;
  el.patientSpecies.textContent = patient.species;
  el.patientName.textContent = patient.name;
  el.toneBadge.textContent = patient.tone;
  el.caseIntro.textContent = patient.intro;
  el.clueList.innerHTML = patient.clues.map((clue) => `<li>${clue}</li>`).join("");
  el.resultPanel.className = "result-panel";
  el.resultPanel.textContent = "Read the dream traces, then choose the gentlest useful repair.";
  el.nextButton.textContent = "Next dream";
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
    el.resultPanel.textContent = `${patient.dreamGift} ${patient.morningAnchor}`;
  } else {
    playSfx("mistake");
    state.nightmares += 1;
    state.warmth = Math.max(0, state.warmth - 18);
    state.hope = Math.max(0, state.hope - 1);
    el.resultPanel.className = "result-panel is-hard";
    el.resultPanel.textContent = `${actions[action]} was not enough for ${patient.name}. The nightmare is smaller now, but it still has teeth.`;
  }

  const logItem = document.createElement("li");
  logItem.textContent = `${patient.name}: ${success ? "sent home with a morning anchor" : "nightmare fragment kept for later"}.`;
  el.dreamLog.prepend(logItem);
  updateMeters();
  el.nextButton.textContent = state.caseIndex + 1 >= state.config.casesPerNight ? "Close night" : "Next dream";
}

function endNight() {
  playSfx("closeNight");
  startMusic("dawnReport");
  state.finished = true;
  state.locked = true;
  setChoiceDisabled(true);
  const gentleClose = state.warmth >= 45 && state.hope > 0;
  el.patientSpecies.textContent = gentleClose ? "Dawn report" : "Quiet report";
  el.patientName.textContent = gentleClose ? "The clinic made it to morning" : "The clinic needs another night";
  el.toneBadge.textContent = gentleClose ? "hopeful" : "unfinished";
  el.caseIntro.textContent = gentleClose
    ? "The repaired dreams will not change reality, but each patient left with one small reason to meet it."
    : "Some dreams were too sharp tonight. The clinic keeps their names warm until they can try again.";
  el.clueList.innerHTML = [
    `<li>Warmth at dawn: ${state.warmth}</li>`,
    `<li>Dream dust gathered: ${state.dust}</li>`,
    `<li>Nightmare fragments bottled: ${state.nightmares}</li>`
  ].join("");
  el.resultPanel.className = gentleClose ? "result-panel is-good" : "result-panel is-hard";
  el.resultPanel.textContent = gentleClose
    ? "The first birds are singing outside the moon window."
    : "The moon stays a little longer, just in case.";
  el.nextButton.textContent = state.night >= state.config.nights ? "Restart clinic" : "Open next night";
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

document.querySelectorAll(".choice-button").forEach((button) => {
  button.addEventListener("click", () => {
    playSfx("choice");
    chooseAction(button.dataset.action);
  });
});

el.nextButton.addEventListener("click", nextStep);
el.audioToggle.addEventListener("click", () => {
  state.audioEnabled = !state.audioEnabled;
  el.audioToggle.setAttribute("aria-pressed", String(state.audioEnabled));
  el.audioToggle.textContent = state.audioEnabled ? "Sound on" : "Sound off";
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
  })
  .catch((error) => {
    el.resultPanel.className = "result-panel is-hard";
    el.resultPanel.textContent = error.message;
  });
