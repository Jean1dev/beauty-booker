import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import * as https from "https";

interface UserPreference {
  userId: string;
  instagram?: string;
}

interface InstagramPost {
  shortcode: string;
  url: string;
  caption: string;
  thumbnailUrl: string;
  timestamp: string;
  isVideo: boolean;
  mediaType: "image" | "video";
}

interface GraphQLPost {
  node: {
    shortcode: string;
    edge_media_to_caption: { edges: Array<{ node: { text: string } }> };
    thumbnail_src: string;
    taken_at_timestamp: number;
    is_video: boolean;
  };
}

function fetchJson(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk: Buffer) => { data += chunk.toString(); });
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error(`Failed to parse JSON for response: ${data.slice(0, 200)}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(15000, () => {
      req.destroy(new Error("Request timed out"));
    });
  });
}

async function fetchLatestPosts(username: string, count = 3): Promise<InstagramPost[]> {
  const url = `https://www.instagram.com/${username}/?__a=1&__d=dis`;

  let json: unknown;
  try {
    json = await fetchJson(url);
  } catch (err) {
    throw new Error(`Failed to fetch Instagram profile for @${username}: ${err}`);
  }

  const edges: GraphQLPost[] =
    (json as any)
      ?.graphql
      ?.user
      ?.edge_owner_to_timeline_media
      ?.edges ?? [];

  if (!Array.isArray(edges) || edges.length === 0) {
    logger.warn(`No posts found for @${username} (profile may be private or Instagram blocked the request)`);
    return [];
  }

  return edges.slice(0, count).map(({ node }) => ({
    shortcode: node.shortcode,
    url: `https://www.instagram.com/p/${node.shortcode}/`,
    caption: (node.edge_media_to_caption?.edges?.[0]?.node?.text ?? "").slice(0, 500),
    thumbnailUrl: node.thumbnail_src,
    timestamp: new Date(node.taken_at_timestamp * 1000).toISOString(),
    isVideo: node.is_video,
    mediaType: node.is_video ? "video" : "image",
  }));
}

export class ScrapeInstagramPostsUseCase {
  static async execute(): Promise<void> {
    logger.info("Starting weekly Instagram scrape job");

    const db = admin.firestore();
    const snapshot = await db.collection("user-preferences").get();

    let success = 0;
    let skipped = 0;
    let errors = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data() as UserPreference;
      const username = (data.instagram ?? "").trim();

      if (!username) {
        skipped++;
        continue;
      }

      const userId = doc.id;
      logger.info(`Scraping Instagram for user ${userId} (@${username})`);

      try {
        const posts = await fetchLatestPosts(username, 3);

        await db.collection("instagram_posts").doc(userId).set({
          userId,
          instagram: username,
          posts,
          scrapedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info(`Saved ${posts.length} post(s) for user ${userId} (@${username})`);
        success++;
      } catch (err: unknown) {
        logger.error(`Error scraping @${username} for user ${userId}:`, err);
        errors++;
      }
    }

    logger.info(
      `Instagram scrape job finished — success: ${success}, skipped: ${skipped}, errors: ${errors}`
    );
  }
}
