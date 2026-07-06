const priorityMatrix = {
  "high:high": "critical",
  "high:medium": "high",
  "medium:high": "high",
  "medium:medium": "medium",
  "low:high": "medium",
  "low:medium": "low",
  "low:low": "low"
};

export function calculatePriority(impact, urgency) {
  return priorityMatrix[`${impact}:${urgency}`] ?? "low";
}
