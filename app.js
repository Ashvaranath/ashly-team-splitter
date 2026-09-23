const MAX_NAME = 10;
const MIN_RATING = 1;
const MAX_RATING = 5;
const DEFAULT_RATING = 3;
const MAX_KEEPERS = 2;

const SPORTS = [
  {
    id: "football",
    name: "Football",
    icon: `<img src="icons/football.png" alt="">`,
    keeperCode: "GK",
    keeperWarning: "Already 2 Goal keepers are selected",
    categories: [
      { code: "GK", label: "Goal Keeper" },
      { code: "D", label: "Defender" },
      { code: "M", label: "Mid field" },
      { code: "F", label: "Forward" },
    ],
  },
  {
    id: "cricket",
    name: "Cricket",
    icon: `<img src="icons/cricket.png" alt="">`,
    keeperCode: "WK",
    keeperWarning: "Already 2 Wicket keepers are selected",
    categories: [
      { code: "WK", label: "WicketKeeper" },
      { code: "BT", label: "Batsmen" },
      { code: "BL", label: "Bowler" },
      { code: "AL", label: "Alrounder" },
    ],
  },
  {
    id: "volleyball",
    name: "Volleyball",
    icon: `<img src="icons/volleyball.png" alt="">`,
    keeperCode: null,
    keeperWarning: "",
    categories: [
      { code: "SM", label: "Smasher" },
      { code: "ST", label: "Setter" },
    ],
  },
  {
    id: "badminton",
    name: "Badminton",
    icon: `<img src="icons/badminton.png" alt="">`,
    keeperCode: null,
    keeperWarning: "",
    categories: [],
  },
];

let selectedSport = SPORTS[0];

function currentCategories() {
  return selectedSport.categories;
}

function currentCodes() {
  return currentCategories().map((item) => item.code);
}

function positionKeys() {
  return [...currentCodes(), "none"];
}

function categoryLabel(code) {
  const match = currentCategories().find((item) => item.code === code);
  return match ? match.label : code;
}

const listEl = document.getElementById("playerList");
const warningEl = document.getElementById("warning");
const resultEl = document.getElementById("result");
const splitButton = document.getElementById("splitTeam");

let nextId = 1;
const players = [];
let warningTimer = null;

function showWarning(message) {
  warningEl.textContent = message;
  warningEl.hidden = false;
  clearTimeout(warningTimer);
  warningTimer = setTimeout(() => {
    warningEl.hidden = true;
  }, 3000);
}

function keeperCount(excludeId) {
  const code = selectedSport.keeperCode;
  if (!code) return 0;
  return players.filter((p) => p.pos === code && p.id !== excludeId).length;
}

function updateChips(player) {
  const showAll = player.row.classList.contains("focused");
  player.chips.forEach((chip) => {
    const selected = player.pos === chip.dataset.pos;
    chip.classList.toggle("selected", selected);
    chip.setAttribute("aria-pressed", String(selected));
    chip.hidden = !showAll && !selected;
  });
  player.positionsEl.hidden =
    currentCodes().length === 0 || (!showAll && player.pos === null);
  player.row.classList.toggle("has-pos", player.pos !== null);
  player.row.dataset.chipCount = String(currentCodes().length);
}

function updateRating(player) {
  player.pips.forEach((pip, index) => {
    pip.classList.toggle("off", index >= player.rating);
  });
  player.valueEl.setAttribute("aria-valuenow", String(player.rating));
  player.valueEl.setAttribute("aria-label", `Rating ${player.rating} of ${MAX_RATING}`);
  player.minusEl.disabled = player.rating <= MIN_RATING;
  player.plusEl.disabled = player.rating >= MAX_RATING;
}

function renumberPlaceholders() {
  players.forEach((player, index) => {
    player.input.placeholder = `player${index + 1}`;
  });
}

