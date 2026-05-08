"use client";

export default function FileExport({ ext = "txt", content }: { ext: "txt" | "md", content: string }) {
  const downloadFile = () => {
    const blob = new Blob([content], { type: `text/${ext}` });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `coursehub.${ext}`;
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={downloadFile}
      className="btn-primary p-1.5 rounded-md m-2"
    >
      Export as {ext=="md" ? "Markdown" : "Text"}
    </button>
  );
}
