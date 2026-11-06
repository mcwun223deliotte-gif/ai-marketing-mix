const NAV = [
  { id: "dashboard", label: "Dashboard" },
  { id: "plan", label: "Plan" },
  { id: "competitors", label: "Competitors" },
  { id: "guardrails", label: "Guardrails" },
  { id: "opportunities", label: "Opportunities" },
  { id: "reporting", label: "Reporting" }
];

const CHANNELS = [
  ["paid search", "Search"],
  ["search", "Search"],
  ["display", "Display"],
  ["social", "Social"],
  ["television", "TV"],
  ["tv", "TV"],
  ["e-mail", "Email"],
  ["email", "Email"],
  ["direct mail", "Direct"],
  ["direct", "Direct"],
  ["outdoor", "Outdoor"],
  ["branch", "Branch"],
  ["app", "App"]
];

const SEGMENTS = [
  [/mass[-\s]?affluent/i, "Mass-affluent"],
  [/homeowners?/i, "Homeowners"],
  [/legacy circle/i, "Legacy Circle"],
  [/cardholders?/i, "Cardholders"],
  [/retirees?/i, "Retirees"],
  [/families/i, "Families"],
  [/millennials?/i, "Millennials"],
  [/mass market/i, "Mass market"]
];

const ASK = {
  objective: ["Objective", "What should this campaign achieve?"],
  channels: ["Channels", "Which channels should it use?"],
  segment: ["Segment", "Which segment is it for?"],
  target: ["Target", "Who is the target, and how many?"]
};

const SEEDS = [
  {
    id: "spring",
    name: "Spring Home email",
    sits: "Draft",
    wanted: "HK$1.2m at 3×, from homeowners",
    read: "Meets",
    detail: "The panel reads about 3.4× if brand search is left alone and the email goes to people who stopped."
  },
  {
    id: "legacy",
    name: "Legacy Circle",
    sits: "Launched",
    wanted: "Invite-only. No extra spend.",
    read: "Meets",
    detail: "It is doing what the brand asked. It stays off any new public plan."
  },
  {
    id: "cash",
    name: "Mass-affluent cashback search",
    sits: "Idea",
    wanted: "More applications from search",
    read: "Does not meet",
    detail: "Search is at 0.9×, and the position says the bank does not chase the loudest cashback."
  },
  {
    id: "cards",
    name: "Card keyword defence",
    sits: "Idea",
    wanted: "Close an 18-point gap",
    read: "Open",
    detail: "Shift about HK$0.6m onto terms already published. No new offer, so the guardrail can pass it."
  }
];

const DEFAULTS = {
  view: "dashboard",
  openRec: "",
  idea: "",
  objective: "",
  channels: "",
  segment: "",
  target: "",
  planPhase: "write",
  planError: "",
  justSaved: false,
  compQuery: "",
  compPhase: "ready",
  compError: "",
  brand: "Plain language. No hype, no fear, no fake urgency. Legacy Circle stays invite-only. We do not invent an offer we do not already have.",
  position: "Everyday banking for the mass market. Mortgages and cards for the mass-affluent. We do not chase the loudest cashback in the market.",
  likes: "Homeowners here answer to a clear rate more than to a lifestyle film. Cardholders look up the fee and the cashback before they look up the brand.",
  income: "Mass-affluent means household income from about HK$80,000 a month. The mass market sits below that.",
  weather: "6 November is dry and mild. Branch and outdoor traffic can run. Nothing is held for a typhoon.",
  other: "A rate cut is being talked about and is lifting mortgage intent. It has not been announced. Rivals are buying card keywords.",
  saved: []
};

const state = Object.assign({}, DEFAULTS, read());
state.saved = Array.isArray(state.saved) ? state.saved : [];
if (state.planPhase === "reading") state.planPhase = "write";
if (state.compPhase === "reading") state.compPhase = "ready";

let timer = 0;

function read() {
  try { return JSON.parse(localStorage.getItem("ai-mmm-2") || "{}"); }
  catch (e) { return {}; }
}
function save() {
  const copy = Object.assign({}, state);
  if (copy.planPhase === "reading") copy.planPhase = "write";
  if (copy.compPhase === "reading") copy.compPhase = "ready";
  localStorage.setItem("ai-mmm-2", JSON.stringify(copy));
}
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}
function firstSentence(s) {
  const t = String(s || "").trim();
  if (!t) return "";
  const matched = t.match(/^[\s\S]*?[.?!](?:\s|$)/);
  const cut = (matched ? matched[0] : t).trim();
  return cut.length > 160 ? cut.slice(0, 157) + "…" : cut;
}
function later(fn, ms) {
  clearTimeout(timer);
  timer = setTimeout(fn, ms);
}

