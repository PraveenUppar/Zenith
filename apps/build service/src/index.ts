import { client } from "./redis.js";
import { downloadS3Folder } from "./aws";
import { buildProject } from "./utils";
import { copyFinalDist } from "./aws";

async function main() {
  console.log("Deploy Service: Waiting for jobs...");
  while (1) {
    try {
      const response = await client.brPop("build-queue", 0);
      if (!response) continue;
      const id = response.element;
      console.log(`Build request for project ID: ${id}`);

      await downloadS3Folder(`output/${id}`);
      console.log("Downloaded successfully. Ready to build!");

      console.log("Building...");
      await buildProject(id);
      console.log("Build complete!");

      console.log("Uploading dist folder...");
      await copyFinalDist(id);
      console.log("Deployment Complete!");
    } catch (error) {
      console.error("Error processing queue:", error);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

main();
