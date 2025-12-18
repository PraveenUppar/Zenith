import express from "express";
import { simpleGit } from "simple-git";
import { getAllFiles } from "./utils.js";
import { uploadFile } from "./aws.js";
import { client } from "./redis.js";
import path from "path";

const app = express();
app.use(express.json());
const PORT = 3000;

const generateID = () => {
  const subset = "123456789qwertyuiopasdfghjklzxcvbnm";
  const length = 5;
  let id = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * subset.length);
    id += subset[randomIndex];
  }
  return id;
};

app.post("/deploy", async (req, res) => {
  const repoUrl = req.body.repoUrl;
  if (!repoUrl) {
    return res.status(400).json({ error: "Missing URL" });
  }
  const id = generateID();

  const outputPath = path.join("output", id);
  await simpleGit().clone(repoUrl, outputPath);

  const files = getAllFiles(outputPath);
  console.log(files);

  const uploadS3 = files.map(async (file) => {
    const relativePath = file.slice(outputPath.length + 1);
    const s3Key = `output/${id}/${relativePath}`.replace(/\\/g, "/");
    return uploadFile(s3Key, file);
  });
  await Promise.all(uploadS3);

  await client.lPush("build-queue", id);
  console.log(`Added ${id} upload to build-queue`);

  res.json({ id: id, status: "uploaded" });
});

app.listen(PORT, () => {
  console.log(`Upload Service Running, ${PORT}`);
});
