const MAX_NAME = 10;
const MIN_RATING = 1;
const MAX_RATING = 5;
const DEFAULT_RATING = 3;
const MAX_KEEPERS = 2;

const SPORTS = [
  {
    id: "football",
    name: "Football",
    iconSrc: "icons/football.png",
    tagline: "Fair squads. Match-ready in seconds.",
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
    iconSrc: "icons/cricket.png",
    tagline: "Balance the batting. Split the sides.",
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
    iconSrc: "icons/volleyball.png",
    tagline: "Even teams. Clean rotations.",
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
    iconSrc: "icons/badminton.png",
    tagline: "Quick pairs. Fair courts.",
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

const listEl = document.getElementById("playerList");
const warningEl = document.getElementById("warning");
const authBannerEl = document.getElementById("authBanner");
const resultEl = document.getElementById("result");
const splitButton = document.getElementById("splitTeam");
const legendEl = document.getElementById("legend");
const watermarkEl = document.getElementById("sportWatermark");
const taglineEl = document.getElementById("sportTagline");
const matchSceneEl = document.getElementById("matchScene");
const impactEl = document.getElementById("footballImpact");
const cricketSceneEl = document.getElementById("cricketScene");
const cricketImpactEl = document.getElementById("cricketImpact");
const volleySceneEl = document.getElementById("volleyScene");
const volleyImpactEl = document.getElementById("volleyImpact");
const badmintonSceneEl = document.getElementById("badmintonScene");
const badmintonImpactEl = document.getElementById("badmintonImpact");

let nextId = 1;
const players = [];
let warningTimer = null;
let authBannerTimer = null;

function showWarning(message) {
  warningEl.classList.remove("is-success");
  warningEl.textContent = message;
  warningEl.hidden = false;
  clearTimeout(warningTimer);
  warningTimer = setTimeout(() => {
    warningEl.hidden = true;
  }, 3000);
}

function showSaveSuccess(message) {
  warningEl.classList.add("is-success");
  warningEl.textContent = message;
  warningEl.hidden = false;
  clearTimeout(warningTimer);
  warningTimer = setTimeout(() => {
    warningEl.hidden = true;
    warningEl.classList.remove("is-success");
  }, 5000);
}

function showAuthBanner(message) {
  if (!authBannerEl) return;
  authBannerEl.textContent = message;
  authBannerEl.hidden = false;
  clearTimeout(authBannerTimer);
  authBannerTimer = setTimeout(() => {
    authBannerEl.hidden = true;
  }, 5000);
}

function keeperCount(excludeId) {
  const code = selectedSport.keeperCode;
  if (!code) return 0;
  return players.filter((p) => p.pos === code && p.id !== excludeId).length;
}

function updateChips(player) {
  const hasCodes = currentCodes().length > 0;
  const open = hasCodes && player.row.classList.contains("pos-open");
  player.chips.forEach((chip) => {
    const selected = player.pos === chip.dataset.pos;
    chip.classList.toggle("selected", selected);
    chip.setAttribute("aria-pressed", String(selected));
    chip.hidden = false;
  });
  if (player.positionsEl) player.positionsEl.hidden = !open;
  if (player.posToggle) {
    player.posToggle.hidden = !hasCodes;
    player.posToggle.setAttribute("aria-expanded", String(open));
    player.posToggle.dataset.pos = player.pos || "";
    player.posToggle.classList.toggle("has-selection", Boolean(player.pos));
    if (player.pos) {
      player.posToggle.textContent = player.pos;
      player.posToggle.setAttribute("aria-label", `Position ${player.pos}. Change position`);
    } else {
      player.posToggle.innerHTML = POS_TOGGLE_ICON;
      player.posToggle.setAttribute("aria-label", "Select position");
    }
  }
  player.row.classList.toggle("has-pos", player.pos !== null);
}

function closeOtherPosMenus(exceptPlayer) {
  [players, ratingsPlayers].forEach((pool) => {
    if (!Array.isArray(pool)) return;
    pool.forEach((entry) => {
      if (entry === exceptPlayer || !entry.row?.classList.contains("pos-open")) return;
      entry.row.classList.remove("pos-open");
      updateChips(entry);
    });
  });
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

function updatePlayerListScroll() {
  listEl.classList.toggle("is-scrollable", players.length >= 20);
}

const POS_TOGGLE_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 14l5-5 5 5z"/></svg>';

function bindChip(player, chip, category) {
  chip.addEventListener("click", (event) => {
    event.stopPropagation();
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
    player.row.classList.remove("pos-open");
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

/** Show only the selected sport's scene while no split is on screen. */
function syncSportScenes() {
  matchSceneEl.classList.remove("is-playing");
  cricketSceneEl.classList.remove("is-playing");
  volleySceneEl.classList.remove("is-playing");
  badmintonSceneEl.classList.remove("is-playing");
  matchSceneEl.hidden = selectedSport.id !== "football" || !resultEl.hidden;
  cricketSceneEl.hidden = selectedSport.id !== "cricket" || !resultEl.hidden;
  volleySceneEl.hidden = selectedSport.id !== "volleyball" || !resultEl.hidden;
  badmintonSceneEl.hidden = selectedSport.id !== "badminton" || !resultEl.hidden;
}

function applySportMood() {
  document.body.dataset.sport = selectedSport.id;
  watermarkEl.classList.remove("is-swapping");
  void watermarkEl.offsetWidth;
  watermarkEl.src = selectedSport.iconSrc;
  watermarkEl.classList.add("is-swapping");
  taglineEl.textContent = selectedSport.tagline;
}

function applySportChange() {
  players.forEach((player) => {
    player.pos = null;
    rebuildChips(player);
  });
  applySportMood();
  clearResult();
}

function createPlayer(options = {}) {
  const targetPlayers = options.players || players;
  const targetList = options.listEl || listEl;
  const onChange = options.onChange || null;
  const useMainExtras = !options.players;

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
    if (useMainExtras) updateHeaderSaveButton();
    if (onChange) onChange();
  });

  const posToggle = document.createElement("button");
  posToggle.type = "button";
  posToggle.className = "pos-toggle";
  posToggle.setAttribute("aria-label", "Select position");
  posToggle.setAttribute("aria-expanded", "false");
  posToggle.innerHTML = POS_TOGGLE_ICON;

  const positionsEl = document.createElement("div");
  positionsEl.className = "positions";
  positionsEl.hidden = true;
  nameCell.append(input, posToggle, positionsEl);

  posToggle.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (currentCodes().length === 0) return;
    const willOpen = !row.classList.contains("pos-open");
    closeOtherPosMenus(player);
    row.classList.toggle("pos-open", willOpen);
    updateChips(player);
  });

  row.addEventListener("focusin", () => {
    row.classList.add("focused");
    if (document.activeElement === input) {
      const keepNameVisible = () => {
        input.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
      };
      setTimeout(keepNameVisible, 50);
      setTimeout(keepNameVisible, 350);
    }
  });
  row.addEventListener("focusout", (event) => {
    if (row.contains(event.relatedTarget)) return;
    row.classList.remove("focused");
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
    if (onChange) onChange();
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
    if (onChange) onChange();
  });

  rating.append(minus, value, plus);

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "delete";
  remove.textContent = "\u2715";
  remove.setAttribute("aria-label", "Delete player");
  remove.addEventListener("click", () => {
    const index = targetPlayers.indexOf(player);
    if (index === -1) return;
    targetPlayers.splice(index, 1);
    row.remove();
    targetPlayers.forEach((entry, entryIndex) => {
      entry.input.placeholder = `player${entryIndex + 1}`;
    });
    if (useMainExtras) {
      updatePlayerListScroll();
      renderLegend();
      updateHeaderSaveButton();
    }
    if (onChange) onChange();
  });

  row.append(nameCell, rating, remove);

  Object.assign(player, {
    row,
    input,
    posToggle,
    positionsEl,
    chips: [],
    pips,
    valueEl: value,
    minusEl: minus,
    plusEl: plus,
  });

  targetPlayers.push(player);
  targetList.appendChild(row);

  rebuildChips(player);
  updateRating(player);
  targetPlayers.forEach((entry, entryIndex) => {
    entry.input.placeholder = `player${entryIndex + 1}`;
  });
  if (useMainExtras) {
    updatePlayerListScroll();
    updateHeaderSaveButton();
  }

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

// Football intro: kick → save → ball fills the screen, then show the split.
const FOOTBALL_KICK_MS = 1500;
const FOOTBALL_IMPACT_MS = 1500;
// Cricket intro: run-up → bounce → hit → ball fills the screen.
const CRICKET_HIT_MS = 1700;
const CRICKET_IMPACT_MS = 1500;
// Volleyball intro: serve → over the net → spike → ball fills the screen.
const VOLLEY_SPIKE_MS = 1450;
const VOLLEY_IMPACT_MS = 1500;
const BADMINTON_HIT_MS = 1450;
const BADMINTON_IMPACT_MS = 1500;

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

/**
 * Badminton pairs: two players per team, strongest with weakest so the team
 * totals stay as close as possible. An odd squad leaves the highest-rated
 * player as a team of one.
 */
function splitBadmintonPairs(squad) {
  if (squad.length === 2) {
    return squad.map((player) => [player]);
  }

  const ranked = squad
    .map((player, index) => ({ player, index }))
    .sort((a, b) => b.player.rating - a.player.rating || a.index - b.index)
    .map((entry) => entry.player);

  const pairs = [];
  let pool = ranked;
  let solo = null;
  if (pool.length % 2 === 1) {
    solo = pool[0];
    pool = pool.slice(1);
  }

  const pairCount = pool.length / 2;
  for (let i = 0; i < pairCount; i++) {
    pairs.push([pool[i], pool[pool.length - 1 - i]]);
  }
  return solo ? [...pairs, [solo]] : pairs;
}

function showBadmintonResult(squad) {
  const teams = splitBadmintonPairs(squad);
  const pairStrengths = teams
    .filter((team) => team.length === 2)
    .map((team) => team.reduce((sum, player) => sum + player.rating, 0));
  const pairGap = pairStrengths.length
    ? Math.max(...pairStrengths) - Math.min(...pairStrengths)
    : 0;
  const pairNote =
    pairGap === 0 ? "every pair has equal strength" : `pair strengths differ by ${pairGap}`;
  const note =
    squad.length === 2
      ? "2 teams of 1."
      : squad.length % 2 === 1
        ? `The strongest player stands alone${pairStrengths.length ? ` &mdash; ${pairNote}` : ""}.`
        : `${teams.length} teams of 2 &mdash; ${pairNote}.`;

  resultEl.classList.add("is-pairs");
  resultEl.innerHTML =
    `<button type="button" id="closeResult" class="result-close" aria-label="Close split teams">&#10005;</button>` +
    teams
      .map((team, index) => teamMarkup(`Team ${index + 1}`, index % 2 === 0 ? "a" : "b", team, "team-pair"))
      .join("") +
    `<p class="result-note">${note}</p>`;
  resultEl.hidden = false;
  legendEl.hidden = true;
  splitButton.disabled = true;
  resultEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function teamMarkup(title, side, team, extraClass) {
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
  const classes = extraClass ? `team team-${side} ${extraClass}` : `team team-${side}`;
  return `
    <div class="${classes}">
      <h2>${title}</h2>
      <p class="meta">${team.length === 1 ? "1 player" : `${team.length} players`} &middot; strength ${strength}</p>
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
  const minimum = selectedSport.id === "badminton" ? 1 : 2;
  if (squad.length < minimum) {
    showWarning(
      minimum === 1 ? "Add a player to split teams" : "Add at least 2 players to split a team"
    );
    return;
  }
  if (splitButton.disabled) return;

  if (selectedSport.id === "football") {
    playFootballSplitSequence(squad);
    return;
  }
  if (selectedSport.id === "cricket") {
    playCricketSplitSequence(squad);
    return;
  }
  if (selectedSport.id === "volleyball") {
    playVolleyballSplitSequence(squad);
    return;
  }
  if (selectedSport.id === "badminton") {
    playBadmintonSplitSequence(squad);
    return;
  }

  showSplitResult(squad);
}

function sceneBall() {
  return matchSceneEl.querySelector(".match-ball");
}

function sceneShadow() {
  return matchSceneEl.querySelector(".match-ball-shadow");
}

/** Park the keeper on the save pose, read the glove, then put him back. */
function gloveTarget() {
  const keeper = matchSceneEl.querySelector(".match-keeper");
  const hand = matchSceneEl.querySelector(".keeper-left-hand");
  keeper.style.transformOrigin = "42% 96%";
  keeper.style.transform = "translate(16px, -6px) rotate(6deg)";
  hand.style.transform = "translate(16px, -18px) rotate(-30deg)";
  const glove = hand.getBoundingClientRect();
  const target = {
    x: glove.left + glove.width / 2,
    y: glove.top + glove.height / 2,
  };
  keeper.style.transform = "";
  hand.style.transform = "";
  return target;
}

function aimBallAtKeeper() {
  const ball = sceneBall();
  const shadow = sceneShadow();
  ball.style.opacity = "";
  shadow.style.opacity = "";
  const ballBox = ball.getBoundingClientRect();
  const target = gloveTarget();
  const x = `${Math.round(target.x - (ballBox.left + ballBox.width / 2))}px`;
  const y = `${Math.round(target.y - (ballBox.top + ballBox.height / 2))}px`;
  ball.style.setProperty("--kick-x", x);
  ball.style.setProperty("--kick-y", y);
  shadow.style.setProperty("--kick-x", x);
}

function resetFootballImpact() {
  impactEl.hidden = true;
  impactEl.classList.remove("is-playing");
  if (matchSceneEl) {
    sceneBall().style.opacity = "";
    sceneShadow().style.opacity = "";
  }
}

function resetCricketImpact() {
  cricketImpactEl.hidden = true;
  cricketImpactEl.classList.remove("is-playing");
  cricketSceneEl.querySelector(".cricket-ball").style.opacity = "";
  cricketSceneEl.querySelector(".cricket-ball-shadow").style.opacity = "";
}

function aimCricketBall() {
  const ball = cricketSceneEl.querySelector(".cricket-ball");
  const shadow = cricketSceneEl.querySelector(".cricket-ball-shadow");
  const bowler = cricketSceneEl.querySelector(".cricket-bowler");
  const crease = cricketSceneEl.querySelector(".cricket-crease").getBoundingClientRect();
  const batsman = cricketSceneEl.querySelector(".cricket-batsman").getBoundingClientRect();
  bowler.style.transformOrigin = "center bottom";
  bowler.style.transform = "translate(-62px, 0) rotate(-8deg)";

  const center = (box) => ({ x: box.left + box.width / 2, y: box.top + box.height / 2 });
  const move = (dx, dy, scale) => {
    ball.style.transformOrigin = "center bottom";
    ball.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
    return center(ball.getBoundingClientRect());
  };
  const aim = (target, scale) => {
    ball.style.transform = "";
    const start = center(ball.getBoundingClientRect());
    let dx = target.x - start.x;
    let dy = target.y - start.y;
    const landed = move(dx, dy, scale);
    dx -= landed.x - target.x;
    dy -= landed.y - target.y;
    return { x: Math.round(dx), y: Math.round(dy) };
  };

  const pitch = aim(center(crease), 0.92);
  const target = aim(
    { x: batsman.left + batsman.width * 0.28, y: batsman.top + batsman.height * 0.62 },
    1
  );
  ball.style.transform = "";
  bowler.style.transform = "";
  ball.style.setProperty("--pitch-x", `${pitch.x}px`);
  ball.style.setProperty("--pitch-y", `${pitch.y}px`);
  ball.style.setProperty("--bowl-x", `${target.x}px`);
  ball.style.setProperty("--bowl-y", `${target.y}px`);
  shadow.style.setProperty("--pitch-x", `${pitch.x}px`);
  shadow.style.setProperty("--bowl-x", `${target.x}px`);
}

function showSplitResult(squad) {
  if (selectedSport.id === "badminton") {
    showBadmintonResult(squad);
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
    gap === 0 ? "equal strength" : `Strength difference of ${gap}`;
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
  resultEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/** Kick → save → ball fills the screen, then open the split result. */
function playFootballSplitSequence(squad) {
  stopStages();
  splitButton.disabled = true;
  matchSceneEl.classList.remove("is-playing");
  void matchSceneEl.offsetWidth;
  aimBallAtKeeper();
  matchSceneEl.classList.add("is-playing");
  matchSceneEl.scrollIntoView({ behavior: "smooth", block: "nearest" });

  queueStage(() => {
    const glove = matchSceneEl.querySelector(".keeper-left-hand").getBoundingClientRect();
    const x = glove.left + glove.width / 2;
    const y = glove.top + glove.height / 2;
    impactEl.style.setProperty("--from-x", `${Math.round(x - window.innerWidth / 2)}px`);
    impactEl.style.setProperty("--from-y", `${Math.round(y - window.innerHeight / 2)}px`);
    sceneBall().style.opacity = "0";
    sceneShadow().style.opacity = "0";
    impactEl.hidden = false;
    impactEl.classList.add("is-playing");

    queueStage(() => {
      resetFootballImpact();
      matchSceneEl.classList.remove("is-playing");
      matchSceneEl.hidden = true;
      showSplitResult(squad);
    }, FOOTBALL_IMPACT_MS);
  }, FOOTBALL_KICK_MS);
}

/** Run-up → pitched delivery → bat strike → ball fills the screen. */
function playCricketSplitSequence(squad) {
  stopStages();
  splitButton.disabled = true;
  cricketSceneEl.classList.remove("is-playing");
  void cricketSceneEl.offsetWidth;
  aimCricketBall();
  cricketSceneEl.classList.add("is-playing");
  cricketSceneEl.scrollIntoView({ behavior: "smooth", block: "nearest" });

  queueStage(() => {
    const ball = cricketSceneEl.querySelector(".cricket-ball");
    const ballBox = ball.getBoundingClientRect();
    const x = ballBox.left + ballBox.width / 2;
    const y = ballBox.top + ballBox.height / 2;
    cricketImpactEl.style.setProperty("--from-x", `${Math.round(x - window.innerWidth / 2)}px`);
    cricketImpactEl.style.setProperty("--from-y", `${Math.round(y - window.innerHeight / 2)}px`);
    ball.style.opacity = "0";
    cricketSceneEl.querySelector(".cricket-ball-shadow").style.opacity = "0";
    cricketImpactEl.hidden = false;
    cricketImpactEl.classList.add("is-playing");

    queueStage(() => {
      resetCricketImpact();
      cricketSceneEl.classList.remove("is-playing");
      cricketSceneEl.hidden = true;
      showSplitResult(squad);
    }, CRICKET_IMPACT_MS);
  }, CRICKET_HIT_MS);
}

function resetVolleyImpact() {
  volleyImpactEl.hidden = true;
  volleyImpactEl.classList.remove("is-playing");
  volleySceneEl.querySelector(".vb-ball").style.opacity = "";
}

/** Aim the serve at the spiker's raised hand at the top of her jump. */
function aimVolleyball() {
  const ball = volleySceneEl.querySelector(".vb-ball");
  const spiker = volleySceneEl.querySelector(".vb-spiker");
  const arm = spiker.querySelector(".vb-arm");
  spiker.style.transform = "translateY(-30px)";
  arm.style.transform = "rotate(-170deg)";
  const hand = arm.getBoundingClientRect();
  spiker.style.transform = "";
  arm.style.transform = "";
  const ballBox = ball.getBoundingClientRect();
  const x = hand.left + hand.width / 2 - (ballBox.left + ballBox.width / 2);
  const y = hand.top + 6 - (ballBox.top + ballBox.height / 2);
  ball.style.setProperty("--serve-x", `${Math.round(x)}px`);
  ball.style.setProperty("--serve-y", `${Math.round(y)}px`);
}

/** Serve → ball crosses the net → spike → ball fills the screen. */
function playVolleyballSplitSequence(squad) {
  stopStages();
  splitButton.disabled = true;
  volleySceneEl.classList.remove("is-playing");
  void volleySceneEl.offsetWidth;
  aimVolleyball();
  volleySceneEl.classList.add("is-playing");
  volleySceneEl.scrollIntoView({ behavior: "smooth", block: "nearest" });

  queueStage(() => {
    const ball = volleySceneEl.querySelector(".vb-ball");
    const ballBox = ball.getBoundingClientRect();
    const x = ballBox.left + ballBox.width / 2;
    const y = ballBox.top + ballBox.height / 2;
    volleyImpactEl.style.setProperty("--from-x", `${Math.round(x - window.innerWidth / 2)}px`);
    volleyImpactEl.style.setProperty("--from-y", `${Math.round(y - window.innerHeight / 2)}px`);
    ball.style.opacity = "0";
    volleyImpactEl.hidden = false;
    volleyImpactEl.classList.add("is-playing");

    queueStage(() => {
      resetVolleyImpact();
      volleySceneEl.classList.remove("is-playing");
      volleySceneEl.hidden = true;
      showSplitResult(squad);
    }, VOLLEY_IMPACT_MS);
  }, VOLLEY_SPIKE_MS);
}

function resetBadmintonImpact() {
  badmintonImpactEl.hidden = true;
  badmintonImpactEl.classList.remove("is-playing");
  badmintonSceneEl.querySelector(".bd-shuttle").style.opacity = "";
}

/** Aim the shuttle at the receiver's racket at the top of the hit. */
function aimBadminton() {
  const shuttle = badmintonSceneEl.querySelector(".bd-shuttle");
  const receiver = badmintonSceneEl.querySelector(".bd-receiver");
  const arm = receiver.querySelector(".bd-arm");
  const racket = receiver.querySelector(".bd-racket");
  receiver.style.transform = "translateY(-30px)";
  arm.style.transform = "rotate(-160deg)";
  const head = racket.getBoundingClientRect();
  receiver.style.transform = "";
  arm.style.transform = "";
  const shuttleBox = shuttle.getBoundingClientRect();
  const x = head.left + head.width / 2 - (shuttleBox.left + shuttleBox.width / 2);
  const y = head.top + head.height / 2 - (shuttleBox.top + shuttleBox.height / 2);
  shuttle.style.setProperty("--serve-x", `${Math.round(x)}px`);
  shuttle.style.setProperty("--serve-y", `${Math.round(y)}px`);
}

/** Serve → shuttle arches over the net → hit → cork fills the screen. */
function playBadmintonSplitSequence(squad) {
  stopStages();
  splitButton.disabled = true;
  badmintonSceneEl.classList.remove("is-playing");
  void badmintonSceneEl.offsetWidth;
  aimBadminton();
  badmintonSceneEl.classList.add("is-playing");
  badmintonSceneEl.scrollIntoView({ behavior: "smooth", block: "nearest" });

  queueStage(() => {
    const shuttle = badmintonSceneEl.querySelector(".bd-shuttle");
    const box = shuttle.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    badmintonImpactEl.style.setProperty("--from-x", `${Math.round(x - window.innerWidth / 2)}px`);
    badmintonImpactEl.style.setProperty("--from-y", `${Math.round(y - window.innerHeight / 2)}px`);
    shuttle.style.opacity = "0";
    badmintonImpactEl.hidden = false;
    badmintonImpactEl.classList.add("is-playing");

    queueStage(() => {
      resetBadmintonImpact();
      badmintonSceneEl.classList.remove("is-playing");
      badmintonSceneEl.hidden = true;
      showSplitResult(squad);
    }, BADMINTON_IMPACT_MS);
  }, BADMINTON_HIT_MS);
}

function queueStage(step, delay) {
  animationTimers.push(window.setTimeout(step, delay));
}

function stopStages() {
  animationTimers.forEach(window.clearTimeout);
  animationTimers = [];
}

function clearResult() {
  stopStages();
  resetFootballImpact();
  resetCricketImpact();
  resetVolleyImpact();
  resetBadmintonImpact();
  resultEl.classList.remove("is-closing", "is-absorbing", "is-pairs");
  resultEl.hidden = true;
  resultEl.innerHTML = "";
  splitButton.disabled = false;
  renderLegend();
  syncSportScenes();
}

/** Shiver, flash white, pull both team cards into the button, then fade out. */
function closeResultWithAnimation(button) {
  if (resultEl.classList.contains("is-closing")) return;

  stopStages();
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
let showPositionsUntilAdd = false;

function renderLegend() {
  const cats = currentCategories();
  const show = cats.length > 0 && (showPositionsUntilAdd || players.length < 3);
  if (!show) {
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

function sportIconMarkup(sport) {
  return `<img src="${sport.iconSrc}" alt="">`;
}

function renderSportTrigger() {
  sportIcon.innerHTML = sportIconMarkup(selectedSport);
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
  option.innerHTML = `<span class="sport-icon">${sportIconMarkup(sport)}</span><span>${sport.name}</span>`;
  option.addEventListener("click", () => {
    if (selectedSport.id !== sport.id) showPositionsUntilAdd = true;
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
applySportMood();
syncSportScenes();
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
  if (event.key === "Escape") {
    photoOverlay.hidden = true;
    closeConnect();
  }
});

const connectButton = document.getElementById("connectButton");
const connectCloth = document.getElementById("connectCloth");

function openConnect() {
  connectCloth.hidden = false;
  void connectCloth.offsetWidth;
  connectCloth.classList.add("is-open");
  connectButton.setAttribute("aria-expanded", "true");
}

function closeConnect() {
  if (connectCloth.hidden || !connectCloth.classList.contains("is-open")) return;
  connectCloth.classList.remove("is-open");
  connectButton.setAttribute("aria-expanded", "false");
}

connectButton.addEventListener("click", (event) => {
  event.stopPropagation();
  if (connectButton.getAttribute("aria-expanded") === "true") closeConnect();
  else openConnect();
});

connectCloth.addEventListener("transitionend", (event) => {
  if (event.propertyName !== "transform" || connectCloth.classList.contains("is-open")) return;
  connectCloth.hidden = true;
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".connect-wrap")) closeConnect();
  if (!event.target.closest(".pos-toggle, .positions")) closeOtherPosMenus(null);
  if (!event.target.closest(".saved-picker-wrap")) closeSavedPickerMenu();
});

document.getElementById("addPlayer").addEventListener("click", () => {
  closeSavedPlayersPanel();
  closeSavedPickerMenu();
  showPositionsUntilAdd = false;
  const player = createPlayer();
  renderLegend();
  if (listEl.classList.contains("is-scrollable")) {
    listEl.scrollTop = listEl.scrollHeight;
  }
  player.input.focus({ preventScroll: true });
});
splitButton.addEventListener("click", renderResult);
resultEl.addEventListener("click", (event) => {
  const closeButton = event.target.closest("#closeResult");
  if (closeButton) closeResultWithAnimation(closeButton);
});

const headerSaveRatings = document.getElementById("headerSaveRatings");
const ratingsOverlay = document.getElementById("ratingsOverlay");
const ratingsListEl = document.getElementById("ratingsList");
const ratingsAddPlayer = document.getElementById("ratingsAddPlayer");
const ratingsSaveButton = document.getElementById("ratingsSaveButton");
const ratingsClose = document.getElementById("ratingsClose");
const ratingsConfirm = document.getElementById("ratingsConfirm");
const ratingsConfirmCancel = document.getElementById("ratingsConfirmCancel");
const ratingsConfirmClose = document.getElementById("ratingsConfirmClose");
const ratingsWarningEl = document.getElementById("ratingsWarning");
const ratingsPlayers = [];
let ratingsDirty = false;
let ratingsWarningTimer = null;

let pendingSaveAfterAuth = false;
let mainListSaveInFlight = false;

function hasNamedMainPlayer() {
  return players.some((player) => player.name.length >= 1);
}

function collectMainListSquad() {
  return players
    .filter((player) => player.name.length >= 1)
    .map((player) => ({
      name: player.name,
      rating: player.rating,
      pos: player.pos,
    }));
}

function updateHeaderSaveButton() {
  if (!headerSaveRatings) return;
  const canSave = hasNamedMainPlayer() && !mainListSaveInFlight;
  headerSaveRatings.hidden = !hasNamedMainPlayer();
  headerSaveRatings.disabled = !canSave;
}

async function saveMainListRatings() {
  if (!hasNamedMainPlayer()) {
    pendingSaveAfterAuth = false;
    updateHeaderSaveButton();
    return;
  }

  const userId = window.AshlyAuth && window.AshlyAuth.currentUserId();
  if (!userId) {
    pendingSaveAfterAuth = true;
    window.AshlyAuth.openLogin();
    return;
  }

  if (mainListSaveInFlight) return;
  mainListSaveInFlight = true;
  pendingSaveAfterAuth = false;

  const squad = collectMainListSquad();

  headerSaveRatings.disabled = true;
  headerSaveRatings.classList.add("is-saving");
  headerSaveRatings.classList.remove("is-saved");
  headerSaveRatings.setAttribute("aria-label", "Saving");
  headerSaveRatings.title = "Saving…";
  try {
    await writeSavedRatings(userId, squad);
    headerSaveRatings.classList.remove("is-saving");
    headerSaveRatings.classList.add("is-saved");
    headerSaveRatings.setAttribute("aria-label", "Saved");
    headerSaveRatings.title = "Saved";
    showSaveSuccess("Saved the ratings!\nyou can view/edit from your account");
    refreshSavedPickerVisibility();
    setTimeout(() => {
      headerSaveRatings.classList.remove("is-saved");
      headerSaveRatings.setAttribute("aria-label", "Save");
      headerSaveRatings.title = "Save";
      mainListSaveInFlight = false;
      updateHeaderSaveButton();
    }, 1200);
  } catch (error) {
    showWarning(error.message || "Could not save ratings.");
    headerSaveRatings.classList.remove("is-saving", "is-saved");
    headerSaveRatings.setAttribute("aria-label", "Save");
    headerSaveRatings.title = "Save";
    mainListSaveInFlight = false;
    updateHeaderSaveButton();
  }
}

document.addEventListener("ats-auth-change", (event) => {
  const userId = event.detail && event.detail.userId;
  if (userId && pendingSaveAfterAuth) {
    saveMainListRatings();
  }
  refreshSavedPickerVisibility();
});

document.addEventListener("ats-auth-close", () => {
  const userId = window.AshlyAuth && window.AshlyAuth.currentUserId();
  if (!userId) pendingSaveAfterAuth = false;
});

document.addEventListener("ats-auth-success", (event) => {
  const mode = event.detail && event.detail.mode;
  const name = (event.detail && event.detail.username) || "";
  if (mode === "register") {
    showAuthBanner(
      name
        ? `Welcome, ${name}!\nRegistration successful.`
        : "Welcome!\nRegistration successful."
    );
    return;
  }
  showAuthBanner(
    name ? `Welcome, ${name}!\nYou are successfully logged in.` : "Welcome!\nYou are successfully logged in."
  );
});

function showRatingsWarning(message) {
  if (!ratingsWarningEl) return;
  ratingsWarningEl.textContent = message;
  ratingsWarningEl.hidden = !message;
  clearTimeout(ratingsWarningTimer);
  if (message) {
    ratingsWarningTimer = setTimeout(() => {
      ratingsWarningEl.hidden = true;
    }, 4000);
  }
}

const MAX_RATING_SETS = 4;
const DEFAULT_SET_NAME = "Rating Set-1";

const ratingsCreateSet = document.getElementById("ratingsCreateSet");
const ratingsOverview = document.getElementById("ratingsOverview");
const ratingsDetail = document.getElementById("ratingsDetail");
const ratingsSetGrid = document.getElementById("ratingsSetGrid");
const ratingsSetClose = document.getElementById("ratingsSetClose");
const ratingsSetNameInput = document.getElementById("ratingsSetNameInput");
const ratingsSetNameEdit = document.getElementById("ratingsSetNameEdit");
const ratingsSaveToast = document.getElementById("ratingsSaveToast");
const ratingsDeleteConfirm = document.getElementById("ratingsDeleteConfirm");
const ratingsDeleteConfirmText = document.getElementById("ratingsDeleteConfirmText");
const ratingsDeleteCancel = document.getElementById("ratingsDeleteCancel");
const ratingsDeleteConfirmBtn = document.getElementById("ratingsDeleteConfirmBtn");
const ratingsSaveLabel = ratingsSaveButton
  ? ratingsSaveButton.querySelector(".ratings-save-label")
  : null;

function ratingSetNameForIndex(index) {
  return `Rating Set-${index + 1}`;
}

let ratingsStore = null;
let editingSetName = false;
let ratingsSaveToastTimer = null;
let ratingsHasExistingSet = false;
let ratingsViewMode = "overview";

function newRatingsSetId() {
  return `set_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function createEmptyRatingsStore() {
  const id = "default";
  return {
    version: 2,
    activeSetId: id,
    sets: [{ id, name: DEFAULT_SET_NAME, players: [] }],
  };
}

function normalizeRatingsStore(raw) {
  if (Array.isArray(raw)) {
    return {
      version: 2,
      activeSetId: "default",
      sets: [{ id: "default", name: DEFAULT_SET_NAME, players: raw }],
    };
  }
  if (raw && Array.isArray(raw.sets) && raw.sets.length) {
    const sets = raw.sets.slice(0, MAX_RATING_SETS).map((set, index) => {
      let name = set && String(set.name || "").trim();
      if (!name || name === "Default Set") name = ratingSetNameForIndex(index);
      return {
        id: set && set.id ? String(set.id) : index === 0 ? "default" : newRatingsSetId(),
        name,
        players: Array.isArray(set && set.players)
          ? set.players
          : Array.isArray(set && set.squad)
            ? set.squad
            : [],
      };
    });
    const activeSetId =
      sets.some((set) => set.id === raw.activeSetId) ? raw.activeSetId : sets[0].id;
    return { version: 2, activeSetId, sets };
  }
  return createEmptyRatingsStore();
}

function getActiveRatingsSet(store = ratingsStore) {
  if (!store || !store.sets.length) return null;
  return store.sets.find((set) => set.id === store.activeSetId) || store.sets[0];
}

function flattenRatingsPlayers(store) {
  const seen = new Set();
  const out = [];
  (store && store.sets ? store.sets : []).forEach((set) => {
    (set.players || []).forEach((entry) => {
      const key = String((entry && entry.name) || "")
        .trim()
        .toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      out.push(entry);
    });
  });
  return out;
}

function collectRatingsEditorSquad() {
  return ratingsPlayers.map((player, index) => ({
    name: player.name.trim() || `Player ${index + 1}`,
    rating: player.rating,
    pos: player.pos,
  }));
}

function syncActiveSetFromEditor() {
  const active = getActiveRatingsSet();
  if (!active) return;
  active.players = collectRatingsEditorSquad();
  if (ratingsSetNameInput) {
    const name = ratingsSetNameInput.value.trim() || DEFAULT_SET_NAME;
    active.name = name;
    ratingsSetNameInput.value = name;
  }
}

async function readRatingsStore(userId) {
  const { data, error } = await window.AshlySupabase.from("ratings")
    .select("squad")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return normalizeRatingsStore(data && data.squad);
}

async function writeRatingsStore(userId, store) {
  const payload = normalizeRatingsStore(store);
  const { error } = await window.AshlySupabase.from("ratings").upsert(
    {
      user_id: userId,
      squad: payload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) throw error;
  return payload;
}

/** Flat player list for the split picker (all sets, unique names). */
async function readSavedRatings(userId) {
  const store = await readRatingsStore(userId);
  return flattenRatingsPlayers(store);
}

async function writeSavedRatings(userId, squad) {
  const store = await readRatingsStore(userId);
  const active = getActiveRatingsSet(store);
  if (active) active.players = squad;
  await writeRatingsStore(userId, store);
}

function setHasNamedPlayers(set) {
  return Array.isArray(set && set.players) && set.players.some((entry) => String((entry && entry.name) || "").trim());
}

function updateRatingsCreateSetButton() {
  if (!ratingsCreateSet || !ratingsStore) return;
  const atLimit = ratingsStore.sets.length >= MAX_RATING_SETS;
  const canShow =
    ratingsHasExistingSet &&
    ratingsStore.sets.length >= 1 &&
    !atLimit &&
    ratingsViewMode === "overview";
  ratingsCreateSet.hidden = !canShow;
}

function showRatingsOverview() {
  ratingsViewMode = "overview";
  if (ratingsOverview) ratingsOverview.hidden = false;
  if (ratingsDetail) ratingsDetail.hidden = true;
  clearRatingsEditor();
  renderRatingsSetGrid();
  updateRatingsCreateSetButton();
}

function showRatingsDetail(setId) {
  if (!ratingsStore) return;
  const target = ratingsStore.sets.find((set) => set.id === setId);
  if (!target) return;
  ratingsStore.activeSetId = setId;
  ratingsViewMode = "detail";
  if (ratingsOverview) ratingsOverview.hidden = true;
  if (ratingsDetail) ratingsDetail.hidden = false;
  updateRatingsSetTitle();
  fillRatingsEditor(Array.isArray(target.players) ? target.players : []);
  updateRatingsCreateSetButton();
  if (ratingsDetail) ratingsDetail.scrollTop = 0;
  showRatingsWarning("");
}

function renderRatingsSetGrid() {
  if (!ratingsSetGrid || !ratingsStore) return;
  ratingsSetGrid.replaceChildren();
  ratingsStore.sets.forEach((set) => {
    const tile = document.createElement("div");
    tile.className = "ratings-set-tile";
    tile.dataset.setId = set.id;
    tile.setAttribute("role", "button");
    tile.tabIndex = 0;

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "ratings-set-delete";
    deleteBtn.setAttribute("aria-label", `Delete ${set.name || DEFAULT_SET_NAME}`);
    deleteBtn.title = "Delete set";
    deleteBtn.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';
    deleteBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      requestDeleteRatingsSet(set.id);
    });

    const name = document.createElement("span");
    name.className = "ratings-set-tile-name";
    name.textContent = set.name || DEFAULT_SET_NAME;

    const playersWrap = document.createElement("span");
    playersWrap.className = "ratings-set-tile-players";
    const names = (set.players || [])
      .map((entry) => String((entry && entry.name) || "").trim())
      .filter(Boolean)
      .slice(0, 2);

    if (!names.length) {
      const empty = document.createElement("span");
      empty.className = "ratings-set-tile-empty";
      empty.textContent = "No players yet";
      playersWrap.appendChild(empty);
    } else {
      names.forEach((playerName) => {
        const line = document.createElement("span");
        line.className = "ratings-set-tile-player";
        line.textContent = playerName;
        playersWrap.appendChild(line);
      });
    }

    tile.append(deleteBtn, name, playersWrap);
    tile.addEventListener("click", () => showRatingsDetail(set.id));
    tile.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        showRatingsDetail(set.id);
      }
    });
    ratingsSetGrid.appendChild(tile);
  });
  updateRatingsCreateSetButton();
}

function updateRatingsSetTitle() {
  const active = getActiveRatingsSet();
  if (!ratingsSetNameInput || !active) return;
  ratingsSetNameInput.value = active.name || DEFAULT_SET_NAME;
  ratingsSetNameInput.readOnly = true;
  ratingsSetNameInput.classList.remove("is-editing");
  editingSetName = false;
}

function scrollRatingsWindowToActions() {
  if (!ratingsOverlay || ratingsOverlay.hidden) return;
  requestAnimationFrame(() => {
    const actions = ratingsDetail && ratingsDetail.querySelector(".actions");
    if (actions) {
      actions.scrollIntoView({ block: "end", behavior: "smooth" });
      return;
    }
    ratingsOverlay.scrollTop = ratingsOverlay.scrollHeight;
  });
}

function markRatingsDirty() {
  ratingsDirty = true;
}

function clearRatingsEditor() {
  ratingsPlayers.splice(0, ratingsPlayers.length);
  if (ratingsListEl) ratingsListEl.replaceChildren();
}

function blankRatingsEntries() {
  return [
    { name: "", rating: DEFAULT_RATING, pos: null },
    { name: "", rating: DEFAULT_RATING, pos: null },
  ];
}

function fillRatingsEditor(saved) {
  clearRatingsEditor();
  const starter = saved.length ? saved : blankRatingsEntries();
  starter.forEach((entry) => {
    const player = createPlayer({
      players: ratingsPlayers,
      listEl: ratingsListEl,
      onChange: markRatingsDirty,
    });
    player.name = entry.name || "";
    player.rating = entry.rating || DEFAULT_RATING;
    player.pos = entry.pos || null;
    player.input.value = player.name;
    rebuildChips(player);
    updateRating(player);
  });
  ratingsDirty = false;
}

function showRatingsSaveToast() {
  if (!ratingsSaveToast) return;
  ratingsSaveToast.hidden = false;
  clearTimeout(ratingsSaveToastTimer);
  ratingsSaveToastTimer = setTimeout(() => {
    ratingsSaveToast.hidden = true;
  }, 1000);
}

function minimizeRatingsSet() {
  if (ratingsViewMode === "detail") syncActiveSetFromEditor();
  showRatingsOverview();
  showRatingsWarning("");
}

async function openSaveRatingsEditor() {
  const userId = window.AshlyAuth && window.AshlyAuth.currentUserId();
  if (!userId) {
    window.AshlyAuth.openLogin();
    return;
  }
  showRatingsWarning("");
  if (ratingsSaveToast) ratingsSaveToast.hidden = true;
  ratingsOverlay.hidden = false;
  document.body.classList.add("ratings-open");
  ratingsStore = createEmptyRatingsStore();
  ratingsHasExistingSet = false;
  showRatingsOverview();
  try {
    ratingsStore = await readRatingsStore(userId);
    ratingsHasExistingSet = ratingsStore.sets.some(setHasNamedPlayers);
    showRatingsOverview();
  } catch (error) {
    showRatingsWarning(error.message || "Could not load saved ratings.");
  }
}

function forceCloseRatingsEditor() {
  ratingsConfirm.hidden = true;
  cancelDeleteRatingsSet();
  ratingsOverlay.hidden = true;
  document.body.classList.remove("ratings-open");
  clearRatingsEditor();
  ratingsDirty = false;
  ratingsStore = null;
  ratingsHasExistingSet = false;
  editingSetName = false;
  ratingsViewMode = "overview";
  clearTimeout(ratingsSaveToastTimer);
  if (ratingsSaveToast) ratingsSaveToast.hidden = true;
  if (ratingsSetGrid) ratingsSetGrid.replaceChildren();
  if (ratingsOverview) ratingsOverview.hidden = false;
  if (ratingsDetail) ratingsDetail.hidden = true;
  showRatingsWarning("");
}

function requestCloseRatingsEditor() {
  if (!ratingsDirty) {
    forceCloseRatingsEditor();
    return;
  }
  ratingsConfirm.hidden = false;
}

function createNewRatingsSet() {
  if (!ratingsStore) return;
  if (!ratingsHasExistingSet) {
    showRatingsWarning("Save at least one set before creating another.");
    return;
  }
  if (ratingsStore.sets.length >= MAX_RATING_SETS) {
    showRatingsWarning(`You can save up to ${MAX_RATING_SETS} player sets.`);
    updateRatingsCreateSetButton();
    return;
  }
  const id = newRatingsSetId();
  const name = ratingSetNameForIndex(ratingsStore.sets.length);
  ratingsStore.sets.push({ id, name, players: [] });
  ratingsDirty = true;
  showRatingsDetail(id);
}

let pendingDeleteSetId = null;

function requestDeleteRatingsSet(setId) {
  if (!ratingsStore) return;
  const target = ratingsStore.sets.find((set) => set.id === setId);
  if (!target) return;
  pendingDeleteSetId = setId;
  if (ratingsDeleteConfirmText) {
    ratingsDeleteConfirmText.textContent = `Delete "${target.name || DEFAULT_SET_NAME}"? This cannot be undone.`;
  }
  if (ratingsDeleteConfirm) ratingsDeleteConfirm.hidden = false;
}

function cancelDeleteRatingsSet() {
  pendingDeleteSetId = null;
  if (ratingsDeleteConfirm) ratingsDeleteConfirm.hidden = true;
}

async function confirmDeleteRatingsSet() {
  if (!ratingsStore || !pendingDeleteSetId) {
    cancelDeleteRatingsSet();
    return;
  }
  const userId = window.AshlyAuth && window.AshlyAuth.currentUserId();
  if (!userId) {
    window.AshlyAuth.openLogin();
    return;
  }

  const deleteId = pendingDeleteSetId;
  ratingsStore.sets = ratingsStore.sets.filter((set) => set.id !== deleteId);
  if (!ratingsStore.sets.length) {
    ratingsStore = createEmptyRatingsStore();
  } else if (!ratingsStore.sets.some((set) => set.id === ratingsStore.activeSetId)) {
    ratingsStore.activeSetId = ratingsStore.sets[0].id;
  }

  try {
    ratingsStore = await writeRatingsStore(userId, ratingsStore);
    ratingsHasExistingSet = ratingsStore.sets.some(setHasNamedPlayers);
    ratingsDirty = false;
    cancelDeleteRatingsSet();
    showRatingsOverview();
    refreshSavedPickerVisibility();
  } catch (error) {
    cancelDeleteRatingsSet();
    showRatingsWarning(error.message || "Could not delete set.");
  }
}

function beginEditRatingsSetName() {
  if (!ratingsSetNameInput) return;
  editingSetName = true;
  ratingsSetNameInput.readOnly = false;
  ratingsSetNameInput.classList.add("is-editing");
  ratingsSetNameInput.focus();
  ratingsSetNameInput.select();
}

function commitRatingsSetName() {
  if (!ratingsSetNameInput) return;
  const active = getActiveRatingsSet();
  const name = ratingsSetNameInput.value.trim() || DEFAULT_SET_NAME;
  ratingsSetNameInput.value = name;
  ratingsSetNameInput.readOnly = true;
  ratingsSetNameInput.classList.remove("is-editing");
  editingSetName = false;
  if (active && active.name !== name) {
    active.name = name;
    markRatingsDirty();
  }
}

async function saveRatingsFromEditor() {
  const userId = window.AshlyAuth && window.AshlyAuth.currentUserId();
  if (!userId) {
    window.AshlyAuth.openLogin();
    return;
  }
  if (!ratingsStore) ratingsStore = createEmptyRatingsStore();
  syncActiveSetFromEditor();
  const previousLabel = ratingsSaveLabel ? ratingsSaveLabel.textContent : "Save Rating";
  ratingsSaveButton.disabled = true;
  if (ratingsSaveLabel) ratingsSaveLabel.textContent = "Saving…";
  showRatingsWarning("");
  try {
    ratingsStore = await writeRatingsStore(userId, ratingsStore);
    ratingsDirty = false;
    ratingsHasExistingSet = ratingsStore.sets.some(setHasNamedPlayers);
    showRatingsOverview();
    showRatingsSaveToast();
    refreshSavedPickerVisibility();
  } catch (error) {
    showRatingsWarning(error.message || "Could not save ratings.");
  } finally {
    ratingsSaveButton.disabled = false;
    if (ratingsSaveLabel) ratingsSaveLabel.textContent = previousLabel;
  }
}

ratingsAddPlayer.addEventListener("click", () => {
  const player = createPlayer({
    players: ratingsPlayers,
    listEl: ratingsListEl,
    onChange: markRatingsDirty,
  });
  markRatingsDirty();
  player.input.focus({ preventScroll: true });
  scrollRatingsWindowToActions();
});

headerSaveRatings.addEventListener("click", () => {
  saveMainListRatings();
});

ratingsSaveButton.addEventListener("click", () => {
  saveRatingsFromEditor();
});
ratingsClose.addEventListener("click", requestCloseRatingsEditor);
if (ratingsSetClose) {
  ratingsSetClose.addEventListener("click", minimizeRatingsSet);
}
ratingsConfirmCancel.addEventListener("click", () => {
  ratingsConfirm.hidden = true;
});
ratingsConfirmClose.addEventListener("click", forceCloseRatingsEditor);

if (ratingsDeleteCancel) {
  ratingsDeleteCancel.addEventListener("click", cancelDeleteRatingsSet);
}
if (ratingsDeleteConfirmBtn) {
  ratingsDeleteConfirmBtn.addEventListener("click", confirmDeleteRatingsSet);
}

if (ratingsCreateSet) {
  ratingsCreateSet.addEventListener("click", createNewRatingsSet);
}

if (ratingsSetNameEdit) {
  ratingsSetNameEdit.addEventListener("click", () => {
    if (editingSetName) commitRatingsSetName();
    else beginEditRatingsSetName();
  });
}

if (ratingsSetNameInput) {
  ratingsSetNameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitRatingsSetName();
    }
  });
  ratingsSetNameInput.addEventListener("blur", () => {
    if (editingSetName) commitRatingsSetName();
  });
}

