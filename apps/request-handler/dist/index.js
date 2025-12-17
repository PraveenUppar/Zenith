"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_s3_1 = require("@aws-sdk/client-s3");
const mime_types_1 = __importDefault(require("mime-types"));
const s3 = new client_s3_1.S3Client({
    region: "auto",
    endpoint: "http://localhost:9000",
    credentials: {
        accessKeyId: "admin",
        secretAccessKey: "password",
    },
});
const app = (0, express_1.default)();
// FIXED: Use regex /.*/ instead of string "*" to match EVERYTHING
app.get(/.*/, async (req, res) => {
    const host = req.hostname;
    const id = req.path.split("/")[1];
    const filePath = req.path.slice(id.length + 2);
    if (!id) {
        res.status(404).send("ID not found");
        return;
    }
    const key = `dist/${id}/${filePath === "" ? "index.html" : filePath}`;
    console.log(`> Request: ${key}`);
    try {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: "output",
            Key: key,
        });
        const data = await s3.send(command);
        const type = mime_types_1.default.lookup(filePath);
        if (type) {
            res.set("Content-Type", type);
        }
        // @ts-ignore
        data.Body.pipe(res);
    }
    catch (e) {
        const fallbackKey = `dist/${id}/index.html`;
        try {
            const fallbackCommand = new client_s3_1.GetObjectCommand({
                Bucket: "output",
                Key: fallbackKey,
            });
            const fallbackData = await s3.send(fallbackCommand);
            res.set("Content-Type", "text/html");
            // @ts-ignore
            fallbackData.Body.pipe(res);
        }
        catch (error) {
            res.status(404).send("404 Not Found");
        }
    }
});
app.listen(3001, () => {
    console.log("Request Handler running on port 3001");
});
