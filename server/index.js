require("dotenv").config();
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const fsPromises = require("fs").promises;
const os = require("os");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const proofSync = require("./sync");
const mammoth = require("mammoth");
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

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`[Slow Request] ${req.method} ${req.url} took ${duration}ms`);
    }
  });
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Create an API router
const apiRouter = express.Router();

// Mapping emails to internal user IDs
// We use a helper function to ensure case-insensitive matching and env availability
const getUserRole = (email) => {
  if (!email) return null;
  const e = email.toLowerCase().trim();
  
  const edEmail = (process.env.ED_EMAIL || "").toLowerCase().trim();
  const dianeEmail = (process.env.DIANE_EMAIL || "").toLowerCase().trim();
  const saraEmail = (process.env.SARA_EMAIL || "").toLowerCase().trim();

  if (edEmail && e === edEmail) return "ed";
  if (dianeEmail && e === dianeEmail) return "diane";
  if (saraEmail && e === saraEmail) return "sara";
  if (e === "tarpfarmer@gmail.com") return "kristi";
  if (e === "masarikfamilymichael@gmail.com") return "ed";
  
  // Hardcoded viewers or fallback
  const VIEWERS = ["michael@masarik.com", "jackmasarik@gmail.com"];
  if (VIEWERS.includes(e)) return "viewer";
  
  return null;
};

// Middleware to extract user from header
const getUser = (req) => {
  const email =
    req.headers["cf-access-authenticated-user-email"] ||
    req.headers["x-user-email"];
  
  return getUserRole(email);
};

// Add endpoint to identify current user
apiRouter.get("/me", (req, res) => {
  const email =
    req.headers["cf-access-authenticated-user-email"] ||
    req.headers["x-user-email"];
  const user = getUserRole(email);
    
  console.log(`[/me] Auth Check: Email="${email}", Role="${user}"`);

  if (!user) {
    return res.status(401).json({ error: "Unauthorized", email });
  }
  res.json({ user });
});

// Optimized Stage Derivation
// Accepts a Set of all filenames in PROOFS_DIR to avoid expensive syscalls in a loop
const getStageOptimized = (id, fileSet) => {
  if (fileSet.has(`${id}.done.pdf`)) return "done";
  if (fileSet.has(`${id}.kristi.pdf`)) return "diane-2";
  if (fileSet.has(`${id}.sara.pdf`)) return "kristi";
  if (fileSet.has(`${id}.diane.pdf`)) return "sara";
  if (fileSet.has(`${id}.ed.pdf`)) return "diane";
  return "ed";
};

// Legacy single-check stage derivation
const getStage = (id) => {
  if (fs.existsSync(path.join(PROOFS_DIR, `${id}.done.pdf`))) return "done";
  if (fs.existsSync(path.join(PROOFS_DIR, `${id}.kristi.pdf`))) return "diane-2";
  if (fs.existsSync(path.join(PROOFS_DIR, `${id}.sara.pdf`))) return "kristi";
  if (fs.existsSync(path.join(PROOFS_DIR, `${id}.diane.pdf`))) return "sara";
  if (fs.existsSync(path.join(PROOFS_DIR, `${id}.ed.pdf`))) return "diane";
  return "ed";
};