ratingsListEl.addEventListener("click", (event) => {
  if (event.target.closest(".pos, .delete, .rating button")) markRatingsDirty();
});

document.addEventListener("ats-open-save-ratings", openSaveRatingsEditor);

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (ratingsDeleteConfirm && !ratingsDeleteConfirm.hidden) {
    cancelDeleteRatingsSet();
    return;
  }
  if (!ratingsConfirm.hidden) {
    ratingsConfirm.hidden = true;
    return;
  }
  if (ratingsOverlay.hidden) return;
  if (ratingsViewMode === "detail") {
    minimizeRatingsSet();
    return;
  }
  requestCloseRatingsEditor();
});

const savedPickerWrap = document.getElementById("savedPickerWrap");
const savedPickerToggle = document.getElementById("savedPickerToggle");
const savedPickerMenu = document.getElementById("savedPickerMenu");
const selectSavedPlayersOption = document.getElementById("selectSavedPlayersOption");
const savedPlayersPanel = document.getElementById("savedPlayersPanel");
const savedPlayersList = document.getElementById("savedPlayersList");
const savedPlayersClose = document.getElementById("savedPlayersClose");
const savedPlayersContinue = document.getElementById("savedPlayersContinue");
const savedPlayersSelectAll = document.getElementById("savedPlayersSelectAll");
const savedSwipeDemo = document.getElementById("savedSwipeDemo");

