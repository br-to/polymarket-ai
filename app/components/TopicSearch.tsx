"use client";

import { useState } from "react";

interface TopicSearchProps {
  onSearch: (query: string) => void;
  loading?: boolean;
}

export function TopicSearch({ onSearch, loading = false }: TopicSearchProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const suggestions = ["Bitcoin", "AI", "Trump", "Ethereum", "Japan", "War"];

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="話題を入力... (例: Bitcoin, AI, Trump)"
          className="flex-1 h-10 rounded-md border border-gray-200 px-3.5 text-base text-gray-900 focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="h-10 px-5 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-400 cursor-pointer disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "検索中..." : "検索"}
        </button>
      </form>
      <div className="flex gap-2 flex-wrap">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setQuery(s);
              onSearch(s);
            }}
            disabled={loading}
            className="px-3 py-1 text-sm rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
