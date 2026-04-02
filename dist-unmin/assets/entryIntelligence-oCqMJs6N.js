const getEntryIntelligenceSignals = (entry) => {
  const summary = (entry.summary || "").trim();
  const tags = (entry.tags || []).filter(Boolean);
  const linkedCount = (entry.linked_entries || []).filter(Boolean).length;
  const actionItemCount = Array.isArray(entry.action_items) ? (entry.action_items || []).filter(Boolean).length : 0;
  const reminderLikeCount = Object.entries(entry.fields || {}).filter(([key, value]) => {
    if (!value) return false;
    const normalized = key.toLowerCase();
    return normalized.includes("remind") || normalized.includes("due") || normalized.includes("deadline");
  }).length;
  const isEnriched = Boolean(summary || tags.length || linkedCount || actionItemCount || reminderLikeCount);
  return {
    summary,
    tags,
    linkedCount,
    actionItemCount,
    reminderLikeCount,
    isEnriched
  };
};
export {
  getEntryIntelligenceSignals as g
};