let cachedSavedSquad = [];
const selectedSavedIndexes = new Set();
let swipeDemoTimers = [];
let swipeDemoActive = false;

function closeSavedPickerMenu() {
  if (!savedPickerMenu || !savedPickerToggle) return;
  savedPickerMenu.hidden = true;
  savedPickerToggle.setAttribute("aria-expanded", "false");
}

function stopSavedSwipeDemo() {
  swipeDemoActive = false;
  swipeDemoTimers.forEach((id) => clearTimeout(id));
  swipeDemoTimers = [];
  if (savedSwipeDemo) {
    savedSwipeDemo.hidden = true;
    savedSwipeDemo.style.opacity = "0";
    savedSwipeDemo.style.transform = "";
    savedSwipeDemo.style.left = "";
    savedSwipeDemo.style.top = "";
  }
}

function closeSavedPlayersPanel() {
  stopSavedSwipeDemo();
  if (!savedPlayersPanel) return;
  savedPlayersPanel.hidden = true;
  savedPlayersPanel.style.top = "";
  savedPlayersPanel.style.bottom = "";
  selectedSavedIndexes.clear();
  updateSavedContinueButton();
  updateSavedSelectAllLabel();
}

function positionSavedPlayersPanel() {
  if (!savedPlayersPanel) return;
  const tagline = document.getElementById("sportTagline");
  const actions = document.querySelector(".card .actions");
  if (!tagline) return;

  const tagBox = tagline.getBoundingClientRect();
  const top = Math.max(8, tagBox.bottom + 8);
  let bottom = 24;
  if (actions) {
    const actionsBox = actions.getBoundingClientRect();
    bottom = Math.max(24, window.innerHeight - actionsBox.top + 10);
  }

  savedPlayersPanel.style.top = `${top}px`;
  savedPlayersPanel.style.bottom = `${bottom}px`;
}