function parse(text) {
  const raw = String(text || "").trim();
  const found = [];
  CHANNELS.forEach(([key, label]) => {
    const re = new RegExp("\\b" + key.replace(/\s+/g, "\\s+") + "\\b", "i");
    if (re.test(raw) && found.indexOf(label) === -1) found.push(label);
  });
  let segment = "";
  SEGMENTS.forEach(([re, label]) => {
    if (!segment && re.test(raw)) segment = label;
  });
  const objRe = /HK\$|\b\d+(?:\.\d+)?\s*[×x]\b|\bROI\b|\breturn\b|achieve|objective|\bgoal\b|applications|sign-?ups|bring in|get more|\bgrow\b|incremental/i;
  const objective = objRe.test(raw) ? sentenceWith(raw, objRe) : "";
  const targetRe = /\b\d{1,3}(?:,\d{3})+\s*(?:people|customers|households|homeowners)?|\b\d{2,}\s*(?:people|customers|households|homeowners)\b|people who [^.]{3,70}|customers who [^.]{3,70}|anyone who [^.]{3,70}/i;
  const tm = raw.match(targetRe);
  const target = tm ? tm[0].trim() : "";
  const missing = [];
  if (!objective) missing.push("objective");
  if (!found.length) missing.push("channels");
  if (!segment) missing.push("segment");
  if (!target) missing.push("target");
  return { channels: found.join(", "), segment, objective, target, missing };
}
function sentenceWith(text, re) {
  const parts = (text.match(/[^.?!]+[.?!]?/g) || [text]).map((s) => s.trim()).filter(Boolean);
  return (parts.find((s) => re.test(s)) || text).trim();
}
function resolved() {
  const p = parse(state.idea);
  return {
    objective: (state.objective || "").trim() || p.objective,
    channels: (state.channels || "").trim() || p.channels,
    segment: (state.segment || "").trim() || p.segment,
    target: (state.target || "").trim() || p.target
  };
}

function cashHeld() {
  return /loudest cashback|do not chase/.test((state.position || "").toLowerCase());
}
function hikeLanded() {
  return /hike has landed|rate has risen|rates have risen/.test(((state.other || "") + " " + (state.weather || "")).toLowerCase());
}
function badWeather() {
  const text = ((state.weather || "") + "\n" + (state.other || "")).toLowerCase()
    .replace(/nothing is held for a typhoon/g, "")
    .replace(/no typhoon/g, "")
    .replace(/not held for a typhoon/g, "");
  return /signal\s*8|heavy rain|typhoon/.test(text);
}

function recommendations() {
  const held = cashHeld();
  const hike = hikeLanded();
  return [
    {
      id: "cashback",
      q: "Scale search for mass-affluent cashback?",
      why: held
        ? "Search is at 0.9×. The position you wrote also refuses the loudest cashback."
        : "Search is at 0.9× on HK$12.4 million. Another tranche buys very little.",
      held: held,
      answer: held
        ? "Leave it. The curve is flat, and a louder cashback would break the position. If those customers still need to be reached, defend the terms already published and cap the test."
        : "The curve is flat. The panel supports a small test on the exact terms rivals own, and nothing larger.",
      idea: "Scale search for mass-affluent cashback."
    },
    {
      id: "tv",
      q: "Cut TV after the rate hike?",
      why: hike
        ? "The reality check now says the hike has landed. Last week’s 2.4× needs another read before money moves."
        : "A hike is only being talked about. It is not in the panel. TV is still returning 2.4×.",
      held: false,
      answer: hike
        ? "Hold both the cut and any extra TV until the panel is rebuilt with the hike in it. The old 2.4× is no longer a reason to scale."
        : "Leave TV where it is. It is still below the curve. Revisit the cut only if the hike is announced and intent drops.",
      idea: "Decide whether to cut TV after a rate hike."
    },
    {
      id: "rivals",
      q: "Rivals are outranking us on card keywords — what do we do?",
      why: "They lead by 18 points on cashback and annual-fee terms.",
      held: false,
      answer: "Shift about HK$0.6 million from generic brand search onto the card terms already published. Keep the current rate. That closes the gap without inventing an offer.",
      idea: "Rivals are outranking us on card keywords. Defend the card terms we already publish, with search, for cardholders."
    }
  ];
}

function guard(blob) {
  const notes = [];
  const brand = (state.brand || "").toLowerCase();
  const position = (state.position || "").toLowerCase();
  if (/legacy/.test(blob) && /invite/.test(brand)) {
    notes.push("Brand holds this. Legacy Circle stays invite-only, so a public push stops here.");
  }
  if (/cashback/.test(blob) && /loudest cashback|do not chase/.test(position)) {
    notes.push("Position holds this. The bank does not chase the loudest cashback, so scaling that search stops here.");
  }
  if (/(limited time|act now|don.?t miss|fear)/.test(blob) && /no hype|no fear/.test(brand)) {
    notes.push("Brand holds this. The note depends on urgency or fear, and the brand refuses both.");
  }
  return {
    held: notes.length > 0,
    notes: notes.length ? notes : ["Fits the brand and the position written in Guardrails."]
  };
}

