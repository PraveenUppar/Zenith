"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllFiles = void 0;
// apps/upload-service/src/file.ts
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const getAllFiles = (folderPath) => {
    let response = [];
    const allFilesAndFolders = fs_1.default.readdirSync(folderPath);
    allFilesAndFolders.forEach((file) => {
        const fullPath = path_1.default.join(folderPath, file);
        if (fs_1.default.statSync(fullPath).isDirectory()) {
            response = response.concat((0, exports.getAllFiles)(fullPath));
        }
        else {
            response.push(fullPath);
        }
    });
    return response;
};
exports.getAllFiles = getAllFiles;
