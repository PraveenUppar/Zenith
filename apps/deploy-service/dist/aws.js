"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFinalDist = void 0;
exports.downloadS3Folder = downloadS3Folder;
// apps/deploy-service/src/aws.ts
const client_s3_1 = require("@aws-sdk/client-s3");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const stream_1 = require("stream");
// ⚠️ CHECK THIS: Ensure this matches the bucket name you see in MinIO Console
const BUCKET_NAME = "output"; // <--- CHANGE THIS to "local-outputs" if that's what you used!
const s3 = new client_s3_1.S3Client({
    region: "auto",
    endpoint: "http://localhost:9000",
    credentials: {
        accessKeyId: "admin",
        secretAccessKey: "password",
    },
});
async function downloadS3Folder(prefix) {
    console.log(`> Looking for files in Bucket: "${BUCKET_NAME}" with Prefix: "${prefix}"`);
    const command = new client_s3_1.ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
    });
    // List all files
    const allFiles = await s3.send(command);
    // DEBUG LOG: How many files did we find?
    if (!allFiles.Contents || allFiles.Contents.length === 0) {
        console.error("❌ CRITICAL: No files found in S3! Check your Bucket Name and Prefix.");
        return;
    }
    console.log(`> Found ${allFiles.Contents.length} files. Downloading...`);
    const allPromises = allFiles.Contents?.map(async ({ Key }) => {
        return new Promise(async (resolve) => {
            if (!Key) {
                resolve("");
                return;
            }
            const finalOutputPath = path_1.default.join(__dirname, Key);
            const outputFile = fs_1.default.createWriteStream(finalOutputPath);
            const dirName = path_1.default.dirname(finalOutputPath);
            if (!fs_1.default.existsSync(dirName)) {
                fs_1.default.mkdirSync(dirName, { recursive: true });
            }
            const getCommand = new client_s3_1.GetObjectCommand({
                Bucket: BUCKET_NAME, // Use the constant
                Key,
            });
            const data = await s3.send(getCommand);
            if (data.Body instanceof stream_1.Readable) {
                data.Body.pipe(outputFile).on("finish", () => {
                    resolve("");
                });
            }
        });
    }) || [];
    await Promise.all(allPromises?.filter((x) => x !== undefined));
}
const uploadFinalDist = async (id) => {
    // 1. Determine where the build output is
    const folderPath = path_1.default.join(__dirname, `output/${id}`);
    let distFolderPath = path_1.default.join(folderPath, "dist");
    if (!fs_1.default.existsSync(distFolderPath)) {
        distFolderPath = path_1.default.join(folderPath, "build"); // Try 'build' for CRA
    }
    if (!fs_1.default.existsSync(distFolderPath)) {
        console.error(`❌ ERROR: Could not find 'dist' or 'build' folder in ${folderPath}`);
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
exports.uploadFinalDist = uploadFinalDist;
const getAllFiles = (folderPath) => {
    let response = [];
    if (fs_1.default.existsSync(folderPath)) {
        const allFilesAndFolders = fs_1.default.readdirSync(folderPath);
        allFilesAndFolders.forEach((file) => {
            const fullPath = path_1.default.join(folderPath, file);
            if (fs_1.default.statSync(fullPath).isDirectory()) {
                response = response.concat(getAllFiles(fullPath));
            }
            else {
                response.push(fullPath);
            }
        });
    }
    return response;
};
const uploadFile = async (fileName, localFilePath) => {
    const fileContent = fs_1.default.readFileSync(localFilePath);
    const command = new client_s3_1.PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: fileContent,
    });
    await s3.send(command);
    console.log(`Uploaded ${fileName}`);
};
