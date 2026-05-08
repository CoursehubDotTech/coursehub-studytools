"use client";

export default function Reader({ text }: { text: string }) {
  const speak = () => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    speechSynthesis.speak(utter);
  };

  return (
    <button className="btn-primary p-1.5 rounded-md m-2" onClick={speak}>
      Read Aloud
    </button>
  );
}
