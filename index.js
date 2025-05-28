import express from "express";
import generate from "./controller/generateResponse.js";
const app = express();
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import multer from "multer";
app.use(express.json());
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
app.use(cors({
    origin: "*"
}));
app.get("/",(req,res)=>{
    res.send("Welcome to the AI Text Generation API");
})
app.post("/text",upload.single("file"),generate);
app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
});