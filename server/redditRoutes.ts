import express from "express";
import { aiService } from "./services/openai";

type RedditPost = {
  subreddit: string;
  title: string;
  score: number;
};

const redditRouter = express.Router();
const SUBREDDITS = ["stocks", "investing", "wallstreetbets"];

async function fetchSubredditTop(subreddit: string): Promise<RedditPost[]> {
  const url = `https://www.reddit.com/r/${subreddit}/top.json?t=day&limit=15`;
  const resp = await fetch(url, {
    headers: {
      "User-Agent": "AIInvestMate/1.0 (https://ai-investmate)",
    },
  });

  if (!resp.ok) {
    throw new Error(`Reddit fetch failed for ${subreddit}: ${resp.status}`);
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

redditRouter.get("/api/reddit/mood", async (_req, res) => {
  try {
    const postsNested = await Promise.all(
      SUBREDDITS.map(async (sub) => {
        try {
          return await fetchSubredditTop(sub);
        } catch (error) {
          console.error("Reddit fetch error", sub, error);
          return [];
        }
      })
    );

    const posts = postsNested.flat();
    const summary = await aiService.summarizeRedditMood(posts);

    res.json({
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
});

export default redditRouter;
