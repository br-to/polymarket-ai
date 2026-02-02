/**
 * 選挙市場の英語タイトル・選択肢名を日本語に変換する
 */

// 政党・団体名の英日対応
const PARTY_NAMES: Record<string, string> = {
  LDP: "自民党",
  "LDP party": "自民党",
  CRA: "立憲・民主系",
  JIP: "日本維新の会",
  DPFP: "国民民主党",
  Reiwa: "れいわ新選組",
  "Reiwa party": "れいわ新選組",
};

// タイトル内の定型表現を日本語に変換
const TITLE_PHRASES: Array<[RegExp | string, string]> = [
  [/Will LDP win a majority in the 2026 Japanese snap election\?/gi, "2026年衆院選で自民党は過半数を獲得する？"],
  [/Will LDP win a majority in the Japanese snap election\?/gi, "衆院選で自民党は過半数を獲得する？"],
  [/# of LDP seats after the 2026 Japanese snap election\?/gi, "2026年衆院選後の自民党の獲得議席数は？"],
  [/# of LDP seats after the Japanese snap election\?/gi, "衆院選後の自民党の獲得議席数は？"],
  [/Which parties will lose seats in Japanese snap election\?/gi, "衆院選で議席を減らす政党は？"],
  [/# of CRA seats after the 2026 Japanese snap election\?/gi, "2026年衆院選後の立憲・民主系の獲得議席数は？"],
  [/# of DPFP seats after the 2026 Japanese snap election\?/gi, "2026年衆院選後の国民民主党の獲得議席数は？"],
  [/# of JIP seats after the 2026 Japanese snap election\?/gi, "2026年衆院選後の日本維新の会の獲得議席数は？"],
  [/Will CRA win 173\+ seats in the Japanese snap election\?/gi, "衆院選で立憲・民主系は173議席以上獲得する？"],
  [/Turnout in 2026 Japanese Snap Election\?/gi, "2026年衆院選の投票率は？"],
  [/Turnout in Japanese Snap Election\?/gi, "衆院選の投票率は？"],
  [/Governing Parties after Japanese snap election\?/gi, "衆院選後の与党は？"],
  [/Japan General Election Winner\?/gi, "日本総選挙の勝者は？"],
  [/Japan General Election 2nd Place\?/gi, "日本総選挙の2位は？"],
  [/Japan General Election 3rd Place\?/gi, "日本総選挙の3位は？"],
  [/Japanese snap election/gi, "衆院選"],
  [/Japanese Snap Election/gi, "衆院選"],
  [/Japan General Election/gi, "日本総選挙"],
  [/snap election/gi, "衆院選"],
  [/General Election/gi, "総選挙"],
  [/win a majority/gi, "過半数を獲得する"],
  [/lose seats/gi, "議席を減らす"],
  [/Governing Parties/gi, "与党"],
  [/seats after/gi, "獲得議席数"],
  [/Turnout/gi, "投票率"],
];

/**
 * 市場タイトルを日本語に変換
 */
export function translateTitle(title: string): string {
  if (!title || typeof title !== "string") return title;
  let result = title;

  // 定型フレーズを優先して置換
  for (const [pattern, replacement] of TITLE_PHRASES) {
    if (typeof pattern === "string") {
      result = result.replace(new RegExp(escapeRegex(pattern), "gi"), replacement);
    } else {
      result = result.replace(pattern, replacement);
    }
  }

  // 残った政党名を置換（単語境界で）
  for (const [en, ja] of Object.entries(PARTY_NAMES)) {
    const re = new RegExp(`\\b${escapeRegex(en)}\\b`, "gi");
    result = result.replace(re, ja);
  }

  return result.trim();
}

/**
 * 選択肢名（政党名・数値範囲など）を日本語に変換
 */
export function translateOptionName(name: string): string {
  if (!name || typeof name !== "string") return name;

  // 政党名の完全一致
  const upper = name.trim();
  for (const [en, ja] of Object.entries(PARTY_NAMES)) {
    if (upper === en || upper.toLowerCase() === en.toLowerCase()) {
      return ja;
    }
  }

  // 数値範囲はそのまま（例: "250+", "19–22", "<150", "56–58%"）
  return name;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
