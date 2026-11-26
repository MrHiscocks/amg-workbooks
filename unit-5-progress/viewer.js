import { ACCESS, SCHOOLS, STATUS, dateLabel, handed, indexRecords, measures, marksFor, decryptScope, accessLinkFromHash, openAccessLink } from "./shared.js?v=nea-five";
import { el, field, input, select, button, message, showMessage } from "./dom.js";
import { assignmentChart, countStatuses, group, learnerStrip, statusBar, submissionMix } from "./charts.js?v=nea-five";

const main = document.querySelector("#main");
const lock = document.querySelector("#lock");
const refresh = document.querySelector("#refresh");
const refreshFeedback = message();
const schoolParam = new URL(location.href).searchParams.get("school");
let accessLink = accessLinkFromHash(location.hash);
let data;
let passphrase;
let scope;
let showMarks = false;
let schoolFilter = "";
let persons = new Map();
let focusOnly = false;
let term = "";
let progressFilter = "";
let assignmentFilter = "";
let refreshRequest;
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
  refresh.hidden = true;
  refresh.disabled = false;
  refreshRequest = undefined;
  showMessage(refreshFeedback, "");
  document.title = "Unit 5 · Staff progress";
  const prompt = accessLink ? "Enter the shared password to open the " + ACCESS[accessLink.scope] + " view."
    : "Use your passphrase or open your private access link.";
  const panel = el("section", null, { class: "surface gate" },
    heading("Unit 5 staff dashboard", prompt));
  const control = input("password", "", { required: true, autocomplete: "off", maxlength: accessLink ? "128" : "24", spellcheck: "false" });
  const unlock = button("Unlock dashboard", { class: "button primary", type: "submit" });
  const feedback = message();
  const form = el("form", null, null, field(accessLink ? "Shared password" : "Dashboard passphrase", control),
    el("div", null, { class: "actions" }, unlock), feedback);
  form.addEventListener("submit", async event => {
    event.preventDefault();
    unlock.disabled = true;
    showMessage(feedback, "Opening learner records…");
    try {
      if (!globalThis.crypto?.subtle) throw new Error("Open the GitHub Pages link over HTTPS to unlock the dashboard.");
      const invitation = accessLink;
      const candidate = invitation ? await openAccessLink(invitation, control.value) : control.value.trim();
      const provision = await load(candidate, invitation?.scope);
      if (!form.isConnected) return;
      passphrase = candidate;
      data = provision.data;
      scope = provision.scope;
      showMarks = provision.showMarks;
      persons = provision.links;
      schoolFilter = scope === "lead" && Object.hasOwn(SCHOOLS, schoolParam) ? schoolParam : "";
      control.value = "";
      if (accessLinkFromHash(location.hash)) history.replaceState(null, "", location.pathname + location.search);
      render(true);
    } catch (error) {
      showMessage(feedback, error.message, true);
    } finally { unlock.disabled = false; }
  });
  panel.append(form);
  main.replaceChildren(panel);
}

refresh.onclick = async () => {
  const request = {};
  refreshRequest = request;
  refresh.disabled = true;
  showMessage(refreshFeedback, "Refreshing learner records…");
  try {
    const provision = await load(passphrase, scope);
    if (refreshRequest !== request) return;
    data = provision.data;
    showMarks = provision.showMarks;
    persons = provision.links;
    render(false);
    showMessage(refreshFeedback, "Updated progress loaded.");
  } catch {
    if (refreshRequest !== request) return;
    showMessage(refreshFeedback, "Could not refresh. Reopen the dashboard with your current access link or passphrase.", true);
  } finally {
    if (refreshRequest === request) refresh.disabled = false;
  }
};

function notes() {
  return el("details", null, { class: "legend" }, el("summary", "How to read the statuses"),
    el("p", "Viewed means Teams recorded an opening. Blank in Teams means no activity was displayed. Unknown means the status could not be verified."),
    el("p", "Overdue counts use calendar days from confirmed deadlines at the snapshot date. Individual deadlines take precedence. Unknown and excused work stay out of the count."));
}

function avatar(learner) {
  const initials = learner.name.trim().split(/\s+/).slice(0, 2).map(word => Array.from(word)[0]).join("");
  return el("span", initials, { class: "avatar", "aria-hidden": "true" });
}

