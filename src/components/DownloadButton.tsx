"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

export default function DownloadButton({ 
  id, 
  endpoint, 
  filenamePrefix,
  className,
  text
}: { 
  id: string, 
  endpoint: string, 
  filenamePrefix: string,
  className?: string,
  text?: string
}) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      
      if (!res.ok) {
        alert("Download failed. Please try again.");
        return;
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      // Attempt to get filename from Content-Disposition header
      let filename = `${filenamePrefix}_${id}.pdf`;
      const cd = res.headers.get("content-disposition");
      if (cd) {
        const match = cd.match(/filename="([^"]+)"/);
        if (match) filename = match[1];
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Error downloading file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleDownload}
      disabled={loading}
      className={className || "inline-flex items-center text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded transition-colors disabled:opacity-50"}
      title={`Download ID: ${id}`}
    >
      {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Download className="w-3 h-3 mr-1" />}
      {text || "Download"}
    </button>
  );
}
