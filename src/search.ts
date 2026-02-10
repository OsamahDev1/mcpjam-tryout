import type { Program } from "./types.js";

// Maps English search terms to Arabic keywords found in program titles/summaries
const KEYWORD_MAP: Record<string, string[]> = {
  // Tech & Engineering
  software: ["برمج", "تطوير", "حاسب", "تطبيق", "برنامج"],
  engineer: ["هندس", "تقني", "مهني"],
  programming: ["برمج", "تطوير", "حاسب"],
  developer: ["تطوير", "برمج", "تطبيق"],
  web: ["ويب", "تطوير", "تطبيق"],
  data: ["بيانات", "تحليل", "ذكاء"],
  ai: ["ذكاء", "اصطناعي", "بيانات"],
  "artificial intelligence": ["ذكاء", "اصطناعي"],
  "machine learning": ["ذكاء", "اصطناعي", "تعلم"],
  cyber: ["سيبران", "أمن", "حماية"],
  security: ["أمن", "سيبران", "حماية"],
  cloud: ["سحاب", "حوسبة"],
  network: ["شبك", "اتصال"],
  game: ["ألعاب", "تصميم"],
  digital: ["رقم", "تحول", "إلكتروني"],
  iot: ["إنترنت", "أشياء"],

  // Business & Management
  business: ["إدار", "أعمال", "تجار"],
  management: ["إدار", "قياد"],
  marketing: ["تسويق", "إعلان"],
  finance: ["مال", "محاسب", "اقتصاد"],
  accounting: ["محاسب", "مال"],
  hr: ["موارد", "بشري"],
  "human resources": ["موارد", "بشري"],
  project: ["مشروع", "إدار"],
  leadership: ["قياد", "إدار"],
  entrepreneur: ["ريادة", "أعمال"],
  logistics: ["لوجست", "إمداد", "سلسل"],
  "supply chain": ["إمداد", "سلسل", "لوجست"],

  // Health
  health: ["صح", "طب", "رعاي"],
  medical: ["طب", "صح"],
  nursing: ["تمريض", "صح"],
  pharmacy: ["صيدل", "دواء"],
  nutrition: ["تغذ", "غذا"],
  "public health": ["صحة", "عامة"],

  // Education
  education: ["تعليم", "تدريس", "تربو"],
  teaching: ["تدريس", "تعليم"],
  training: ["تدريب", "تأهيل"],
  "early childhood": ["طفولة", "أطفال"],

  // Law & Public
  law: ["قانون", "حقوق", "نظام"],
  legal: ["قانون", "حقوق"],
  tourism: ["سياح", "ضياف"],
  hospitality: ["ضياف", "فندق"],
  media: ["إعلام", "اتصال"],
  "public relations": ["علاقات", "عامة", "اتصال"],
  design: ["تصميم", "إبداع"],
  architecture: ["عمار", "تصميم"],
  environment: ["بيئ", "استدام"],
  energy: ["طاق", "كهرب"],
  agriculture: ["زراع", "غذا"],
};

export function searchPrograms(
  programs: Program[],
  query: string
): Program[] {
  const queryTerms = query.toLowerCase().split(/\s+/);
  const scores = new Map<number, number>();

  for (const program of programs) {
    let score = 0;
    const titleLower = program.title.toLowerCase();
    const summaryLower = program.summary.toLowerCase();

    for (const term of queryTerms) {
      const arabicKeywords = KEYWORD_MAP[term];
      if (!arabicKeywords) continue;

      for (const keyword of arabicKeywords) {
        if (titleLower.includes(keyword)) {
          score += 3;
        }
        if (summaryLower.includes(keyword)) {
          score += 1;
        }
      }
    }

    // Also try multi-word matches
    const fullQuery = queryTerms.join(" ");
    const multiWordKeywords = KEYWORD_MAP[fullQuery];
    if (multiWordKeywords) {
      for (const keyword of multiWordKeywords) {
        if (titleLower.includes(keyword)) score += 3;
        if (summaryLower.includes(keyword)) score += 1;
      }
    }

    if (score > 0) {
      scores.set(program.id, score);
    }
  }

  return programs
    .filter((p) => scores.has(p.id))
    .sort((a, b) => (scores.get(b.id) || 0) - (scores.get(a.id) || 0));
}

export function filterPrograms(
  programs: Program[],
  filters: {
    type?: string;
    organization?: string;
    maxPrice?: number;
  }
): Program[] {
  return programs.filter((p) => {
    if (filters.type && p.type !== filters.type) return false;
    if (
      filters.organization &&
      !p.organization.name.includes(filters.organization)
    )
      return false;
    if (filters.maxPrice !== undefined) {
      const price = parseFloat(p.price) || 0;
      const additional = parseFloat(p.additional_price) || 0;
      if (price + additional > filters.maxPrice) return false;
    }
    return true;
  });
}