function updateSavedContinueButton() {
  if (!savedPlayersContinue) return;
  savedPlayersContinue.hidden = selectedSavedIndexes.size === 0;
}

function updateSavedSelectAllLabel() {
  if (!savedPlayersSelectAll) return;
  const allSelected =
    cachedSavedSquad.length > 0 && selectedSavedIndexes.size === cachedSavedSquad.length;
  savedPlayersSelectAll.textContent = allSelected ? "Deselect all" : "Select all";
}

function startSavedSwipeDemo() {
  stopSavedSwipeDemo();
  if (!savedSwipeDemo || !savedPlayersList || !listEl) return;
  const firstRow = savedPlayersList.querySelector(".saved-player-row");
  if (!firstRow) return;

  swipeDemoActive = true;
  const from = firstRow.getBoundingClientRect();
  const listBox = listEl.getBoundingClientRect();
  const startX = from.left + from.width * 0.55;
  const startY = from.top + from.height * 0.35;
  const endX = listBox.left + Math.min(72, listBox.width * 0.35);
  const endY = Math.min(listBox.bottom - 28, Math.max(listBox.top + 24, from.top));

  const placeAtStart = () => {
    if (!swipeDemoActive) return;
    savedSwipeDemo.hidden = false;
    savedSwipeDemo.style.transition = "none";
    savedSwipeDemo.style.left = `${startX}px`;
    savedSwipeDemo.style.top = `${startY}px`;
    savedSwipeDemo.style.opacity = "1";
    savedSwipeDemo.style.transform = "translate(0, 0) scale(1)";
  };

  const swipeOnce = (onDone) => {
    placeAtStart();
    const moveId = setTimeout(() => {
      if (!swipeDemoActive) return;
      savedSwipeDemo.style.transition =
        "transform 1.6s cubic-bezier(0.25, 0.1, 0.25, 1), opacity 1.6s ease";
      savedSwipeDemo.style.transform = `translate(${endX - startX}px, ${endY - startY}px) scale(0.9)`;
      savedSwipeDemo.style.opacity = "0.25";
    }, 450);
    swipeDemoTimers.push(moveId);
    const doneId = setTimeout(() => {
      if (!swipeDemoActive) return;
      if (onDone) onDone();
    }, 2300);
    swipeDemoTimers.push(doneId);
  };

  swipeOnce(() => {
    const pauseId = setTimeout(() => {
      if (!swipeDemoActive) return;
      swipeOnce(() => {
        stopSavedSwipeDemo();
      });
    }, 350);
    swipeDemoTimers.push(pauseId);
  });
}

