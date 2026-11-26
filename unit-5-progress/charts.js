import { handed } from "./shared.js";
import { el, button } from "./dom.js";

const series = [
  { id: "submitted", label: "Handed in", colour: "#087775" },
  { id: "viewed", label: "Viewed", colour: "#5145bc" },
  { id: "missing", label: "No hand-in", colour: "#dfd2f4" },
  { id: "unknown", label: "Unknown", colour: "#65768c" },
  { id: "excused", label: "Excused", colour: "#d4e8ef" },
];
const compactTitles = {
  "design-report": "Design Report",
  "investigation-2": "Investigation Part 2",
  "investigation-1": "Investigation Part 1",
  wireframes: "Wireframes & mockups",
  "discussion-final": "Final discussion",
};

export function group(status) {
  if (handed(status)) return "submitted";
  return status === "blank" ? "missing" : status;
}

export function countStatuses(work) {
  const counts = Object.fromEntries(series.map(({ id }) => [id, 0]));
  for (const item of work) counts[group(item.record.status)]++;
  return counts;
}

const countTotal = counts => series.reduce((sum, { id }) => sum + counts[id], 0);
const describe = counts => series.filter(item => counts[item.id])
  .map(item => counts[item.id] + " " + item.label.toLowerCase()).join(", ") || "No assignment records";

function key(counts, { includeCounts = false, percentages = false } = {}) {
  const total = countTotal(counts);
  return el("ul", null, { class: "chart-key" + (percentages ? " vertical" : "") },
    ...series.filter(item => item.id !== "excused" || counts.excused).map(({ id, label }) => el("li", null, null,
      el("span", null, { class: "swatch " + id, "aria-hidden": "true" }),
      ...(includeCounts && !percentages ? [el("strong", counts[id])] : []),
      el("span", label),
      ...(percentages ? [el("span", counts[id] + " (" + Math.round(counts[id] / total * 100) + "%)", { class: "key-value" })] : []),
    )));
}

export function statusBar(counts, mode = "") {
  const total = countTotal(counts);
  const parts = series.filter(({ id }) => counts[id]).map(({ id, label }) => {
    const amount = counts[id];
    const percent = amount / total * 100;
    const show = mode === "assignment" && percent >= 10;
    const part = el("span", show ? amount : "", { class: "bar-cell " + id, "aria-hidden": "true", title: label + " " + amount });
    part.style.setProperty("--share", percent + "%");
    return part;
  });
  return el("div", null, { class: "status-bar" + (mode ? " " + mode : ""), role: "img", "aria-label": describe(counts) }, ...parts);
}

export function assignmentChart(assignments, learners, selection, onSelect) {
  const heading = el("div", null, { class: "chart-heading" }, el("h2", "Assignment status"));
  if (selection) {
    const clear = button("Clear assignment", { class: "text-action" });
    clear.onclick = () => onSelect("");
    heading.append(clear);
  }
  const panel = el("section", null, { class: "surface chart-panel", "aria-label": "Assignment status" }, heading);
  if (!learners.length || !assignments.length) {
    panel.append(el("p", "No assignments match the current learner filters.", { class: "hint chart-empty" }));
    return panel;
  }
  const totals = countStatuses(learners.flatMap(row => row.work));
  const rows = assignments.map((assignment, index) => {
    const counts = countStatuses(learners.map(row => row.work[index]));
    const name = compactTitles[assignment.id] ?? assignment.title;
    const selected = selection === assignment.id;
    const row = button(null, {
      class: "chart-row", "aria-pressed": String(selected), "aria-label": assignment.title + ", " + describe(counts),
      title: assignment.title + " · " + describe(counts), "data-assignment": assignment.id,
    });
    row.append(el("span", name, { class: "chart-assignment" }), statusBar(counts, "assignment"));
    row.onclick = () => onSelect(selected ? "" : assignment.id, assignment.id);
    return row;
  });
  panel.append(el("p", "Select an assignment to focus the learner list.", { class: "hint chart-instruction" }),
    el("div", null, { class: "chart-rows" }, ...rows), key(totals));
  return panel;
}

export function submissionMix(work, assignmentTitle) {
  const counts = countStatuses(work);
  const total = countTotal(counts);
  const panel = el("section", null, { class: "surface chart-panel", "aria-label": "Submission mix" },
    el("h2", "Submission mix"), ...(assignmentTitle ? [el("p", assignmentTitle, { class: "hint mix-subject" })] : []));
  if (!total) {
    panel.append(el("p", "No submission records in this selection.", { class: "hint chart-empty" }));
    return panel;
  }
  let cursor = 0;
  const stops = series.filter(({ id }) => counts[id]).map(({ id, colour }) => {
    const start = cursor;
    cursor += counts[id];
    return colour + " " + (start / total * 100) + "% " + (cursor / total * 100) + "%";
  });
  const ring = el("div", null, { class: "donut", role: "img", "aria-label": describe(counts) },
    el("div", null, { class: "donut-centre", "aria-hidden": "true" }, el("strong", counts.submitted), el("span", "Handed in")));
  ring.style.setProperty("--mix", "conic-gradient(" + stops.join(", ") + ")");
  panel.append(el("div", null, { class: "mix-body" }, ring, key(counts, { percentages: true })));
  return panel;
}

export function learnerStrip(work) {
  const counts = countStatuses(work);
  return el("div", null, { class: "learner-strip" }, statusBar(counts), key(counts, { includeCounts: true }));
}
