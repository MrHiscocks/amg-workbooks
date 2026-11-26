export const SCHOOLS = { maesteg: "Maesteg", ccyd: "CCYD", amg: "AMG" };
export const ACCESS = { lead: "Course lead", maesteg: "Maesteg staff", ccyd: "CCYD staff" };
// WJEC GCE Computer Science, Unit 5 assessment grids, Appendix B, pp. 39–47.
export const MARK_SECTIONS = [
  { id: "discussion", title: "Discussion", max: 5 },
  { id: "investigation", title: "Investigation", max: 10 },
  { id: "design", title: "Design", max: 15 },
  { id: "prototype", title: "Prototype", max: 10 },
  { id: "post-prototype", title: "Post-prototype refinement of design", max: 5 },
  { id: "development", title: "Software development", max: 25 },
  { id: "developmental-testing", title: "Developmental testing", max: 5 },
  { id: "testing", title: "Testing", max: 10 },
  { id: "evaluation", title: "Evaluation", max: 15 },
];
const MARK_LIMITS = new Map(MARK_SECTIONS.map(section => [section.id, section.max]));
export const STATUS = {
  submitted: "Handed in", returned: "Returned", viewed: "Viewed", blank: "Blank in Teams",
  missing: "Not handed in", unknown: "Unknown", excused: "Excused",
};
const ID = /^[a-z0-9][a-z0-9-]{0,79}$/;
const DAY = 86_400_000;
const PASSES = /^[A-Za-z\d_-]{24}$/;
const ITERATIONS = 600000;
const format = new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
const encode = new TextEncoder();
const decode = new TextDecoder("utf-8", { fatal: true });
export const today = date => Date.parse(date + "T00:00:00.000Z") / DAY;
export const dateLabel = date => date ? format.format(today(date) * DAY) : "—";
export const schoolId = name => Object.keys(SCHOOLS).find(id => SCHOOLS[id] === name);
export const handed = status => status === "submitted" || status === "returned";
export const unknown = Object.freeze({ status: "unknown", submitted: "", extension: "" });
export const recordKey = (learnerId, assignmentId) => learnerId + "/" + assignmentId;
export const indexRecords = data => new Map(data.records.map(row => [recordKey(row.learnerId, row.assignmentId), row]));

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

function id(value) {
  requireValue(typeof value === "string" && ID.test(value), "A learner or assignment ID is invalid.");
  return value;
}

function label(value, name, size = 180) {
  requireValue(typeof value === "string" && value.trim() && value.length <= size, "Check the " + name + ".");
  return value.trim();
}

function iso(value, name, required = false) {
  if (!required && (value === undefined || value === "")) return "";
  requireValue(typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(today(value)) && new Date(today(value) * DAY).toISOString().slice(0, 10) === value,
  name + " must be a valid date.");
  return value;
}

function canonical(data) {
  requireValue(data?.version === 1 && Array.isArray(data.learners) && Array.isArray(data.assignments) && Array.isArray(data.records),
    "Choose a Unit 5 dashboard JSON backup.");
  requireValue(data.learners.length <= 500 && data.assignments.length <= 100 && data.records.length <= 30000, "This backup exceeds the dashboard limits.");
  const asOf = iso(data.asOf, "The snapshot date", true);
  const learnerIds = new Set();
  const assignmentIds = new Set();
  const recordIds = new Set();
  const learners = data.learners.filter(row => schoolId(row?.school)).map(row => {
    const who = id(row.id);
    requireValue(!learnerIds.has(who), "The backup repeats a learner.");
    learnerIds.add(who);
    return { id: who, name: label(row.name, "learner name", 120), school: row.school };
  });
  const excluded = new Set();
  const assignments = [];
  for (const row of data.assignments) {
    const assignmentId = id(row?.id);
    const title = label(row.title, "assignment title");
    if (/programming[\s-]+paradigms?/i.test(assignmentId) || /programming[\s-]+paradigms?/i.test(title)
      || /programming[\s-]+paradigms?/i.test(row.label ?? "")) {
      excluded.add(assignmentId);
      continue;
    }
    requireValue(!assignmentIds.has(assignmentId), "The backup repeats an assignment.");
    assignmentIds.add(assignmentId);
    requireValue(row.dueBasis === "confirmed" || row.dueBasis === "planned", "An assignment is missing its deadline type.");
    assignments.push({ id: assignmentId, title, due: iso(row.due, "The assignment deadline"), dueBasis: row.dueBasis });
  }
  requireValue(![...excluded].some(key => assignmentIds.has(key)), "An excluded assignment has a duplicate ID.");
  const records = data.records.filter(row => learnerIds.has(row?.learnerId) && !excluded.has(row?.assignmentId)).map(row => {
    const assignmentId = id(row.assignmentId);
    const unique = recordKey(row.learnerId, assignmentId);
    requireValue(assignmentIds.has(assignmentId) && !recordIds.has(unique), "The backup repeats a status or refers to an unknown assignment.");
    recordIds.add(unique);
    requireValue(typeof row.status === "string" && Object.hasOwn(STATUS, row.status), "A record has an invalid progress status.");
    const submitted = iso(row.submitted, "The hand-in date");
    requireValue(!submitted || (handed(row.status) && submitted <= asOf), "A hand-in date needs a hand-in status and must be on or before the snapshot date.");
    return { learnerId: row.learnerId, assignmentId, status: row.status, submitted, extension: iso(row.extension, "The individual deadline") };
  });
  const markIds = new Set();
  const markEntries = data.marks ?? [];
  requireValue(Array.isArray(markEntries) && markEntries.length <= learners.length * MARK_SECTIONS.length, "Check the provisional marks in this backup.");
  const marks = markEntries.filter(row => learnerIds.has(row?.learnerId)).map(row => {
    const limit = MARK_LIMITS.get(row.section);
    const unique = recordKey(row.learnerId, row.section);
    requireValue(limit && Number.isInteger(row.mark) && row.mark >= 0 && row.mark <= limit && !markIds.has(unique),
      "A provisional mark is duplicated or outside its section maximum.");
    markIds.add(unique);
    return { learnerId: row.learnerId, section: row.section, mark: row.mark };
  });
  return { version: 1, asOf, learners, assignments, records, marks };
}

