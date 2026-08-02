"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = void 0;
exports.downloadS3Folder = downloadS3Folder;
exports.copyFinalDist = copyFinalDist;
const client_s3_1 = require("@aws-sdk/client-s3");
const utils_1 = require("./utils");
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const s3 = new client_s3_1.S3Client({
    region: "ap-south-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
});
async function downloadS3Folder(prefix) {
    console.log(`Downloading content for: ${prefix}...`);
    try {
        const listCommand = new client_s3_1.ListObjectsV2Command({
            Bucket: "zenith-deployment-as-a-service-project",
            Prefix: prefix,
        });
        const allFiles = await s3.send(listCommand);
        if (!allFiles.Contents || allFiles.Contents.length === 0) {
            console.log("No files found in bucket.");
            return;
        }
        const downloadPromises = allFiles.Contents.map(async ({ Key }) => {
            if (!Key)
                return;
            const finalOutputPath = path_1.default.join(__dirname, Key);
            const dirName = path_1.default.dirname(finalOutputPath);
            if (!fs_1.default.existsSync(dirName)) {
                fs_1.default.mkdirSync(dirName, { recursive: true });
            }
            const getCommand = new client_s3_1.GetObjectCommand({
                Bucket: "zenith-deployment-as-a-service-project",
                Key: Key,
            });
            const data = await s3.send(getCommand);
            if (data.Body) {
                const fileData = await data.Body.transformToByteArray();
                fs_1.default.writeFileSync(finalOutputPath, fileData);
            }
        });
        await Promise.all(downloadPromises);
        console.log("Download complete.");
    }
    catch (error) {
        console.error("Error downloading folder:", error);
    }
}
const uploadFile = async (fileName, localFilePath) => {
    const fileContent = fs_1.default.readFileSync(localFilePath);
    const command = new client_s3_1.PutObjectCommand({
        Bucket: "zenith-deployment-as-a-service-project",
        Key: fileName,
        Body: fileContent,
        ContentType: "text/html",
    });
    try {
        await s3.send(command);
        console.log(`Uploaded project to Deployment${fileName}`);
    }
    catch (error) {
        console.error("Error uploading:", error);
    }
};
exports.uploadFile = uploadFile;
async function copyFinalDist(id) {
    const folderPath = path_1.default.join(__dirname, "output", id, "dist");
    const allFiles = (0, utils_1.getAllFiles)(folderPath);
    const uploadPromises = allFiles.map((file) => {
        const relativePath = file.slice(folderPath.length + 1);
        const destination = `dist/${id}/${relativePath}`.replace(/\\/g, "/");
        console.log(`Uploading ${relativePath} to ${destination}`);
        return (0, exports.uploadFile)(destination, file);
    });
    await Promise.all(uploadPromises);
}
