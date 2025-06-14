# Summary Generator Extension
[![Ask DeepWiki](https://devin.ai/assets/askdeepwiki.png)](https://deepwiki.com/KashishGupta07-dev/Summary-Generator-Extension)

## Overview

This project is a browser extension designed to generate concise summaries of various content types using AI. It can summarize:
*   The text content of the current active web page.
*   The content of uploaded PDF files.
*   The transcripts of YouTube videos.

The backend is built with Node.js and Express, leveraging Google's Gemini AI model (specifically `gemini-2.0-flash`) for summarization. The browser extension frontend is developed using React and Vite.

## Features

*   **Web Page Summarization:** Generates a summary from the textual content of the currently active browser tab.
*   **PDF Summarization:** Allows users to upload PDF files and receive a summary of their content.
*   **YouTube Video Summarization:** Fetches the transcript of a YouTube video (if available) and summarizes it.
*   **AI-Powered Summaries:** Utilizes Google's Gemini AI for intelligent and context-aware text summarization.
*   **Chunked Processing:** For long texts, the content is split into smaller chunks, summarized individually, and then combined into a final summary to handle API limits and improve the summarization of extensive documents.
*   **User-Friendly Interface:** A simple and intuitive popup interface within the browser extension for easy operation.

## Tech Stack

**Backend:**
*   Node.js
*   Express.js
*   Google GenAI SDK (`@google/genai`)
*   Multer (for handling PDF file uploads)
*   `pdf-parse` (for extracting text from PDF files)
*   Puppeteer-core (for fetching YouTube video transcripts, connecting to a Browserless.io instance)
*   `dotenv` (for managing environment variables)

**Frontend (Browser Extension):**
*   React
*   Vite
*   Tailwind CSS
*   Web Extensions API (using `chrome.tabs`, `chrome.scripting`, `chrome.runtime`)

**Deployment:**
*   Backend API: Designed for deployment on platforms like Vercel (see `vercel.json`).

## Project Structure

```
kashishgupta07-dev-summary-generator-extension/
├── index.js                      # Backend Express server entry point
├── package.json                  # Backend dependencies and scripts
├── vercel.json                   # Vercel deployment configuration for the backend
├── controller/
│   └── generateResponse.js       # Core logic for text processing and AI summarization
└── frontend/
    ├── index.html                # Base HTML for the extension popup
    ├── package.json              # Frontend dependencies and scripts
    ├── vite.config.js            # Vite configuration for the frontend build
    ├── public/
    │   ├── content.js            # Content script (currently basic)
    │   ├── index.html            # HTML template for the extension popup (used by Vite)
    │   └── manifest.json         # Chrome extension manifest file
    └── src/
        ├── App.jsx               # Main React component for the extension's UI
        ├── index.css             # Main CSS file (imports Tailwind)
        └── main.jsx              # React application entry point
```

## API Endpoint

The backend exposes a single primary endpoint for generating summaries:

*   **`POST /text`**
    *   **Description:** Accepts text content, a PDF file, or a YouTube URL and returns an AI-generated summary.
    *   **Request Type:** `multipart/form-data`
    *   **Form Fields:**
        *   `text` (String, optional): Direct text to be summarized.
        *   `file` (File, optional): A PDF file.
        *   `url` (String, optional): A YouTube video URL (e.g., `https://www.youtube.com/watch?v=...`).
    *   **Responses:**
        *   **Success (200 OK):**
            ```json
            {
              "successs": true,
              "message": "Generated summary text in point format..."
            }
            ```
        *   **Error (e.g., 404 Not Found, 500 Internal Server Error):**
            ```json
            {
              "success": false,
              "message": "Error message detailing the issue."
            }
            ```

## How it Works

1.  **Input:** The user interacts with the extension popup to either summarize the current webpage, upload a PDF, or summarize a YouTube video. The request (text, file, or URL) is sent to the backend API.
2.  **Text Extraction (Backend):**
    *   **Web Page:** The extension's `summaryGenerator` function (injected into the active tab) extracts `document.body.innerText`.
    *   **PDF:** If a PDF file is uploaded, `pdf-parse` on the backend extracts its text content.
    *   **YouTube URL:** If a YouTube URL is provided, Puppeteer (connected to a Browserless.io service) navigates to the video, attempts to reveal and scrape the transcript.
3.  **Text Preprocessing:** The extracted text is cleaned by removing excessive whitespace.
4.  **Chunking:** The cleaned text is divided into smaller chunks (default max 4000 characters) to adhere to the AI model's input constraints and to facilitate better summarization of lengthy content.
5.  **Initial Summarization:** Each chunk is individually sent to the Google Gemini AI model (`gemini-2.0-flash`) with a prompt to "Summarize the following text with focus on important details only".
6.  **Final Summarization:** The summaries generated from all chunks are concatenated. This combined text is then sent back to the Gemini AI model with a prompt to "Give Summary In points very nice and clean and cover each and everything properly".
7.  **Display:** The final, formatted summary is returned to the browser extension, which then renders it in the popup UI for the user.

## Setup and Installation

**Prerequisites:**
*   Node.js and npm (or yarn) installed.
*   A Google GenAI API Key.
*   A Browserless.io API Key (required for fetching YouTube transcripts).

**Backend Setup:**
1.  Clone the repository:
    ```bash
    git clone https://github.com/KashishGupta07-dev/Summary-Generator-Extension.git
    cd Summary-Generator-Extension
    ```
2.  Install backend dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the root directory of the project (`Summary-Generator-Extension/`) and add your API keys:
    ```env
    APIKEY=YOUR_GOOGLE_GENAI_API_KEY
    BROWSERLESS_API_KEY=YOUR_BROWSERLESS_IO_API_KEY
    PORT=3000 # Optional, defaults to 3000 if not set
    ```
4.  Start the backend server:
    ```bash
    npm start
    ```
    The server will typically be running on `http://localhost:3000`.

**Frontend (Browser Extension) Setup:**
1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install frontend dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `frontend` directory (`Summary-Generator-Extension/frontend/.env`):
    ```env
    VITE_API_URL=http://localhost:3000
    ```
    (Replace `http://localhost:3000` with your deployed backend URL if applicable).
4.  Build the extension:
    ```bash
    npm run build
    ```
    This command will generate a `dist` folder inside the `frontend` directory. This `dist` folder contains the packaged extension.

**Loading the Extension in Chrome (or Chromium-based browsers):**
1.  Open your browser and navigate to `chrome://extensions`.
2.  Enable "Developer mode" (usually a toggle switch in the top-right corner).
3.  Click on the "Load unpacked" button.
4.  In the file dialog, select the `frontend/dist` directory from your project.
5.  The "Summary Generator" extension icon should now appear in your browser's toolbar.

## Usage

1.  Click the "Summary Generator" extension icon in your browser toolbar to open the popup.
2.  Choose one of the following options:
    *   **Summarize Current Webpage:** Click the "Generate Summary Of Webpage" button. The extension will take the text content of your active tab and send it for summarization.
    *   **Summarize PDF:** Click the "Upload PDF" button. A file dialog will appear, allowing you to select a PDF file from your computer.
    *   **Summarize YouTube Video:** Navigate to a YouTube video page. Then, open the extension popup and click the "Generate Summary Of Youtube Video" button.
3.  A "Loading Summary...." message will appear while the backend processes the request.
4.  Once ready, the generated summary will be displayed in the popup.
