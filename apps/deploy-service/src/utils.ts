// apps/deploy-service/src/utils.ts
import { exec } from "child_process";
import path from "path";
import fs from "fs";

export function buildProject(id: string) {
  return new Promise((resolve) => {
    // Resolve the absolute path to ensure we are pointing to the right place
    const folderPath = path.resolve(__dirname, `output/${id}`);

    // Check if folder exists before trying to CD into it
    if (!fs.existsSync(folderPath)) {
      console.error(`❌ ERROR: Source folder not found: ${folderPath}`);
      console.error("   (Did the download fail?)");
      resolve("");
      return;
    }

    console.log(`> Starting Build in: ${folderPath}`);

    // Use quotes around the path to handle spaces safely on Windows
    // cmd /c is often needed on Windows to chain commands properly
    const child = exec(`cd "${folderPath}" && npm install && npm run build`);

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