async function refreshSavedPickerVisibility() {
  if (!savedPickerWrap) return;
  const userId = window.AshlyAuth && window.AshlyAuth.currentUserId();
  if (!userId) {
    cachedSavedSquad = [];
    savedPickerWrap.hidden = true;
    closeSavedPickerMenu();
    closeSavedPlayersPanel();
    return;
  }
  try {
    const saved = await readSavedRatings(userId);
    cachedSavedSquad = (Array.isArray(saved) ? saved : []).filter(
      (entry) => entry && String(entry.name || "").trim()
    );
    savedPickerWrap.hidden = cachedSavedSquad.length === 0;
    if (savedPickerWrap.hidden) {
      closeSavedPickerMenu();
      closeSavedPlayersPanel();
    } else if (savedPlayersPanel && !savedPlayersPanel.hidden) {
      renderSavedPlayersPanel();
    }
  } catch (error) {
    cachedSavedSquad = [];
    savedPickerWrap.hidden = true;
    closeSavedPickerMenu();
    closeSavedPlayersPanel();
  }
}

function applySavedEntryToPlayer(player, entry) {
  player.name = (entry && entry.name) || "";
  player.rating = entry && entry.rating ? entry.rating : DEFAULT_RATING;
  player.pos = entry && entry.pos ? entry.pos : null;
  player.input.value = player.name;
  rebuildChips(player);
  updateRating(player);
  updateHeaderSaveButton();
}

