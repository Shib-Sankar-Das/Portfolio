// ---------------------------------------------------------------------------
// The technology icon set, read for the skills sections. SERVER ONLY.
//
// The icons and their descriptions are written by portfolio_admin (at /icons);
// this file only reads them, and its job is matching the skill names written in
// lib/data.js — "ROS2 Humble", "nRF24L01 (2.4GHz)" — onto rows in tech_icons.
// ---------------------------------------------------------------------------

import { getDb } from "./db";

/**
 * Skills whose name does not lead to their icon on its own.
 *
 * Keyed by the normalised skill name, so "Arduino Uno/Nano" and
 * "arduino uno nano" both land here. Everything not listed is matched by name
 * or label directly.
 */
const ALIASES = {
  "esp8266": "nodemcu-esp8266",
  "arduino-uno-nano": "arduino-uno",
  "arduino-ide": "arduino",
  "raspberry-pi-5-pico-w": "raspberry-pi-5",
  "nrf24l01": "nordic-nrf",
  "ros2-humble": "robot-operating-system",
  "ros2": "robot-operating-system",
  "ros": "robot-operating-system",
  "lidar-fusion": "lidar",
  "yolo-v11": "yolo",
  "rest-apis": "openapi",
  "rest-api": "openapi",
  "blynk-iot": "blynk",
  "thonny-ide": "thonny",
  "vs-code": "visual-studio-code",
  "esp32": "esp32",
  "native-android-java": "android",
  "postgresql": "postgressql",
  "tailwind-css": "tailwind-css",
};

/** A skill name reduced to the shape an icon name takes. */
function normalise(name) {
  return String(name)
    .replace(/\(([^)]*)\)/g, " ") // drop "(2.4GHz)", "(C3/S3/CAM)"
    .replace(/'/g, "")
    .replace(/#/g, "sharp")
    .replace(/\+/g, "plus")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseLong(text) {
  if (!text) return { intro: "", points: [] };
  try {
    const value = JSON.parse(text);
    return {
      intro: typeof value?.intro === "string" ? value.intro : "",
      points: Array.isArray(value?.points) ? value.points.filter((p) => typeof p === "string") : [],
    };
  } catch {
    return { intro: String(text), points: [] };
  }
}

/**
 * Looks up every skill named in `groups` and returns what the page needs to
 * show one: its icon and its description.
 *
 * Unmatched skills are simply absent — the section renders them without an
 * icon rather than breaking, which is what happens to a skill that has no row
 * in the table yet.
 */
export function iconsForSkillGroups(groups) {
  const names = [...new Set(groups.flatMap((g) => g.items))];
  if (!names.length) return {};

  const db = getDb();
  // One pass over the index: 450-odd rows of three short columns is cheaper
  // than a query per skill, and lets the label be matched case-insensitively.
  const index = db.prepare("SELECT id, icon_name, label FROM tech_icons").all();
  const byName = new Map();
  const byLabel = new Map();
  for (const row of index) {
    byName.set(row.icon_name, row.id);
    byLabel.set(row.label.toLowerCase(), row.id);
    byLabel.set(normalise(row.label), row.id);
  }

  const wanted = new Map(); // skill name -> row id
  for (const name of names) {
    const key = normalise(name);
    const id =
      (ALIASES[key] && byName.get(ALIASES[key])) ??
      byName.get(key) ??
      byLabel.get(name.toLowerCase()) ??
      byLabel.get(key) ??
      null;
    if (id) wanted.set(name, id);
  }
  if (!wanted.size) return {};

  const ids = [...new Set(wanted.values())];
  const rows = db
    .prepare(
      `SELECT id, icon_name, label, short_description, detailed_description,
              long_description, icon_url
       FROM tech_icons WHERE id IN (${ids.map(() => "?").join(",")})`
    )
    .all(...ids);
  const byId = new Map(rows.map((r) => [r.id, r]));

  const out = {};
  for (const [name, id] of wanted) {
    const row = byId.get(id);
    if (!row) continue;
    const long = parseLong(row.long_description);
    out[name] = {
      iconName: row.icon_name,
      label: row.label,
      iconUrl: row.icon_url,
      short: row.short_description,
      detailed: row.detailed_description,
      intro: long.intro,
      points: long.points,
    };
  }
  return out;
}