// 2. GET /proofs - list all proofs (with optimized filesystem check)
apiRouter.get("/proofs", async (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM proofs ORDER BY created_at DESC").all();
    
    // Perform ONE readdir call for the entire request
    const files = await fsPromises.readdir(PROOFS_DIR);
    const fileSet = new Set(files);

    const proofs = rows.map((p) => ({
      ...p,
      current_stage: getStageOptimized(p.id, fileSet),
    }));

    res.json(proofs);
  } catch (err) {
    console.error("Failed to list proofs:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 3. GET /proofs/:id
apiRouter.get("/proofs/:id", async (req, res) => {
  try {
    const proof = db
      .prepare("SELECT * FROM proofs WHERE id = ?")
      .get(req.params.id);
    if (!proof) return res.status(404).json({ error: "Proof not found" });

    const filesInDir = await fsPromises.readdir(PROOFS_DIR);
    const fileSet = new Set(filesInDir);

    const files = {
      original: fileSet.has(`${proof.id}.pdf`),
      ed: fileSet.has(`${proof.id}.ed.pdf`),
      edDraft: fileSet.has(`${proof.id}.ed.draft.pdf`),
      diane: fileSet.has(`${proof.id}.diane.pdf`),
      sara: fileSet.has(`${proof.id}.sara.pdf`),
      kristi: fileSet.has(`${proof.id}.kristi.pdf`),
      done: fileSet.has(`${proof.id}.done.pdf`),
      docx: fileSet.has(`${proof.id}.docx`),
    };

    res.json({
      ...proof,
      current_stage: getStageOptimized(proof.id, fileSet),
      files,
    });
  } catch (err) {
    console.error(`Failed to get proof ${req.params.id}:`, err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ... rest of the upload and other routes remain similar, but ensure we use getUser correctly ...

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
    const email = req.headers["cf-access-authenticated-user-email"] || req.headers["x-user-email"];
    
    if (!["ed", "diane", "sara", "kristi"].includes(user)) {
      console.log(`Upload forbidden for user: ${user}, email: ${email}`);
      return res.status(403).json({ error: "Invalid user", email });
    }

    if (!req.file) {
      console.log("Upload failed: No file provided in request body.");
      return res.status(400).json({ error: "No file uploaded" });
    }

    const proof = db
      .prepare("SELECT * FROM proofs WHERE id = ?")
      .get(req.params.id);
    if (!proof) return res.status(404).json({ error: "Proof not found" });

    const stage = getStage(proof.id);
    console.log(`User ${user} attempting upload for proof ${req.params.id} at stage ${stage}. File size: ${req.file.size}`);
    
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
    } else if (user === "diane") {
      if (stage === "diane") {
        finalFilename = `${proof.id}.diane.pdf`;
        emailer("diane", proof.id);
      } else if (stage === "diane-2") {
        finalFilename = `${proof.id}.done.pdf`;
        emailer("diane-2", proof.id);
      } else {
        fs.unlinkSync(tempPath);
        return res.status(400).json({ error: "Only allowed at Diane stage" });
      }
    } else if (user === "sara") {
      if (stage !== "sara") {
        fs.unlinkSync(tempPath);
        return res.status(400).json({ error: "Only allowed at Sara stage" });
      }
      finalFilename = `${proof.id}.sara.pdf`;
      emailer("sara", proof.id);
    } else if (user === "kristi") {
      if (stage !== "kristi") {
        fs.unlinkSync(tempPath);
        return res.status(400).json({ error: "Only allowed at Kristi stage" });
      }
      finalFilename = `${proof.id}.kristi.pdf`;
      emailer("kristi", proof.id);
    }

    const finalPath = path.join(PROOFS_DIR, finalFilename);
    if (user !== "ed" && fs.existsSync(finalPath)) {
      fs.unlinkSync(tempPath);
      return res.status(400).json({ error: "File already exists" });
    }

    try {
      fs.copyFileSync(tempPath, finalPath);
      fs.unlinkSync(tempPath);
      console.log(`Successfully saved ${finalFilename}`);
    } catch (err) {
      console.error("File move failed:", err);
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      return res.status(500).json({ error: "Failed to save file" });
    }

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

// ...Docx routes...

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

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

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

apiRouter.get("/proofs/:id/extract-text", async (req, res) => {
  const { id } = req.params;
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const docxPath = path.join(PROOFS_DIR, `${id}.docx`);
  if (!fs.existsSync(docxPath)) {
    return res.status(404).json({ error: "Editorial notes (Word) not found" });
  }

  try {
    const result = await mammoth.extractRawText({ path: docxPath });
    const text = result.value;

    res.setHeader("Content-Type", "text/plain");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${id}-notes.txt"`
    );
    res.send(text);
  } catch (err) {
    console.error("Text extraction failed:", err);
    res.status(500).json({ error: "Failed to extract text from Word document" });
  }
});

// 6. Download endpoint
apiRouter.get("/proofs/:id/download/:type", async (req, res) => {
  const { id, type } = req.params;
  const user = getUser(req);
  const stage = getStage(id);

  if (!user) return res.status(401).json({ error: "Unauthorized" });

  let allowed = false;
  if (user === "viewer" || type === "docx") {
    allowed = true;
  } else if (type === "original") {
    allowed = (user === "ed");
  } else if (user === "ed" && stage === "ed" && type === "edDraft") {
    allowed = true;
  } else if (user === "diane" && stage === "diane" && type === "ed") {
    allowed = true;
  } else if (user === "diane" && stage === "diane-2" && type === "kristi") {
    allowed = true;
  } else if (user === "sara" && stage === "sara" && type === "diane") {
    allowed = true;
  } else if (user === "kristi" && stage === "kristi" && type === "sara") {
    allowed = true;
  } else if (stage === "done" && type === "done") {
    allowed = true;
  }

  if (!allowed) {
    return res.status(403).json({
      error: "You do not have permission to download this file version at this stage",
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
  console.log(`Serving static files from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));
}

if (fs.existsSync(clientDistPath)) {
  app.get("{*path}", (req, res, next) => {
    if (req.url.startsWith("/api")) return next();
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error("UNCAUGHT ERROR:", err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({ 
    error: err.message || "Internal Server Error",
  });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Robust Async Sync Runner
  let isSyncing = false;
  const runSync = async () => {
    if (isSyncing) return;
    isSyncing = true;
    try {
      const syncStart = Date.now();
      await proofSync();
      const syncDuration = Date.now() - syncStart;
      if (syncDuration > 1000) console.log(`[Sync] Completed in ${syncDuration}ms`);
    } catch (err) {
      console.error("[Sync] Failed:", err);
    } finally {
      isSyncing = false;
      // Schedule next run
      setTimeout(runSync, 10000); // Wait 10s between runs
    }
  };

  runSync();
});

server.setTimeout(600000); // 10 minutes timeout
