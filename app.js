const NAV = [
  { id: "plan", label: "Plan" },
  { id: "recommendation", label: "Recommendation" },
  { id: "overview", label: "Overview" },
  { id: "media", label: "Media spend" },
  { id: "influences", label: "Influences" },
  { id: "competitive", label: "Competitive" },
  { id: "section", label: "INSIGHT" },
  { id: "model", label: "Model" },
  { id: "opportunities", label: "Opportunities" },
  { id: "section2", label: "GOVERNANCE" },
  { id: "approvals", label: "Approvals" },
  { id: "decisions", label: "Decisions" }
];

const DEFAULTS = {
  view: "plan",
  phase: "ready",
  name: "Spring Home",
  want: "More homeowners in the green mortgage. I do not want to buy more brand search to get them. We are already near the top of that curve, and the other banks are showing up more often than we are.",
  campaign: "Spring Home. Search and display to homeowners, then a short email if they look and do not finish. Legacy Circle is not part of this. It stays invite-only.",
  achieve: "About HK$1.2 million extra over 13 weeks. At least 3×, after the rate, the season, and the rivals are taken out of the number.",
  market: "Homeowners, 18,420",
  window: "13 weeks",
  leave: "Legacy Circle",
  asked: "HK$1.2m  ·  3×"
};

const state = Object.assign({}, DEFAULTS, read());

