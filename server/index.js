require("dotenv").config();
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3001;
const PROOFS_DIR = process.env.PROOFS_DIR;

// Ensure storage directory exists
if (!fs.existsSync(PROOFS_DIR)) {
  fs.mkdirSync(PROOFS_DIR);
}

app.use(cors());
app.use(express.json());

// Mapping emails to internal user IDs
const USER_MAP = {
  [process.env.ED_EMAIL]: "ed",
  [process.env.DIANE_EMAIL]: "diane",
  [process.env.SARA_EMAIL]: "sara",
  [process.env.GRETA_EMAIL]: "greta",
  "masarikfamilymichael@gmail.com": "ed",
  "plumfieldlivinglibrary@gmail.com": "sara",
  "masarikfamilymargaret@gmail.com": "greta",
};

// Middleware to extract user from header
const getUser = (req) => {
  const email =
    req.headers["cf-access-authenticated-user-email"] ||
    req.headers["x-user-email"];
  return USER_MAP[email] || null;
};

// Add endpoint to identify current user
app.get("/me", (req, res) => {
  const user = getUser(req);
  if (!user) {
    const email =
      req.headers["cf-access-authenticated-user-email"] ||
      req.headers["x-user-email"];
    return res.status(401).json({ error: "Unauthorized", email });
  }
  res.json({ user });
});

// Helper to derive stage from filesystem
const getStage = (id) => {
  if (fs.existsSync(path.join(PROOFS_DIR, `${id}.done.pdf`))) return "done";
  if (fs.existsSync(path.join(PROOFS_DIR, `${id}.sara.pdf`))) return "greta";
  if (fs.existsSync(path.join(PROOFS_DIR, `${id}.diane.pdf`))) return "sara";
  if (fs.existsSync(path.join(PROOFS_DIR, `${id}.ed.pdf`))) return "diane";
  return "ed";
};

// Helper to sync DB with filesystem
const syncDatabase = () => {
  if (!fs.existsSync(PROOFS_DIR)) fs.mkdirSync(PROOFS_DIR);

  const files = fs.readdirSync(PROOFS_DIR);
  // Rule: A proof is created ONLY from {id}.pdf
  // Ignore .ed.pdf, .diane.pdf, .sara.pdf, and .done.pdf for discovery
  const pdfs = files.filter(
    (f) =>
      f.endsWith(".pdf") &&
      !f.endsWith(".ed.pdf") &&
      !f.endsWith(".diane.pdf") &&
      !f.endsWith(".sara.pdf") &&
      !f.endsWith(".done.pdf") &&
      f !== "database.sqlite",
  );

  for (const file of pdfs) {
    const id = path.parse(file).name;
    const existing = db.prepare("SELECT * FROM proofs WHERE id = ?").get(id);
    if (!existing) {
      const now = Date.now();
      // Insert with only required fields
      db.prepare(
        "INSERT INTO proofs (id, book_title, created_at, updated_at) VALUES (?, ?, ?, ?)",
      ).run(id, id, now, now);
    }
  }
};

// 2. GET /proofs - list all proofs (with sync)
app.get("/proofs", (req, res) => {
  syncDatabase();
  const rows = db
    .prepare("SELECT * FROM proofs ORDER BY created_at DESC")
    .all();

  const proofs = rows.map((p) => ({
    ...p,
    current_stage: getStage(p.id),
  }));

  res.json(proofs);
});

// 3. GET /proofs/:id
app.get("/proofs/:id", (req, res) => {
  const proof = db
    .prepare("SELECT * FROM proofs WHERE id = ?")
    .get(req.params.id);
  if (!proof) return res.status(404).json({ error: "Proof not found" });

  // Add file availability info
  const files = {
    original: fs.existsSync(path.join(PROOFS_DIR, `${proof.id}.pdf`)),
    ed: fs.existsSync(path.join(PROOFS_DIR, `${proof.id}.ed.pdf`)),
    diane: fs.existsSync(path.join(PROOFS_DIR, `${proof.id}.diane.pdf`)),
    sara: fs.existsSync(path.join(PROOFS_DIR, `${proof.id}.sara.pdf`)),
    done: fs.existsSync(path.join(PROOFS_DIR, `${proof.id}.done.pdf`)),
  };

  res.json({
    ...proof,
    current_stage: getStage(proof.id),
    files,
  });
});

// 5. POST /proofs/:id/upload
const workflowUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, PROOFS_DIR),
    filename: (req, file, cb) => {
      cb(null, `temp-work-${uuidv4()}.pdf`);
    },
  }),
});

app.post("/proofs/:id/upload", workflowUpload.single("pdf"), (req, res) => {
  const user = getUser(req);
  if (!["ed", "diane", "sara", "greta"].includes(user))
    return res.status(403).json({ error: "Invalid user" });

  const proof = db
    .prepare("SELECT * FROM proofs WHERE id = ?")
    .get(req.params.id);
  if (!proof) return res.status(404).json({ error: "Proof not found" });

  const stage = getStage(proof.id);
  if (stage === "done") {
    return res.status(400).json({ error: "Proof is already finalized" });
  }

  const originalPath = path.join(PROOFS_DIR, `${proof.id}.pdf`);
  if (!fs.existsSync(originalPath)) {
    return res.status(404).json({ error: "Original file missing" });
  }

  const tempPath = req.file.path;
  let finalFilename = "";

  if (user === "ed") {
    if (stage !== "ed") {
      fs.unlinkSync(tempPath);
      return res.status(400).json({ error: "Only allowed at Ed stage" });
    }
    finalFilename = `${proof.id}.ed.pdf`;
  } else if (user === "diane") {
    if (stage !== "diane") {
      fs.unlinkSync(tempPath);
      return res.status(400).json({ error: "Only allowed at Diane stage" });
    }
    finalFilename = `${proof.id}.diane.pdf`;
  } else if (user === "sara") {
    if (stage !== "sara") {
      fs.unlinkSync(tempPath);
      return res.status(400).json({ error: "Only allowed at Sara stage" });
    }
    finalFilename = `${proof.id}.sara.pdf`;
  } else if (user === "greta") {
    if (stage !== "greta") {
      fs.unlinkSync(tempPath);
      return res.status(400).json({ error: "Only allowed at Greta stage" });
    }
    finalFilename = `${proof.id}.done.pdf`;
  }

  const finalPath = path.join(PROOFS_DIR, finalFilename);
  if (fs.existsSync(finalPath)) {
    fs.unlinkSync(tempPath);
    return res.status(400).json({ error: "File already exists" });
  }

  fs.renameSync(tempPath, finalPath);

  // Update updated_at
  db.prepare("UPDATE proofs SET updated_at = ? WHERE id = ?").run(
    Date.now(),
    proof.id,
  );

  res.json({ message: "Upload successful", nextStage: getStage(proof.id) });
});

// 6. Download endpoint
app.get("/proofs/:id/download/:type", (req, res) => {
  const { id, type } = req.params;
  let filename = "";
  if (type === "original") filename = `${id}.pdf`;
  else if (["ed", "diane", "sara", "done"].includes(type))
    filename = `${id}.${type}.pdf`;
  else return res.status(400).json({ error: "Invalid file type" });

  const filePath = path.join(PROOFS_DIR, filename);
  if (!fs.existsSync(filePath))
    return res.status(404).json({ error: "File not found" });

  res.download(filePath, filename);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
