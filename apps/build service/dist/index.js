"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_js_1 = require("./redis.js");
const aws_1 = require("./aws");
const utils_1 = require("./utils");
const aws_2 = require("./aws");
async function main() {
    console.log("Deploy Service: Waiting for jobs...");
    while (1) {
        try {
            const response = await redis_js_1.client.brPop("build-queue", 0);
            if (!response)
                continue;
            const id = response.element;
            console.log(`Build request for project ID: ${id}`);
            await (0, aws_1.downloadS3Folder)(`output/${id}`);
            console.log("Downloaded successfully. Ready to build!");
            console.log("Building...");
            await (0, utils_1.buildProject)(id);
            console.log("Build complete!");
            console.log("Uploading dist folder...");
            await (0, aws_2.copyFinalDist)(id);
            console.log("Deployment Complete!");
            await redis_js_1.publisher.hSet("status", id, "deployed");
            console.log(`Deployment ${id} is live!`);
        }
        catch (error) {
            console.error("Error processing queue:", error);
            await new Promise((r) => setTimeout(r, 1000));
        }
    }
}
main();