function read() {
  try { return JSON.parse(localStorage.getItem("ai-mmm") || "{}"); }
  catch { return {}; }
}
function save() {
  const copy = Object.assign({}, state);
  delete copy.phase;
  localStorage.setItem("ai-mmm", JSON.stringify(copy));
}
function words() {
  return [state.want, state.campaign, state.achieve].join(" ").trim().split(/\s+/).filter(Boolean).length;
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function shell() {
  const nav = NAV.map((item) => {
    if (item.label === "INSIGHT" || item.label === "GOVERNANCE") {
      return `<div class="nav-section">${item.label}</div>`;
    }
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
  document.querySelectorAll("[data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => go(btn.dataset.nav, false));
  });
}

function go(view, reading) {
  capture();
  state.view = view;
  state.phase = reading ? "reading" : "ready";
  save();
  paint();
  if (reading) {
    window.setTimeout(() => {
      state.phase = "ready";
      paint();
    }, 1100);
  }
}

function capture() {
  document.querySelectorAll("[data-field]").forEach((el) => {
    state[el.dataset.field] = el.value;
  });
}

function header(eyebrow, title, dek, right) {
  return `
    <p class="eyebrow">${eyebrow}</p>
    <h1 class="page-title">${title}</h1>
    <p class="dek">${dek}</p>
    <div class="status">
      <span class="live"><i class="dot"></i>Live</span>
      <span class="quiet"><i class="dot gray"></i>${right}</span>
    </div>`;
}

function plan() {
  return `
    ${header("Plan", "Write the brief", "In your own words. What you want, the campaign you are planning, and what it should achieve.", "Draft")}
    <article class="sheet">
      <div class="letterhead"></div>
      <div class="masthead">
        <div class="brand">
          <i class="pip"></i>
          <input class="name-input" data-field="name" value="${esc(state.name)}" aria-label="Campaign name">
        </div>
        <div class="meta-date">Draft &nbsp;·&nbsp; 6 Nov 2026</div>
      </div>
      <div class="doc">
        <div class="writing">
          ${field("want", "What I want", state.want)}
          ${field("campaign", "The campaign", state.campaign)}
          ${field("achieve", "What it should achieve", state.achieve)}
          <div class="send">
            <button class="ask" id="ask" type="button">Ask for a recommendation</button>
            <p class="fine">Nothing is spent from this page.</p>
          </div>
        </div>
        <aside class="rail">
          ${prop("market", "Market", state.market)}
          ${prop("window", "Window", state.window)}
          ${prop("leave", "Leave out", state.leave)}
          ${prop("asked", "Asked for", state.asked)}
          <div class="words" data-words>${words()} words</div>
        </aside>
      </div>
    </article>`;
}

function field(key, label, value) {
  return `<div class="field">
    <label for="${key}">${label}</label>
    <textarea class="prose" id="${key}" data-field="${key}" rows="3">${esc(value)}</textarea>
  </div>`;
}
function prop(key, label, value) {
  return `<label class="prop"><span>${label}</span><input data-field="${key}" value="${esc(value)}"></label>`;
}

function recommendation() {
  if (state.phase === "reading") {
    return `
      ${header("Recommendation", esc(state.name), "Reading the brief, then this week’s external factors and the model.", "Working")}
      <article class="sheet">
        <div class="letterhead"></div>
        <div class="memo reading">
          <h2 class="headline">Reading ${esc(state.name)}.</h2>
          <ol>
            <li class="on"><i class="tick"></i>What you wrote</li>
            <li class="on"><i class="tick"></i>External factors</li>
            <li class="on"><i class="tick"></i>This week’s model</li>
          </ol>
        </div>
      </article>`;
  }
  return `
    ${header("Recommendation", esc(state.name), "From the brief you just wrote. Checked against external factors, then against the spend and the model.", "Not approved")}
    <article class="sheet">
      <div class="letterhead"></div>
      <div class="memo">
        <div class="kicker">
          <span>6 Nov 2026 &nbsp;·&nbsp; Answer to the brief</span>
          <strong>Waiting on marketing and finance</strong>
        </div>
        <div class="you-wrote">
          <h2 class="block-title">You wrote</h2>
          <div class="wrote">
            <div><em>What you want.</em>${esc(state.want)}</div>
            <div><em>The campaign.</em>${esc(state.campaign)}</div>
            <div><em>The aim.</em>${esc(state.achieve)}</div>
          </div>
        </div>
        <hr class="rule">
        <h2 class="headline">Do not add to brand search.</h2>
        <div class="lead-row">
          <p class="lead">You can still reach the homeowners, and you can still get close to what you asked for. Not by spending more where the other banks already outrank you. Take HK$0.9 million off brand search. Put HK$1.4 million into TV while it is still below the curve. Leave the email cap where finance set it. The mortgage rate is doing some of this work, so it does not count as media. ${esc(state.leave)} stays out, as you wrote.</p>
          <div class="result">
            <p class="figure">HK$1.2m</p>
            <p>incremental, ${esc(state.window)}</p>
            <p class="times">3.8× after influences</p>
          </div>
        </div>
        <hr class="rule">
        <div class="cols">
          <section>
            <h2>External factors</h2>
            ${ev("Rate cut, 50bp", "+4% intent", "Already in demand this month. It is not your media.")}
            ${ev("Rival pressure", "They lead", "Search. Their voice is 18 points ahead of yours.")}
            ${ev("New Year baseline", "+12% demand", "Held out, so the campaign is not credited for the season.")}
          </section>
          <section>
            <h2>From the model</h2>
            ${ev("Search", "0.9×", "HK$12.4m in market. Near saturation on brand terms.")}
            ${ev("TV", "2.4×", "HK$11.2m. Still below the curve, no promo attached.")}
            ${ev("Email", "3.1×", "HK$1.8m. The cap finance agreed is doing its job.")}
            ${ev("Mortgage rate", "Held out", "The green-mortgage price stays in the baseline.")}
          </section>
        </div>
        <hr class="rule">
        <h2 class="block-title">What to do</h2>
        <div class="table-head" style="margin-top:12px"><span>Move</span><span>Amount</span><span>Reason</span></div>
        ${trow("Cut brand search", "−HK$0.9m", "They outrank you, and search is already at 0.9×. More brand spend will not bring the homeowners.")}
        ${trow("Scale TV", "+HK$1.4m", "Still below the curve, at 2.4×. This does not depend on a promo.")}
        ${trow("Hold the email cap", "No change", "Recovery is already at 3.1×. Leave the cap where finance set it.")}
        <p class="close">A recommendation, not a spend. Marketing and finance still have to sign. ${esc(state.leave)} is untouched, so compliance is not in this decision.</p>
      </div>
    </article>`;
}
function ev(name, value, note) {
  return `<div class="ev"><div class="ev-top"><span>${name}</span><b>${value}</b></div><p>${note}</p></div>`;
}
function trow(move, amount, why) {
  return `<div class="trow"><span>${move}</span><b>${amount}</b><span>${why}</span></div>`;
}

function kpis(items) {
  return `<div class="kpis">${items.map((k) => `
    <article class="kpi"><span class="chev">›</span><div class="lbl">${k[0]}</div><div class="val">${k[1]}</div><div class="cap">${k[2]}</div></article>`).join("")}</div>`;
}
function records(items) {
  return `<div class="grid-2">${items.map((c) => `
    <article class="record">
      <h3>${c[0]}</h3><div class="when">${c[1]}</div>
      <div class="pair"><div class="lbl">${c[2]}</div><b>${c[3]}</b></div>
      <div class="pair"><div class="lbl">${c[4]}</div><b>${c[5]}</b></div>
      <div class="pair"><div class="lbl">${c[6]}</div><b>${c[7]}</b></div>
      <div class="insight">${c[8]}</div>
    </article>`).join("")}</div>`;
}
function rows(items) {
  return `<div class="stack">${items.map((r) => `
    <article class="row"><div><h3>${r[0]}</h3><p>${r[1]}</p></div><div class="right"><b>${r[2]}</b><span>${r[3]}</span></div></article>`).join("")}</div>`;
}

function overview() {
  return `
    ${header("Overview", "Overview", "What spend really drives, what rivals are doing, what is approved, and what came back.", "In review")}
    ${kpis([["Media spend", "HK$48.2m", "7 channels in market"], ["Rival pressure", "High", "Search outranks you"], ["Governance", "3", "Waiting on approval"], ["Blended ROI", "3.4×", "After influences, 13 weeks"]])}
    <h2 class="section">Opportunities</h2>
    ${records([
      ["Spring Home mortgage", "Published 28 Oct 2026", "Segment", "Homeowners · 18,420", "Channel", "Search and display", "Governance", "Approved", "Insight  3.8× ROI · HK$1.2m incremental"],
      ["Legacy Circle preview", "Updated 22 Oct 2026", "Segment", "Legacy Circle · 2,140", "Channel", "Email, invite only", "Governance", "In review · legal", "Insight  Held · 18% rival pressure"],
      ["Quiet week recovery", "Published 14 Sep 2026", "Segment", "7-day abandoners · 9,860", "Channel", "Email, 3 steps", "Governance", "Approved · cap on", "Insight  HK$1.2M recovered"],
      ["Birthday note", "Updated 7 Sep 2026", "Segment", "Birthday month · 4,310", "Channel", "Email and wallet", "Governance", "Template locked", "Insight  52% open · 11% redeem"]
    ])}`;
}
function media() {
  return `
    ${header("Media spend", "Media spend", "Search, display, social, TV, direct, email, and other. What went into the market this week.", "Collecting")}
    ${kpis([["This week", "HK$48.2m", "Across 7 channels"], ["Search", "HK$12.4m", "Near saturation"], ["TV", "HK$11.2m", "Still below the curve"], ["Email", "HK$1.8m", "Most room to add"]])}
    <h2 class="section">Spending entries</h2>
    ${rows([
      ["Search", "Brand and generic", "HK$12.4m", "26% · near saturation"],
      ["Display", "Prospecting", "HK$6.1m", "13% · room left"],
      ["Social", "Prospecting and retargeting", "HK$9.8m", "20% · rival pressure high"],
      ["TV", "Brand, always on", "HK$11.2m", "23% · below the curve"],
      ["Direct", "Mail and statement", "HK$3.4m", "7% · steady"],
      ["Email", "Owned, 3 steps", "HK$1.8m", "4% · room to add"],
      ["Other", "Affiliates and partners", "HK$3.5m", "7% · mixed"]
    ])}`;
}
function influences() {
  const cols = [
    ["Season & baseline", [
      ["SEASON", "Lunar New Year baseline", "+12% demand", "Held out of media"],
      ["SEASON", "Summer travel lull", "−6% demand", "August to September"],
      ["SEASON", "Payday cycle", "Weekly lift", "Tagged on every panel"]
    ]],
    ["External", [
      ["EXTERNAL", "Rate cut, 50bp", "+4% mortgage intent", "This month"],
      ["EXTERNAL", "HSI drawdown", "−3% wealth", "Last 2 weeks"],
      ["EXTERNAL", "Typhoon Signal 8", "−8% branch", "One week"]
    ]],
    ["Internal", [
      ["INTERNAL", "Branch hour cut", "−2% footfall", "Kowloon"],
      ["INTERNAL", "Green mortgage launch", "+5% search", "Overlaps paid search"],
      ["INTERNAL", "App outage", "−1% apply", "11 Oct, two hours"]
    ]]
  ];
  return `
    ${header("Influences", "Influences", "Season and baseline, external shocks, and changes inside the bank. Held apart so media does not take the credit.", "On the panel")}
    ${kpis([["Season", "3", "On this week’s panel"], ["External", "3", "Shocks tagged"], ["Internal", "3", "Changes inside the bank"], ["Double count", "2", "Flags for the engine"]])}
    <div class="factors" style="margin-top:22px">
      ${cols.map((col) => `<section><h2 class="section" style="margin-top:0">${col[0]}</h2>${col[1].map((f) => `
        <article class="factor" style="margin-top:10px"><div class="grp">${f[0]}</div><h3>${f[1]}</h3><div class="fx">${f[2]}</div><p>${f[3]}</p></article>`).join("")}</section>`).join("")}
    </div>`;
}
function competitive() {
  return `
    ${header("Competitive", "Competitive", "Live online exposure versus rivals. Always on. Pressure goes to the adjuster. A quiet week returns to the monitor.", "Pressure detected")}
    ${kpis([["Share of voice", "31%", "You, search and social"], ["They lead", "+18%", "Show more often"], ["Outrank", "2", "Search and social"], ["Adjuster", "Suggest", "Auto-tune cap is off"]])}
    <h2 class="section">Rivals this week</h2>
    <div class="factors">
      ${[
        ["Rival Bank A", "Search", "Outranks you", "Their voice 22% · yours 14%"],
        ["Rival Bank B", "Social", "Shows more often", "1.6× your impressions"],
        ["You, on display", "Display", "You lead", "No rival pressure"]
      ].map((r) => `<article class="factor"><div class="grp">THIS WEEK</div><h3>${r[0]}</h3><div class="fx" style="font-size:16px;line-height:22px">${r[2]}</div><p>${r[1]} · ${r[3]}</p></article>`).join("")}
    </div>
    <h2 class="section">Online ads adjuster</h2>
    ${records([
      ["Search", "Do not add", "Read", "Near saturation", "Rivals", "They outrank you on brand terms", "Cap", "Stays on", "Insight  No new spend"],
      ["Social", "Suggest a shift", "Move", "HK$0.8m to retargeting", "From", "Prospecting", "Auto-tune", "Blocked by the cap", "Insight  Needs a human seat"],
      ["Display", "No change", "Pressure", "None", "Path", "Returns to the monitor", "Owner", "The model", "Insight  Model keeps it"]
    ])}`;
}
function model() {
  const bars = [["TV", 28], ["Email", 22], ["Direct", 16], ["Display", 14], ["Search", 11], ["Social", 9]];
  return `
    ${header("Model", "Model", "Names mapped and checked, then a weekly panel. The engine says what spend still drives once influences are taken out.", "Week of 27 Oct")}
    ${kpis([["Collection", "Clean", "Names mapped, 2 flags"], ["Weekly panel", "Ready", "Spend, influences, rivals, segments"], ["Engine", "Fit held", "After influences"], ["Matches", "4", "Segment × channel × offer"]])}
    <h2 class="section">What spend drives</h2>
    <div class="bars">
      ${bars.map((b) => `<div class="bar-row"><b>${b[0]}</b><div class="track"><i style="width:${Math.round(b[1] / 28 * 100)}%"></i></div><span class="pct">${b[1]}%</span></div>`).join("")}
    </div>
    <p class="note">Flagged at collection: social prospecting overlaps a rival burst, and the green-mortgage launch is sitting on paid search.</p>
    <h2 class="section">Segment × channel × offer</h2>
    ${records([
      ["Green mortgage", "Match", "Segment", "Homeowners · 18,420", "Channel", "Search and display", "Offer", "Rate kept in the baseline", "Insight  Works · media does not get the rate"],
      ["Legacy Circle invite", "Match", "Segment", "Legacy Circle · 2,140", "Channel", "Email, invite only", "Offer", "Wealth review", "Insight  Works · legal still in review"],
      ["Three-step recovery", "Match", "Segment", "7-day abandoners · 9,860", "Channel", "Email, 3 steps", "Offer", "Fee waived, cap on", "Insight  Works · the cap stays"],
      ["Birthday note", "Match", "Segment", "Birthday month · 4,310", "Channel", "Email and wallet", "Offer", "Template, no new price", "Insight  Locked · promo stays out of the model"]
    ])}`;
}
function opportunities() {
  return `
    ${header("Opportunities", "Opportunities", "Unlimited what-ifs from the insight factory. Kept only when they fit this bank, then checked against the real world.", "4 cards ready")}
    ${kpis([["Factory", "24", "What-ifs this week"], ["Bank-fit", "9 kept", "15 dropped"], ["Reality check", "6 passed", "3 sent back"], ["Ready", "4", "Sized and owned"]])}
    <h2 class="section">Opportunity cards</h2>
    ${records([
      ["Move search off brand terms", "Sized 28 Oct 2026", "Segment", "Homeowners · 18,420", "Offer", "Green mortgage, rate excluded", "Owner", "Media", "Insight  HK$2.1m room · bank-fit yes · reality pass"],
      ["Fund TV while the curve is steep", "Sized 28 Oct 2026", "Segment", "Mass market", "Offer", "Brand, no promo", "Owner", "Brand", "Insight  HK$1.4m · bank-fit yes · reality pass"],
      ["Email recovery, cap on", "Sized 14 Sep 2026", "Segment", "7-day abandoners · 9,860", "Offer", "Fee waived, capped", "Owner", "CRM", "Insight  HK$0.4m · bank-fit yes · reality pass"],
      ["Hold Legacy Circle", "Updated 22 Oct 2026", "Segment", "Legacy Circle · 2,140", "Offer", "Invite, no public claim", "Owner", "Legal", "Insight  HK$0 until review · bank-fit yes · held"]
    ])}
    <h2 class="section">Sent back</h2>
    ${rows([
      ["Crypto teaser", "Not a product this bank sells", "Dropped", "No — drop"],
      ["Saturday branch blitz", "Hours were already cut", "Rethink", "Fail — evidence did not match"]
    ])}`;
}
function approvals() {
  return `
    ${header("Approvals", "Approvals", "Marketing, finance, and compliance sit on the same card. ROI, the forecast, and the promo check sit beside them.", "3 waiting")}
    ${kpis([["Marketing", "Approved", "Spring Home, 28 Oct"], ["Finance", "Approved", "Cap confirmed"], ["Compliance", "In review", "Legacy Circle only"], ["Queue", "3", "Waiting on a seat"]])}
    <h2 class="section">Spring Home mortgage</h2>
    ${records([
      ["ROI analysis", "By segment × channel", "Search", "Homeowners at 0.9×", "TV", "Still at 2.4×", "Email", "At 3.1×", "Insight  3.8× blended on this card"],
      ["Forecasting", "Funded outcome, 13 weeks", "Base", "+HK$1.2m incremental", "Low", "HK$0.8m", "High", "HK$1.6m", "Insight  Base case holds if the cap stays"],
      ["Pricing / promo check", "Keep the offer out of media", "Rate", "Sits in the baseline", "Credit", "Media does not get that lift", "Status", "Excluded", "Insight  Rate excluded from the glory"]
    ])}
    <h2 class="section">Queue</h2>
    ${rows([
      ["Social shift", "Suggested by the adjuster", "HK$0.8m", "Finance seat open"],
      ["TV scale", "Steep part of the curve", "HK$1.4m", "Marketing seat open"],
      ["Legacy Circle preview", "Invite only", "Held", "Compliance in review"]
    ])}`;
}
function decisions() {
  return `
    ${header("Decisions", "Decisions", "Pilot, scale, cut, or shift. Then learn whether reality matched the forecast.", "Approved to move")}
    ${kpis([["To move", "4", "Approved this week"], ["New spend", "HK$1.8m", "Pilot and scale"], ["Coming out", "HK$0.9m", "Cut from search"], ["Learn back", "3", "Checked against the forecast"]])}
    <h2 class="section">Spend / setup</h2>
    <div class="tiles">
      ${[
        ["Pilot", "Email recovery", "HK$0.4m", "4 weeks · cap on"],
        ["Scale", "TV, steep curve", "HK$1.4m", "Brand, no promo"],
        ["Cut", "Search brand terms", "−HK$0.9m", "Near saturation"],
        ["Shift", "Social retargeting", "HK$0.8m", "Off prospecting"]
      ].map((d) => `<article class="tile"><div class="act">${d[0]}</div><h3>${d[1]}</h3><div class="amt">${d[2]}</div><p>${d[3]}</p></article>`).join("")}
    </div>
    <h2 class="section">Learn back</h2>
    ${rows([
      ["Quiet week recovery", "Forecast HK$0.9m", "HK$1.2m", "Beat · update the panel"],
      ["Spring Home", "Forecast 3.2×", "3.8×", "Beat · keep the curve"],
      ["Birthday note", "Forecast 14% redeem", "11%", "Short · back to the factory"]
    ])}
    <p class="note">A new setup goes live on the competitive monitor. What we learned is written back onto the weekly panel.</p>`;
}

const VIEWS = { plan, recommendation, overview, media, influences, competitive, model, opportunities, approvals, decisions };

function bind() {
  document.querySelectorAll("textarea.prose").forEach((el) => {
    const fit = () => { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; };
    fit();
    el.addEventListener("input", () => { capture(); fit(); const w = document.querySelector("[data-words]"); if (w) w.textContent = words() + " words"; save(); });
  });
  document.querySelectorAll("input[data-field]").forEach((el) => {
    el.addEventListener("input", () => { capture(); save(); });
  });
  const ask = document.getElementById("ask");
  if (ask) ask.addEventListener("click", () => go("recommendation", true));
}

function paint() {
  document.querySelectorAll("[data-nav]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.nav === state.view);
  });
  const main = document.getElementById("main");
  main.innerHTML = (VIEWS[state.view] || plan)();
  bind();
  document.title = "AI Marketing Mix · " + (NAV.find((n) => n.id === state.view) || {}).label;
  window.scrollTo(0, 0);
}

shell();
paint();
