import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
const ai = new GoogleGenAI({ apiKey: process.env.APIKEY });
import puppeteer from "puppeteer-core";
function splitIntoChunks(text, maxChunkSize = 4000) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = start + maxChunkSize;
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf(".", end);
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
async function getYoutubeTranscript(videoURL) {
  const apiKey = process.env.BROWSERLESS_API_KEY;
  if (!apiKey) {
    throw new Error("Browserless API key is not set in environment variables.");
  }
  const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://production-sfo.browserless.io?token=${apiKey}`,
  });

  const page = await browser.newPage();
  await page.goto(videoURL, { waitUntil: "networkidle2" });
  await page.evaluate(() => {
    document
      .querySelector("ytd-video-description-transcript-section-renderer button")
      ?.click();
  });
  await page.waitForSelector("#segments-container yt-formatted-string");
  const transcript = await page.evaluate(() => {
    return Array.from(
      document.querySelectorAll("#segments-container yt-formatted-string")
    )
      .map((element) => element.textContent.trim())
      .join("\n");
  });

  await browser.close();
  return transcript;
}
export default async function generate(req, res) {
  try {
    let text = req.body.text;
    const file = req.file;
    const url = req.body.url;
    if (file) {
      try {
        const data = await pdfParse(file.buffer);
        text = data.text;
      } catch (error) {
        console.error("Error parsing PDF file:", error);
        return res.status(500).json({
          success: false,
          message: `Error parsing PDF file.${error.message}`,
        });
      }
    }
    if (text.length === 0 && url.includes("youtube.com/watch?v=")) {
      try {
        const transcript = await getYoutubeTranscript(url);
        if (!transcript) {
          return res.status(404).json({
            success: false,
            message: "No transcript found for the provided YouTube video.",
          });
        }
        text = transcript;
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: `Error fetching YouTube transcript: ${error.message}`,
        });
      }
    }
    const cleanText = text.replace(/\s+/g, " ").trim();
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
      contents: `Give Summary In points very nice and clean and cover each and everything properly\n${summaries.join(
        "\n"
      )}`,
    });
    return res.status(200).json({
      successs: true,
      message: finalSummary.text,
    });
  } catch (error) {
    console.log(error);
  }
}
