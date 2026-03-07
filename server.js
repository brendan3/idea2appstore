const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const { Pool } = require("pg");

const app = express();

const ROOT_DIR = __dirname;
const STATS_FILE = path.join(ROOT_DIR, "beer_stats.json");

const INDEX_FILE = path.join(ROOT_DIR, "index.html");
const DRAFT_FILE = path.join(ROOT_DIR, "draft", "index.html");
const BEER_TRACKER_FILE = path.join(ROOT_DIR, "austinbeertracker2026roadto1500.html");
const BEER_TRACKER_ADMIN_FILE = path.join(ROOT_DIR, "austinbeertracker2026roadto1500_current_count.html");

const ADMIN_KEY = process.env.BEER_TRACKER_ADMIN_KEY || "";
const PORT = Number(process.env.PORT) || 8080;

const hasDatabase = Boolean(process.env.DATABASE_URL);
const pool = hasDatabase
  ? new Pool({
      connectionString: process.env.DATABASE_URL
    })
  : null;

function getDaysIntoYear(date) {
  const now = date || new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / 86400000);
}

function buildComputedStats(currentCount, goal) {
  const daysIntoYear = getDaysIntoYear(new Date());
  const averagePerDayRaw = daysIntoYear > 0 ? currentCount / daysIntoYear : 0;
  const averagePerDay = Math.floor(averagePerDayRaw * 100) / 100;
  const projectedTotal = Math.floor(averagePerDay * 365);

  return {
    current_count: currentCount,
    average_per_day: averagePerDay,
    projected_total: projectedTotal,
    goal,
    days_into_year: daysIntoYear
  };
}

async function readStatsFromFile() {
  const raw = await fs.readFile(STATS_FILE, "utf8");
  const parsed = JSON.parse(raw);

  return {
    current_count: Number(parsed.current_count) || 0,
    goal: Number(parsed.goal) || 1500
  };
}

async function writeStatsToFile(currentCount, goal) {
  const computed = buildComputedStats(currentCount, goal);
  await fs.writeFile(
    STATS_FILE,
    JSON.stringify(
      {
        current_count: computed.current_count,
        average_per_day: computed.average_per_day,
        projected_total: computed.projected_total,
        goal: computed.goal
      },
      null,
      2
    ) + "\n",
    "utf8"
  );
}

async function ensureDatabaseSchema() {
  if (!pool) {
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS beer_tracker_stats (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      current_count INTEGER NOT NULL,
      goal INTEGER NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const fallback = await readStatsFromFile();
  await pool.query(
    `
      INSERT INTO beer_tracker_stats (id, current_count, goal)
      VALUES (1, $1, $2)
      ON CONFLICT (id) DO NOTHING
    `,
    [fallback.current_count, fallback.goal]
  );
}

async function getStoredStats() {
  if (pool) {
    const result = await pool.query(
      "SELECT current_count, goal FROM beer_tracker_stats WHERE id = 1 LIMIT 1"
    );
    if (result.rows.length > 0) {
      return {
        current_count: Number(result.rows[0].current_count) || 0,
        goal: Number(result.rows[0].goal) || 1500
      };
    }
  }

  return readStatsFromFile();
}

async function setCurrentCount(nextCount) {
  const safeCount = Math.max(0, Number(nextCount) || 0);

  if (pool) {
    const current = await getStoredStats();
    await pool.query(
      `
        INSERT INTO beer_tracker_stats (id, current_count, goal, updated_at)
        VALUES (1, $1, $2, NOW())
        ON CONFLICT (id)
        DO UPDATE SET current_count = EXCLUDED.current_count, updated_at = NOW()
      `,
      [safeCount, current.goal]
    );
    return;
  }

  const current = await readStatsFromFile();
  await writeStatsToFile(safeCount, current.goal);
}

async function resolveStats() {
  const stored = await getStoredStats();
  return buildComputedStats(stored.current_count, stored.goal);
}

function requireAdminKey(req, res, next) {
  if (!ADMIN_KEY) {
    return next();
  }

  const suppliedHeader = req.get("x-admin-key");
  const suppliedBody = req.body && req.body.admin_key;
  const supplied = suppliedHeader || suppliedBody || "";
  if (supplied !== ADMIN_KEY) {
    return res.status(401).json({ error: "Invalid admin key." });
  }
  return next();
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/health", (_, res) => {
  res.json({ ok: true });
});

app.get("/api/beer-stats", async (_, res) => {
  try {
    const stats = await resolveStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Could not load stats." });
  }
});

app.post("/api/beer-stats/current-count", requireAdminKey, async (req, res) => {
  const nextCount = Number(req.body && req.body.current_count);
  if (!Number.isInteger(nextCount) || nextCount < 0) {
    return res.status(400).json({ error: "current_count must be a non-negative integer." });
  }

  try {
    await setCurrentCount(nextCount);
    const stats = await resolveStats();
    return res.json({ ok: true, stats });
  } catch (error) {
    return res.status(500).json({ error: "Could not update current_count." });
  }
});

app.get("/beer_stats.json", async (_, res) => {
  try {
    const stats = await resolveStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Could not load stats." });
  }
});

app.get("/", (_, res) => res.sendFile(INDEX_FILE));
app.get("/index.html", (_, res) => res.sendFile(INDEX_FILE));
app.get("/draft", (_, res) => res.sendFile(DRAFT_FILE));
app.get("/draft/", (_, res) => res.sendFile(DRAFT_FILE));

app.get("/austinbeertracker2026roadto1500", (_, res) => res.sendFile(BEER_TRACKER_FILE));
app.get("/austinbeertracker2026roadto1500.html", (_, res) => res.sendFile(BEER_TRACKER_FILE));
app.get("/austinbeertracker2026roadto1500/current_count", (_, res) =>
  res.sendFile(BEER_TRACKER_ADMIN_FILE)
);
app.get("/austinbeertracker2026roadto1500/current_count/", (_, res) =>
  res.sendFile(BEER_TRACKER_ADMIN_FILE)
);

app.use("/assets", express.static(path.join(ROOT_DIR, "assets")));
app.use(express.static(ROOT_DIR));

app.use((_, res) => {
  res.status(404).send("Not found");
});

async function start() {
  try {
    await ensureDatabaseSchema();
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log("Server listening on port " + PORT);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