function bindChip(player, chip, category) {
  chip.addEventListener("click", () => {
    if (player.pos === category.code) {
      player.pos = null;
    } else {
      if (
        selectedSport.keeperCode &&
        category.code === selectedSport.keeperCode &&
        keeperCount(player.id) >= MAX_KEEPERS
      ) {
        showWarning(selectedSport.keeperWarning);
        return;
      }
      player.pos = category.code;
    }
    updateChips(player);
  });
}

function rebuildChips(player) {
  player.positionsEl.replaceChildren();
  player.chips = currentCategories().map((category) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "pos";
    chip.dataset.pos = category.code;
    chip.textContent = category.code;
    chip.title = category.label;
    bindChip(player, chip, category);
    player.positionsEl.appendChild(chip);
    return chip;
  });
  if (player.pos && !currentCodes().includes(player.pos)) {
    player.pos = null;
  }
  updateChips(player);
}

function applySportChange() {
  players.forEach((player) => {
    player.pos = null;
    rebuildChips(player);
  });
  clearResult();
}

function createPlayer() {
  const player = { id: nextId++, name: "", rating: DEFAULT_RATING, pos: null };

  const row = document.createElement("div");
  row.className = "player-row";

  const nameCell = document.createElement("div");
  nameCell.className = "name-cell";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "name-input";
  input.maxLength = MAX_NAME;
  input.autocomplete = "off";
  input.addEventListener("input", () => {
    player.name = input.value;
  });

  const positionsEl = document.createElement("div");
  positionsEl.className = "positions";
  nameCell.append(input, positionsEl);

  row.addEventListener("focusin", () => {
    row.classList.add("focused");
    updateChips(player);
  });
  row.addEventListener("focusout", (event) => {
    if (row.contains(event.relatedTarget)) return;
    row.classList.remove("focused");
    updateChips(player);
  });

  const rating = document.createElement("div");
  rating.className = "rating";

  const minus = document.createElement("button");
  minus.type = "button";
  minus.textContent = "\u2212";
  minus.setAttribute("aria-label", "Decrease rating");
  minus.addEventListener("click", () => {
    player.rating = Math.max(MIN_RATING, player.rating - 1);
    updateRating(player);
  });

  const value = document.createElement("span");
  value.className = "pips";
  value.setAttribute("role", "meter");
  value.setAttribute("aria-valuemin", String(MIN_RATING));
  value.setAttribute("aria-valuemax", String(MAX_RATING));
  const pips = Array.from({ length: MAX_RATING }, () => {
    const pip = document.createElement("span");
    value.appendChild(pip);
    return pip;
  });

  const plus = document.createElement("button");
  plus.type = "button";
  plus.textContent = "+";
  plus.setAttribute("aria-label", "Increase rating");
  plus.addEventListener("click", () => {
    player.rating = Math.min(MAX_RATING, player.rating + 1);
    updateRating(player);
  });

  rating.append(minus, value, plus);

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "delete";
  remove.textContent = "\u2715";
  remove.setAttribute("aria-label", "Delete player");
  remove.addEventListener("click", () => {
    const index = players.indexOf(player);
    if (index === -1) return;
    players.splice(index, 1);
    row.remove();
    renumberPlaceholders();
  });

  row.append(nameCell, rating, remove);

  Object.assign(player, {
    row,
    input,
    positionsEl,
    chips: [],
    pips,
    valueEl: value,
    minusEl: minus,
    plusEl: plus,
  });

  players.push(player);
  listEl.appendChild(row);

  rebuildChips(player);
  updateRating(player);
  renumberPlaceholders();

  return player;
}

function activePlayers() {
  return players.map((player, index) => ({
    name: player.name.trim() || `Player ${index + 1}`,
    rating: player.rating,
    pos: player.pos,
  }));
}

// Total rating comes first: any split with a smaller overall gap always wins,
// because STRENGTH_PRIORITY outweighs every category term combined. Among the
// splits tied on total rating, the best sharing of each position wins, counting
// both how many players and how much rating each team gets per position.
const STRENGTH_PRIORITY = 100000;
const POSITION_COUNT_WEIGHT = 3;
const POSITION_STRENGTH_WEIGHT = 2;
const KEEPERS_TOGETHER_PENALTY = 1e9;
const EXACT_SEARCH_LIMIT = 20;
const MAX_TIED_SPLITS = 200;
const HEURISTIC_RESTARTS = 12;

