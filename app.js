const POSITIONS = ["GK", "D", "M", "F"];
const MAX_NAME = 10;
const MIN_RATING = 1;
const MAX_RATING = 5;
const DEFAULT_RATING = 3;
const MAX_GOALKEEPERS = 2;

const listEl = document.getElementById("playerList");
const warningEl = document.getElementById("warning");
const resultEl = document.getElementById("result");

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

function goalkeeperCount(excludeId) {
  return players.filter((p) => p.pos === "GK" && p.id !== excludeId).length;
}

function updateChips(player) {
  const showAll = player.row.classList.contains("focused");
  player.chips.forEach((chip) => {
    const selected = player.pos === chip.dataset.pos;
    chip.classList.toggle("selected", selected);
    chip.setAttribute("aria-pressed", String(selected));
    chip.hidden = !showAll && !selected;
  });
  player.positionsEl.hidden = !showAll && player.pos === null;
  player.row.classList.toggle("has-pos", player.pos !== null);
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

  const chips = POSITIONS.map((pos) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "pos";
    chip.dataset.pos = pos;
    chip.textContent = pos;
    chip.title = { GK: "Goalkeeper", D: "Defender", M: "Midfielder", F: "Forward" }[pos];
    chip.addEventListener("click", () => {
      if (player.pos === pos) {
        player.pos = null;
      } else {
        if (pos === "GK" && goalkeeperCount(player.id) >= MAX_GOALKEEPERS) {
          showWarning("Already 2 Goal keepers are selected");
          return;
        }
        player.pos = pos;
      }
      updateChips(player);
    });
    positionsEl.appendChild(chip);
    return chip;
  });

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
    chips,
    pips,
    valueEl: value,
    minusEl: minus,
    plusEl: plus,
  });

  players.push(player);
  listEl.appendChild(row);

  updateRating(player);
  updateChips(player);
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
const POSITION_KEYS = [...POSITIONS, "none"];
const GK_INDEX = POSITION_KEYS.indexOf("GK");
const EXACT_SEARCH_LIMIT = 20;

function positionKey(player) {
  return player.pos || "none";
}

function countPositions(team) {
  const counts = { GK: 0, D: 0, M: 0, F: 0, none: 0 };
  team.forEach((player) => {
    counts[positionKey(player)] += 1;
  });
  return counts;
}

function strengthByPosition(team) {
  const sums = { GK: 0, D: 0, M: 0, F: 0, none: 0 };
  team.forEach((player) => {
    sums[positionKey(player)] += player.rating;
  });
  return sums;
}

