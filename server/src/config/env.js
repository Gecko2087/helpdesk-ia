import "dotenv/config";

const configuredProvider = process.env.AI_PROVIDER ?? "gemini";
const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);

export const env = {
  port: Number(process.env.PORT ?? 3001),
  nodeEnv: process.env.NODE_ENV ?? "development",
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
  aiProvider: configuredProvider === "gemini" && !hasGeminiKey ? "demo" : configuredProvider,
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-3.5-flash"
};