// Stages of the close animation, in the order they play.
const CLOSE_SHIVER_MS = 1000;
const CLOSE_CHARGE_MS = 260;
const CLOSE_ABSORB_MS = 450;
const CLOSE_VANISH_MS = 600;

// The reveal runs the same stages backwards: dot grows, then shivers while
// the teams fly out and the button settles back into dark glass.
const REVEAL_GROW_MS = 450;
const REVEAL_SETTLE_MS = 1000;

let animationTimers = [];

// Remembers the pairing on screen so the next split offers a different one.
let lastSplitKey = "";

function positionKey(player) {
  return player.pos || "none";
}

function emptyCategoryMap() {
  const map = { none: 0 };
  currentCodes().forEach((code) => {
    map[code] = 0;
  });
  return map;
}

function countPositions(team) {
  const counts = emptyCategoryMap();
  team.forEach((player) => {
    counts[positionKey(player)] += 1;
  });
  return counts;
}

function strengthByPosition(team) {
  const sums = emptyCategoryMap();
  team.forEach((player) => {
    sums[positionKey(player)] += player.rating;
  });
  return sums;
}

/** flags[i] === 1 puts player i on team B, 0 puts them on team A. */
function scoreFlags(flags, ratings, categories, keeperTotal, keyCount, keeperIndex) {
  let strengthA = 0;
  let strengthB = 0;
  const countA = new Array(keyCount).fill(0);
  const countB = new Array(keyCount).fill(0);
  const catStrengthA = new Array(keyCount).fill(0);
  const catStrengthB = new Array(keyCount).fill(0);

  for (let i = 0; i < flags.length; i++) {
    const category = categories[i];
    const rating = ratings[i];
    if (flags[i]) {
      strengthB += rating;
      countB[category] += 1;
      catStrengthB[category] += rating;
    } else {
      strengthA += rating;
      countA[category] += 1;
      catStrengthA[category] += rating;
    }
  }

  let categoryCost = 0;
  for (let c = 0; c < keyCount; c++) {
    categoryCost += Math.abs(countA[c] - countB[c]) * POSITION_COUNT_WEIGHT;
    categoryCost += Math.abs(catStrengthA[c] - catStrengthB[c]) * POSITION_STRENGTH_WEIGHT;
  }

  let cost = Math.abs(strengthA - strengthB) * STRENGTH_PRIORITY + categoryCost;

  if (
    keeperIndex >= 0 &&
    keeperTotal === MAX_KEEPERS &&
    (countA[keeperIndex] === 0 || countB[keeperIndex] === 0)
  ) {
    cost += KEEPERS_TOGETHER_PENALTY;
  }

  return cost;
}

function teamsFromFlags(squad, flags) {
  const teamA = [];
  const teamB = [];
  squad.forEach((player, index) => {
    (flags[index] ? teamB : teamA).push(player);
  });
  return { teamA, teamB };
}

/**
 * Two flag sets describe the same pairing when one is the other with the team
 * labels swapped, so both normalise to the same key.
 */
function flagsKey(flags) {
  const invert = flags[0] === 1;
  let key = "";
  for (let i = 0; i < flags.length; i++) key += invert ? flags[i] ^ 1 : flags[i];
  return key;
}

/** Tries every legal division; only used for squads small enough to enumerate. */
function exactSplit(squad, sizeA, ratings, categories, keeperTotal, keyCount, keeperIndex) {
  const n = squad.length;
  const flags = new Uint8Array(n);
  const best = [];
  const seen = new Set();
  let bestCost = Infinity;

  for (let mask = 0; mask < 1 << n; mask++) {
    let onB = 0;
    for (let bits = mask; bits; bits &= bits - 1) onB += 1;
    if (n - onB !== sizeA) continue;

    for (let i = 0; i < n; i++) flags[i] = (mask >> i) & 1;

    const cost = scoreFlags(flags, ratings, categories, keeperTotal, keyCount, keeperIndex);
    if (cost > bestCost) continue;
    if (cost < bestCost) {
      bestCost = cost;
      best.length = 0;
      seen.clear();
    }
    const key = flagsKey(flags);
    if (seen.has(key) || best.length >= MAX_TIED_SPLITS) continue;
    seen.add(key);
    best.push(Uint8Array.from(flags));
  }

  return best;
}

