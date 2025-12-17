"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildProject = buildProject;
// apps/deploy-service/src/utils.ts
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
function buildProject(id) {
    return new Promise((resolve) => {
        // Resolve the absolute path to ensure we are pointing to the right place
        const folderPath = path_1.default.resolve(__dirname, `output/${id}`);
        // Check if folder exists before trying to CD into it
        if (!fs_1.default.existsSync(folderPath)) {
            console.error(`❌ ERROR: Source folder not found: ${folderPath}`);
            console.error("   (Did the download fail?)");
            resolve("");
            return;
        }
        console.log(`> Starting Build in: ${folderPath}`);
        // Use quotes around the path to handle spaces safely on Windows
        // cmd /c is often needed on Windows to chain commands properly
        const child = (0, child_process_1.exec)(`cd "${folderPath}" && npm install && npm run build`);
        child.stdout?.on("data", function (data) {
            console.log("stdout: " + data);
        });
        child.stderr?.on("data", function (data) {
            console.log("stderr: " + data);
        });
        child.on("close", function (code) {
            resolve("");
        });
    });
}
