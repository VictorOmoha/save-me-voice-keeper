import { c as createLucideIcon, i as cn, d as db, u as useAuth, E as ErrorBoundary, A as Search, S as Sparkles, F as FileText, B as Button, D as Download, X, J as Jt, C as Card, h as CardContent, m as Brain, p as printProfessionally } from "./index-CT7EzYyk.js";
import { z as Root2, T as Trigger, a as reactExports, j as jsxRuntimeExports, A as Portal2, D as Content2, L as Label2, E as Separator2, F as Item2, G as SubTrigger2, H as SubContent2, J as CheckboxItem2, K as ItemIndicator2, M as RadioItem2, u as useComposedRefs, d as useControllableState, P as Primitive, f as composeEventHandlers, e as Presence, x as usePrevious, y as useSize, m as createContextScope, R as React } from "./vendor-ui-CLSr_GWM.js";
import { C as ChevronRight } from "./chevron-right-fa0SEsLi.js";
import { C as Check } from "./check-CZQFmZAj.js";
import { I as Input } from "./input-B1KmmYia.js";
import { p as collection, q as addDoc, n as serverTimestamp, t as query, w as where, T as Timestamp, x as orderBy, v as getDocs, d as doc, l as getDoc, m as setDoc } from "./vendor-firebase-N64baH19.js";
import { Z as Zap } from "./zap-CZIUQ85z.js";
import { T as TrendingUp, H as Heart } from "./trending-up-F9qFPeih.js";
import { B as Badge } from "./badge-CRUpIyW6.js";
import { D as Dialog, f as DialogTrigger, a as DialogContent, b as DialogHeader, c as DialogTitle } from "./dialog-qADkFQn2.js";
import { U as Users } from "./users-C124q9JP.js";
import { U as User, E as Eye, a as Copy } from "./user-CWEc4l4g.js";
import { C as ChevronLeft } from "./chevron-left-cv4Egzj6.js";
import { S as SquareCheckBig, L as Link2 } from "./square-check-big-Clnf_GY-.js";
const ArrowDownWideNarrow = createLucideIcon("ArrowDownWideNarrow", [
  ["path", { d: "m3 16 4 4 4-4", key: "1co6wj" }],
  ["path", { d: "M7 20V4", key: "1yoxec" }],
  ["path", { d: "M11 4h10", key: "1w87gc" }],
  ["path", { d: "M11 8h7", key: "djye34" }],
  ["path", { d: "M11 12h4", key: "q8tih4" }]
]);
const ArrowUpNarrowWide = createLucideIcon("ArrowUpNarrowWide", [
  ["path", { d: "m3 8 4-4 4 4", key: "11wl7u" }],
  ["path", { d: "M7 4v16", key: "1glfcx" }],
  ["path", { d: "M11 12h4", key: "q8tih4" }],
  ["path", { d: "M11 16h7", key: "uosisv" }],
  ["path", { d: "M11 20h10", key: "jvxblo" }]
]);
const Circle = createLucideIcon("Circle", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }]
]);
const Clock = createLucideIcon("Clock", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["polyline", { points: "12 6 12 12 16 14", key: "68esgv" }]
]);
const DollarSign = createLucideIcon("DollarSign", [
  ["line", { x1: "12", x2: "12", y1: "2", y2: "22", key: "7eqyqh" }],
  ["path", { d: "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6", key: "1b0p4s" }]
]);
const Grid3x3 = createLucideIcon("Grid3x3", [
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "afitv7" }],
  ["path", { d: "M3 9h18", key: "1pudct" }],
  ["path", { d: "M3 15h18", key: "5xshup" }],
  ["path", { d: "M9 3v18", key: "fh3hqa" }],
  ["path", { d: "M15 3v18", key: "14nvp0" }]
]);
const Hash = createLucideIcon("Hash", [
  ["line", { x1: "4", x2: "20", y1: "9", y2: "9", key: "4lhtct" }],
  ["line", { x1: "4", x2: "20", y1: "15", y2: "15", key: "vyu0kd" }],
  ["line", { x1: "10", x2: "8", y1: "3", y2: "21", key: "1ggp8o" }],
  ["line", { x1: "16", x2: "14", y1: "3", y2: "21", key: "weycgp" }]
]);
const LogOut = createLucideIcon("LogOut", [
  ["path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", key: "1uf3rs" }],
  ["polyline", { points: "16 17 21 12 16 7", key: "1gabdz" }],
  ["line", { x1: "21", x2: "9", y1: "12", y2: "12", key: "1uyos4" }]
]);
const Package = createLucideIcon("Package", [
  [
    "path",
    {
      d: "M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z",
      key: "1a0edw"
    }
  ],
  ["path", { d: "M12 22V12", key: "d0xqtd" }],
  ["path", { d: "m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7", key: "yx3hmr" }],
  ["path", { d: "m7.5 4.27 9 5.15", key: "1c824w" }]
]);
const Printer = createLucideIcon("Printer", [
  [
    "path",
    {
      d: "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",
      key: "143wyd"
    }
  ],
  ["path", { d: "M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6", key: "1itne7" }],
  ["rect", { x: "6", y: "14", width: "12", height: "8", rx: "1", key: "1ue0tg" }]
]);
const ShoppingCart = createLucideIcon("ShoppingCart", [
  ["circle", { cx: "8", cy: "21", r: "1", key: "jimo8o" }],
  ["circle", { cx: "19", cy: "21", r: "1", key: "13723u" }],
  [
    "path",
    {
      d: "M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12",
      key: "9zh506"
    }
  ]
]);
const SquarePen = createLucideIcon("SquarePen", [
  ["path", { d: "M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7", key: "1m0v6g" }],
  [
    "path",
    {
      d: "M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z",
      key: "ohrbg2"
    }
  ]
]);
const Tags = createLucideIcon("Tags", [
  ["path", { d: "m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19", key: "1cbfv1" }],
  [
    "path",
    {
      d: "M9.586 5.586A2 2 0 0 0 8.172 5H3a1 1 0 0 0-1 1v5.172a2 2 0 0 0 .586 1.414L8.29 18.29a2.426 2.426 0 0 0 3.42 0l3.58-3.58a2.426 2.426 0 0 0 0-3.42z",
      key: "135mg7"
    }
  ],
  ["circle", { cx: "6.5", cy: "9.5", r: ".5", fill: "currentColor", key: "5pm5xn" }]
]);
const DropdownMenu = Root2;
const DropdownMenuTrigger = Trigger;
const DropdownMenuSubTrigger = reactExports.forwardRef(({ className, inset, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  SubTrigger2,
  {
    ref,
    className: cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent",
      inset && "pl-8",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "ml-auto h-4 w-4" })
    ]
  }
));
DropdownMenuSubTrigger.displayName = SubTrigger2.displayName;
const DropdownMenuSubContent = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  SubContent2,
  {
    ref,
    className: cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    ),
    ...props
  }
));
DropdownMenuSubContent.displayName = SubContent2.displayName;
const DropdownMenuContent = reactExports.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(Portal2, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
  Content2,
  {
    ref,
    sideOffset,
    className: cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    ),
    ...props
  }
) }));
DropdownMenuContent.displayName = Content2.displayName;
const DropdownMenuItem = reactExports.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Item2,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    ),
    ...props
  }
));
DropdownMenuItem.displayName = Item2.displayName;
const DropdownMenuCheckboxItem = reactExports.forwardRef(({ className, children, checked, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  CheckboxItem2,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    checked,
    ...props,
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ItemIndicator2, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4" }) }) }),
      children
    ]
  }
));
DropdownMenuCheckboxItem.displayName = CheckboxItem2.displayName;
const DropdownMenuRadioItem = reactExports.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  RadioItem2,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ItemIndicator2, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Circle, { className: "h-2 w-2 fill-current" }) }) }),
      children
    ]
  }
));
DropdownMenuRadioItem.displayName = RadioItem2.displayName;
const DropdownMenuLabel = reactExports.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Label2,
  {
    ref,
    className: cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    ),
    ...props
  }
));
DropdownMenuLabel.displayName = Label2.displayName;
const DropdownMenuSeparator = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Separator2,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
DropdownMenuSeparator.displayName = Separator2.displayName;
class SearchIntelligence {
  levenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }
  calculateSemanticScore(searchTerm, text) {
    const searchWords = searchTerm.toLowerCase().split(/\s+/);
    const textWords = text.toLowerCase().split(/\s+/);
    let totalScore = 0;
    let matches = 0;
    for (const searchWord of searchWords) {
      let bestMatch = 0;
      for (const textWord of textWords) {
        if (textWord.includes(searchWord) || searchWord.includes(textWord)) {
          bestMatch = Math.max(bestMatch, 0.8);
        } else {
          const distance = this.levenshteinDistance(searchWord, textWord);
          const similarity = 1 - distance / Math.max(searchWord.length, textWord.length);
          if (similarity > 0.6) {
            bestMatch = Math.max(bestMatch, similarity * 0.6);
          }
        }
      }
      totalScore += bestMatch;
      if (bestMatch > 0.3) matches++;
    }
    const coverage = matches / searchWords.length;
    return totalScore / searchWords.length * coverage;
  }
  generateAutoCompletions(query2, entries) {
    if (query2.length < 2) return [];
    const completions = /* @__PURE__ */ new Set();
    const queryLower = query2.toLowerCase();
    entries.forEach((entry) => {
      if (entry.title.toLowerCase().includes(queryLower)) {
        const words = entry.title.split(/\s+/);
        for (let i = 0; i < words.length; i++) {
          const phrase = words.slice(i, i + 3).join(" ");
          if (phrase.toLowerCase().startsWith(queryLower) && phrase.length > query2.length) {
            completions.add(phrase);
          }
        }
      }
      Object.values(entry.fields).forEach((value) => {
        const valueStr = String(value);
        if (valueStr.toLowerCase().includes(queryLower)) {
          const words = valueStr.split(/\s+/);
          for (let i = 0; i < words.length; i++) {
            const phrase = words.slice(i, i + 3).join(" ");
            if (phrase.toLowerCase().startsWith(queryLower) && phrase.length > query2.length) {
              completions.add(phrase);
            }
          }
        }
      });
    });
    return Array.from(completions).slice(0, 5).map((completion, index) => ({
      id: `completion-${index}`,
      title: completion,
      type: "completion",
      matchText: completion,
      confidence: 0.7,
      completionText: completion
    }));
  }
  correctSpelling(query2, entries) {
    if (query2.length < 3) return query2;
    const words = query2.toLowerCase().split(/\s+/);
    const correctedWords = [];
    for (const word of words) {
      let bestMatch = word;
      let bestDistance = Infinity;
      entries.forEach((entry) => {
        const checkWords = [
          ...entry.title.toLowerCase().split(/\s+/),
          ...Object.values(entry.fields).flatMap(
            (value) => String(value).toLowerCase().split(/\s+/)
          )
        ];
        checkWords.forEach((checkWord) => {
          if (checkWord.length > 2) {
            const distance = this.levenshteinDistance(word, checkWord);
            if (distance < bestDistance && distance <= 2) {
              bestDistance = distance;
              bestMatch = checkWord;
            }
          }
        });
      });
      correctedWords.push(bestMatch);
    }
    return correctedWords.join(" ");
  }
  generateIntelligentSuggestions(query2, entries, options) {
    const suggestions = [];
    const queryLower = query2.toLowerCase().trim();
    if (!queryLower) {
      options.recentSearches.slice(0, 5).forEach((recent, index) => {
        suggestions.push({
          id: `recent-${index}`,
          title: recent,
          type: "recent",
          matchText: recent,
          confidence: 0.9
        });
      });
      options.popularSearches.slice(0, 3).forEach((popular, index) => {
        suggestions.push({
          id: `popular-${index}`,
          title: popular,
          type: "popular",
          matchText: popular,
          confidence: 0.8
        });
      });
      return suggestions.slice(0, options.maxSuggestions);
    }
    const correctedQuery = options.enableSpellCorrection ? this.correctSpelling(queryLower, entries) : queryLower;
    if (options.enableAutoComplete) {
      const completions = this.generateAutoCompletions(correctedQuery, entries);
      suggestions.push(...completions);
    }
    entries.forEach((entry) => {
      let confidence = 0;
      let matchText = "";
      const titleScore = options.enableSemanticSearch ? this.calculateSemanticScore(correctedQuery, entry.title) : entry.title.toLowerCase().includes(correctedQuery) ? 0.8 : 0;
      if (titleScore > 0.3) {
        confidence = Math.max(confidence, titleScore);
        matchText = entry.title;
      }
      Object.entries(entry.fields).forEach(([key, value]) => {
        const valueStr = String(value);
        const fieldScore = options.enableSemanticSearch ? this.calculateSemanticScore(correctedQuery, valueStr) : valueStr.toLowerCase().includes(correctedQuery) ? 0.7 : 0;
        if (fieldScore > 0.3) {
          confidence = Math.max(confidence, fieldScore * 0.9);
          if (!matchText || fieldScore > titleScore) {
            matchText = `${key}: ${valueStr}`;
          }
        }
      });
      if (options.userPreferences?.some(
        (pref) => entry.title.toLowerCase().includes(pref.toLowerCase())
      )) {
        confidence *= 1.2;
      }
      if (confidence > 0.3) {
        suggestions.push({
          id: entry.id,
          title: entry.title,
          type: "entry",
          matchText,
          entry,
          confidence,
          entryId: entry.id,
          category: entry.fields.category || "Personal"
        });
      }
    });
    const categories = ["notes", "tasks", "ideas", "documents", "contacts"];
    categories.forEach((category) => {
      if (category.includes(correctedQuery)) {
        suggestions.push({
          id: `category-${category}`,
          title: `Search in ${category}`,
          type: "category",
          matchText: category,
          confidence: 0.6
        });
      }
    });
    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, options.maxSuggestions);
  }
  extractSearchTerms(query2) {
    return query2.toLowerCase().split(/\s+/).filter((term) => term.length > 1).map((term) => term.replace(/[^\w]/g, ""));
  }
  buildSearchQuery(terms) {
    return terms.join(" ");
  }
}
const searchIntelligence = new SearchIntelligence();
class SearchAnalyticsService {
  async trackSearch(data, user) {
    try {
      if (!user) return;
      const analyticsRef = collection(db, "search_analytics");
      await addDoc(analyticsRef, {
        user_id: user.uid,
        query: data.query,
        results_count: data.resultsCount,
        clicked_result_id: data.clickedResultId || null,
        search_type: data.searchType || "text",
        response_time_ms: data.responseTimeMs || null,
        created_at: serverTimestamp()
      });
    } catch (error) {
      console.error("Search analytics error:", error);
    }
  }
  async getPopularSearches(limit = 10, user) {
    try {
      if (!user) return [];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3);
      const analyticsRef = collection(db, "search_analytics");
      const q = query(
        analyticsRef,
        where("created_at", ">=", Timestamp.fromDate(thirtyDaysAgo)),
        orderBy("created_at", "desc")
      );
      const querySnapshot = await getDocs(q);
      const queryCounts = /* @__PURE__ */ new Map();
      querySnapshot.docs.forEach((docSnap) => {
        const searchQuery = docSnap.data().query?.trim();
        if (searchQuery) {
          queryCounts.set(searchQuery, (queryCounts.get(searchQuery) || 0) + 1);
        }
      });
      return Array.from(queryCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([query2]) => ({ query: query2 }));
    } catch (error) {
      console.error("Error fetching popular searches:", error);
      return [];
    }
  }
  async getUserSearchHistory(limit = 20, user) {
    try {
      if (!user) return [];
      const analyticsRef = collection(db, "search_analytics");
      const q = query(
        analyticsRef,
        where("user_id", "==", user.uid),
        orderBy("created_at", "desc")
      );
      const querySnapshot = await getDocs(q);
      const results = [];
      querySnapshot.docs.slice(0, limit).forEach((docSnap) => {
        const data = docSnap.data();
        if (data.query) {
          results.push({
            query: data.query,
            created_at: data.created_at?.toDate() || /* @__PURE__ */ new Date()
          });
        }
      });
      return results;
    } catch (error) {
      console.error("Error fetching search history:", error);
      return [];
    }
  }
  async getSearchPreferences(user) {
    try {
      if (!user) return null;
      const prefsRef = doc(db, "search_preferences", user.uid);
      const prefsSnap = await getDoc(prefsRef);
      if (!prefsSnap.exists()) {
        return {
          preferredCategories: [],
          searchSuggestionsEnabled: true,
          voiceSearchEnabled: true,
          semanticSearchEnabled: true,
          autoCompleteEnabled: true,
          recentSearchesLimit: 10
        };
      }
      const data = prefsSnap.data();
      return {
        preferredCategories: data.preferred_categories || [],
        searchSuggestionsEnabled: data.search_suggestions_enabled ?? true,
        voiceSearchEnabled: data.voice_search_enabled ?? true,
        semanticSearchEnabled: data.semantic_search_enabled ?? true,
        autoCompleteEnabled: data.auto_complete_enabled ?? true,
        recentSearchesLimit: data.recent_searches_limit ?? 10
      };
    } catch (error) {
      console.error("Search preferences error:", error);
      return null;
    }
  }
  async updateSearchPreferences(preferences, user) {
    try {
      if (!user) return;
      const prefsRef = doc(db, "search_preferences", user.uid);
      await setDoc(prefsRef, {
        user_id: user.uid,
        preferred_categories: preferences.preferredCategories,
        search_suggestions_enabled: preferences.searchSuggestionsEnabled,
        voice_search_enabled: preferences.voiceSearchEnabled,
        semantic_search_enabled: preferences.semanticSearchEnabled,
        auto_complete_enabled: preferences.autoCompleteEnabled,
        recent_searches_limit: preferences.recentSearchesLimit,
        updated_at: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("Search preferences update error:", error);
    }
  }
  async trackEntryOpened(entryId, query2, user) {
    try {
      if (!user) return;
      const analyticsRef = collection(db, "search_analytics");
      await addDoc(analyticsRef, {
        user_id: user.uid,
        query: query2,
        result_type: "entry",
        result_id: entryId,
        action_type: "entry_opened",
        created_at: serverTimestamp()
      });
    } catch (error) {
      console.error("Error tracking entry opened:", error);
    }
  }
}
const searchAnalyticsService = new SearchAnalyticsService();
const useIntelligentSearch = ({
  entries,
  onSuggestionSelect,
  onSearchChange,
  debounceMs = 300
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [suggestions, setSuggestions] = reactExports.useState([]);
  const [isLoading, setIsLoading] = reactExports.useState(false);
  const [selectedIndex, setSelectedIndex] = reactExports.useState(-1);
  const [recentSearches, setRecentSearches] = reactExports.useState([]);
  const [popularSearches, setPopularSearches] = reactExports.useState([]);
  const [searchPreferences, setSearchPreferences] = reactExports.useState({
    enableSemanticSearch: true,
    enableAutoComplete: true,
    enableSpellCorrection: true,
    maxSuggestions: 8,
    recentSearches: [],
    popularSearches: [],
    userPreferences: []
  });
  const debounceRef = reactExports.useRef();
  const searchStartTime = reactExports.useRef();
  reactExports.useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      const loadSearchData = async () => {
        try {
          const [preferences, history, popular] = await Promise.all([
            searchAnalyticsService.getSearchPreferences(user),
            searchAnalyticsService.getUserSearchHistory(10, user),
            searchAnalyticsService.getPopularSearches(5, user)
          ]);
          if (preferences) {
            setSearchPreferences((prev) => ({
              ...prev,
              enableSemanticSearch: preferences.semanticSearchEnabled,
              enableAutoComplete: preferences.autoCompleteEnabled,
              maxSuggestions: Math.min(preferences.recentSearchesLimit, 10),
              userPreferences: preferences.preferredCategories
            }));
          }
          const recentQueries = history?.map((h) => h.query).filter(Boolean) || [];
          const popularQueries = popular?.map((p) => p.query).filter(Boolean) || [];
          setRecentSearches(recentQueries);
          setPopularSearches(popularQueries);
          setSearchPreferences((prev) => ({
            ...prev,
            recentSearches: recentQueries,
            popularSearches: popularQueries
          }));
        } catch (error) {
          console.log("Failed to load search preferences:", error);
        }
      };
      loadSearchData();
    }, 500);
    return () => clearTimeout(timer);
  }, [user]);
  const generateSuggestions = reactExports.useCallback(async (query2) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      searchStartTime.current = Date.now();
      try {
        const newSuggestions = searchIntelligence.generateIntelligentSuggestions(
          query2,
          entries,
          searchPreferences
        );
        setSuggestions(newSuggestions);
        setSelectedIndex(-1);
        if (query2.trim().length >= 2 && user) {
          const responseTime = Date.now() - (searchStartTime.current || Date.now());
          await searchAnalyticsService.trackSearch({
            query: query2.trim(),
            resultsCount: newSuggestions.length,
            searchType: "text",
            responseTimeMs: responseTime
          }, user);
        }
      } catch (error) {
        console.error("Error generating suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);
  }, [entries, searchPreferences, debounceMs, user]);
  const handleSearchChange = reactExports.useCallback((query2) => {
    setSearchQuery(query2);
    generateSuggestions(query2);
    onSearchChange?.(query2);
  }, [generateSuggestions, onSearchChange]);
  const handleSuggestionSelect = reactExports.useCallback(async (suggestion) => {
    setSearchQuery(suggestion.completionText || suggestion.title);
    setSuggestions([]);
    setSelectedIndex(-1);
    if (suggestion.entry && user) {
      await searchAnalyticsService.trackSearch({
        query: searchQuery,
        resultsCount: suggestions.length,
        clickedResultId: suggestion.entry.id,
        searchType: "text"
      }, user);
    }
    const newRecent = [suggestion.title, ...recentSearches.filter((r) => r !== suggestion.title)].slice(0, 10);
    setRecentSearches(newRecent);
    onSuggestionSelect?.(suggestion);
  }, [searchQuery, suggestions.length, recentSearches, onSuggestionSelect, user]);
  const handleKeyDown = reactExports.useCallback((e) => {
    if (!suggestions.length) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => prev <= 0 ? suggestions.length - 1 : prev - 1);
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setSuggestions([]);
        setSelectedIndex(-1);
        break;
    }
  }, [suggestions, selectedIndex, handleSuggestionSelect]);
  const clearSuggestions = reactExports.useCallback(() => {
    setSuggestions([]);
    setSelectedIndex(-1);
  }, []);
  const handleVoiceSearch = reactExports.useCallback(async (transcript) => {
    if (searchPreferences.enableSemanticSearch) {
      handleSearchChange(transcript);
      if (user) {
        await searchAnalyticsService.trackSearch({
          query: transcript,
          resultsCount: 0,
          searchType: "voice"
        }, user);
      }
    }
  }, [searchPreferences.enableSemanticSearch, handleSearchChange, user]);
  return {
    searchQuery,
    suggestions,
    isLoading,
    selectedIndex,
    recentSearches,
    popularSearches,
    searchPreferences,
    handleSearchChange,
    handleSuggestionSelect,
    handleKeyDown,
    clearSuggestions,
    handleVoiceSearch,
    setSearchPreferences
  };
};
const SmartSearch = ({
  entries,
  searchQuery,
  onSearchChange,
  onSuggestionSelect,
  onEntrySelect,
  placeholder = "🔍 Search with AI intelligence...",
  className = ""
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = reactExports.useState(false);
  const inputRef = reactExports.useRef(null);
  const suggestionsRef = reactExports.useRef(null);
  const {
    suggestions,
    isLoading,
    selectedIndex,
    searchPreferences,
    handleSearchChange,
    handleSuggestionSelect,
    handleKeyDown
  } = useIntelligentSearch({
    entries,
    onSuggestionSelect,
    onSearchChange,
    debounceMs: 200
  });
  reactExports.useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) && inputRef.current && !inputRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleInputChange = (e) => {
    handleSearchChange(e.target.value);
  };
  const onSuggestionClick = (suggestion) => {
    if (suggestion.type === "entry" && onEntrySelect && suggestion.entryId) {
      const entry = entries.find((e) => e.id === suggestion.entryId);
      if (entry) {
        searchAnalyticsService.trackEntryOpened(entry.id, searchQuery, user);
        onEntrySelect(entry);
        setIsOpen(false);
        return;
      }
    }
    handleSuggestionSelect(suggestion);
    setIsOpen(false);
  };
  const onKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }
    if (e.key === "Enter" && selectedIndex >= 0 && selectedIndex < suggestions.length) {
      const selectedSuggestion = suggestions[selectedIndex];
      onSuggestionClick(selectedSuggestion);
      e.preventDefault();
      return;
    }
    handleKeyDown(e);
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };
  const getSuggestionIcon = (type) => {
    switch (type) {
      case "entry":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-4 h-4" });
      case "field":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Hash, { className: "w-4 h-4" });
      case "category":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Grid3x3, { className: "w-4 h-4" });
      case "recent":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-4 h-4" });
      case "popular":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "w-4 h-4" });
      case "completion":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "w-4 h-4" });
      default:
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "w-4 h-4" });
    }
  };
  const highlightMatch = (text, query2) => {
    if (!query2.trim()) return text;
    const regex = new RegExp(`(${query2.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: parts.map(
      (part, index) => regex.test(part) ? /* @__PURE__ */ jsxRuntimeExports.jsx("mark", { className: "bg-primary/20 text-primary font-medium", children: part }, index) : part
    ) });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `relative ${className}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative group", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          ref: inputRef,
          type: "text",
          placeholder,
          value: searchQuery,
          onChange: handleInputChange,
          onKeyDown,
          onFocus: () => setIsOpen(true),
          onBlur: () => setTimeout(() => setIsOpen(false), 150),
          className: "pl-10 pr-12 py-2 w-full transition-all duration-300 ease-in-out focus:scale-[1.02] hover:shadow-md",
          autoComplete: "off"
        }
      ),
      searchPreferences.enableSemanticSearch && /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary/60" }),
      isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute right-8 top-1/2 transform -translate-y-1/2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" }) })
    ] }),
    isOpen && suggestions.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        ref: suggestionsRef,
        className: "absolute top-full left-0 right-0 mt-1 bg-background/95 backdrop-blur-sm border border-border rounded-md shadow-xl max-h-80 overflow-y-auto z-50",
        children: suggestions.map((suggestion, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: `px-3 py-2 cursor-pointer transition-all duration-200 hover:bg-accent/50 hover:text-accent-foreground ${index === selectedIndex ? "bg-accent text-accent-foreground" : ""}`,
            onClick: () => onSuggestionClick(suggestion),
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-muted-foreground ${suggestion.type === "completion" ? "text-primary" : ""}`, children: getSuggestionIcon(suggestion.type) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium truncate", children: highlightMatch(suggestion.title, searchQuery) }),
                suggestion.matchText !== suggestion.title && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground truncate", children: highlightMatch(suggestion.matchText, searchQuery) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                suggestion.type === "entry" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-primary font-medium", children: "Entry" }),
                suggestion.confidence > 0.8 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 bg-primary rounded-full" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
                  Math.round(suggestion.confidence * 100),
                  "%"
                ] })
              ] })
            ] })
          },
          suggestion.id
        ))
      }
    )
  ] });
};
const SmartSearchWithBoundary = (props) => /* @__PURE__ */ jsxRuntimeExports.jsx(ErrorBoundary, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative group", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Input,
      {
        type: "text",
        placeholder: props.placeholder || "🔍 Search...",
        value: props.searchQuery,
        onChange: (e) => props.onSearchChange(e.target.value),
        className: "pl-10 pr-4 py-2 w-full",
        disabled: true
      }
    )
  ] }),
  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground mt-1", children: "Search temporarily unavailable" })
] }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(SmartSearch, { ...props }) });
const getCategoryName = (entry) => {
  if (entry.fields?.category) {
    return entry.fields.category;
  }
  const titleLower = entry.title.toLowerCase();
  if (titleLower.includes("document") || titleLower.includes("paper")) return "Documents";
  if (titleLower.includes("health") || titleLower.includes("medical")) return "Health";
  if (titleLower.includes("contact") || titleLower.includes("people")) return "Contacts";
  if (titleLower.includes("bank") || titleLower.includes("finance")) return "Finance";
  return "Personal";
};
const getCategoryIcon = (entry) => {
  const categoryName = getCategoryName(entry).toLowerCase();
  if (categoryName.includes("document")) return FileText;
  if (categoryName.includes("health") || categoryName.includes("medical")) return Heart;
  if (categoryName.includes("contact")) return Users;
  if (categoryName.includes("finance") || categoryName.includes("bank")) return DollarSign;
  return User;
};
const getCategoryColor = (entry) => {
  const categoryName = getCategoryName(entry).toLowerCase();
  if (categoryName.includes("document")) return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20";
  if (categoryName.includes("health") || categoryName.includes("medical")) return "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20";
  if (categoryName.includes("contact")) return "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20";
  if (categoryName.includes("finance") || categoryName.includes("bank")) return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20";
  return "bg-primary/10 text-primary border border-primary/20";
};
const getEntryType = (entry) => {
  const fieldCount = Object.keys(entry.fields).length;
  if (fieldCount <= 2) return "Simple";
  if (fieldCount <= 5) return "Form";
  return "Complex";
};
const ImageGallery = ({
  images,
  readOnly = false
}) => {
  const [selectedIndex, setSelectedIndex] = reactExports.useState(0);
  const [isOpen, setIsOpen] = reactExports.useState(false);
  if (!images || images.length === 0) {
    return null;
  }
  const nextImage = () => {
    setSelectedIndex((prev) => (prev + 1) % images.length);
  };
  const prevImage = () => {
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
  };
  const downloadImage = async (url, index) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `image-${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4", children: images.map((url, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: isOpen && selectedIndex === index, onOpenChange: setIsOpen, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "relative group cursor-pointer",
        onClick: () => {
          setSelectedIndex(index);
          setIsOpen(true);
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: url,
              alt: `Image ${index + 1}`,
              className: "w-full h-32 object-cover rounded-lg border border-border hover:border-primary transition-colors"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "opacity-0 group-hover:opacity-100 transition-opacity", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white text-sm font-medium", children: "View" }) }) })
        ]
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { className: "max-w-4xl w-full p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "img",
        {
          src: images[selectedIndex],
          alt: `Image ${selectedIndex + 1}`,
          className: "w-full h-auto max-h-[80vh] object-contain"
        }
      ),
      images.length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "secondary",
            size: "sm",
            className: "absolute left-4 top-1/2 transform -translate-y-1/2",
            onClick: prevImage,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "w-4 h-4" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "secondary",
            size: "sm",
            className: "absolute right-4 top-1/2 transform -translate-y-1/2",
            onClick: nextImage,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "w-4 h-4" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute top-4 right-4 flex space-x-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "secondary",
            size: "sm",
            onClick: () => downloadImage(images[selectedIndex], selectedIndex),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "w-4 h-4" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "secondary",
            size: "sm",
            onClick: () => setIsOpen(false),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
          }
        )
      ] }),
      images.length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-4 left-1/2 transform -translate-x-1/2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-black/50 text-white px-3 py-1 rounded-full text-sm", children: [
        selectedIndex + 1,
        " of ",
        images.length
      ] }) })
    ] }) })
  ] }, index)) }) });
};
const isImageUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  return url.includes("/images/") || url.includes("firebasestorage.googleapis.com") || url.match(/\.(jpeg|jpg|gif|png|webp)$/i) !== null || url.startsWith("data:image/");
};
const extractImagesFromEntry = (entry) => {
  const images = [];
  if (entry.fieldDefinitions) {
    entry.fieldDefinitions.forEach((fieldDef) => {
      const fieldValue = entry.fields[fieldDef.name];
      if (fieldDef.type === "image" && isImageUrl(fieldValue)) {
        images.push(fieldValue);
      } else if (fieldDef.type === "gallery" && Array.isArray(fieldValue)) {
        fieldValue.forEach((url) => {
          if (isImageUrl(url)) {
            images.push(url);
          }
        });
      }
    });
  }
  Object.values(entry.fields).forEach((value) => {
    if (isImageUrl(value)) {
      images.push(value);
    } else if (Array.isArray(value)) {
      value.forEach((item) => {
        if (isImageUrl(item)) {
          images.push(item);
        }
      });
    }
  });
  return [...new Set(images)];
};
var CHECKBOX_NAME = "Checkbox";
var [createCheckboxContext] = createContextScope(CHECKBOX_NAME);
var [CheckboxProvider, useCheckboxContext] = createCheckboxContext(CHECKBOX_NAME);
var Checkbox$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const {
      __scopeCheckbox,
      name,
      checked: checkedProp,
      defaultChecked,
      required,
      disabled,
      value = "on",
      onCheckedChange,
      form,
      ...checkboxProps
    } = props;
    const [button, setButton] = reactExports.useState(null);
    const composedRefs = useComposedRefs(forwardedRef, (node) => setButton(node));
    const hasConsumerStoppedPropagationRef = reactExports.useRef(false);
    const isFormControl = button ? form || !!button.closest("form") : true;
    const [checked = false, setChecked] = useControllableState({
      prop: checkedProp,
      defaultProp: defaultChecked,
      onChange: onCheckedChange
    });
    const initialCheckedStateRef = reactExports.useRef(checked);
    reactExports.useEffect(() => {
      const form2 = button?.form;
      if (form2) {
        const reset = () => setChecked(initialCheckedStateRef.current);
        form2.addEventListener("reset", reset);
        return () => form2.removeEventListener("reset", reset);
      }
    }, [button, setChecked]);
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(CheckboxProvider, { scope: __scopeCheckbox, state: checked, disabled, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Primitive.button,
        {
          type: "button",
          role: "checkbox",
          "aria-checked": isIndeterminate(checked) ? "mixed" : checked,
          "aria-required": required,
          "data-state": getState(checked),
          "data-disabled": disabled ? "" : void 0,
          disabled,
          value,
          ...checkboxProps,
          ref: composedRefs,
          onKeyDown: composeEventHandlers(props.onKeyDown, (event) => {
            if (event.key === "Enter") event.preventDefault();
          }),
          onClick: composeEventHandlers(props.onClick, (event) => {
            setChecked((prevChecked) => isIndeterminate(prevChecked) ? true : !prevChecked);
            if (isFormControl) {
              hasConsumerStoppedPropagationRef.current = event.isPropagationStopped();
              if (!hasConsumerStoppedPropagationRef.current) event.stopPropagation();
            }
          })
        }
      ),
      isFormControl && /* @__PURE__ */ jsxRuntimeExports.jsx(
        BubbleInput,
        {
          control: button,
          bubbles: !hasConsumerStoppedPropagationRef.current,
          name,
          value,
          checked,
          required,
          disabled,
          form,
          style: { transform: "translateX(-100%)" },
          defaultChecked: isIndeterminate(defaultChecked) ? false : defaultChecked
        }
      )
    ] });
  }
);
Checkbox$1.displayName = CHECKBOX_NAME;
var INDICATOR_NAME = "CheckboxIndicator";
var CheckboxIndicator = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeCheckbox, forceMount, ...indicatorProps } = props;
    const context = useCheckboxContext(INDICATOR_NAME, __scopeCheckbox);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Presence, { present: forceMount || isIndeterminate(context.state) || context.state === true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive.span,
      {
        "data-state": getState(context.state),
        "data-disabled": context.disabled ? "" : void 0,
        ...indicatorProps,
        ref: forwardedRef,
        style: { pointerEvents: "none", ...props.style }
      }
    ) });
  }
);
CheckboxIndicator.displayName = INDICATOR_NAME;
var BubbleInput = (props) => {
  const { control, checked, bubbles = true, defaultChecked, ...inputProps } = props;
  const ref = reactExports.useRef(null);
  const prevChecked = usePrevious(checked);
  const controlSize = useSize(control);
  reactExports.useEffect(() => {
    const input = ref.current;
    const inputProto = window.HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(inputProto, "checked");
    const setChecked = descriptor.set;
    if (prevChecked !== checked && setChecked) {
      const event = new Event("click", { bubbles });
      input.indeterminate = isIndeterminate(checked);
      setChecked.call(input, isIndeterminate(checked) ? false : checked);
      input.dispatchEvent(event);
    }
  }, [prevChecked, checked, bubbles]);
  const defaultCheckedRef = reactExports.useRef(isIndeterminate(checked) ? false : checked);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "input",
    {
      type: "checkbox",
      "aria-hidden": true,
      defaultChecked: defaultChecked ?? defaultCheckedRef.current,
      ...inputProps,
      tabIndex: -1,
      ref,
      style: {
        ...props.style,
        ...controlSize,
        position: "absolute",
        pointerEvents: "none",
        opacity: 0,
        margin: 0
      }
    }
  );
};
function isIndeterminate(checked) {
  return checked === "indeterminate";
}
function getState(checked) {
  return isIndeterminate(checked) ? "indeterminate" : checked ? "checked" : "unchecked";
}
var Root = Checkbox$1;
var Indicator = CheckboxIndicator;
const Checkbox = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Root,
  {
    ref,
    className: cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Indicator,
      {
        className: cn("flex items-center justify-center text-current"),
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4" })
      }
    )
  }
));
Checkbox.displayName = Root.displayName;
const TableFieldViewer = ({
  value,
  title,
  showExport = true
}) => {
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [sortColumn, setSortColumn] = reactExports.useState(null);
  const [sortDirection, setSortDirection] = reactExports.useState("asc");
  const columns = value?.columns ?? [];
  const rows = value?.rows ?? [];
  const handleSort = (columnId) => {
    if (sortColumn === columnId) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(columnId);
      setSortDirection("asc");
    }
  };
  const filteredAndSortedRows = React.useMemo(() => {
    let filtered = rows;
    if (searchTerm) {
      filtered = filtered.filter(
        (row) => Object.values(row).some(
          (value2) => String(value2).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortColumn] || "";
        const bVal = b[sortColumn] || "";
        const column = columns.find((col) => col.id === sortColumn);
        if (column?.type === "number") {
          const aNum = parseFloat(String(aVal)) || 0;
          const bNum = parseFloat(String(bVal)) || 0;
          return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
        }
        if (column?.type === "date") {
          const aDate = new Date(String(aVal));
          const bDate = new Date(String(bVal));
          return sortDirection === "asc" ? aDate.getTime() - bDate.getTime() : bDate.getTime() - aDate.getTime();
        }
        if (column?.type === "checkbox") {
          const aBool = Boolean(aVal);
          const bBool = Boolean(bVal);
          return sortDirection === "asc" ? aBool === bBool ? 0 : aBool ? 1 : -1 : aBool === bBool ? 0 : aBool ? -1 : 1;
        }
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        return sortDirection === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      });
    }
    return filtered;
  }, [rows, searchTerm, sortColumn, sortDirection, columns]);
  if (!value || columns.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-8 text-muted-foreground border border-border rounded-lg", children: "No table data available" });
  }
  const exportToCSV = () => {
    try {
      const headers = columns.map((col) => col.name);
      const csvContent = [
        headers.join(","),
        ...rows.map(
          (row) => columns.map((col) => {
            const value2 = row[col.id] || "";
            if (col.type === "checkbox") {
              return value2 ? "true" : "false";
            }
            const escaped = String(value2).replace(/"/g, '""');
            return escaped.includes(",") ? `"${escaped}"` : escaped;
          }).join(",")
        )
      ].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${title || "table-data"}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      Jt.success("Table exported to CSV");
    } catch (error) {
      console.error("Export error:", error);
      Jt.error("Failed to export table");
    }
  };
  const renderCellValue = (row, column) => {
    const cellValue = row[column.id];
    switch (column.type) {
      case "checkbox":
        return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { checked: !!cellValue, disabled: true, className: "pointer-events-none" }) });
      case "number":
        return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: cellValue !== null && cellValue !== void 0 ? Number(cellValue).toLocaleString() : "—" });
      case "date":
        return cellValue ? new Date(cellValue).toLocaleDateString() : "—";
      default:
        return cellValue || "—";
    }
  };
  const getSortIcon = (columnId) => {
    if (sortColumn !== columnId) return null;
    return sortDirection === "asc" ? /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUpNarrowWide, { className: "h-3 w-3" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDownWideNarrow, { className: "h-3 w-3" });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 border border-border rounded-lg p-4 bg-card", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        title && /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-medium", children: title }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", children: [
            rows.length,
            " row",
            value.rows.length !== 1 ? "s" : ""
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", children: [
            columns.length,
            " column",
            value.columns.length !== 1 ? "s" : ""
          ] })
        ] })
      ] }),
      showExport && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: exportToCSV, variant: "outline", size: "sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4 mr-1" }),
        "Export CSV"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          placeholder: "Search table data...",
          value: searchTerm,
          onChange: (e) => setSearchTerm(e.target.value),
          className: "pl-10"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full border-collapse border border-border", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "bg-muted/50", children: columns.map((column) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "th",
        {
          className: "border border-border p-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/70 transition-colors",
          onClick: () => handleSort(column.id),
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: column.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs", children: column.type }),
              getSortIcon(column.id)
            ] })
          ] })
        },
        column.id
      )) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: filteredAndSortedRows.map((row, rowIndex) => /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "hover:bg-muted/30 transition-colors", children: columns.map((column) => /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "border border-border p-3 text-sm", children: renderCellValue(row, column) }, column.id)) }, rowIndex)) })
    ] }) }),
    filteredAndSortedRows.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-8 text-muted-foreground", children: searchTerm ? "No matching results found." : "No data available." }),
    searchTerm && filteredAndSortedRows.length !== rows.length && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-muted-foreground text-center", children: [
      "Showing ",
      filteredAndSortedRows.length,
      " of ",
      rows.length,
      " rows"
    ] })
  ] });
};
const ShoppingListCardViewer = ({
  value,
  title,
  showExport = true
}) => {
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const columns = value?.columns ?? [];
  const rows = value?.rows ?? [];
  const itemColumn = columns.find((col) => col.name.toLowerCase().includes("item"));
  const quantityColumn = columns.find((col) => col.name.toLowerCase().includes("quantity") || col.name.toLowerCase().includes("qty"));
  const unitColumn = columns.find((col) => col.name.toLowerCase().includes("unit"));
  const priceColumn = columns.find((col) => col.name.toLowerCase().includes("price") || col.name.toLowerCase().includes("cost"));
  const categoryColumn = columns.find((col) => col.name.toLowerCase().includes("category") || col.name.toLowerCase().includes("aisle"));
  const purchasedColumn = columns.find((col) => col.name.toLowerCase().includes("purchased") || col.name.toLowerCase().includes("got it") || col.type === "checkbox");
  const notesColumn = columns.find((col) => col.name.toLowerCase().includes("notes") || col.name.toLowerCase().includes("note"));
  const filteredRows = React.useMemo(() => {
    if (!searchTerm) return rows;
    return rows.filter(
      (row) => Object.values(row).some(
        (value2) => String(value2).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [rows, searchTerm]);
  const totals = React.useMemo(() => {
    const totalItems = filteredRows.length;
    const purchasedItems = purchasedColumn ? filteredRows.filter((row) => row[purchasedColumn.id]).length : 0;
    const totalCost = priceColumn ? filteredRows.reduce((sum, row) => sum + (parseFloat(row[priceColumn.id]) || 0), 0) : 0;
    const purchasedCost = priceColumn && purchasedColumn ? filteredRows.filter((row) => row[purchasedColumn.id]).reduce((sum, row) => sum + (parseFloat(row[priceColumn.id]) || 0), 0) : 0;
    return {
      totalItems,
      purchasedItems,
      remainingItems: totalItems - purchasedItems,
      totalCost,
      purchasedCost,
      remainingCost: totalCost - purchasedCost
    };
  }, [filteredRows, priceColumn, purchasedColumn]);
  if (!value || columns.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-8 text-muted-foreground border border-border rounded-lg", children: "No shopping list data available" });
  }
  const exportToCSV = () => {
    try {
      const headers = value.columns.map((col) => col.name);
      const csvContent = [
        headers.join(","),
        ...rows.map(
          (row) => value.columns.map((col) => {
            const value2 = row[col.id] || "";
            if (col.type === "checkbox") {
              return value2 ? "true" : "false";
            }
            const escaped = String(value2).replace(/"/g, '""');
            return escaped.includes(",") ? `"${escaped}"` : escaped;
          }).join(",")
        )
      ].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${title || "shopping-list"}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      Jt.success("Shopping list exported to CSV");
    } catch (error) {
      console.error("Export error:", error);
      Jt.error("Failed to export shopping list");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 border border-border rounded-lg p-4 bg-card", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          title && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingCart, { className: "h-5 w-5 text-primary" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-medium", children: title })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "h-3 w-3" }),
              totals.totalItems,
              " items"
            ] }),
            purchasedColumn && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "flex items-center gap-1", children: [
              "✓ ",
              totals.purchasedItems,
              " completed"
            ] }),
            priceColumn && totals.totalCost > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "h-3 w-3" }),
              "$",
              totals.totalCost.toFixed(2)
            ] })
          ] })
        ] }),
        showExport && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: exportToCSV, variant: "outline", size: "sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4 mr-1" }),
          "Export CSV"
        ] })
      ] }),
      purchasedColumn && totals.totalItems > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-muted/30 rounded-lg p-3 space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Progress" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium", children: [
            Math.round(totals.purchasedItems / totals.totalItems * 100),
            "% complete"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full bg-muted rounded-full h-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "bg-primary h-2 rounded-full transition-all duration-300",
            style: { width: `${totals.purchasedItems / totals.totalItems * 100}%` }
          }
        ) }),
        priceColumn && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-xs text-muted-foreground pt-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "Spent: $",
            totals.purchasedCost.toFixed(2)
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "Remaining: $",
            totals.remainingCost.toFixed(2)
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          placeholder: "Search shopping list...",
          value: searchTerm,
          onChange: (e) => setSearchTerm(e.target.value),
          className: "pl-10"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: filteredRows.map((row, index) => {
      const isPurchased = purchasedColumn ? Boolean(row[purchasedColumn.id]) : false;
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        Card,
        {
          className: `transition-all duration-200 ${isPurchased ? "bg-muted/50 opacity-75" : "bg-card hover:shadow-sm"}`,
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-start justify-between gap-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
              purchasedColumn && /* @__PURE__ */ jsxRuntimeExports.jsx(
                Checkbox,
                {
                  checked: isPurchased,
                  disabled: true,
                  className: "pointer-events-none"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: `font-medium ${isPurchased ? "line-through text-muted-foreground" : "text-foreground"}`, children: itemColumn ? row[itemColumn.id] : "Unknown Item" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 text-sm text-muted-foreground mt-1", children: [
                  quantityColumn && row[quantityColumn.id] && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "h-3 w-3" }),
                    row[quantityColumn.id],
                    unitColumn && row[unitColumn.id] && ` ${row[unitColumn.id]}`
                  ] }),
                  priceColumn && row[priceColumn.id] && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1 font-medium", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "h-3 w-3" }),
                    parseFloat(row[priceColumn.id]).toFixed(2)
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs", children: [
              categoryColumn && row[categoryColumn.id] && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs", children: row[categoryColumn.id] }),
              notesColumn && row[notesColumn.id] && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground italic", children: row[notesColumn.id] })
            ] })
          ] }) }) })
        },
        index
      );
    }) }),
    filteredRows.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-8 text-muted-foreground", children: searchTerm ? "No matching items found." : "No items in shopping list." }),
    searchTerm && filteredRows.length !== rows.length && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-muted-foreground text-center", children: [
      "Showing ",
      filteredRows.length,
      " of ",
      rows.length,
      " items"
    ] })
  ] });
};
const formatMessage = (message, options) => {
  const parts = [];
  if (options?.emoji) parts.push(options.emoji);
  if (options?.context) parts.push(`[${options.context}]`);
  parts.push(message);
  return parts.join(" ");
};
const logError = (message, error, options) => {
  const formatted = formatMessage(message, options);
  if (error !== void 0) {
    console.error(formatted, error);
  } else {
    console.error(formatted);
  }
};
const normalizeActionItems = (entry) => {
  const extracted = Array.isArray(entry.action_items) ? (entry.action_items || []).map((item) => {
    if (typeof item === "string") return item.trim();
    if (item && typeof item === "object" && "text" in item) {
      return String(item.text || "").trim();
    }
    return "";
  }) : [];
  const fieldBased = typeof entry.fields?.actionItems === "string" ? String(entry.fields.actionItems).split(/\n|•/).map((item) => item.trim()).filter(Boolean) : [];
  return [...extracted, ...fieldBased].filter(Boolean).slice(0, 5);
};
const EntryIntelligencePanel = ({
  entry,
  allEntries = [],
  onOpenEntry
}) => {
  const summary = entry.summary || "";
  const tags = (entry.tags || []).filter(Boolean);
  const linkedEntryIds = (entry.linked_entries || []).filter(Boolean);
  const actionItems = reactExports.useMemo(() => normalizeActionItems(entry), [entry]);
  const relatedEntries = reactExports.useMemo(() => {
    if (!allEntries.length) return [];
    const explicit = allEntries.filter((candidate) => linkedEntryIds.includes(candidate.id));
    if (explicit.length > 0) return explicit.slice(0, 4);
    const entryTerms = new Set(
      [entry.title, ...tags || []].flatMap((value) => String(value).toLowerCase().split(/\s+/)).map((term) => term.replace(/[^a-z0-9]/gi, "")).filter((term) => term.length > 2)
    );
    return allEntries.filter((candidate) => candidate.id !== entry.id).map((candidate) => {
      const haystack = `${candidate.title} ${Object.values(candidate.fields).join(" ")}`.toLowerCase();
      let score = 0;
      entryTerms.forEach((term) => {
        if (haystack.includes(term)) score += 1;
      });
      return { candidate, score };
    }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 4).map((item) => item.candidate);
  }, [allEntries, entry.id, entry.title, linkedEntryIds, tags]);
  if (!summary && tags.length === 0 && actionItems.length === 0 && relatedEntries.length === 0) {
    return null;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 rounded-xl border bg-muted/20 p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Brain, { className: "w-4 h-4 text-primary" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold uppercase tracking-wide text-muted-foreground", children: "Entry Intelligence" })
    ] }),
    summary && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm font-medium text-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Brain, { className: "w-4 h-4 text-primary" }),
        "Summary"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground leading-relaxed", children: summary })
    ] }),
    tags.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm font-medium text-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Tags, { className: "w-4 h-4 text-primary" }),
        "Tags"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: tags.slice(0, 8).map((tag) => /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: tag }, tag)) })
    ] }),
    actionItems.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm font-medium text-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SquareCheckBig, { className: "w-4 h-4 text-green-500" }),
        "Action Items"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: actionItems.map((item, index) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border bg-background/80 p-3 text-sm text-foreground", children: item }, `${item}-${index}`)) })
    ] }),
    relatedEntries.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm font-medium text-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link2, { className: "w-4 h-4 text-primary" }),
        "Related Entries"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: relatedEntries.map((related) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "outline",
          size: "sm",
          className: "max-w-full",
          onClick: () => onOpenEntry?.(related),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate max-w-[180px]", children: related.title })
        },
        related.id
      )) })
    ] })
  ] });
};
const EntryViewDialog = ({
  entry,
  isOpen,
  onClose,
  onEdit,
  onFill,
  onUseAsTemplate,
  onViewDocument,
  allEntries = [],
  onOpenRelatedEntry
}) => {
  const [isDownloading, setIsDownloading] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const handleCloseCommand = () => {
      if (isOpen) {
        onClose();
      }
    };
    window.addEventListener("nova:close", handleCloseCommand);
    return () => {
      window.removeEventListener("nova:close", handleCloseCommand);
    };
  }, [isOpen, onClose]);
  if (!entry) return null;
  const Icon = getCategoryIcon(entry);
  const categoryColor = getCategoryColor(entry);
  const categoryName = getCategoryName(entry);
  const entryType = getEntryType(entry);
  const entryImages = extractImagesFromEntry(entry);
  const isDocumentWithFile = entry.fields.category === "Documents" && entry.fields.hasUploadedFile;
  const handleDownload = async () => {
    if (!entry.fields.hasUploadedFile || !entry.fields.fileName) {
      Jt.error("No file available for download");
      return;
    }
    setIsDownloading(true);
    try {
      const allKeys = Object.keys(localStorage);
      const documentKeys = allKeys.filter((key) => key.startsWith("document_"));
      let fileData = null;
      for (const key of documentKeys) {
        try {
          const storedData = JSON.parse(localStorage.getItem(key) || "");
          if (storedData.name === entry.fields.fileName) {
            fileData = storedData;
            break;
          }
        } catch (e) {
          continue;
        }
      }
      if (!fileData) {
        Jt.error("File data not found in storage");
        return;
      }
      const link = document.createElement("a");
      link.href = fileData.data;
      link.download = fileData.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      Jt.success(`Downloaded ${fileData.name}`);
    } catch (error) {
      logError("Download error", error);
      Jt.error("Failed to download file");
    } finally {
      setIsDownloading(false);
    }
  };
  const handlePrint = () => {
    printProfessionally([entry], { title: entry.title, includeMetadata: true });
    Jt.success("Print dialog opened");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: isOpen, onOpenChange: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-2xl max-h-[80vh] overflow-y-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `w-10 h-10 rounded-lg ${categoryColor} flex items-center justify-center flex-shrink-0`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "w-5 h-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "text-xl font-semibold", children: entry.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2 mt-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs", children: categoryName }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs", children: entryType })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-sm text-muted-foreground border-b pb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
            "Created: ",
            new Date(entry.createdAt).toLocaleDateString()
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
            "Last Modified: ",
            new Date(entry.updatedAt).toLocaleDateString()
          ] })
        ] }),
        entry.fields.hasUploadedFile && entry.fields.fileName && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: entry.fields.fileName }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
            "(",
            entry.fields.fileSize ? `${(entry.fields.fileSize / 1024).toFixed(1)} KB` : "Unknown size",
            ")"
          ] })
        ] })
      ] }),
      entryImages.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-medium text-foreground", children: "Images" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ImageGallery, { images: entryImages, readOnly: true })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        EntryIntelligencePanel,
        {
          entry,
          allEntries,
          onOpenEntry: onOpenRelatedEntry
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-medium text-foreground", children: "Entry Details" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4", children: Object.entries(entry.fields).filter(([key, value]) => {
          if (["hasUploadedFile", "fileName", "fileSize", "fileType"].includes(key)) {
            return false;
          }
          if (entryImages.includes(String(value)) || Array.isArray(value) && value.some((v) => entryImages.includes(String(v)))) {
            return false;
          }
          return true;
        }).map(([key, value]) => {
          if (typeof value === "object" && value !== null && "columns" in value && "rows" in value) {
            const tableData = value;
            const isShoppingList = tableData.columns.some(
              (col) => ["item", "quantity", "price", "cost", "purchased", "got it"].some(
                (term) => col.name.toLowerCase().includes(term)
              )
            );
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground capitalize", children: key.replace(/([A-Z])/g, " $1").trim() }),
              isShoppingList ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                ShoppingListCardViewer,
                {
                  value: tableData,
                  title: key,
                  showExport: true
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                TableFieldViewer,
                {
                  value: tableData,
                  title: key,
                  showExport: true
                }
              )
            ] }, key);
          }
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium text-muted-foreground capitalize", children: key.replace(/([A-Z])/g, " $1").trim() }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 bg-accent/50 rounded-md border", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground whitespace-pre-wrap", children: String(value) || "No data" }) })
          ] }, key);
        }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end space-x-2 pt-4 border-t", children: [
        isDocumentWithFile && onViewDocument && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            onClick: () => {
              onViewDocument(entry);
              onClose();
            },
            variant: "outline",
            className: "text-primary hover:text-primary/80",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4 mr-2" }),
              "View Document"
            ]
          }
        ),
        entry.fields.hasUploadedFile && entry.fields.fileName && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            onClick: handleDownload,
            variant: "outline",
            disabled: isDownloading,
            className: "text-green-600 hover:text-green-700",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4 mr-2" }),
              isDownloading ? "Downloading..." : "Download File"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            onClick: handlePrint,
            variant: "outline",
            className: "text-purple-600 hover:text-purple-700",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { className: "h-4 w-4 mr-2" }),
              "Print Entry"
            ]
          }
        ),
        onFill && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            onClick: () => {
              onFill(entry);
              onClose();
            },
            variant: "outline",
            className: "text-green-600 hover:text-green-700",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-4 w-4 mr-2" }),
              "Fill Form"
            ]
          }
        ),
        onUseAsTemplate && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            onClick: () => {
              onUseAsTemplate(entry);
              onClose();
            },
            variant: "outline",
            className: "text-purple-600 hover:text-purple-700",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-4 w-4 mr-2" }),
              "Use as Template"
            ]
          }
        ),
        onEdit && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            onClick: () => {
              onEdit(entry);
              onClose();
            },
            variant: "outline",
            className: "text-blue-600 hover:text-blue-700",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SquarePen, { className: "h-4 w-4 mr-2" }),
              "Edit Entry"
            ]
          }
        )
      ] })
    ] })
  ] }) });
};
export {
  Clock as C,
  DollarSign as D,
  EntryIntelligencePanel as E,
  Grid3x3 as G,
  ImageGallery as I,
  LogOut as L,
  Printer as P,
  SquarePen as S,
  TableFieldViewer as T,
  DropdownMenu as a,
  DropdownMenuTrigger as b,
  DropdownMenuContent as c,
  DropdownMenuItem as d,
  DropdownMenuSeparator as e,
  extractImagesFromEntry as f,
  ShoppingListCardViewer as g,
  SmartSearchWithBoundary as h,
  Checkbox as i,
  EntryViewDialog as j,
  Circle as k,
  logError as l,
  DropdownMenuLabel as m,
  ShoppingCart as n
};