function findEmptyMainPlayer() {
  return players.find((player) => !String(player.name || "").trim());
}

function addSavedEntryToMain(entry) {
  const empty = findEmptyMainPlayer();
  const player = empty || createPlayer();
  applySavedEntryToPlayer(player, entry);
  renderLegend();
  if (!empty && listEl.classList.contains("is-scrollable")) {
    listEl.scrollTop = listEl.scrollHeight;
  }
  return player;
}

function removeSavedEntryFromPanel(entry) {
  const index = cachedSavedSquad.indexOf(entry);
  if (index === -1) return;
  cachedSavedSquad.splice(index, 1);
  if (!cachedSavedSquad.length) {
    closeSavedPlayersPanel();
    return;
  }
  renderSavedPlayersPanel();
  positionSavedPlayersPanel();
}

function flySavedNameToMain(fromEl, entry, onDone) {
  const from = fromEl.getBoundingClientRect();
  const listBox = listEl.getBoundingClientRect();
  const chip = document.createElement("div");
  chip.className = "saved-fly-chip";
  chip.textContent = entry.name || "Player";
  chip.style.left = `${from.left}px`;
  chip.style.top = `${from.top}px`;
  chip.style.width = `${Math.max(from.width, 72)}px`;
  document.body.appendChild(chip);

  const targetX = listBox.left + 18;
  const targetY = Math.min(listBox.bottom - 36, listBox.top + listBox.height * 0.72);

  requestAnimationFrame(() => {
    chip.style.transform = `translate(${targetX - from.left}px, ${targetY - from.top}px) scale(0.85)`;
    chip.style.opacity = "0.15";
  });

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    chip.remove();
    if (onDone) onDone();
  };
  chip.addEventListener("transitionend", finish, { once: true });
  setTimeout(finish, 650);
}

