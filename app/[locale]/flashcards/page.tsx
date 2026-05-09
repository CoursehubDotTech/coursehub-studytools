"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

type Flashcard = {
  question: string;
  answer: string;
};

type FlashcardSet = {
  id: string;
  originalText?: string;
  flashcards: Flashcard[];
  createdAt: string;
};

const normalizeSets = (raw: unknown): FlashcardSet[] => {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((set) => {
      if (!set || typeof set !== "object") return null;
      const typedSet = set as Record<string, unknown>;
      if (!typedSet.id) return null;

      const cards = Array.isArray(typedSet.flashcards)
        ? typedSet.flashcards
            .map((card) => {
              if (!card || typeof card !== "object") return null;
              const typedCard = card as Record<string, unknown>;
              const question = String(typedCard.question || "");
              const answer = String(typedCard.answer || "");
              if (!question && !answer) return null;
              return { question, answer };
            })
            .filter(Boolean)
        : [];

      return {
        id: String(typedSet.id),
        originalText: typeof typedSet.originalText === "string" ? typedSet.originalText : "",
        createdAt: typeof typedSet.createdAt === "string" ? typedSet.createdAt : new Date().toISOString(),
        flashcards: cards as Flashcard[]
      };
    })
    .filter(Boolean) as FlashcardSet[];
};

const buildStudyOrder = (count: number, shuffleOn: boolean) => {
  const order = Array.from({ length: count }, (_, i) => i);
  if (!shuffleOn) return order;

  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  return order;
};

