/**
 * Safely get preview text with fallback handling
 */
export const getPreviewText = (text: string | undefined | null, maxLength: number = 150): string | null => {
  if (!text || text === "undefined" || text === "null") return null;
  const cleanText = String(text).trim();
  if (!cleanText) return null;
  if (cleanText.length <= maxLength) return cleanText;
  return cleanText.slice(0, maxLength) + "...";
};

/**
 * Safely render quote object
 */
export const getQuoteDisplay = (quote: any): { text: string; author?: string } | null => {
  if (!quote) return null;
  
  // Handle string quotes
  if (typeof quote === 'string') {
    return { text: quote };
  }
  
  // Handle object quotes
  if (typeof quote === 'object' && quote.text) {
    return {
      text: quote.text,
      author: quote.author
    };
  }
  
  return null;
};
