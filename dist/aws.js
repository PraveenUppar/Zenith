"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = void 0;
// apps/upload-service/src/aws.ts
const client_s3_1 = require("@aws-sdk/client-s3");
const fs_1 = __importDefault(require("fs"));
// Replace with your actual MinIO credentials from docker-compose
const s3 = new client_s3_1.S3Client({
    region: "auto",
    endpoint: "http://localhost:9000",
    credentials: {
        accessKeyId: "admin",
        secretAccessKey: "password",
    },
});
const uploadFile = async (fileName, localFilePath) => {
    const fileContent = fs_1.default.readFileSync(localFilePath);
    const command = new client_s3_1.PutObjectCommand({
        Bucket: "output", // Ensure this bucket exists in MinIO
        Key: fileName,
        Body: fileContent,
    });
    try {
        await s3.send(command);
        console.log(`Uploaded ${fileName}`);
    }
    catch (error) {
        console.log("Error uploading file:", error);
    }
};
exports.uploadFile = uploadFile;