function analyze() {
  const heard = resolved();
  const blob = [state.idea, heard.objective, heard.channels, heard.segment, heard.target].join(" \n ").toLowerCase();
  const g = guard(blob);
  const risks = [];
  let headline, figure, times, lead, read;

  if (g.held && /legacy/.test(blob)) {
    headline = "Leave Legacy Circle as it is.";
    figure = "HK$0";
    times = "Held by the brand";
    read = "Held";
    lead = "The note reaches " + (heard.segment || "Legacy Circle") + ". The brand keeps that circle invite-only, so there is no public spend to estimate.";
    risks.push("A public line would break the brand note already on file.");
    risks.push("Compliance is already reviewing this franchise.");
  } else if (g.held && /cashback/.test(blob)) {
    headline = "Do not scale cashback search.";
    figure = "HK$0";
    times = "Held by position";
    read = "Held";
    lead = "The plan puts " + (heard.channels || "search") + " in front of " + (heard.segment || "that segment") + ". Position refuses a louder cashback, and search on those terms is already at 0.9×. The estimate is no extra spend.";
    risks.push("Search is at the ceiling. HK$12.4 million is returning 0.9×.");
    risks.push("Rivals already lead those terms by 18 points. Matching their rate would break position.");
  } else if (/homeowner|mortgage/.test(blob) && /email/.test(blob)) {
    headline = "The unfinished-mortgage email is the part that pays.";
    figure = "HK$1.1m";
    times = "About 3.4× over 13 weeks";
    read = "Meets";
    lead = "You want " + (heard.objective || "a return") + ". Channels: " + (heard.channels || "email") + ". Target: " + (heard.target || "the people named in the note") + ". Leave brand search where it is. The short email to people who started and stopped is the spend that still returns, after the rate talk and the rivals are taken out.";
    risks.push("A rival is already running Home Rate search at the same homeowners.");
    risks.push("The rate conversation is lifting intent. It comes out of the number, because it is not media.");
  } else if (/\bsearch\b/.test(blob) && !/email/.test(blob)) {
    headline = "More search does not pay for itself.";
    figure = "HK$0.4m";
    times = "About 0.9×";
    read = "Does not meet";
    lead = heard.channels + " aimed at " + (heard.segment || "the segment in the note") + ", to achieve " + (heard.objective || "the aim in the note") + ". This week’s panel has search at 0.9×. Adding to it misses that aim.";
    risks.push("The curve is flat. A larger tranche buys little incremental reach.");
    risks.push("Rivals outrank the bank on the terms a new search plan would need.");
  } else {
    headline = "Keep the test to one segment and one job.";
    figure = "HK$0.8m";
    times = "About 2.2× if it stays this narrow";
    read = "Open";
    lead = (heard.channels || "The channels in the note") + " for " + (heard.segment || "one segment") + ", target " + (heard.target || "the people named") + ", aiming at " + (heard.objective || "the aim you wrote") + ". The panel can carry a narrow test. A mix of jobs will be credited for demand the season is already creating.";
    risks.push("A wide channel list borrows from the rate talk and from New Year demand.");
  }

  if (/mass-affluent|cardholder/.test(blob) && (state.income || "").trim()) {
    risks.push("Income on file: " + firstSentence(state.income));
  }
  if (badWeather()) {
    risks.push("Weather on file says outdoor and branch work should wait.");
  } else if ((state.other || "").trim()) {
    risks.push(firstSentence(state.other));
  }
  risks.push("Marketing and finance still sign before anything is spent.");

  return { headline, figure, times, lead, risks: risks.filter(Boolean).slice(0, 4), read, heard, guard: g };
}

function marketFindings(query) {
  const blob = (query || "").toLowerCase();
  const rows = [];
  if (/mortgage|homeowner|green mortgage|home rate|spring home/.test(blob)) {
    rows.push(["A rival bank · Home Rate", "In market", "Search against homeowners, rate in the headline, live since October."]);
    rows.push(["Your draft · Spring Home", "Already yours", "Same homeowners. The email path is the part that meets its number. Their search is the crowded part."]);
  }
  if (/cashback|card|mass-affluent|mass affluent|annual fee|keyword/.test(blob)) {
    rows.push(["Two card issuers", "In market", "Cashback and annual-fee terms. They lead by about 18 points this week."]);
    rows.push(["Your idea · card keyword defence", "Not launched", "No cashback burst of yours is live. Defending the published terms does not require a new rate."]);
  }
  if (/email|abandon|did not finish|unfinished|started and stopped|follow-up|follow up/.test(blob)) {
    rows.push(["Unfinished-application email", "Clear", "No rival is running a short follow-up to a mortgage someone started and left."]);
  }
  if (/\btv\b|television|brand film/.test(blob)) {
    rows.push(["Two retail banks", "On air", "Always-on brand television. Their spots are louder on cashback than yours."]);
  }
  if (/legacy/.test(blob)) {
    rows.push(["Legacy-style private circles", "Quiet", "Rivals do not advertise these. Yours is already launched, and the brand keeps it invite-only."]);
  }
  return rows;
}

