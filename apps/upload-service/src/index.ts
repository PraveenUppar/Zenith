// apps/upload-service/src/index.ts
import express from "express";
import cors from "cors";
import simpleGit from "simple-git";
import path from "path";
import { generateRandomId } from "./utils.js"; // Note the .js extension for nodenext
import { getAllFiles } from "./file.js";
import { uploadFile } from "./aws.js";
import { createClient } from "redis";

const publisher = createClient();
publisher.connect();

const app = express();
app.use(cors());
app.use(express.json());

// Main Endpoint
app.post("/deploy", async (req, res) => {
  const repoUrl = req.body.repoUrl;

  if (!repoUrl) {
    // Basic validation
    res.status(400).json({ error: "Missing repoUrl" });
    return;
  }

  const id = generateRandomId(); // e.g., "xc78s"
  const outputPath = path.join(__dirname, `output/${id}`);

  // 1. Clone the Repo
  await simpleGit().clone(repoUrl, outputPath);

  // 2. Get all files path
  const files = getAllFiles(outputPath);

  // 3. Upload raw source code to S3
  // We iterate over the files and upload them one by one.
  // In production, you might want to zip this or use a queue for uploads to avoid blocking.
  for (const file of files) {
    // file: /Users/username/project/dist/output/xc78s/src/App.tsx
    // target: output/xc78s/src/App.tsx
    // We want to remove the base path to get the relative S3 key
    const relativePath = file.slice(outputPath.length + 1).replace(/\\/g, "/");
    await uploadFile(`output/${id}/${relativePath}`, file);
  }

  // 4. Push to Queue
  // We send the ID to the "build-queue" so the Build Service knows it needs to start.
  await publisher.lPush("build-queue", id);

  // 5. Update Status (Optional: Create a status entry in Redis/DB)
  await publisher.hSet("status", id, "uploaded");

  res.json({
    id: id,
  });
});

app.listen(3000, () => {
  console.log("Upload Service running on port 3000");
});
