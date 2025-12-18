import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

export const client = createClient({
  url: process.env.UPSTASH_REDIS_REST_URL,
});

client.on("error", (err) => console.log("Redis Client Error", err));

client.connect();