function opportunities() {
  const mine = state.saved.filter((item) => !SEEDS.some((seed) => seed.id === item.id));
  return mine.concat(SEEDS);
}

function shell() {
  const nav = NAV.map((item) => {
    const active = state.view === item.id ? " active" : "";
    return `<button class="nav-item${active}" data-nav="${item.id}">${item.label}</button>`;
  }).join("");
  document.getElementById("app").innerHTML = `
    <div class="app">
      <aside class="sidebar">
        <img class="logo" src="logo.png" alt="D.">
        ${nav}
      </aside>
      <main class="main" id="main"></main>
    </div>`;
  document.querySelector(".sidebar").addEventListener("click", (event) => {
    const btn = event.target.closest("[data-nav]");
    if (btn) go(btn.dataset.nav);
  });
}

function go(view) {
  clearTimeout(timer);
  capture();
  if (state.planPhase === "reading") state.planPhase = "write";
  if (state.compPhase === "reading") state.compPhase = "ready";
  state.view = view;
  state.planError = "";
  state.compError = "";
  save();
  paint(true);
}

function capture() {
  document.querySelectorAll("[data-field]").forEach((el) => {
    state[el.dataset.field] = el.value;
  });
}

function header(eyebrow, title, dek, quiet) {
  return `
    <p class="eyebrow">${eyebrow}</p>
    <h1 class="page-title">${title}</h1>
    <p class="dek">${dek}</p>
    <div class="status">
      <span class="live"><i class="dot"></i>Live</span>
      <span class="quiet"><i class="dot gray"></i>${quiet}</span>
    </div>`;
}
function next(label, id) {
  return `<p class="next">Next, <button type="button" data-jump="${id}">${label}</button>.</p>`;
}
function ev(name, value, note) {
  return `<div class="ev"><div class="ev-top"><span>${esc(name)}</span><b>${esc(value)}</b></div><p>${esc(note)}</p></div>`;
}
function field(key, label, value, short) {
  return `<div class="field">
    <label for="${key}">${label}</label>
    <textarea class="prose${short ? " short" : ""}" id="${key}" data-field="${key}" rows="2">${esc(value)}</textarea>
  </div>`;
}

function dashboard() {
  const recs = recommendations();
  const open = state.openRec;
  return `
    ${header("Dashboard", "What needs a decision", "Three questions from this week’s panel. Under them, the gaps and the openings. A campaign starts at the bottom.", "Week of 6 Nov 2026")}
    <article class="sheet">
      <div class="letterhead"></div>
      <div class="masthead">
        <div class="brand"><i class="pip"></i>From the model</div>
        <div class="meta-date">Held means it fights the guardrail</div>
      </div>
      ${recs.map((rec) => `
        <div class="q-block${open === rec.id ? " open" : ""}">
          <button type="button" class="q" data-rec="${rec.id}">
            <span>
              <h2>${esc(rec.q)}</h2>
              <p>${esc(rec.why)}</p>
            </span>
            <span class="q-side"><span class="${rec.held ? "held" : "fit"}">${rec.held ? "Held" : "Fits"}</span></span>
          </button>
          ${open === rec.id ? `<div class="q-more"><p>${esc(rec.answer)}</p><button type="button" class="text-btn" data-plan="${rec.id}">Plan this</button></div>` : ""}
        </div>`).join("")}
    </article>
    <article class="sheet">
      <div class="masthead">
        <div class="brand">Gaps and openings</div>
        <div class="meta-date">This week’s panel</div>
      </div>
      <div class="writing">
        <div class="cols">
          <section>
            <h2>Gaps</h2>
            ${ev("Brand search", "0.9×", "HK$12.4 million is in market. More money there does not bring more homeowners.")}
            ${ev("Unfinished mortgages", "No follow-up", "People who start and stop are not hearing from the bank.")}
            ${ev("Card terms", "Absent", "Fees and cashback the bank already publishes are missing from search, so rivals look like the only name.")}
          </section>
          <section>
            <h2>Openings</h2>
            ${ev("Spring Home email", "Room", "A short note to people who started and stopped. Plain language, small cost.")}
            ${ev("Published card terms", "HK$0.6m", "Put the fee waiver and the current cashback into search. No new rate.")}
            ${ev("Legacy Circle", "Leave it", "Invite-only, already launched, no extra spend.")}
          </section>
        </div>
        <p class="close">Guardrail in force. ${esc(firstSentence(state.position))} ${esc(firstSentence(state.weather))}</p>
      </div>
    </article>
    ${planComposer("Start a campaign")}
    ${next("check who else is in market", "competitors")}`;
}

