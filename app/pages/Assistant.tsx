"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import Markdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import Reader from "../components/TTS";
import removeMd from "remove-markdown";
import FileExport from "../components/FileExport";

export default function AssistantPage() {
  const [notes, setNotes] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [sH, setSH] = useState(true);
  const locale = useLocale();
  const t = useTranslations("Assistant");

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/ai/history");
        if (res.ok) {
          const data = await res.json();
          if (data.history) {
            setHistory(data.history);
          }
        }
      } catch (err) {
        console.error("Failed to fetch history", err);
      } finally {
        setHistoryLoading(false);
      }
    }
    fetchHistory();
  }, []);

  const handleSummarize = async () => {
    setLoading(true);
    setSummary("");
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ notes, locale }) // Pass the current locale to the API for localized responses
      });
      const data = await res.json();
      if (res.ok) {
        setSummary(data.summary);
        if (data.studyNote) {
          setHistory((prev) => [...prev, data.studyNote]);
        }
      } else {
        alert(data.error || "An error occurred");
      }
    } catch (err) {
      alert("Failed to summarize notes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center text-left min-h-screen p-6 font-sans">
      <h1 className="text-3xl font-bold mb-4">{t("title")}</h1>
      <p className="text-gray-600 mb-6">{t("description")}</p>

      <textarea
        className="w-full h-64 p-4 border rounded shadow-sm focus:outline-none focus:ring focus:border-purple-300 dark:bg-zinc-800 dark:border-zinc-700"
        placeholder={t("placeholder")}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <button
        onClick={handleSummarize}
        disabled={loading || !notes.trim()}
        className="mt-4 px-6 py-2 bg-purple-600 text-white rounded shadow disabled:opacity-50"
      >
        {loading ? t("summarizing") : t("summarizeBtn")}
      </button>

      {summary && (
  <div className="mt-8 p-6 border rounded bg-zinc-50 dark:bg-zinc-900 border-purple-200">
    <h2 className="text-xl font-semibold mb-2 text-purple-700 dark:text-purple-400">
      {t("aiSummary")}
    </h2>

    <div className="flex gap-3 mb-4">
      <Reader text={removeMd(summary)} />
      <FileExport ext="md" content={summary} />
      <FileExport ext="txt" content={removeMd(summary)} />
    </div>

    <div className="prose dark:prose-invert max-w-none">
      <Markdown remarkPlugins={[remarkGfm]}>
        {summary}
      </Markdown>
    </div>
  </div>
)}


      {historyLoading ? (
        <div className="mt-8 text-center text-gray-500">Loading history...</div>
      ) : history.length > 0 ? (
        <>
        <button onClick={() => setSH(!sH)}>{sH ? t("hideHistory") : t("showHistory")}</button>
        {sH && (
            <div className="mt-12">
          <h3 className="text-2xl font-bold mb-4 border-b pb-2 text-zinc-800 dark:text-zinc-200">{t("sessionHistory")}</h3>
          <div className="space-y-6">
            {[...history].reverse().map((item, idx) => (
              <div key={item.id || idx} className="p-4 border rounded bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
                <div className="text-sm text-gray-500 mb-2">
                  {new Date(item.createdAt).toLocaleString(locale)}
                </div>
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300">Original Notes:</h4>
                  <p className="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-3">
                    {item.originalText}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-600 dark:text-purple-400">AI Summary:</h4>
                  <div className="prose prose-sm dark:prose-invert mt-1 text-xs hover:text-md transition-all duration-200 max-w-none">
                    <Markdown remarkPlugins={[remarkGfm]}>{item.summaryText}</Markdown>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}
        </>
      ) : null}
    </div>
  );
}