/**
 * Greedy start plus swap hill-climbing, for squads too large to enumerate.
 * Each restart shuffles players of equal rating, so repeated runs settle on
 * different arrangements of the same quality.
 */
function heuristicSplit(squad, sizeA, ratings, categories, keeperTotal, keyCount, keeperIndex) {
  const n = squad.length;
  const best = [];
  const seen = new Set();
  let bestCost = Infinity;

  for (let restart = 0; restart < HEURISTIC_RESTARTS; restart++) {
    const flags = new Uint8Array(n).fill(1);
    const order = squad
      .map((player, index) => ({ index, rating: player.rating, tie: Math.random() }))
      .sort((a, b) => b.rating - a.rating || a.tie - b.tie);

    let filled = 0;
    order.forEach((entry, position) => {
      if (position % 2 === 0 && filled < sizeA) {
        flags[entry.index] = 0;
        filled += 1;
      }
    });
    for (let i = 0; i < n && filled < sizeA; i++) {
      if (flags[i]) {
        flags[i] = 0;
        filled += 1;
      }
    }

    let current = scoreFlags(flags, ratings, categories, keeperTotal, keyCount, keeperIndex);
    let improved = true;
    while (improved) {
      improved = false;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (flags[i] === flags[j]) continue;
          flags[i] ^= 1;
          flags[j] ^= 1;
          const candidate = scoreFlags(flags, ratings, categories, keeperTotal, keyCount, keeperIndex);
          if (candidate < current) {
            current = candidate;
            improved = true;
          } else {
            flags[i] ^= 1;
            flags[j] ^= 1;
          }
        }
      }
    }

    if (current > bestCost) continue;
    if (current < bestCost) {
      bestCost = current;
      best.length = 0;
      seen.clear();
    }
    const key = flagsKey(flags);
    if (seen.has(key)) continue;
    seen.add(key);
    best.push(flags);
  }

  return best;
}

/** Prefers a pairing the player has not just seen, so a re-split looks new. */
function pickSplit(candidates) {
  if (!candidates.length) return null;
  const fresh = candidates.filter((flags) => flagsKey(flags) !== lastSplitKey);
  const pool = fresh.length ? fresh : candidates;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  lastSplitKey = flagsKey(chosen);
  return chosen;
}

/**
 * Splits the squad into two teams whose sizes differ by at most one. Total
 * rating is matched as closely as possible, then each position is shared as
 * evenly as possible in both player count and rating.
 */
function splitTeams(squad) {
  const sizeA = Math.floor(squad.length / 2);
  const keys = positionKeys();
  const keeperCode = selectedSport.keeperCode;
  const keeperIndex = keeperCode ? keys.indexOf(keeperCode) : -1;
  const keeperTotal = keeperCode
    ? squad.filter((player) => player.pos === keeperCode).length
    : 0;
  const ratings = squad.map((player) => player.rating);
  const categories = squad.map((player) => {
    const index = keys.indexOf(positionKey(player));
    return index === -1 ? keys.length - 1 : index;
  });

  const candidates =
    squad.length <= EXACT_SEARCH_LIMIT
      ? exactSplit(squad, sizeA, ratings, categories, keeperTotal, keys.length, keeperIndex)
      : heuristicSplit(squad, sizeA, ratings, categories, keeperTotal, keys.length, keeperIndex);
  const flags = pickSplit(candidates);

  if (!flags) {
    return { teamA: squad.slice(0, sizeA), teamB: squad.slice(sizeA) };
  }

  return teamsFromFlags(squad, flags);
}

