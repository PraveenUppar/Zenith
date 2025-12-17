"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// apps/upload-service/src/index.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const simple_git_1 = __importDefault(require("simple-git"));
const path_1 = __importDefault(require("path"));
const utils_js_1 = require("./utils.js"); // Note the .js extension for nodenext
const file_js_1 = require("./file.js");
const aws_js_1 = require("./aws.js");
const redis_1 = require("redis");
const publisher = (0, redis_1.createClient)();
publisher.connect();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Main Endpoint
app.post("/deploy", async (req, res) => {
    const repoUrl = req.body.repoUrl;
    if (!repoUrl) {
        // Basic validation
        res.status(400).json({ error: "Missing repoUrl" });
        return;
    }
    const id = (0, utils_js_1.generateRandomId)(); // e.g., "xc78s"
    const outputPath = path_1.default.join(__dirname, `output/${id}`);
    // 1. Clone the Repo
    await (0, simple_git_1.default)().clone(repoUrl, outputPath);
    // 2. Get all files path
    const files = (0, file_js_1.getAllFiles)(outputPath);
    // 3. Upload raw source code to S3
    // We iterate over the files and upload them one by one.
    // In production, you might want to zip this or use a queue for uploads to avoid blocking.
    for (const file of files) {
        // file: /Users/username/project/dist/output/xc78s/src/App.tsx
        // target: output/xc78s/src/App.tsx
        // We want to remove the base path to get the relative S3 key
        const relativePath = file.slice(outputPath.length + 1).replace(/\\/g, "/");
        await (0, aws_js_1.uploadFile)(`output/${id}/${relativePath}`, file);
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