function planComposer(title) {
  if (state.planPhase === "answer" && state.idea.trim()) {
    const a = analyze();
    return `
      <article class="sheet">
        <div class="masthead">
          <div class="brand">${esc(title)}</div>
          <div class="meta-date">${esc(a.figure)} · ${esc(a.times)}</div>
        </div>
        <div class="writing">
          <p class="lead">${esc(a.headline)}</p>
          <div class="send">
            <button class="ask" type="button" data-jump="plan">Read the estimate</button>
          </div>
        </div>
      </article>`;
  }
  if (state.planPhase === "ask" && state.idea.trim()) {
    return `
      <article class="sheet">
        <div class="masthead"><div class="brand">${esc(title)}</div></div>
        <div class="writing">
          <p class="lead">The note is in. A few facts are still missing before an estimate.</p>
          <div class="send"><button class="ask" type="button" data-jump="plan">Add them</button></div>
        </div>
      </article>`;
  }
  return `
    <article class="sheet">
      <div class="letterhead"></div>
      <div class="masthead">
        <div class="brand"><i class="pip"></i>${esc(title)}</div>
        <div class="meta-date">Step 1 · in your own words</div>
      </div>
      <div class="writing">
        <div class="field">
          <label for="idea">The campaign</label>
          <textarea class="prose" id="idea" data-field="idea" rows="4" placeholder="Write the campaign in your own words.">${esc(state.idea)}</textarea>
        </div>
        <div class="send">
          <button class="ask" id="continue" type="button">Continue</button>
          <p class="fine">If the objective, channels, segment, or target are missing, the next step asks for them.</p>
        </div>
        ${state.planError ? `<p class="fine warn">${esc(state.planError)}</p>` : ""}
      </div>
    </article>`;
}

function plan() {
  if (state.planPhase === "reading") return reading("Plan", "Reading the plan.");
  if (state.planPhase === "ask") return askStep();
  if (state.planPhase === "answer") return answerStep();
  return `
    ${header("Plan", "What are you planning?", "Write the campaign in ordinary language. Objective, channels, segment, and target are read from the note. Anything missing is asked next, before an estimate.", "Step 1")}
    ${planComposer("The brief")}
    ${next("check who else is in market", "competitors")}`;
}

function askStep() {
  const heard = parse(state.idea);
  const need = heard.missing;
  const known = ["objective", "channels", "segment", "target"].filter((key) => need.indexOf(key) === -1);
  const heardValue = {
    objective: heard.objective,
    channels: heard.channels,
    segment: heard.segment,
    target: heard.target
  };
  return `
    ${header("Plan", "A few things are missing", "The note did not name everything the estimate needs. Only the gaps are asked.", "Step 2")}
    <article class="sheet">
      <div class="letterhead"></div>
      <div class="writing">
        <blockquote class="quote">${esc(state.idea)}</blockquote>
        ${known.length ? `<div class="heard"><h2>Already in the note</h2><div class="wrote">${known.map((key) => `<div><em>${ASK[key][0]}.</em>${esc(heardValue[key])}</div>`).join("")}</div></div>` : ""}
        ${need.map((key) => field(key, ASK[key][1], state[key] || "", true)).join("")}
        <div class="send">
          <button class="ask" id="estimate" type="button">Estimate this</button>
          <button class="ask quiet" id="edit-note" type="button">Edit the note</button>
        </div>
        ${state.planError ? `<p class="fine warn">${esc(state.planError)}</p>` : ""}
        <p class="fine">Nothing is spent from this page.</p>
      </div>
    </article>`;
}

function answerStep() {
  const a = analyze();
  const h = a.heard;
  return `
    ${header("Plan", "Estimated result", "Read from the note, then from this week’s panel and the guardrails. Marketing and finance still sign.", a.read)}
    <article class="sheet">
      <div class="letterhead"></div>
      <div class="doc">
        <div class="memo">
          <div class="kicker">
            <span>6 Nov 2026 · Answer to the note</span>
            <strong>${a.guard.held ? "Held by a guardrail" : "Waiting on marketing and finance"}</strong>
          </div>
          <h2 class="headline">${esc(a.headline)}</h2>
          <div class="lead-row">
            <p class="lead">${esc(a.lead)}</p>
            <div class="result">
              <p class="figure">${esc(a.figure)}</p>
              <p>incremental, this read</p>
              <p class="times">${esc(a.times)}</p>
            </div>
          </div>
          <hr class="rule">
          <div class="cols">
            <section>
              <h2>Risks</h2>
              ${a.risks.map((risk) => `<div class="ev"><p>${esc(risk)}</p></div>`).join("")}
            </section>
            <section>
              <h2>Guardrail</h2>
              ${a.guard.notes.map((note) => `<div class="ev"><p>${esc(note)}</p></div>`).join("")}
              <div class="ev"><p>${esc(firstSentence(state.likes))}</p></div>
            </section>
          </div>
          <div class="send">
            <button class="ask" id="keep" type="button">${state.justSaved ? "Saved to opportunities" : "Keep as an opportunity"}</button>
            <button class="ask quiet" id="edit-note" type="button">Edit the note</button>
          </div>
          <p class="close">Figures are this week’s panel, read against the guardrails. Nothing is spent from this page.</p>
        </div>
        <aside class="rail">
          ${railInput("objective", "Objective", h.objective)}
          ${railInput("channels", "Channels", h.channels)}
          ${railInput("segment", "Segment", h.segment)}
          ${railInput("target", "Target", h.target)}
          <div class="send"><button class="text-btn" id="reestimate" type="button">Update the estimate</button></div>
        </aside>
      </div>
    </article>
    ${next("check who else is in market", "competitors")}`;
}
function railInput(key, label, value) {
  return `<label class="prop"><span>${label}</span><textarea class="prose short rail-text" data-field="${key}" rows="2">${esc(value)}</textarea></label>`;
}

