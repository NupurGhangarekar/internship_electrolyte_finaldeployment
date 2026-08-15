export const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : "-");
export const moneylessPercent = (value) => `${Math.min(100, Math.max(0, Number(value || 0)))}%`;
