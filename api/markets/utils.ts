import axios from "axios";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY?.trim();

export async function finnhubGet<T>(
  path: string,
  params: Record<string, any> = {}
): Promise<T> {
  if (!FINNHUB_API_KEY) {
    throw new Error("FINNHUB_API_KEY is not configured");
  }
  const cleanPath = path.replace(/^\//, "");
  const url = `${FINNHUB_BASE_URL}/${cleanPath}`;
  const response = await axios.get<T>(url, {
    params: { ...params, token: FINNHUB_API_KEY },
  });
  return response.data;
}

export function parseTickersParam(
  raw: unknown,
  fallback: string[]
): string[] {
  if (typeof raw === "string" && raw.trim()) {
    return raw
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
  }
  return fallback;
}
