import fs from "fs";
import path from "path";
export const getAllFiles = (folderPath) => {
    let response = [];
    // 1. Get list of all file/folder names inside the current folder
    const allFilesAndFolders = fs.readdirSync(folderPath);
    // 2. Loop through them
    allFilesAndFolders.forEach((file) => {
        // 3. Create the full path (e.g., /users/me/output/123/src)
        const fullFilePath = path.join(folderPath, file);
        // 4. Check stats: Is it a folder?
        if (fs.statSync(fullFilePath).isDirectory()) {
            // Call getAllFiles again with the new path
            // Merge the results into our current response array
            response = response.concat(getAllFiles(fullFilePath));
        }
        else {
            // It's a file! Add to array
            response.push(fullFilePath);
        }
    });
    return response;
};
