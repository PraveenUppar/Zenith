"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publisher = exports.client = void 0;
const redis_1 = require("redis");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.client = (0, redis_1.createClient)({
    url: process.env.UPSTASH_REDIS_REST_URL,
});
exports.client.on("error", (err) => console.log("Redis Client Error", err));
exports.client.connect();
exports.publisher = exports.client.duplicate();
exports.publisher.connect();
