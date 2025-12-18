import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getAllFiles } from "./utils";

import fs from "fs";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const s3 = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function downloadS3Folder(prefix: string) {
  console.log(`Downloading content for: ${prefix}...`);
  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: "zenith-deployment-as-a-service-project",
      Prefix: prefix,
    });

    const allFiles = await s3.send(listCommand);

    if (!allFiles.Contents || allFiles.Contents.length === 0) {
      console.log("No files found in bucket.");
      return;
    }

    const downloadPromises = allFiles.Contents.map(async ({ Key }) => {
      if (!Key) return;

      const finalOutputPath = path.join(__dirname, Key);

      const dirName = path.dirname(finalOutputPath);
      if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
      }

      const getCommand = new GetObjectCommand({
        Bucket: "zenith-deployment-as-a-service-project",
        Key: Key,
      });

      const data = await s3.send(getCommand);

      if (data.Body) {
        const fileData = await data.Body.transformToByteArray();
        fs.writeFileSync(finalOutputPath, fileData);
      }
    });
    await Promise.all(downloadPromises);
    console.log("Download complete.");
  } catch (error) {
    console.error("Error downloading folder:", error);
  }
}

export const uploadFile = async (fileName: string, localFilePath: string) => {
  const fileContent = fs.readFileSync(localFilePath);
  const command = new PutObjectCommand({
    Bucket: "zenith-deployment-as-a-service-project",
    Key: fileName,
    Body: fileContent,
    ContentType: "text/html",
  });

  try {
    await s3.send(command);
    console.log(`Uploaded project to Deployment${fileName}`);
  } catch (error) {
    console.error("Error uploading:", error);
  }
};

export async function copyFinalDist(id: string) {
  const folderPath = path.join(__dirname, "output", id, "dist");
  const allFiles = getAllFiles(folderPath);

  const uploadPromises = allFiles.map((file) => {
    const relativePath = file.slice(folderPath.length + 1);
    const destination = `dist/${id}/${relativePath}`.replace(/\\/g, "/");

    console.log(`Uploading ${relativePath} to ${destination}`);

    return uploadFile(destination, file);
  });

  await Promise.all(uploadPromises);
}
