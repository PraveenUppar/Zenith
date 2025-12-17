// apps/deploy-service/src/aws.ts
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { Readable } from "stream";

// ⚠️ CHECK THIS: Ensure this matches the bucket name you see in MinIO Console
const BUCKET_NAME = "output"; // <--- CHANGE THIS to "local-outputs" if that's what you used!

const s3 = new S3Client({
  region: "auto",
  endpoint: "http://localhost:9000",
  credentials: {
    accessKeyId: "admin",
    secretAccessKey: "password",
  },
});

export async function downloadS3Folder(prefix: string) {
  console.log(
    `> Looking for files in Bucket: "${BUCKET_NAME}" with Prefix: "${prefix}"`
  );

  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: prefix,
  });

  // List all files
  const allFiles = await s3.send(command);

  // DEBUG LOG: How many files did we find?
  if (!allFiles.Contents || allFiles.Contents.length === 0) {
    console.error(
      "❌ CRITICAL: No files found in S3! Check your Bucket Name and Prefix."
    );
    return;
  }
  console.log(`> Found ${allFiles.Contents.length} files. Downloading...`);

  const allPromises =
    allFiles.Contents?.map(async ({ Key }) => {
      return new Promise(async (resolve) => {
        if (!Key) {
          resolve("");
          return;
        }

        const finalOutputPath = path.join(__dirname, Key);
        const outputFile = fs.createWriteStream(finalOutputPath);
        const dirName = path.dirname(finalOutputPath);

        if (!fs.existsSync(dirName)) {
          fs.mkdirSync(dirName, { recursive: true });
        }

        const getCommand = new GetObjectCommand({
          Bucket: BUCKET_NAME, // Use the constant
          Key,
        });

        const data = await s3.send(getCommand);

        if (data.Body instanceof Readable) {
          data.Body.pipe(outputFile).on("finish", () => {
            resolve("");
          });
        }
      });
    }) || [];

  await Promise.all(allPromises?.filter((x) => x !== undefined));
}

export const uploadFinalDist = async (id: string) => {
  // 1. Determine where the build output is
  const folderPath = path.join(__dirname, `output/${id}`);

  let distFolderPath = path.join(folderPath, "dist");
  if (!fs.existsSync(distFolderPath)) {
    distFolderPath = path.join(folderPath, "build"); // Try 'build' for CRA
  }

  if (!fs.existsSync(distFolderPath)) {
    console.error(
      `❌ ERROR: Could not find 'dist' or 'build' folder in ${folderPath}`
    );
    return;
  }

  // 2. Upload files
  const allFiles = getAllFiles(distFolderPath);

  if (allFiles.length === 0) {
    console.error("❌ ERROR: Build folder is empty!");
    return;
  }

  for (const file of allFiles) {
    const relativePath = file
      .slice(distFolderPath.length + 1)
      .replace(/\\/g, "/");
    await uploadFile(`dist/${id}/${relativePath}`, file);
  }
};

const getAllFiles = (folderPath: string): string[] => {
  let response: string[] = [];
  if (fs.existsSync(folderPath)) {
    const allFilesAndFolders = fs.readdirSync(folderPath);
    allFilesAndFolders.forEach((file) => {
      const fullPath = path.join(folderPath, file);
      if (fs.statSync(fullPath).isDirectory()) {
        response = response.concat(getAllFiles(fullPath));
      } else {
        response.push(fullPath);
      }
    });
  }
  return response;
};

const uploadFile = async (fileName: string, localFilePath: string) => {
  const fileContent = fs.readFileSync(localFilePath);
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: fileContent,
  });
  await s3.send(command);
  console.log(`Uploaded ${fileName}`);
};
