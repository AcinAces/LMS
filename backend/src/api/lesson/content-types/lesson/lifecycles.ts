import { errors } from '@strapi/utils';

// Helper to convert ISO 8601 duration (e.g. PT3M34S) to seconds
function parseIsoDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  
  return (hours * 3600) + (minutes * 60) + seconds;
}

function extractYoutubeId(input: string): string | null {
  if (!input) return null;
  // If it's already an 11-character ID without spaces/slashes
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  
  // Try to match various YouTube URL formats
  const match = input.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
}

// Fetch YouTube video duration
async function fetchYoutubeDuration(videoId: string): Promise<number | null> {
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(url);
    const html = await response.text();
    
    // Look for <meta itemprop="duration" content="PT3M34S">
    const match = html.match(/itemprop="duration" content="(.*?)"/);
    if (match && match[1]) {
      return parseIsoDuration(match[1]);
    }
    return null;
  } catch (err) {
    console.error('Failed to fetch YouTube duration:', err);
    return null;
  }
}

export default {
  async beforeCreate(event: any) {
    const { data } = event.params;
    if (data.youtubeVideoId) {
      const cleanId = extractYoutubeId(data.youtubeVideoId);
      if (cleanId) {
        data.youtubeVideoId = cleanId; // Save only the clean ID back to the DB
        const duration = await fetchYoutubeDuration(cleanId);
        if (duration) {
          data.durationInSeconds = duration;
        }
      }
    }
  },

  async beforeUpdate(event: any) {
    const { data } = event.params;
    if (data.youtubeVideoId) {
      const cleanId = extractYoutubeId(data.youtubeVideoId);
      if (cleanId) {
        data.youtubeVideoId = cleanId; // Save only the clean ID back to the DB
        const duration = await fetchYoutubeDuration(cleanId);
        if (duration) {
          data.durationInSeconds = duration;
        }
      }
    }
  },
};
