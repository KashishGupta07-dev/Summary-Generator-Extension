import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();
const ai = new GoogleGenAI({ apiKey: process.env.APIKEY});
function splitIntoChunks(text, maxChunkSize = 4000) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = start + maxChunkSize;
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end);
      if (lastPeriod > start) {
        end = lastPeriod + 1;
      }
    }

    const chunk = text.slice(start, end).trim();
    chunks.push(chunk);
    start = end;
  }

  return chunks;
}

export default async function generate(req,res){
    try{
        const {text} = req.body;
        const cleanText = text.replace(/\s+/g, ' ').trim();
        const chunks = splitIntoChunks(cleanText, 4000);
        const summaries = [];
        for (const chunk of chunks) {
        const res = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: `Summarize the following text with focus on important details only: ${chunk}`,
        });
        summaries.push(res.text);
        }
        const finalSummary = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Give Summary In points very nice and clean and cover each and everything properly\n${summaries.join('\n')}`,
        });

        return res.status(200).json({
            "successs" : true,
            message : finalSummary.text,
        });
    }catch(error){
        console.log(error);
    }
}