function teamMarkup(title, side, team) {
  const strength = team.reduce((sum, p) => sum + p.rating, 0);
  const counts = countPositions(team);
  const catStrength = strengthByPosition(team);
  const breakdown = currentCodes()
    .filter((pos) => counts[pos] > 0)
    .map((pos) => `${pos} ${counts[pos]} (${catStrength[pos]})`)
    .join(" &middot; ");
  const rows = team
    .map((p) => {
      const badge = p.pos ? `<span class="badge ${p.pos}">${p.pos}</span>` : "";
      const width = (p.rating / MAX_RATING) * 100;
      return `<li>${badge}<span>${escapeHtml(p.name)}</span><span class="bar" title="Rating ${p.rating}"><i style="width:${width}%"></i></span></li>`;
    })
    .join("");
  return `
    <div class="team team-${side}">
      <h2>${title}</h2>
      <p class="meta">${team.length} players &middot; strength ${strength}</p>
      ${breakdown ? `<p class="meta positions-meta">${breakdown}</p>` : ""}
      <ul>${rows}</ul>
    </div>`;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
  });
}

function renderResult() {
  const squad = activePlayers();
  if (squad.length < 2) {
    showWarning("Add at least 2 players to split a team");
    return;
  }

  const { teamA, teamB } = splitTeams(squad);
  const strengthA = teamA.reduce((sum, p) => sum + p.rating, 0);
  const strengthB = teamB.reduce((sum, p) => sum + p.rating, 0);
  const gap = Math.abs(strengthA - strengthB);
  const countsA = countPositions(teamA);
  const countsB = countPositions(teamB);
  const catStrengthA = strengthByPosition(teamA);
  const catStrengthB = strengthByPosition(teamB);
  const keys = positionKeys();
  const positionGap = keys.reduce(
    (total, key) =>
      total +
      Math.abs(countsA[key] - countsB[key]) +
      Math.abs(catStrengthA[key] - catStrengthB[key]),
    0
  );

  const strengthNote =
    gap === 0 ? "Equal strength" : `Strength difference of ${gap}`;
  const positionNote =
    positionGap === 0
      ? "every position shared evenly"
      : "positions shared as evenly as the squad allows";
  const note = `${strengthNote} &mdash; ${positionNote}.`;

  resultEl.innerHTML =
    teamMarkup("Team A", "a", teamA) +
    `<button type="button" id="closeResult" class="result-close" aria-label="Close split teams">&#10005;</button>` +
    teamMarkup("Team B", "b", teamB) +
    `<p class="result-note">${note}</p>`;
  resultEl.hidden = false;
  legendEl.hidden = true;
  splitButton.disabled = true;
  revealResultWithAnimation();
  resultEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function queueStage(step, delay) {
  animationTimers.push(window.setTimeout(step, delay));
}

function stopStages() {
  animationTimers.forEach(window.clearTimeout);
  animationTimers = [];
}

/** Reverse of the close: a white dot grows, shivers, and spits out the teams. */
function revealResultWithAnimation() {
  const button = resultEl.querySelector("#closeResult");
  if (!button) return;

  stopStages();
  resultEl.classList.add("is-revealing");
  button.classList.add("is-seed");
  void button.offsetWidth;
  button.classList.add("is-grown");

  queueStage(() => {
    button.classList.remove("is-seed", "is-grown");
    button.classList.add("is-settling", "is-shivering");
    resultEl.classList.add("is-emerging");

    queueStage(() => {
      button.classList.remove("is-settling", "is-shivering");
      resultEl.classList.remove("is-revealing", "is-emerging");
    }, REVEAL_SETTLE_MS);
  }, REVEAL_GROW_MS);
}

function clearResult() {
  stopStages();
  resultEl.classList.remove("is-closing", "is-absorbing", "is-revealing", "is-emerging");
  resultEl.hidden = true;
  resultEl.innerHTML = "";
  splitButton.disabled = false;
  renderLegend();
}

/** Shiver, flash white, pull both team cards into the button, then fade out. */
function closeResultWithAnimation(button) {
  if (resultEl.classList.contains("is-closing")) return;

  stopStages();
  resultEl.classList.remove("is-revealing", "is-emerging");
  button.classList.remove("is-seed", "is-grown", "is-settling");
  resultEl.classList.add("is-closing");
  button.classList.add("is-shivering");

  queueStage(() => {
    button.classList.remove("is-shivering");
    button.classList.add("is-charged");

    queueStage(() => {
      resultEl.classList.add("is-absorbing");

      queueStage(() => {
        button.classList.add("is-vanishing");
        queueStage(clearResult, CLOSE_VANISH_MS);
      }, CLOSE_ABSORB_MS);
    }, CLOSE_CHARGE_MS);
  }, CLOSE_SHIVER_MS);
}

const sportSelect = document.getElementById("sportSelect");
const sportTrigger = document.getElementById("sportTrigger");
const sportMenu = document.getElementById("sportMenu");
const sportIcon = document.getElementById("sportIcon");
const sportLabel = document.getElementById("sportLabel");
const legendEl = document.getElementById("legend");

function renderLegend() {
  const cats = currentCategories();
  if (!cats.length) {
    legendEl.innerHTML = "";
    legendEl.hidden = true;
    return;
  }
  legendEl.hidden = false;
  legendEl.innerHTML = cats
    .map(
      (item) =>
        `<div class="legend-row"><span class="pos selected" data-pos="${item.code}">${item.code}</span><span class="legend-text">${item.label}</span></div>`
    )
    .join("");
}

function renderSportTrigger() {
  sportIcon.innerHTML = selectedSport.icon;
  sportLabel.textContent = selectedSport.name;
}

function closeSportMenu() {
  sportSelect.classList.remove("open");
  sportTrigger.setAttribute("aria-expanded", "false");
  sportMenu.hidden = true;
}

function openSportMenu() {
  sportSelect.classList.add("open");
  sportTrigger.setAttribute("aria-expanded", "true");
  sportMenu.hidden = false;
}

SPORTS.forEach((sport) => {
  const item = document.createElement("li");
  const option = document.createElement("button");
  option.type = "button";
  option.className = "sport-option";
  option.role = "option";
  option.dataset.id = sport.id;
  option.innerHTML = `<span class="sport-icon">${sport.icon}</span><span>${sport.name}</span>`;
  option.addEventListener("click", () => {
    selectedSport = sport;
    sportMenu.querySelectorAll(".sport-option").forEach((btn) => {
      btn.setAttribute("aria-selected", String(btn.dataset.id === sport.id));
    });
    renderSportTrigger();
    applySportChange();
    closeSportMenu();
  });
  item.appendChild(option);
  sportMenu.appendChild(item);
});

sportMenu.querySelector(`[data-id="${selectedSport.id}"]`).setAttribute("aria-selected", "true");
renderSportTrigger();
renderLegend();

sportTrigger.addEventListener("click", (event) => {
  event.stopPropagation();
  if (sportMenu.hidden) openSportMenu();
  else closeSportMenu();
});

document.addEventListener("click", (event) => {
  if (!sportSelect.contains(event.target)) closeSportMenu();
});

const avatarButton = document.getElementById("avatarButton");
const photoOverlay = document.getElementById("photoOverlay");

avatarButton.addEventListener("click", () => {
  photoOverlay.hidden = false;
});

photoOverlay.addEventListener("click", (event) => {
  if (event.target === photoOverlay) photoOverlay.hidden = true;
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") photoOverlay.hidden = true;
});

document.getElementById("addPlayer").addEventListener("click", () => {
  const player = createPlayer();
  player.input.focus();
});
splitButton.addEventListener("click", renderResult);
resultEl.addEventListener("click", (event) => {
  const closeButton = event.target.closest("#closeResult");
  if (closeButton) closeResultWithAnimation(closeButton);
});

createPlayer();
createPlayer();