function reading(eyebrow, title) {
  return `
    ${header(eyebrow, title, "The note, the missing facts, then this week’s panel and the guardrails.", "Working")}
    <article class="sheet">
      <div class="letterhead"></div>
      <div class="memo reading">
        <h2 class="headline">${esc(title)}</h2>
        <ol>
          <li class="on"><i class="tick"></i>What you wrote</li>
          <li class="on"><i class="tick"></i>Objective, channels, segment, target</li>
          <li class="on"><i class="tick"></i>Guardrails and this week’s panel</li>
        </ol>
      </div>
    </article>`;
}

function competitors() {
  const query = state.compQuery;
  const body = state.compPhase === "reading"
    ? `<div class="memo reading">
        <h2 class="headline">Checking the market.</h2>
        <ol>
          <li class="on"><i class="tick"></i>The campaign or the target</li>
          <li class="on"><i class="tick"></i>Rivals in market this week</li>
          <li class="on"><i class="tick"></i>Your drafts and what is already launched</li>
        </ol>
      </div>`
    : state.compPhase === "answer"
      ? competitorAnswer(query)
      : `<div class="writing">
          <div class="field">
            <label for="compQuery">Campaign or target</label>
            <textarea class="prose" id="compQuery" data-field="compQuery" rows="3" placeholder="A mortgage push to homeowners, or cashback keywords for the mass-affluent.">${esc(query)}</textarea>
          </div>
          <div class="send">
            <button class="ask" id="check-market" type="button">Check the market</button>
            ${state.idea.trim() ? `<button class="ask quiet" id="use-idea" type="button">Use the campaign I just wrote</button>` : ""}
          </div>
          ${state.compError ? `<p class="fine warn">${esc(state.compError)}</p>` : ""}
        </div>`;
  return `
    ${header("Competitors", "Who else is doing this?", "A quick read on similar campaigns and similar targets, in market and among your drafts.", "This week")}
    <article class="sheet">
      <div class="letterhead"></div>
      ${state.compPhase === "ready" ? "" : `<div class="masthead"><div class="brand"><i class="pip"></i>${esc(query || "Market")}</div><div class="meta-date">6 Nov 2026</div></div>`}
      ${body}
    </article>
    ${next("set what the model must respect", "guardrails")}`;
}

function competitorAnswer(query) {
  const rows = marketFindings(query);
  const crowded = rows.some((row) => row[1] === "In market" || row[1] === "On air");
  const headline = rows.length === 0
    ? "Nothing close is in market."
    : crowded
      ? "This target is already busy."
      : "The close path is clear.";
  const lead = rows.length === 0
    ? "No live campaign this week matches the note. The ambient pressure is still card keywords, and that is a different target."
    : crowded
      ? "Someone is already spending against a similar person. The useful question is which part of your plan sits in their space, and which part is still empty."
      : "What turned up is either yours already, or a path rivals have left alone.";
  return `
    <div class="memo">
      <h2 class="headline">${headline}</h2>
      <p class="lead" style="margin-top:12px">${lead}</p>
      <hr class="rule">
      <h2 class="block-title">What turned up</h2>
      ${rows.length ? rows.map((row) => ev(row[0], row[1], row[2])).join("") : ev("Card keywords", "Busy, different target", "Rivals lead cashback and annual-fee terms by 18 points. That does not overlap this note.")}
      <div class="send">
        <button class="ask quiet" id="check-again" type="button">Check a different one</button>
      </div>
      <p class="close">Compared with what you have launched or in draft. ${esc(firstSentence(state.position))}</p>
    </div>`;
}

function guardrails() {
  return `
    ${header("Guardrails", "What the model must respect", "Two limits. The brand and the position decide what may be recommended. The reality check takes local habit, income, weather, and anything else out of the glory.", "Used on every read")}
    <article class="sheet">
      <div class="letterhead"></div>
      <div class="masthead">
        <div class="brand"><i class="pip"></i>Brand and position</div>
        <div class="meta-date">Recommendations that fight this are held</div>
      </div>
      <div class="writing">
        ${field("brand", "Brand", state.brand, true)}
        ${field("position", "Strategic position", state.position, true)}
        <p class="fine">The dashboard, the estimate, the rival check, and the cards all read this.</p>
      </div>
    </article>
    <article class="sheet">
      <div class="masthead">
        <div class="brand">Reality check</div>
        <div class="meta-date">Taken out of every estimate</div>
      </div>
      <div class="writing">
        ${field("likes", "What this market actually responds to", state.likes, true)}
        ${field("income", "Income", state.income, true)}
        ${field("weather", "Weather and season", state.weather, true)}
        ${field("other", "Anything else that should change a decision", state.other, true)}
      </div>
    </article>
    ${next("see the cards against what you wanted", "opportunities")}`;
}