/** flags[i] === 1 puts player i on team B, 0 puts them on team A. */
function scoreFlags(flags, ratings, categories, keeperTotal) {
  let strengthA = 0;
  let strengthB = 0;
  const countA = [0, 0, 0, 0, 0];
  const countB = [0, 0, 0, 0, 0];
  const catStrengthA = [0, 0, 0, 0, 0];
  const catStrengthB = [0, 0, 0, 0, 0];

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
  for (let c = 0; c < POSITION_KEYS.length; c++) {
    categoryCost += Math.abs(countA[c] - countB[c]) * POSITION_COUNT_WEIGHT;
    categoryCost += Math.abs(catStrengthA[c] - catStrengthB[c]) * POSITION_STRENGTH_WEIGHT;
  }

  let cost = Math.abs(strengthA - strengthB) * STRENGTH_PRIORITY + categoryCost;

  // Two keepers must never end up on the same team.
  if (keeperTotal === MAX_GOALKEEPERS && (countA[GK_INDEX] === 0 || countB[GK_INDEX] === 0)) {
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

/** Tries every legal division; only used for squads small enough to enumerate. */
function exactSplit(squad, sizeA, ratings, categories, keeperTotal) {
  const n = squad.length;
  const flags = new Uint8Array(n);
  let bestFlags = null;
  let bestCost = Infinity;

  for (let mask = 0; mask < 1 << n; mask++) {
    let onB = 0;
    for (let bits = mask; bits; bits &= bits - 1) onB += 1;
    if (n - onB !== sizeA) continue;

    for (let i = 0; i < n; i++) flags[i] = (mask >> i) & 1;

    const cost = scoreFlags(flags, ratings, categories, keeperTotal);
    if (cost < bestCost) {
      bestCost = cost;
      bestFlags = Uint8Array.from(flags);
    }
  }

  return bestFlags;
}

/** Greedy start plus swap hill-climbing, for squads too large to enumerate. */
function heuristicSplit(squad, sizeA, ratings, categories, keeperTotal) {
  const n = squad.length;
  const flags = new Uint8Array(n).fill(1);

  const order = squad
    .map((player, index) => ({ index, rating: player.rating }))
    .sort((a, b) => b.rating - a.rating);

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

  let current = scoreFlags(flags, ratings, categories, keeperTotal);
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (flags[i] === flags[j]) continue;
        flags[i] ^= 1;
        flags[j] ^= 1;
        const candidate = scoreFlags(flags, ratings, categories, keeperTotal);
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

  return flags;
}

/**
 * Splits the squad into two teams whose sizes differ by at most one. Total
 * rating is matched as closely as possible, then each position is shared as
 * evenly as possible in both player count and rating.
 */
function splitTeams(squad) {
  const sizeA = Math.floor(squad.length / 2);
  const keeperTotal = squad.filter((player) => player.pos === "GK").length;
  const ratings = squad.map((player) => player.rating);
  const categories = squad.map((player) => POSITION_KEYS.indexOf(positionKey(player)));

  const flags =
    squad.length <= EXACT_SEARCH_LIMIT
      ? exactSplit(squad, sizeA, ratings, categories, keeperTotal)
      : heuristicSplit(squad, sizeA, ratings, categories, keeperTotal);

  if (!flags) {
    return { teamA: squad.slice(0, sizeA), teamB: squad.slice(sizeA) };
  }

  return teamsFromFlags(squad, flags);
}

function teamMarkup(title, side, team) {
  const strength = team.reduce((sum, p) => sum + p.rating, 0);
  const counts = countPositions(team);
  const catStrength = strengthByPosition(team);
  const breakdown = POSITIONS.filter((pos) => counts[pos] > 0)
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
  const positionGap = POSITION_KEYS.reduce(
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
    teamMarkup("Team B", "b", teamB) +
    `<p class="result-note">${note}</p>`;
  resultEl.hidden = false;
  resultEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

const SPORTS = [
  { id: "football", name: "Football", icon: `<img src="icons/football.png" alt="">` },
  { id: "cricket", name: "Cricket", icon: `<img src="icons/cricket.png" alt="">` },
  { id: "volleyball", name: "Volleyball", icon: `<img src="icons/volleyball.png" alt="">` },
  { id: "badminton", name: "Badminton", icon: `<img src="icons/badminton.png" alt="">` },
];

let selectedSport = SPORTS[0];
const sportSelect = document.getElementById("sportSelect");
const sportTrigger = document.getElementById("sportTrigger");
const sportMenu = document.getElementById("sportMenu");
const sportIcon = document.getElementById("sportIcon");
const sportLabel = document.getElementById("sportLabel");

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
    closeSportMenu();
  });
  item.appendChild(option);
  sportMenu.appendChild(item);
});

sportMenu.querySelector(`[data-id="${selectedSport.id}"]`).setAttribute("aria-selected", "true");
renderSportTrigger();

sportTrigger.addEventListener("click", (event) => {
  event.stopPropagation();
  if (sportMenu.hidden) openSportMenu();
  else closeSportMenu();
});

document.addEventListener("click", (event) => {
  if (!sportSelect.contains(event.target)) closeSportMenu();
});

document.getElementById("addPlayer").addEventListener("click", () => {
  const player = createPlayer();
  player.input.focus();
});
document.getElementById("splitTeam").addEventListener("click", renderResult);

createPlayer();
createPlayer();
