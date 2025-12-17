// apps/upload-service/src/file.ts
import fs from "fs";
import path from "path";

export const getAllFiles = (folderPath: string): string[] => {
  let response: string[] = [];
  const allFilesAndFolders = fs.readdirSync(folderPath);
  allFilesAndFolders.forEach((file) => {
    const fullPath = path.join(folderPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      response = response.concat(getAllFiles(fullPath));
    } else {
      response.push(fullPath);
    }
  });
  return response;
};