function opportunityPage() {
  const items = opportunities();
  return `
    ${header("Opportunities", "On the table", "Every card, set beside what is launched or still in draft, and beside the result you said you wanted.", "Compared")}
    <article class="sheet">
      <div class="letterhead"></div>
      <div class="writing" style="padding-bottom:8px">
        <p class="lead">${esc(compareLine(items))}</p>
      </div>
      <div class="opp-head"><span>Opportunity</span><span>Sits in</span><span>You wanted</span><span>Against that</span></div>
      ${items.map((item) => `
        <article class="opp">
          <div>
            <h3>${esc(item.name)}</h3>
            <p>${esc(item.detail)}</p>
          </div>
          <div class="sits">${esc(item.sits)}</div>
          <div class="wanted">${esc(item.wanted)}</div>
          <div class="read${item.read === "Meets" ? " yes" : ""}">${esc(item.read)}</div>
        </article>`).join("")}
    </article>
    ${next("read the week", "reporting")}`;
}

function joinNames(names) {
  if (names.length <= 1) return names[0] || "";
  if (names.length === 2) return names[0] + " and " + names[1];
  return names.slice(0, -1).join(", ") + ", and " + names[names.length - 1];
}
function compareLine(items) {
  const groups = [
    [items.filter((item) => item.sits === "Launched"), " is already launched.", " are already launched."],
    [items.filter((item) => item.sits === "Draft" && item.read === "Meets"), " is a draft that meets what you asked for.", " are drafts that meet what you asked for."],
    [items.filter((item) => item.read === "Held"), " is held by a guardrail.", " are held by a guardrail."],
    [items.filter((item) => item.read === "Does not meet"), " does not meet the number.", " do not meet the number."],
    [items.filter((item) => item.read === "Open"), " is still open.", " are still open."]
  ];
  return groups.filter((group) => group[0].length).map((group) => {
    const names = joinNames(group[0].map((item) => item.name));
    return names + (group[0].length > 1 ? group[2] : group[1]);
  }).join(" ");
}

function reporting() {
  return `
    ${header("Reporting", "The week in numbers", "Return by channel, the 13-week forecast, what price is allowed to do, and what is moving underneath.", "Week of 6 Nov 2026")}
    <article class="sheet">
      <div class="letterhead"></div>
      <div class="memo">
        <div class="kicker">
          <span>6 Nov 2026 · Weekly note</span>
          <strong>After influences</strong>
        </div>
        <div class="figures">
          <div><b>0.9×</b><span>Search, at the ceiling</span></div>
          <div><b>2.4×</b><span>TV, still working</span></div>
          <div><b>3.1×</b><span>Email, room left</span></div>
          <div><b>HK$1.1m</b><span>13-week base forecast</span></div>
        </div>
        <hr class="rule">
        <h2 class="block-title">Return</h2>
        <div class="table-head" style="margin-top:12px"><span>Channel</span><span>In market</span><span>Return</span><span>Read</span></div>
        ${trow("Search", "HK$12.4m", "0.9×", "At the ceiling on brand terms.")}
        ${trow("TV", "HK$11.2m", "2.4×", "Still below the curve. No promo attached.")}
        ${trow("Email", "HK$1.8m", "3.1×", "The cap finance set is doing the work.")}
        ${trow("Display", "HK$6.1m", "1.4×", "Holding. No rival pressure.")}
        ${trow("Social", "HK$9.8m", "1.1×", "Thin, and a rival burst sits on top of prospecting.")}
        <hr class="rule">
        <div class="cols">
          <section>
            <h2>Forecast, 13 weeks</h2>
            ${ev("Base", "HK$1.1m", "Spring Home email runs. Brand search is not increased. Rate talk is held out.")}
            ${ev("If search is scaled", "HK$0.4m", "About 0.9×. It misses a 3× ask.")}
            ${ev("If card terms are defended", "Unproven", "HK$0.6m moved, current rate only. Capped until it shows a return.")}
          </section>
          <section>
            <h2>Price</h2>
            ${ev("Green mortgage", "Cleared rate only", "Quote the rate compliance has cleared. A teaser stays out of the ads.")}
            ${ev("Cashback", "Published rate", "Matching a rival’s headline rate would break position.")}
            ${ev("Annual fee", "Waiver already live", "Say it in the keyword defence. Do not add a second waiver.")}
          </section>
        </div>
        <hr class="rule">
        <h2 class="block-title">What is moving</h2>
        ${ev("Mortgage intent", "+4%", "From rate-cut talk. Held out, so media is not credited for it.")}
        ${ev("New Year", "+12% demand", "Not in market yet. Held in the baseline.")}
        ${ev("Card terms", "Rivals +18 pts", "Share of voice on cashback and annual-fee words, this week.")}
        <p class="close">${esc(firstSentence(state.weather))} ${esc(firstSentence(state.other))} Figures are this week’s panel.</p>
      </div>
    </article>`;
}
function trow(a, b, c, d) {
  return `<div class="trow"><span>${a}</span><span>${b}</span><b>${c}</b><span>${d}</span></div>`;
}

