import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const s3 = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export const uploadFile = async (fileName: string, localFilePath: string) => {
  const fileContent = fs.readFileSync(localFilePath);

  const command = new PutObjectCommand({
    Bucket: "zenith-deployment-as-a-service-project",
    Key: fileName,
    Body: fileContent,
  });

  try {
    await s3.send(command);
    console.log(`Uploaded: ${fileName}`);
  } catch (error) {
    console.error("Error uploading file:", error);
  }
};