export const cleanData = input => canonical(input);

export function dataForSchool(data, school) {
  const learners = data.learners.filter(row => row.school === SCHOOLS[school]);
  const ids = new Set(learners.map(row => row.id));
  return { ...data, learners, records: data.records.filter(row => ids.has(row.learnerId)), marks: data.marks.filter(row => ids.has(row.learnerId)) };
}

export function marksFor(data, learner) {
  const marks = new Map(data.marks.filter(row => row.learnerId === learner.id).map(row => [row.section, row.mark]));
  const rows = MARK_SECTIONS.map(section => ({ ...section, mark: marks.get(section.id) ?? null }));
  const graded = rows.filter(row => row.mark !== null);
  return {
    rows, entered: graded.length, total: graded.reduce((sum, row) => sum + row.mark, 0),
    possible: graded.reduce((sum, row) => sum + row.max, 0), maximum: rows.reduce((sum, row) => sum + row.max, 0),
  };
}

export function measures(data, learner, index = indexRecords(data)) {
  return data.assignments.map(assignment => {
    const record = index.get(recordKey(learner.id, assignment.id)) ?? unknown;
    const due = record.extension || assignment.due;
    const confirmed = Boolean(due && (record.extension || assignment.dueBasis === "confirmed"));
    const elapsed = confirmed ? today(data.asOf) - today(due) : null;
    const open = ["viewed", "blank", "missing"].includes(record.status);
    const late = confirmed && record.submitted ? today(record.submitted) - today(due) : null;
    return { assignment, record, due, confirmed, elapsed, late, overdue: open && elapsed > 0 ? elapsed : 0 };
  });
}

function base64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

function bytes64(value, expected) {
  requireValue(typeof value === "string" && value.length <= 2_000_000, "The published file is invalid.");
  const binary = atob(value);
  requireValue(expected === undefined || binary.length === expected, "The published file contains an invalid key parameter.");
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

export function makePassphrase() {
  return base64(crypto.getRandomValues(new Uint8Array(18))).replaceAll("+", "-").replaceAll("/", "_");
}

export function checkPassphrases(input) {
  const codes = Object.fromEntries(Object.keys(ACCESS).map(scope => [scope, input?.[scope]]));
  const values = Object.values(codes);
  requireValue(values.every(code => PASSES.test(code || "")) && new Set(values).size === values.length,
    "This private backup is missing its three different passphrases.");
  return codes;
}

async function keyFor(passphrase, salt, use) {
  const raw = await crypto.subtle.importKey("raw", encode.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    raw, { name: "AES-GCM", length: 256 }, false, [use],
  );
}

function cipherOptions(school, iv) {
  return { name: "AES-GCM", iv, additionalData: encode.encode("unit5-staff-pages:v1:" + school) };
}

async function encryptScope(data, scope, passphrase) {
  requireValue(Object.hasOwn(ACCESS, scope) && PASSES.test(passphrase), "Choose a dashboard passphrase first.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await keyFor(passphrase, salt, "encrypt");
  const buffer = new Uint8Array(await crypto.subtle.encrypt(cipherOptions(scope, iv), key, encode.encode(JSON.stringify(data))));
  let ciphertext = "";
  for (let offset = 0; offset < buffer.length; offset += 8192) {
    ciphertext += String.fromCharCode(...buffer.subarray(offset, offset + 8192));
  }
  const encoded = btoa(ciphertext);
  requireValue(encoded.length <= 2_000_000, "The published record is too large.");
  return { salt: base64(salt), iv: base64(iv), data: encoded };
}

export async function decryptScope(bundle, scope, passphrase) {
  requireValue(Object.hasOwn(ACCESS, scope) && PASSES.test(passphrase), "Enter the passphrase supplied for the dashboard.");
  const item = bundle?.version === 2 ? bundle.access?.[scope] : bundle?.version === 1 ? bundle.schools?.[scope] : null;
  requireValue(item, "The published file is missing this view.");
  const salt = bytes64(item.salt, 16);
  const iv = bytes64(item.iv, 12);
  const key = await keyFor(passphrase, salt, "decrypt");
  let plain;
  try { plain = await crypto.subtle.decrypt(cipherOptions(scope, iv), key, bytes64(item.data)); }
  catch { throw new Error("That passphrase could not open these records."); }
  const payload = JSON.parse(decode.decode(plain));
  const data = cleanData(bundle.version === 2 ? payload.data : payload);
  requireValue(scope === "lead" || data.learners.every(row => row.school === SCHOOLS[scope]), "The published data has an invalid school scope.");
  return { data, showMarks: scope === "lead" || payload.showMarks === true, scope };
}

export async function encryptedBundle(data, codes, shareMarks = false) {
  const clean = cleanData(data);
  const passes = checkPassphrases(codes);
  const access = await Promise.all(Object.keys(ACCESS).map(async scope => {
    const scoped = scope === "lead" ? clean : dataForSchool(clean, scope);
    const showMarks = scope === "lead" || shareMarks === true;
    const payload = { showMarks, data: showMarks ? scoped : { ...scoped, marks: [] } };
    return [scope, await encryptScope(payload, scope, passes[scope])];
  }));
  return { version: 2, access: Object.fromEntries(access) };
}
