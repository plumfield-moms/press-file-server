require("dotenv").config();
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const os = require("os");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const proofSync = require("./sync");
const PROOFS_DIR =
  process.env.PROOFS_DIR ||
  "/Users/jackmasarik/plumfield/plumfield publishing/proofs";

// Ensure storage directory exists
if (!fs.existsSync(PROOFS_DIR)) {
  console.log(`Creating directory: ${PROOFS_DIR}`);
  fs.mkdirSync(PROOFS_DIR, { recursive: true });
}

const db = require("./db");
const emailer = require("./email");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Create an API router
const apiRouter = express.Router();

// Mapping emails to internal user IDs
const USER_MAP = {
  [process.env.ED_EMAIL]: "ed",
  [process.env.DIANE_EMAIL]: "diane",
  [process.env.SARA_EMAIL]: "sara",
  "masarikfamilymichael@gmail.com": "ed",
  "tarpfarmer@gmail.com": "viewer",
};

// Middleware to extract user from header
const getUser = (req) => {
  const email =
    req.headers["cf-access-authenticated-user-email"] ||
    req.headers["x-user-email"];
  return USER_MAP[email] || null;
};

// Add endpoint to identify current user
apiRouter.get("/me", (req, res) => {
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
  if (fs.existsSync(path.join(PROOFS_DIR, `${id}.diane.pdf`))) return "sara";
  if (fs.existsSync(path.join(PROOFS_DIR, `${id}.ed.pdf`))) return "diane";
  return "ed";
};

// 2. GET /proofs - list all proofs (with sync)
apiRouter.get("/proofs", (req, res) => {
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
apiRouter.get("/proofs/:id", (req, res) => {
  const proof = db
    .prepare("SELECT * FROM proofs WHERE id = ?")
    .get(req.params.id);
  if (!proof) return res.status(404).json({ error: "Proof not found" });

  // Add file availability info
  const files = {
    original: fs.existsSync(path.join(PROOFS_DIR, `${proof.id}.pdf`)),
    ed: fs.existsSync(path.join(PROOFS_DIR, `${proof.id}.ed.pdf`)),
    edDraft: fs.existsSync(path.join(PROOFS_DIR, `${proof.id}.ed.draft.pdf`)),
    diane: fs.existsSync(path.join(PROOFS_DIR, `${proof.id}.diane.pdf`)),
    done: fs.existsSync(path.join(PROOFS_DIR, `${proof.id}.done.pdf`)),
    docx: fs.existsSync(path.join(PROOFS_DIR, `${proof.id}.docx`)),
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
    destination: (req, file, cb) => cb(null, os.tmpdir()),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `temp-work-${uuidv4()}${ext}`);
    },
  }),
});

apiRouter.post(
  "/proofs/:id/upload",
  workflowUpload.single("pdf"),
  (req, res) => {
    const user = getUser(req);
    if (!["ed", "diane", "sara"].includes(user))
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
      finalFilename = `${proof.id}.ed.draft.pdf`;
      // No email for draft
    } else if (user === "diane") {
      if (stage !== "diane") {
        fs.unlinkSync(tempPath);
        return res.status(400).json({ error: "Only allowed at Diane stage" });
      }
      finalFilename = `${proof.id}.diane.pdf`;
      emailer("diane", proof.id);
    } else if (user === "sara") {
      if (stage !== "sara") {
        fs.unlinkSync(tempPath);
        return res.status(400).json({ error: "Only allowed at Sara stage" });
      }
      finalFilename = `${proof.id}.done.pdf`;
    }

    const finalPath = path.join(PROOFS_DIR, finalFilename);
    // Allow Ed to overwrite draft
    if (user !== "ed" && fs.existsSync(finalPath)) {
      fs.unlinkSync(tempPath);
      return res.status(400).json({ error: "File already exists" });
    }

    try {
      fs.copyFileSync(tempPath, finalPath);
      fs.unlinkSync(tempPath);
    } catch (err) {
      console.error("File move failed:", err);
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      return res.status(500).json({ error: "Failed to save file" });
    }

    // Update updated_at
    db.prepare("UPDATE proofs SET updated_at = ? WHERE id = ?").run(
      Date.now(),
      proof.id,
    );

    res.json({ message: "Upload successful", nextStage: getStage(proof.id) });
  },
);