function renderSavedPlayersPanel() {
  selectedSavedIndexes.clear();
  updateSavedContinueButton();
  updateSavedSelectAllLabel();
  savedPlayersList.replaceChildren();
  savedPlayersList.classList.toggle("is-scrollable", cachedSavedSquad.length > 20);

  cachedSavedSquad.forEach((entry, index) => {
    const row = document.createElement("div");
    row.className = "saved-player-row";
    row.dataset.index = String(index);
    row.setAttribute("role", "button");
    row.tabIndex = 0;

    const name = document.createElement("span");
    name.className = "saved-player-name";
    name.textContent = entry.name || `Player ${index + 1}`;
    row.appendChild(name);

    if (entry.pos) {
      const pos = document.createElement("span");
      pos.className = "pos selected saved-player-pos";
      pos.dataset.pos = entry.pos;
      pos.textContent = entry.pos;
      row.appendChild(pos);
    }

    let startX = 0;
    let startY = 0;
    let tracking = false;
    let swiped = false;

    row.addEventListener("pointerdown", (event) => {
      tracking = true;
      swiped = false;
      startX = event.clientX;
      startY = event.clientY;
      row.setPointerCapture(event.pointerId);
      row.classList.add("is-swiping");
    });

    row.addEventListener("pointermove", (event) => {
      if (!tracking) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.abs(dx) > Math.abs(dy) && dx < 0) {
        row.style.transform = `translateX(${Math.max(dx, -120)}px)`;
        if (dx < -56) swiped = true;
      }
    });

    const endSwipe = (event) => {
      if (!tracking) return;
      tracking = false;
      row.classList.remove("is-swiping");
      row.style.transform = "";
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (swiped || (dx < -72 && Math.abs(dx) > Math.abs(dy) * 1.2)) {
        stopSavedSwipeDemo();
        if (row.dataset.adding === "1") return;
        row.dataset.adding = "1";
        flySavedNameToMain(row, entry, () => {
          addSavedEntryToMain(entry);
          removeSavedEntryFromPanel(entry);
        });
        return;
      }
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
        stopSavedSwipeDemo();
        if (selectedSavedIndexes.has(index)) selectedSavedIndexes.delete(index);
        else selectedSavedIndexes.add(index);
        row.classList.toggle("is-selected", selectedSavedIndexes.has(index));
        updateSavedContinueButton();
        updateSavedSelectAllLabel();
      }
    };

    row.addEventListener("pointerup", endSwipe);
    row.addEventListener("pointercancel", () => {
      tracking = false;
      row.classList.remove("is-swiping");
      row.style.transform = "";
    });

    savedPlayersList.appendChild(row);
  });
}

