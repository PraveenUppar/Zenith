import { exec } from "child_process";
import path from "path";
import fs from "fs";

export const getAllFiles = (folderPath: string): string[] => {
  let response: string[] = [];
  const allFilesAndFolders = fs.readdirSync(folderPath);
  allFilesAndFolders.forEach((file) => {
    const fullFilePath = path.join(folderPath, file);
    if (fs.statSync(fullFilePath).isDirectory()) {
      response = response.concat(getAllFiles(fullFilePath));
    } else {
      response.push(fullFilePath);
    }
  });
  return response;
};

export function buildProject(id: string) {
  return new Promise((resolve, reject) => {
    const folderPath = path.join(__dirname, "output", id);

    const command = `cd ${folderPath} && npm install && npm run build`;

    console.log(`Starting build for ${id}...`);

    const child = exec(command);

    child.stdout?.on("data", function (data) {
      console.log("stdout: " + data);
    });

    child.stderr?.on("data", function (data) {
      console.error("stderr: " + data);
    });

    child.on("close", function (code) {
      if (code === 0) {
        resolve("");
      } else {
        reject(new Error(`Build failed with exit code ${code}`));
      }
    });
  });
}