function continuePlan() {
  capture();
  state.objective = "";
  state.channels = "";
  state.segment = "";
  state.target = "";
  state.justSaved = false;
  state.planError = "";
  if (!state.idea.trim()) {
    state.planError = "Write the campaign first.";
    paint(false);
    return;
  }
  state.view = "plan";
  if (parse(state.idea).missing.length) {
    state.planPhase = "ask";
    save();
    paint(true);
    return;
  }
  readThenAnswer();
}

function estimatePlan() {
  capture();
  const missing = parse(state.idea).missing.filter((key) => !(state[key] || "").trim());
  if (missing.length) {
    state.planError = "Add the " + missing.map((key) => ASK[key][0].toLowerCase()).join(", ") + ".";
    paint(false);
    return;
  }
  readThenAnswer();
}

function readThenAnswer() {
  state.justSaved = false;
  state.planError = "";
  state.view = "plan";
  state.planPhase = "reading";
  save();
  paint(true);
  later(() => {
    state.planPhase = "answer";
    save();
    paint(true);
  }, 1200);
}

function keepOpportunity() {
  const a = analyze();
  const name = shortName();
  const item = {
    id: "u-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 36),
    name: name,
    sits: "Draft",
    wanted: a.heard.objective || "See the note",
    read: a.read,
    detail: a.headline + " " + a.figure + " · " + a.times + "."
  };
  state.saved = state.saved.filter((row) => row.id !== item.id);
  state.saved.unshift(item);
  state.justSaved = true;
  save();
  paint(false);
}

function shortName() {
  const t = state.idea.trim().replace(/\s+/g, " ");
  if (!t) return "Untitled campaign";
  const cut = t.split(/[.?!]/)[0];
  return cut.length > 72 ? cut.slice(0, 69) + "…" : cut;
}

function runComp() {
  capture();
  if (!state.compQuery.trim()) {
    state.compError = "Name a campaign or a target first.";
    paint(false);
    return;
  }
  state.compError = "";
  state.compPhase = "reading";
  save();
  paint(true);
  later(() => {
    state.compPhase = "answer";
    save();
    paint(true);
  }, 900);
}

function bind() {
  document.querySelectorAll("textarea.prose").forEach((el) => {
    const fit = () => {
      el.style.height = "auto";
      el.style.height = Math.max(el.scrollHeight, el.classList.contains("short") ? 56 : 84) + "px";
    };
    fit();
    el.addEventListener("input", () => {
      capture();
      fit();
      save();
    });
  });
  document.querySelectorAll("input[data-field]").forEach((el) => {
    el.addEventListener("input", () => { capture(); save(); });
  });
  const on = (id, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", fn);
  };
  on("continue", continuePlan);
  on("estimate", estimatePlan);
  on("reestimate", () => { capture(); readThenAnswer(); });
  on("edit-note", () => {
    capture();
    state.planPhase = "write";
    state.planError = "";
    state.justSaved = false;
    save();
    paint(true);
  });
  on("keep", keepOpportunity);
  on("check-market", runComp);
  on("check-again", () => {
    state.compPhase = "ready";
    state.compError = "";
    save();
    paint(true);
  });
  on("use-idea", () => {
    state.compQuery = state.idea;
    state.compError = "";
    save();
    paint(false);
  });
  document.querySelectorAll("[data-jump]").forEach((btn) => {
    btn.addEventListener("click", () => go(btn.dataset.jump));
  });
  document.querySelectorAll("[data-rec]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.openRec = state.openRec === btn.dataset.rec ? "" : btn.dataset.rec;
      paint(false);
    });
  });
  document.querySelectorAll("[data-plan]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const rec = recommendations().find((item) => item.id === btn.dataset.plan);
      if (!rec) return;
      state.idea = rec.idea;
      state.objective = "";
      state.channels = "";
      state.segment = "";
      state.target = "";
      state.planPhase = "write";
      state.planError = "";
      state.justSaved = false;
      state.view = "plan";
      save();
      paint(true);
    });
  });
}

const VIEWS = {
  dashboard: dashboard,
  plan: plan,
  competitors: competitors,
  guardrails: guardrails,
  opportunities: opportunityPage,
  reporting: reporting
};

function paint(scroll) {
  document.querySelectorAll(".sidebar [data-nav]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.nav === state.view);
  });
  document.getElementById("main").innerHTML = (VIEWS[state.view] || dashboard)();
  bind();
  const label = (NAV.find((item) => item.id === state.view) || {}).label || "Dashboard";
  document.title = "AI Marketing Mix · " + label;
  if (scroll) window.scrollTo(0, 0);
}

shell();
paint(false);
