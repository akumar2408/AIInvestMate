import type { VercelRequest, VercelResponse } from "@vercel/node";
import { aiService } from "../../server/services/openai";

type RedditPost = { subreddit: string; title: string; score: number };

const SUBREDDITS = ["stocks", "investing", "wallstreetbets"];

async function fetchPosts(subreddit: string): Promise<RedditPost[]> {
  const url = `https://www.reddit.com/r/${subreddit}/top.json?t=day&limit=15`;
  const resp = await fetch(url, {
    headers: {
      "User-Agent": "AIInvestMate/1.0 (+https://aiinvestmate.com)",
    },
  });

  if (!resp.ok) {
    throw new Error(`Reddit responded ${resp.status} for r/${subreddit}`);
  }

  const data = await resp.json();
  const children = data?.data?.children ?? [];
  return children
    .map((child: any) => ({
      subreddit,
      title: child?.data?.title || "",
      score: typeof child?.data?.score === "number" ? child.data.score : 0,
    }))
    .filter((post: RedditPost) => Boolean(post.title));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const postsNested = await Promise.all(
      SUBREDDITS.map(async (sub) => {
        try {
          return await fetchPosts(sub);
        } catch (error) {
          console.error("Reddit fetch error", sub, error);
          return [];
        }
      })
    );
    const posts = postsNested.flat();
    const summary = await aiService.summarizeRedditMood(posts);

    res.status(200).json({
      summary,
      stats: {
        totalPosts: posts.length,
        subs: SUBREDDITS,
      },
    });
  } catch (error) {
    console.error("Reddit mood route error", error);
    res.status(500).json({ error: "Failed to load Reddit mood" });
  }
}
