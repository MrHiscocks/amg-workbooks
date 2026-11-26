import { ACCESS, SCHOOLS, STATUS, dateLabel, handed, indexRecords, measures, marksFor, decryptScope } from "./shared.js";
import { el, field, input, select, button, message, showMessage } from "./dom.js";

const main = document.querySelector("#main");
const lock = document.querySelector("#lock");
const schoolParam = new URL(location.href).searchParams.get("school");
let data;
let passphrase;
let scope;
let showMarks = false;
let schoolFilter = "";
let persons = new Map();
let focusOnly = false;
let term = "";
let progressFilter = "";
const focus = new Set();

const hints = text => el("p", text, { class: "hint" });

function heading(title, subtitle) {
  return el("div", null, { class: "heading" },
    el("div", null, null, el("h1", title), el("p", subtitle)),
    ...(data ? [el("div", "Data as at", { class: "date" }, el("time", dateLabel(data.asOf), { datetime: data.asOf }))] : []));
}

async function load(pass, previousScope) {
  const response = await fetch("./progress.json", { cache: "no-store", credentials: "omit" });
  if (!response.ok) throw new Error("The published progress file is unavailable.");
  const bundle = await response.json();
  let provision;
  try {
    provision = previousScope ? await decryptScope(bundle, previousScope, pass)
      : await Promise.any(Object.keys(ACCESS).map(candidate => decryptScope(bundle, candidate, pass)));
  } catch { throw new Error("That passphrase could not open the dashboard."); }
  const encoder = new TextEncoder();
  const secret = await crypto.subtle.importKey("raw", encoder.encode(pass), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const entries = await Promise.all(provision.data.learners.map(async learner => {
    const digest = new Uint8Array(await crypto.subtle.sign("HMAC", secret, encoder.encode("unit5-learner:" + learner.id)));
    const token = [...digest.slice(0, 16)].map(byte => byte.toString(16).padStart(2, "0")).join("");
    return [token, learner];
  }));
  return { ...provision, links: new Map(entries) };
}

function gate() {
  lock.hidden = true;
  document.title = "Unit 5 · Staff progress";
  const panel = el("section", null, { class: "surface gate" },
    heading("Unit 5 staff dashboard", "Use your shared passphrase to open the learner records."));
  const control = input("password", "", { required: true, autocomplete: "off", maxlength: "24", spellcheck: "false" });
  const unlock = button("Unlock dashboard", { class: "button primary", type: "submit" });
  const feedback = message();
  const form = el("form", null, null, field("Dashboard passphrase", control), el("div", null, { class: "actions" }, unlock), feedback);
  form.addEventListener("submit", async event => {
    event.preventDefault();
    unlock.disabled = true;
    showMessage(feedback, "Opening learner records…");
    try {
      if (!globalThis.crypto?.subtle) throw new Error("Open the GitHub Pages link over HTTPS to unlock the dashboard.");
      const candidate = control.value.trim();
      const provision = await load(candidate);
      passphrase = candidate;
      data = provision.data;
      scope = provision.scope;
      showMarks = provision.showMarks;
      persons = provision.links;
      schoolFilter = scope === "lead" && Object.hasOwn(SCHOOLS, schoolParam) ? schoolParam : "";
      control.value = "";
      render(true);
    } catch (error) {
      showMessage(feedback, error.message, true);
    } finally { unlock.disabled = false; }
  });
  panel.append(form);
  main.replaceChildren(panel);
}

function refreshAction() {
  const refresh = button("Refresh progress");
  const feedback = message();
  refresh.addEventListener("click", async () => {
    refresh.disabled = true;
    const unlockSession = passphrase;
    try {
      const provision = await load(unlockSession, scope);
      if (passphrase !== unlockSession) return;
      data = provision.data;
      showMarks = provision.showMarks;
      persons = provision.links;
      render(false, "Updated progress loaded.");
    } catch {
      showMessage(feedback, "Could not refresh. Reopen the dashboard if your school passphrase has changed.", true);
    } finally { refresh.disabled = false; }
  });
  return [refresh, feedback];
}

function notes() {
  return el("details", null, { class: "legend" }, el("summary", "How to read the statuses"),
    el("p", "Viewed means Teams recorded an opening. Blank in Teams means no activity was displayed. Unknown means the status could not be verified."),
    el("p", "Overdue counts use calendar days from confirmed deadlines at the snapshot date. Individual deadlines take precedence. Unknown and excused work stay out of the count."));
}

function list(notice) {
  const find = input("search", term, { placeholder: "Name of learner" });
  const filter = select([["", "Any status"], ["past", "Has past-due work"], ["unknown", "Has unknown statuses"]], progressFilter);
  const school = select(scope === "lead" ? [["", "All schools"], ...Object.entries(SCHOOLS)] : [[scope, SCHOOLS[scope]]],
    scope === "lead" ? schoolFilter : scope);
  const focused = input("checkbox");
  focused.checked = focusOnly;
  const clear = button("Clear focus list");
  const [refresh, feedback] = refreshAction();
  const body = el("tbody");
  const count = el("p", "", { class: "count", role: "status" });
  const table = el("table", null, { class: "roster", "aria-label": "Learner progress" },
    el("thead", null, null, el("tr", null, null, ...["Focus", "Learner", "School", "Handed in", "Past due", "Unknown"].map(name => el("th", name, { scope: "col" })))), body);
  const index = indexRecords(data);
  const links = new Map([...persons].map(([token, person]) => [person.id, token]));
  const totals = data.learners.map(learner => {
    const work = measures(data, learner, index);
    return { learner, handedIn: work.filter(item => handed(item.record.status)).length,
      overdue: work.filter(item => item.overdue > 0).length, unknown: work.filter(item => item.record.status === "unknown").length };
  }).sort((a, b) => a.learner.name.localeCompare(b.learner.name, "en-GB"));
  function drawCount(length) {
    const size = totals.filter(row => focus.has(row.learner.id)).length;
    count.textContent = length + " shown · " + size + " on focus list";
    clear.disabled = size === 0;
  }
  function draw() {
    const query = term.trim().toLocaleLowerCase("en-GB");
    const visible = totals.filter(({learner, overdue, unknown}) =>
      learner.name.toLocaleLowerCase("en-GB").includes(query) &&
      (!schoolFilter || learner.school === SCHOOLS[schoolFilter]) &&
      (!focusOnly || focus.has(learner.id)) &&
      (!progressFilter || (progressFilter === "past" ? overdue : unknown)));
    body.replaceChildren(...visible.map(({learner, handedIn, overdue, unknown}) => {
      const flag = input("checkbox", "", { "aria-label": "Focus on " + learner.name });
      flag.checked = focus.has(learner.id);
      flag.onchange = () => {
        if (flag.checked) focus.add(learner.id); else focus.delete(learner.id);
        if (focusOnly) draw(); else drawCount(visible.length);
      };
      const details = el("a", learner.name, { href: "#learner-" + links.get(learner.id) });
      return el("tr", null, null, el("td", null, null, flag), el("td", null, null, details), el("td", learner.school),
        el("td", handedIn), el("td", overdue, { class: overdue ? "past" : null }), el("td", unknown));
    }));
    if (!visible.length) body.append(el("tr", null, null, el("td", "No learners match these filters.", { colspan: "6" })));
    drawCount(visible.length);
  }
  find.addEventListener("input", () => { term = find.value; draw(); });
  filter.onchange = () => { progressFilter = filter.value; draw(); };
  school.onchange = () => { schoolFilter = school.value; draw(); };
  focused.onchange = () => { focusOnly = focused.checked; draw(); };
  clear.onclick = () => { focus.clear(); focusOnly = false; focused.checked = false; draw(); };
  draw();
  if (notice) showMessage(feedback, notice);
  main.replaceChildren(heading("Learner progress", "Pick the learners in front of you, then open their individual progress."),
    el("section", null, { class: "surface", "aria-label": "Learners" }, el("h2", "Learners"),
      el("div", null, { class: "controls combined" }, field("Search learners", find), field("School", school), field("Progress", filter),
        el("label", null, { class: "check" }, focused, " Focus list only")),
      el("div", null, { class: "table-area" }, table), count, el("div", null, { class: "actions" }, clear, refresh), feedback),
    notes());
}

function timing(item) {
  if (item.overdue) return item.overdue + (item.overdue === 1 ? " day overdue" : " days overdue");
  if (item.late !== null) return item.late <= 0 ? "On time" : item.late + (item.late === 1 ? " day late" : " days late");
  if (handed(item.record.status) || ["unknown", "excused"].includes(item.record.status) || item.elapsed === null) return "";
  if (item.elapsed === 0) return "Due today";
  return -item.elapsed + (item.elapsed === -1 ? " day to go" : " days to go");
}

function person(learner, notice) {
  const [refresh, feedback] = refreshAction();
  const report = el("section", null, { class: "surface report", "aria-label": "Assignment breakdown" });
  for (const item of measures(data, learner)) {
    const { assignment, record, due, confirmed } = item;
    const time = timing(item);
    const deadline = due ? "Due " + dateLabel(due) + (record.extension ? " · individual deadline" : confirmed ? "" : " · planned") : "Deadline unavailable";
    const context = deadline + (record.submitted ? " · Handed in " + dateLabel(record.submitted) : "");
    const statusClass = handed(record.status) ? " done" : record.status === "viewed" ? " viewed" : "";
    report.append(el("article", null, { class: "assignment" },
      el("div", null, null, el("h2", assignment.title), hints(context)),
      el("div", null, { class: "right" }, el("span", STATUS[record.status], { class: "pill" + statusClass }),
        ...(time ? [el("span", time, { class: "pill" + (item.overdue ? " late" : "") })] : []))));
  }
  if (notice) showMessage(feedback, notice);
  main.replaceChildren(el("a", "‹ Learners", { class: "back", href: "#" }),
    heading(learner.name, learner.school + " · Individual progress"),
    report, ...(showMarks ? [provisionalMarks(learner)] : []), el("div", null, { class: "actions" }, refresh), feedback, notes());
}

function provisionalMarks(learner) {
  const marks = marksFor(data, learner);
  const description = marks.entered
    ? marks.total + " / " + marks.possible + " across " + marks.entered + " of " + marks.rows.length + " sections"
    : "No provisional marks entered";
  const rows = marks.rows.map(row => el("tr", null, null, el("th", row.title, { scope: "row" }),
    el("td", row.mark === null ? "—" : row.mark), el("td", row.max)));
  return el("section", null, { class: "surface", "aria-label": "Provisional NEA marks" },
    el("h2", "Provisional NEA marks"), el("p", description, { class: "hint subtotal" }),
    el("div", null, { class: "table-area" }, el("table", null, { class: "mark-table" },
      el("thead", null, null, el("tr", null, null, ...["Section", "Mark", "Maximum"].map(label => el("th", label, { scope: "col" })))),
      el("tbody", null, null, ...rows))));
}

function render(moveFocus, notice) {
  if (!data) { gate(); return; }
  lock.hidden = false;
  document.title = "Unit 5 · Staff progress";
  const learner = persons.get(/^#learner-([a-f\d]{32})$/.exec(location.hash)?.[1]);
  if (learner) person(learner, notice);
  else list(notice);
  if (moveFocus) {
    const title = main.querySelector("h1");
    title.tabIndex = -1;
    title.focus();
  }
}

lock.onclick = () => {
  data = passphrase = undefined;
  scope = undefined;
  showMarks = false;
  persons.clear();
  focus.clear();
  focusOnly = false;
  term = progressFilter = schoolFilter = "";
  history.replaceState(null, "", "./");
  gate();
  main.querySelector("input")?.focus();
};
window.addEventListener("hashchange", () => render(true));
window.addEventListener("pagehide", () => {
  data = passphrase = undefined;
  persons.clear();
  focus.clear();
  main.replaceChildren();
});
window.addEventListener("pageshow", event => { if (event.persisted) gate(); });
gate();
