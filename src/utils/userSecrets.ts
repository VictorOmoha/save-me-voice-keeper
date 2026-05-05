let elevenLabsApiKey: string | null = null;

export const setElevenLabsApiKey = (apiKey?: string | null): void => {
  elevenLabsApiKey = apiKey || null;
};

export const clearElevenLabsApiKey = (): void => {
  elevenLabsApiKey = null;
};

export const getElevenLabsApiKey = (): string | null => elevenLabsApiKey;
