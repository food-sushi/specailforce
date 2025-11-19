import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =====================================================
   ALLOW IFRAME EMBEDDING  (IMPORTANT)
===================================================== */
app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "ALLOWALL");
  res.setHeader("Content-Security-Policy", "frame-ancestors *");
  next();
});

/* =====================================================
   BOT BLOCK
===================================================== */
const blockedBots = [
  "bot","crawl","spider","slurp","bing","ahrefs","semrush",
  "facebookexternalhit","python-requests","curl","wget","java","headless"
];

app.use((req, res, next) => {
  const ua = (req.headers["user-agent"] || "").toLowerCase();
  if (blockedBots.some(b => ua.includes(b))) {
    return res.status(403).send("Bots not allowed");
  }
  next();
});

/* =====================================================
   ACCESS CONTROL
===================================================== */
const ALLOWED_ORIGIN = "https://decamour.shop";

app.use((req, res, next) => {

  // Allow static
  if (
    req.path.startsWith("/css") ||
    req.path.startsWith("/js") ||
    req.path.startsWith("/images")
  ) return next();

  // Allow API
  if (req.path === "/frontend-loader") return next();

  // Allow ?loader=true
  if (req.query.loader === "true") return next();

  // Allow pages requested from your domain
  const referer = (req.headers.referer || "").toLowerCase();
  if (referer.startsWith(ALLOWED_ORIGIN.toLowerCase())) return next();

  return res.status(403).send("Access Restricted");
});

/* =====================================================
   FRONTEND LOADER  — INDIA ONLY
===================================================== */
app.get("/frontend-loader", (req, res) => {
  const tzRaw = req.headers["x-client-timezone"] || "";
  const tz = tzRaw.toLowerCase();

  const allowedTZ = [
    "asia/kolkata",
    "asia/calcutta"
  ];

  if (!allowedTZ.includes(tz)) {
    return res.json({
      allowed: false,
      frontloader: false,
      error: "Timezone blocked"
    });
  }

  return res.json({
    allowed: true,
    frontloader: true
  });
});

/* =====================================================
   STATIC FILES
===================================================== */
app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* =====================================================
   START
===================================================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