async function openSavedPlayersPanel() {
  closeSavedPickerMenu();
  const userId = window.AshlyAuth && window.AshlyAuth.currentUserId();
  if (!userId) {
    window.AshlyAuth.openLogin();
    return;
  }
  try {
    const saved = await readSavedRatings(userId);
    cachedSavedSquad = (Array.isArray(saved) ? saved : []).filter(
      (entry) => entry && String(entry.name || "").trim()
    );
  } catch (error) {
    showWarning(error.message || "Could not load saved players.");
    return;
  }
  if (!cachedSavedSquad.length) {
    savedPickerWrap.hidden = true;
    showWarning("No saved players yet.");
    return;
  }
  renderSavedPlayersPanel();
  positionSavedPlayersPanel();
  savedPlayersPanel.hidden = false;
  requestAnimationFrame(() => startSavedSwipeDemo());
}

window.addEventListener("resize", () => {
  if (savedPlayersPanel && !savedPlayersPanel.hidden) positionSavedPlayersPanel();
});

if (savedPickerToggle) {
  savedPickerToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    if (savedPickerMenu.hidden) {
      savedPickerMenu.hidden = false;
      savedPickerToggle.setAttribute("aria-expanded", "true");
    } else {
      closeSavedPickerMenu();
    }
  });
}

if (selectSavedPlayersOption) {
  selectSavedPlayersOption.addEventListener("click", (event) => {
    event.stopPropagation();
    openSavedPlayersPanel();
  });
}

if (savedPlayersClose) {
  savedPlayersClose.addEventListener("click", () => {
    stopSavedSwipeDemo();
    closeSavedPlayersPanel();
  });
}

if (savedPlayersSelectAll) {
  savedPlayersSelectAll.addEventListener("click", (event) => {
    event.stopPropagation();
    stopSavedSwipeDemo();
    const allSelected =
      cachedSavedSquad.length > 0 && selectedSavedIndexes.size === cachedSavedSquad.length;
    selectedSavedIndexes.clear();
    if (!allSelected) {
      cachedSavedSquad.forEach((_, index) => selectedSavedIndexes.add(index));
    }
    savedPlayersList.querySelectorAll(".saved-player-row").forEach((row, index) => {
      row.classList.toggle("is-selected", selectedSavedIndexes.has(index));
    });
    updateSavedContinueButton();
    updateSavedSelectAllLabel();
  });
}

if (savedPlayersContinue) {
  savedPlayersContinue.addEventListener("click", () => {
    stopSavedSwipeDemo();
    const pickedIndexes = [...selectedSavedIndexes].sort((a, b) => a - b);
    const picked = pickedIndexes.map((index) => cachedSavedSquad[index]).filter(Boolean);
    if (!picked.length) return;
    picked.forEach((entry) => addSavedEntryToMain(entry));
    for (let i = pickedIndexes.length - 1; i >= 0; i -= 1) {
      cachedSavedSquad.splice(pickedIndexes[i], 1);
    }
    closeSavedPlayersPanel();
  });
}

if (savedPlayersPanel) {
  savedPlayersPanel.addEventListener(
    "pointerdown",
    () => {
      if (swipeDemoActive) stopSavedSwipeDemo();
    },
    true
  );
}

document.addEventListener(
  "pointerdown",
  (event) => {
    if (!swipeDemoActive) return;
    if (event.target.closest("#savedSwipeDemo")) return;
    stopSavedSwipeDemo();
  },
  true
);

document.addEventListener(
  "keydown",
  () => {
    if (swipeDemoActive) stopSavedSwipeDemo();
  },
  true
);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && savedPlayersPanel && !savedPlayersPanel.hidden) {
    closeSavedPlayersPanel();
  }
});

createPlayer();
createPlayer();
updateHeaderSaveButton();
refreshSavedPickerVisibility();
