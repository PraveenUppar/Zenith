// apps/upload-service/src/aws.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";

// Replace with your actual MinIO credentials from docker-compose
const s3 = new S3Client({
  region: "auto",
  endpoint: "http://localhost:9000",
  credentials: {
    accessKeyId: "admin",
    secretAccessKey: "password",
  },
});

export const uploadFile = async (fileName: string, localFilePath: string) => {
  const fileContent = fs.readFileSync(localFilePath);
  const command = new PutObjectCommand({
    Bucket: "output", // Ensure this bucket exists in MinIO
    Key: fileName,
    Body: fileContent,
  });
  try {
    await s3.send(command);
    console.log(`Uploaded ${fileName}`);
  } catch (error) {
    console.log("Error uploading file:", error);
  }
};
