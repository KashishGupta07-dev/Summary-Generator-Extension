import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
function App() {
  const [loading, setLoading] = useState(false);
  const [showButton, setShowButton] = useState(true);
  const [summary, setSummary] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "Summary") {
        const formattedText = message.data.message;
        setSummary(formattedText);
        setLoading(false);
      } else if (message.type === "Error") {
        setSummary("Error generating summary.");
        setLoading(false);
      }
    });
  }, []);

  async function handleClick() {
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
  }
  async function pdfExtractor(e) {
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
    const formattedText = result.message;
    setSummary(formattedText);
    setLoading(false);
  }
  async function summaryGenerator() {
    setTimeout(async () => {
      try {
        let textContent = document.body.innerText;
        if (textContent.length == 0) {
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
  }
  async function handleYoutube() {
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
    const formattedText = result.message;
    setSummary(formattedText);
    setLoading(false);
  }
  return (
    <div className="w-[400px] h-[400px] p-4">
      <div className="font-bold mb-2">Summary Generator</div>
      <button
        onClick={handleClick}
        className={`${
          !showButton ? "hidden" : "block"
        } border-2 border-black p-2 rounded cursor-pointer`}
      >
        Generate Summary Of Webpage
      </button>
      <button
        className={`${
          !showButton ? "hidden" : "block"
        } border-2 mt-5 border-black p-2 rounded cursor-pointer`}
        onClick={() => ref.current.click()}
      >
        Upload PDF
      </button>
      <input
        type="file"
        accept="application/pdf"
        onChange={pdfExtractor}
        className={`hidden`}
        ref={ref}
      />
      <button
        onClick={handleYoutube}
        className={`${
          !showButton ? "hidden" : "block"
        } border-2 border-black mt-5 p-2 rounded cursor-pointer`}
      >
        Generate Summary Of Youtube Video
      </button>
      {loading && <div>Loading Summary....</div>}
      {summary && (
        <>
          <div className="mt-4 font-semibold">Summary Generated:</div>
          <ReactMarkdown>{summary}</ReactMarkdown>
        </>
      )}
    </div>
  );
}

export default App;
