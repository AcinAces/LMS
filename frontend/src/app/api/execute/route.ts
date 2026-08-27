import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { source_code, language_id, versionIndex, stdin } = await req.json();
    
    // Check if the API keys are provided
    const clientId = process.env.JDOODLE_CLIENT_ID;
    const clientSecret = process.env.JDOODLE_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return NextResponse.json({ 
        error: 'Missing JDoodle API keys. Please add JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET to your .env file.'
      }, { status: 500 });
    }

    const response = await fetch('https://api.jdoodle.com/v1/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clientId: clientId,
        clientSecret: clientSecret,
        script: source_code,
        language: language_id,
        versionIndex: versionIndex || "0",
        stdin: stdin || ""
      })
    });

    const data = await response.json();
    
    // Forward the JDoodle response to our frontend
    return NextResponse.json(data);
  } catch (error) {
    console.error('Code execution error:', error);
    return NextResponse.json({ 
      error: 'Failed to execute code'
    }, { status: 500 });
  }
}
