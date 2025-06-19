import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Moon, Sun, Loader2 } from "lucide-react";

function App() {
  const [loading, setLoading] = useState(false);
  const [showButton, setShowButton] = useState(true);
  const [summary, setSummary] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    setDarkMode(stored === "dark");
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === "Summary") {
        setSummary(message.data.message);
        setLoading(false);
      } else if (message.type === "Error") {
        setSummary("Error generating summary.");
        setLoading(false);
      }
    });
  }, []);

  const handleClick = async () => {
    setLoading(true);
    setShowButton(false);
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: summaryGenerator,
    });
  };

  const pdfExtractor = async (e) => {
    setLoading(true);
    setShowButton(false);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("url", window.location.href);
    formData.append("text", "");

    const response = await fetch(`${import.meta.env.VITE_API_URL}/text`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    setSummary(result.message);
    setLoading(false);
  };

  const handleYoutube = async () => {
    setLoading(true);
    setShowButton(false);
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    const formData = new FormData();
    formData.append("file", null);
    formData.append("url", tab.url);
    formData.append("text", "");

    const response = await fetch(`${import.meta.env.VITE_API_URL}/text`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    setSummary(result.message);
    setLoading(false);
  };

  const summaryGenerator = async () => {
    setTimeout(async () => {
      try {
        const textContent = document.body.innerText;
        if (!textContent) {
          chrome.runtime.sendMessage({
            type: "Error",
            error: "No text content found on the page.",
          });
          return;
        }

        const formData = new FormData();
        formData.append("file", null);
        formData.append("url", window.location.href);
        formData.append("text", textContent);

        const response = await fetch(`${import.meta.env.VITE_API_URL}/text`, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        chrome.runtime.sendMessage({ type: "Summary", data });
      } catch (error) {
        chrome.runtime.sendMessage({ type: "Error", error: error.toString() });
      }
    }, 3000);
  };

  return (
    <div className={darkMode ? "dark-theme" : "light-theme"}>
      <div className="container">
        <div className="header">
          <h1 className="title">📝 Summary Generator</h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="theme-toggle cursor-pointer"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {showButton && (
          <div className="actions">
            <button onClick={handleClick} className="btn web cursor-pointer">
              🌐 Summarize Webpage
            </button>
            <button onClick={() => ref.current.click()} className="btn pdf cursor-pointer">
              📄 Upload PDF
            </button>
            <input
              type="file"
              accept="application/pdf"
              onChange={pdfExtractor}
              className="hidden"
              ref={ref}
            />
            <button onClick={handleYoutube} className="btn yt cursor-pointer">
              🎥 Summarize YouTube Video
            </button>
          </div>
        )}

        {loading && (
          <div className="loader">
            <Loader2 className="animate-spin w-6 h-6 text-blue-500" />
            <span className="ml-2">Generating summary...</span>
          </div>
        )}

        {summary && (
          <div className="output">
            <div className="font-semibold mb-2">📋 Summary:</div>
            <ReactMarkdown className="markdown">{summary}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
