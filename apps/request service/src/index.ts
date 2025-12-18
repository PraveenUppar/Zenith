import express from "express";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import mime from "mime-types";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const s3 = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// 2. The Wildcard Route (Catches EVERYTHING)
app.get(/.*/, async (req, res) => {
  // --- ASSIGNMENT 2: Subdomain Extraction ---

  // Hostname: "12345.localhost" -> id: "12345"
  const hostname = req.hostname;
  const id = hostname.split(".")[0];

  // Path: "/about" -> "dist/12345/about"
  // Path: "/"      -> "dist/12345/index.html"
  const filePath = req.path === "/" ? "/index.html" : req.path;

  // The actual key in S3 bucket
  const key = `dist/${id}${filePath}`;

  console.log(`Request for ID: ${id} | Path: ${filePath}`);

  try {
    const command = new GetObjectCommand({
      Bucket: "zenith-deployment-as-a-service-project",
      Key: key,
    });

    const response = await s3.send(command);

    // CRITICAL: Set Content-Type
    // If we don't do this, browsers won't run the JS or apply the CSS
    const type = mime.lookup(filePath);
    if (type) {
      res.setHeader("Content-Type", type);
    }

    // Stream the file content to the user
    // @ts-ignore - response.Body is a stream in Node
    response.Body?.pipe(res);
  } catch (error) {
    const fallbackKey = `dist/${id}/index.html`;

    try {
      const fallbackCommand = new GetObjectCommand({
        Bucket: "zenith-deployment-as-a-service-project",
        Key: fallbackKey,
      });

      const fallbackResponse = await s3.send(fallbackCommand);

      // It's HTML now
      res.setHeader("Content-Type", "text/html");

      // @ts-ignore
      fallbackResponse.Body?.pipe(res);
    } catch (fallbackError) {
      // Even index.html is missing? Then it's a real 404.
      console.error("Fallback failed:", fallbackError);
      res.status(404).send("404 - Site Not Found");
    }
  }
});

app.listen(3001, () => {
  console.log("Request Handler running on port 3001");
});
