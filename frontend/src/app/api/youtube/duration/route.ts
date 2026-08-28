import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('v');
  
  if (!videoId) return NextResponse.json({ error: 'Missing video id' }, { status: 400 });

  try {
    // Fetch YouTube page directly
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const html = await res.text();
    
    // Attempt 1: Look for exact lengthSeconds (commonly available in the HTML config)
    const exactMatch = html.match(/"lengthSeconds":"(\d+)"/);
    if (exactMatch && exactMatch[1]) {
      return NextResponse.json({ durationInSeconds: parseInt(exactMatch[1], 10) });
    }
    
    // Attempt 2: Fallback to approxDurationMs
    const approxMatch = html.match(/"approxDurationMs":"(\d+)"/);
    if (approxMatch && approxMatch[1]) {
      return NextResponse.json({ durationInSeconds: Math.floor(parseInt(approxMatch[1], 10) / 1000) });
    }

    // If nothing found, return 0 (the client video player will dynamically fetch it later anyway)
    return NextResponse.json({ durationInSeconds: 0 });
  } catch (error) {
    console.error("Failed to fetch youtube duration proxy:", error);
    return NextResponse.json({ durationInSeconds: 0 });
  }
}