export default function FlashcardsPage() {
  const t = useTranslations("Flashcards");
  const [notes, setNotes] = useState("");
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [studyOrder, setStudyOrder] = useState<number[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [shuffleOn, setShuffleOn] = useState(false);
  const [knownCards, setKnownCards] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sortedSets = useMemo(() => {
    return [...flashcardSets].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [flashcardSets]);

  const currentSet = useMemo(() => {
    if (!selectedSetId) return sortedSets[0] || null;
    return sortedSets.find((set) => set.id === selectedSetId) || sortedSets[0] || null;
  }, [selectedSetId, sortedSets]);

  const currentCards = currentSet?.flashcards || [];
  const hasValidOrder = studyOrder.length === currentCards.length;
  const currentOrder = hasValidOrder ? studyOrder : buildStudyOrder(currentCards.length, false);
  const currentOrderIndex = currentOrder[cardIndex] ?? 0;
  const currentCard = currentCards[currentOrderIndex];
  const totalCards = currentOrder.length;
  const progress = totalCards ? (cardIndex + 1) / totalCards : 0;

  const knownCount = currentSet
    ? currentCards.reduce((count, _card, index) => {
        const key = `${currentSet.id}-${index}`;
        return count + (knownCards[key] ? 1 : 0);
      }, 0)
    : 0;

  const fetchFlashcards = async (preferSetId?: string) => {
    try {
      setError("");
      const res = await fetch("/api/flashcards");
      if (!res.ok) throw new Error("Failed to fetch flashcards");
      const data = await res.json();
      const normalized = normalizeSets(data.flashcards);
      setFlashcardSets(normalized);
      if (preferSetId && normalized.some((set) => set.id === preferSetId)) {
        setSelectedSetId(preferSetId);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchFlashcards();
  }, []);

  useEffect(() => {
    if (!currentSet) {
      setStudyOrder([]);
      setCardIndex(0);
      setShowAnswer(false);
      return;
    }

    setStudyOrder(buildStudyOrder(currentSet.flashcards.length, shuffleOn));
    setCardIndex(0);
    setShowAnswer(false);
  }, [currentSet?.id, currentSet?.flashcards.length, shuffleOn]);

  const handleGenerate = async () => {
    if (!notes.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/genFC", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, locale: navigator.language || "en" })
      });
      if (!res.ok) {
        throw new Error("Failed to generate flashcards");
      }
      const data = await res.json();
      await fetchFlashcards(data.flashcardSet?.id);
      setNotes("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const goPrev = () => {
    setCardIndex((prev) => Math.max(prev - 1, 0));
    setShowAnswer(false);
  };

  const goNext = () => {
    setCardIndex((prev) => Math.min(prev + 1, totalCards - 1));
    setShowAnswer(false);
  };

  const markKnown = () => {
    if (!currentSet || !totalCards) return;
    const key = `${currentSet.id}-${currentOrderIndex}`;
    setKnownCards((prev) => ({ ...prev, [key]: true }));
    if (cardIndex < totalCards - 1) {
      setCardIndex((prev) => prev + 1);
      setShowAnswer(false);
    }
  };

  const markAgain = () => {
    if (!currentSet || !totalCards) return;
    const key = `${currentSet.id}-${currentOrderIndex}`;
    setKnownCards((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const resetProgress = () => {
    if (!currentSet) return;
    setKnownCards((prev) => {
      const next = { ...prev };
      currentSet.flashcards.forEach((_card, index) => {
        delete next[`${currentSet.id}-${index}`];
      });
      return next;
    });
    setCardIndex(0);
    setShowAnswer(false);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">{t("studyLab")}</span>
          <h1 className="text-4xl font-semibold" style={{ fontFamily: '"DM Serif Display", "Georgia", serif' }}>{t("title")}</h1>
          <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">{t("description")}</p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-lg shadow-slate-200/50 backdrop-blur dark:border-slate-700 dark:bg-slate-900/70 dark:shadow-none">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{t("makeNewDeck")}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t("makeNewDeckDesc")}</p>
              </div>
              <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-500/20 dark:text-amber-200">
                {t("decksCount", { count: sortedSets.length })}
              </div>
            </div>

            <div className="mt-4">
              <textarea
                className="min-h-[140px] w-full resize-none rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-900 shadow-inner outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-amber-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-amber-400/30"
                placeholder={t("pastePlaceholder")}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                  onClick={handleGenerate}
                  disabled={loading || !notes.trim()}
                >
                  {loading ? t("generating") : t("generateBtn")}
                </button>
                {error && <span className="text-sm text-rose-600 dark:text-rose-300">{error}</span>}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-slate-700 dark:bg-slate-900/60 dark:shadow-none">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{t("studyMode")}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t("studyModeDesc")}</p>
              </div>
              <button
                className={`rounded-full px-4 py-1 text-xs font-semibold transition ${
                  shuffleOn
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                }`}
                onClick={() => setShuffleOn((prev) => !prev)}
              >
                {shuffleOn ? t("shuffleOn") : t("shuffleOff")}
              </button>
            </div>

            {!currentSet || !totalCards ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-300">{t("generateToStart")}</div>
            ) : (
              <div className="mt-6 flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
                  <span>{t("cardCounter", { current: cardIndex + 1, total: totalCards })}</span>
                  <span>{t("knownCounter", { count: knownCount })}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>

                <div className="relative" style={{ perspective: "1500px", height: "280px", width: "100%" }}>
                  <button
                    type="button"
                    onClick={() => setShowAnswer((prev) => !prev)}
                    className="group relative h-[280px] w-full transition-transform hover:-translate-y-1"
                  >
                    <div
                      className="relative h-full w-full rounded-2xl shadow-xl shadow-slate-200/40 transition-transform duration-500 ease-in-out dark:shadow-none"
                      style={{
                        transformStyle: "preserve-3d",
                        transform: showAnswer ? "rotateY(180deg)" : "rotateY(0deg)",
                      }}
                    >
                      <div
                        className="absolute inset-0 flex flex-col items-start justify-between rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-950"
                        style={{ backfaceVisibility: "hidden" }}
                      >
                        <span className="text-xs uppercase tracking-[0.3em] text-slate-400">{t("question")}</span>
                        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{currentCard?.question}</p>
                        <span className="text-xs text-slate-400">{t("tapToFlip")}</span>
                      </div>
                      <div
                        className="absolute inset-0 flex flex-col items-start justify-between rounded-2xl border border-slate-200 p-6 text-white dark:border-slate-700"
                        style={{
                          backfaceVisibility: "hidden",
                          transform: "rotateY(180deg)",
                        }}
                      >
                        <span className="text-xs uppercase tracking-[0.3em] text-slate-300">{t("answer")}</span>
                        <p className="text-lg font-semibold">{currentCard?.answer}</p>
                        <span className="text-xs text-slate-300">{t("tapToFlipBack")}</span>
                      </div>
                    </div>
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-200"
                      onClick={goPrev}
                      disabled={cardIndex === 0}
                    >
                      {t("prevBtn")}
                    </button>
                    <button
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-200"
                      onClick={goNext}
                      disabled={cardIndex >= totalCards - 1}
                    >
                      {t("nextBtn")}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
                      onClick={markKnown}
                    >
                      {t("gotItBtn")}
                    </button>
                    <button
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-200"
                      onClick={markAgain}
                    >
                      {t("againBtn")}
                    </button>
                    <button
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-200"
                      onClick={resetProgress}
                    >
                      {t("resetBtn")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-slate-700 dark:bg-slate-900/70 dark:shadow-none">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{t("deckLibrary")}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t("deckLibraryDesc")}</p>
            </div>
          </div>
          {sortedSets.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{t("noDecks")}</p>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {sortedSets.map((set) => {
                const isActive = currentSet?.id === set.id;
                return (
                  <button
                    key={set.id}
                    type="button"
                    onClick={() => setSelectedSetId(set.id)}
                    className={`flex h-full flex-col gap-3 rounded-2xl border px-4 py-4 text-left transition ${
                      isActive
                        ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em]">
                      <span>{new Date(set.createdAt).toLocaleString()}</span>
                      <span>{t("cardsCount", { count: set.flashcards.length })}</span>
                    </div>
                    <p className={`text-sm ${isActive ? "text-white/80" : "text-slate-500 dark:text-slate-400"}`}>
                      {set.originalText ? `${set.originalText.slice(0, 120)}...` : t("noSourceNotes")}
                    </p>
                    <span className={`text-xs font-semibold ${isActive ? "text-white" : "text-slate-600 dark:text-slate-300"}`}>
                      {isActive ? t("studying") : t("studyThisDeck")}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