// 5a. POST /proofs/:id/submit (Ed only)
apiRouter.post("/proofs/:id/submit", (req, res) => {
  const user = getUser(req);
  if (user !== "ed") return res.status(403).json({ error: "Only Ed can submit" });

  const { id } = req.params;
  const draftPath = path.join(PROOFS_DIR, `${id}.ed.draft.pdf`);
  const finalPath = path.join(PROOFS_DIR, `${id}.ed.pdf`);

  if (!fs.existsSync(draftPath)) {
    return res.status(400).json({ error: "No draft version found to submit" });
  }

  try {
    fs.renameSync(draftPath, finalPath);
    emailer("ed", id);
    
    // Update updated_at
    db.prepare("UPDATE proofs SET updated_at = ? WHERE id = ?").run(
      Date.now(),
      id,
    );

    res.json({ message: "Submitted to Diane" });
  } catch (err) {
    console.error("Submit failed:", err);
    res.status(500).json({ error: "Failed to submit version" });
  }
});

// 5b. POST /proofs/:id/upload-docx
apiRouter.post(
  "/proofs/:id/upload-docx",
  workflowUpload.single("docx"),
  (req, res) => {
    const user = getUser(req);
    if (user !== "ed")
      return res.status(403).json({ error: "Only Ed can upload docx files" });

    const proof = db
      .prepare("SELECT * FROM proofs WHERE id = ?")
      .get(req.params.id);
    if (!proof) return res.status(404).json({ error: "Proof not found" });

    const tempPath = req.file.path;
    const finalFilename = `${proof.id}.docx`;
    const finalPath = path.join(PROOFS_DIR, finalFilename);

    try {
      fs.copyFileSync(tempPath, finalPath);
      fs.unlinkSync(tempPath);
    } catch (err) {
      console.error("File move failed:", err);
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      return res.status(500).json({ error: "Failed to save file" });
    }

    res.json({ message: "Docx upload successful" });
  },
);

// 6. Download endpoint
apiRouter.get("/proofs/:id/download/:type", (req, res) => {
  const { id, type } = req.params;
  const user = getUser(req);
  const stage = getStage(id);

  if (!user) return res.status(401).json({ error: "Unauthorized" });

  // Access Control:
  // - "viewer" can download anything
  // - docx can be downloaded by any authenticated user
  // - Others only allow downloading the file "ready" for their stage
  let allowed = false;
  if (user === "viewer" || type === "docx") {
    allowed = true;
  } else if (user === "ed" && stage === "ed" && (type === "original" || type === "edDraft")) {
    allowed = true;
  } else if (user === "diane" && stage === "diane" && type === "ed") {
    allowed = true;
  } else if (user === "sara" && stage === "sara" && type === "diane") {
    allowed = true;
  }

  if (!allowed) {
    return res.status(403).json({
      error: "You do not have permission to download this file version",
    });
  }

  let filename = "";
  if (type === "original") filename = `${id}.pdf`;
  else if (type === "docx") filename = `${id}.docx`;
  else if (type === "edDraft") filename = `${id}.ed.draft.pdf`;
  else filename = `${id}.${type}.pdf`;

  const filePath = path.join(PROOFS_DIR, filename);
  if (!fs.existsSync(filePath))
    return res.status(404).json({ error: "File not found" });

  res.download(filePath, filename);
});

// Mount the API router
app.use("/api", apiRouter);

// Serve static files from the Vite build output directory
const clientDistPath = path.join(__dirname, "../client/dist");
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

// Wildcard route to serve index.html for client-side routing
if (fs.existsSync(clientDistPath)) {
  app.get("*path", (req, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  proofSync();
  setInterval(proofSync, 2000);
});
