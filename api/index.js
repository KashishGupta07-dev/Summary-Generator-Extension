import express from "express";
import generate from "../controller/generateResponse.js";
const app = express();
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import serverless from "serverless-http";
app.use(express.json());
app.use(cors({
    origin: "*"
}));
app.get("/",(req,res)=>{
    res.send("Welcome to the AI Text Generation API");
})
app.post("/text",generate);
export const handler = serverless(app);