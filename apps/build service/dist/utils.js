"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllFiles = void 0;
exports.buildProject = buildProject;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const getAllFiles = (folderPath) => {
    let response = [];
    const allFilesAndFolders = fs_1.default.readdirSync(folderPath);
    allFilesAndFolders.forEach((file) => {
        const fullFilePath = path_1.default.join(folderPath, file);
        if (fs_1.default.statSync(fullFilePath).isDirectory()) {
            response = response.concat((0, exports.getAllFiles)(fullFilePath));
        }
        else {
            response.push(fullFilePath);
        }
    });
    return response;
};
exports.getAllFiles = getAllFiles;
function buildProject(id) {
    return new Promise((resolve, reject) => {
        const folderPath = path_1.default.join(__dirname, "output", id);
        const command = `cd ${folderPath} && npm install && npm run build`;
        console.log(`Starting build for ${id}...`);
        const child = (0, child_process_1.exec)(command);
        child.stdout?.on("data", function (data) {
            console.log("stdout: " + data);
        });
        child.stderr?.on("data", function (data) {
            console.error("stderr: " + data);
        });
        child.on("close", function (code) {
            if (code === 0) {
                resolve("");
            }
            else {
                reject(new Error(`Build failed with exit code ${code}`));
            }
        });
    });
}
