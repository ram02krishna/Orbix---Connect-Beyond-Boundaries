import * as cheerio from "cheerio";

export interface LinkPreviewMetadata {
  type: string;
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
}

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export async function extractLinkPreview(text: string): Promise<LinkPreviewMetadata | null> {
  const match = text.match(URL_REGEX);
  if (!match || match.length === 0) return null;

  const url = match[0]; // Extract the first URL found

  try {
    const response = await fetch(url, {
      headers: {
        // Use a generic user agent to avoid blocks
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    
    if (!response.ok) return { type: "link_preview", url };

    const html = await response.text();
    const $ = cheerio.load(html);

    const getMetaTag = (name: string) => {
      return (
        $(`meta[property="${name}"]`).attr("content") ||
        $(`meta[name="${name}"]`).attr("content")
      );
    };

    return {
      type: "link_preview",
      url,
      title: getMetaTag("og:title") || $("title").text(),
      description: getMetaTag("og:description") || getMetaTag("description"),
      image: getMetaTag("og:image"),
      siteName: getMetaTag("og:site_name"),
    };
  } catch (error) {
    console.error("Failed to extract link preview for", url, error);
    return { type: "link_preview", url }; // Fallback to just returning the url
  }
}