function list() {
  const find = input("search", term, { placeholder: "Name of learner" });
  const filter = select([["", "Any status"], ["past", "Has past-due work"], ["unknown", "Has unknown statuses"]], progressFilter);
  const school = select(scope === "lead" ? [["", "All schools"], ...Object.entries(SCHOOLS)] : [[scope, SCHOOLS[scope]]],
    scope === "lead" ? schoolFilter : scope);
  const focused = input("checkbox");
  focused.checked = focusOnly;
  const clear = button("Clear focus list");
  const body = el("tbody");
  const charts = el("div", null, { class: "overview-charts" });
  const rosterTitle = el("h2", "Learners", { tabindex: "-1" });
  const caption = el("p", "", { class: "hint roster-scope" });
  const count = el("p", "", { class: "count", role: "status" });
  const table = el("table", null, { class: "roster", "aria-label": "Learner progress" },
    el("thead", null, null, el("tr", null, null,
      ...["Focus", "Learner", "School", "Assignment progress", "Past due", "Unknown"].map(name => el("th", name, { scope: "col" })))), body);
  const index = indexRecords(data);
  const links = new Map([...persons].map(([token, person]) => [person.id, token]));
  const totals = data.learners.map(learner => ({ learner, work: measures(data, learner, index) }))
    .sort((a, b) => a.learner.name.localeCompare(b.learner.name, "en-GB"));
  function drawCount(length) {
    const size = totals.filter(row => focus.has(row.learner.id)).length;
    count.textContent = length + " shown · " + size + " on focus list";
    clear.disabled = size === 0;
  }
  function draw() {
    const query = term.trim().toLocaleLowerCase("en-GB");
    const selectedIndex = data.assignments.findIndex(item => item.id === assignmentFilter);
    const selected = data.assignments[selectedIndex];
    const candidates = totals.filter(({ learner }) =>
      learner.name.toLocaleLowerCase("en-GB").includes(query) &&
      (!schoolFilter || learner.school === SCHOOLS[schoolFilter]) &&
      (!focusOnly || focus.has(learner.id)));
    const visible = candidates.map(row => {
      const activeWork = selected ? [row.work[selectedIndex]] : row.work;
      return { ...row, activeWork, counts: countStatuses(activeWork), overdue: activeWork.filter(item => item.overdue).length };
    }).filter(row => !progressFilter || (progressFilter === "past" ? row.overdue : row.counts.unknown));
    charts.replaceChildren(
      assignmentChart(data.assignments, visible, assignmentFilter, (id, focusId) => {
        assignmentFilter = id;
        draw();
        const target = focusId
          ? charts.querySelector('[data-assignment="' + focusId + '"]')
          : charts.querySelector("[data-assignment]");
        (target ?? rosterTitle).focus();
      }),
      submissionMix(visible.flatMap(row => row.activeWork), selected?.title));
    caption.textContent = selected ? selected.title : "All Unit 5 assignments";
    body.replaceChildren(...visible.map(({ learner, activeWork, counts, overdue }) => {
      const flag = input("checkbox", "", { "aria-label": "Focus on " + learner.name });
      flag.checked = focus.has(learner.id);
      flag.onchange = () => {
        if (flag.checked) focus.add(learner.id); else focus.delete(learner.id);
        if (focusOnly) draw(); else drawCount(visible.length);
      };
      const details = el("a", null, { href: "#learner-" + links.get(learner.id), class: "learner-link" },
        avatar(learner), el("span", learner.name));
      const progress = selected ? el("span", STATUS[activeWork[0].record.status], { class: "pill " + group(activeWork[0].record.status) })
        : el("div", null, { class: "mini-progress" }, statusBar(counts, "mini"), el("span", counts.submitted + "/" + activeWork.length + " handed in"));
      return el("tr", null, null, el("td", null, null, flag), el("th", null, { scope: "row" }, details), el("td", learner.school),
        el("td", null, null, progress), el("td", null, null, el("span", overdue, { class: overdue ? "pill late" : null })),
        el("td", null, null, el("span", counts.unknown, { class: counts.unknown ? "pill unknown" : null })));
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
  main.replaceChildren(heading("Learner progress", "Y13 Computer Science · Unit 5 NEA"),
    refreshFeedback,
    el("section", null, { class: "surface filters-panel", "aria-label": "Filter learners" },
      el("div", null, { class: "controls combined" }, field("Search learners", find), field("School", school), field("Progress", filter),
        el("label", null, { class: "check" }, focused, " Focus list only"))),
    charts,
    el("section", null, { class: "surface roster-panel", "aria-label": "Learners" },
      el("div", null, { class: "roster-heading" }, el("div", null, null, rosterTitle, caption), clear),
      el("div", null, { class: "table-area" }, table), count),
    notes());
}

function timing(item) {
  if (item.overdue) return item.overdue + (item.overdue === 1 ? " day overdue" : " days overdue");
  if (item.late !== null) return item.late <= 0 ? "On time" : item.late + (item.late === 1 ? " day late" : " days late");
  if (handed(item.record.status) || ["unknown", "excused"].includes(item.record.status) || item.elapsed === null) return "";
  if (item.elapsed === 0) return "Due today";
  return -item.elapsed + (item.elapsed === -1 ? " day to go" : " days to go");
}

function person(learner) {
  const work = measures(data, learner);
  const report = el("section", null, { class: "surface report", "aria-label": "Assignment breakdown" },
    el("h2", "Assignment breakdown"));
  for (const item of work) {
    const { assignment, record, due, confirmed } = item;
    const time = timing(item);
    const deadline = due ? "Due " + dateLabel(due) + (record.extension ? " · individual deadline" : confirmed ? "" : " · planned") : "Deadline unavailable";
    const context = deadline + (record.submitted ? " · Handed in " + dateLabel(record.submitted) : "");
    const statusClass = group(record.status);
    report.append(el("article", null, { class: "assignment-card " + (item.overdue ? "late" : statusClass) },
      el("div", null, null, el("h3", assignment.title), hints(context)),
      el("div", null, { class: "right" }, el("span", STATUS[record.status], { class: "pill " + statusClass }),
        ...(time ? [el("span", time, { class: "pill" + (item.overdue ? " late" : "") })] : []))));
  }
  main.replaceChildren(el("a", "‹ Learners", { class: "back", href: "#" }), refreshFeedback,
    el("section", null, { class: "surface learner-hero" }, avatar(learner),
      el("div", null, { class: "learner-overview" }, heading(learner.name, learner.school + " · Individual progress"), learnerStrip(work))),
    el("div", null, { class: "learner-columns" + (showMarks ? " with-marks" : "") },
      report, ...(showMarks ? [provisionalMarks(learner)] : [])), notes());
}

function provisionalMarks(learner) {
  const marks = marksFor(data, learner);
  const description = marks.entered
    ? marks.total + " / " + marks.possible + " across " + marks.entered + " of " + marks.rows.length + " sections"
    : "No provisional marks entered";
  const rows = marks.rows.map(row => el("li", null, { class: "mark-row" },
    el("span", row.title, { class: "mark-name" }),
    el("progress", null, { value: row.mark ?? 0, max: row.max, "aria-hidden": "true" }),
    el("span", row.mark === null ? "— / " + row.max : row.mark + " / " + row.max, { class: "mark-value" })));
  return el("section", null, { class: "surface marks-panel", "aria-label": "Provisional NEA marks" },
    el("h2", "Provisional NEA marks"), el("p", description, { class: "hint subtotal" }),
    el("ul", null, { class: "mark-list" }, ...rows));
}

function render(moveFocus) {
  if (!data) { gate(); return; }
  lock.hidden = refresh.hidden = false;
  if (!data.assignments.some(item => item.id === assignmentFilter)) assignmentFilter = "";
  document.title = "Unit 5 · Staff progress";
  const learner = persons.get(/^#learner-([a-f\d]{32})$/.exec(location.hash)?.[1]);
  if (learner) person(learner);
  else list();
  if (moveFocus) {
    const title = main.querySelector("h1");
    title.tabIndex = -1;
    title.focus();
  }
}

function clearSession() {
  data = passphrase = undefined;
  scope = undefined;
  showMarks = false;
  persons.clear();
  focus.clear();
  focusOnly = false;
  term = progressFilter = schoolFilter = assignmentFilter = "";
}

lock.onclick = () => {
  clearSession();
  history.replaceState(null, "", "./");
  gate();
  main.querySelector("input")?.focus();
};
window.addEventListener("hashchange", () => {
  const invitation = accessLinkFromHash(location.hash);
  if (!invitation) { render(true); return; }
  clearSession();
  accessLink = invitation;
  gate();
  main.querySelector("input")?.focus();
});
window.addEventListener("pagehide", () => {
  data = passphrase = undefined;
  refreshRequest = undefined;
  persons.clear();
  focus.clear();
  main.replaceChildren();
});
window.addEventListener("pageshow", event => { if (event.persisted) gate(); });
gate();
