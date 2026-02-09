/**
 * Seed RSS feeds into the_brief.feed_sources table.
 * Run: npx tsx scripts/seed-feeds.ts
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  db: { schema: "the_brief" },
});

const feeds = [
  { name: "TechCrunch", url: "https://techcrunch.com/feed/", feed_type: "rss", fetch_interval_minutes: 120 },
  { name: "The Verge", url: "https://www.theverge.com/rss/index.xml", feed_type: "rss", fetch_interval_minutes: 120 },
  { name: "ESPN", url: "https://www.espn.com/espn/rss/news", feed_type: "rss", fetch_interval_minutes: 60 },
  { name: "SportTechie", url: "https://www.sporttechie.com/feed", feed_type: "rss", fetch_interval_minutes: 180 },
  { name: "Marketing Dive", url: "https://www.marketingdive.com/feeds/news/", feed_type: "rss", fetch_interval_minutes: 120 },
  { name: "Front Office Sports", url: "https://frontofficesports.com/feed/", feed_type: "rss", fetch_interval_minutes: 120 },
  { name: "AdAge", url: "https://adage.com/feed", feed_type: "rss", fetch_interval_minutes: 120 },
  { name: "Digiday", url: "https://digiday.com/feed/", feed_type: "rss", fetch_interval_minutes: 120 },
  { name: "Billboard", url: "https://www.billboard.com/feed/", feed_type: "rss", fetch_interval_minutes: 120 },
  { name: "Wired", url: "https://www.wired.com/feed/rss", feed_type: "rss", fetch_interval_minutes: 120 },
];

async function main() {
  console.log("Seeding RSS feeds...\n");

  for (const feed of feeds) {
    // Check if already exists by URL
    const { data: existing } = await supabase
      .from("feed_sources")
      .select("id, name")
      .eq("url", feed.url)
      .maybeSingle();

    if (existing) {
      console.log(`  SKIP  ${feed.name} — already exists`);
      continue;
    }

    const { error } = await supabase.from("feed_sources").insert({
      name: feed.name,
      url: feed.url,
      feed_type: feed.feed_type,
      active: true,
      fetch_interval_minutes: feed.fetch_interval_minutes,
    });

    if (error) {
      console.error(`  FAIL  ${feed.name}: ${error.message}`);
    } else {
      console.log(`  OK    ${feed.name}`);
    }
  }

  // Verify
  const { data: allFeeds } = await supabase
    .from("feed_sources")
    .select("name, active")
    .order("name");

  console.log(`\n${allFeeds?.length ?? 0} feed sources in database:`);
  allFeeds?.forEach((f) => console.log(`  ${f.active ? "●" : "○"} ${f.name}`));
}

main().catch(console.error);
