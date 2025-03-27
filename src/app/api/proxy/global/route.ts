import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Parse the JSON body from the request
    const requestConfig = await request.json();
    
    if (!requestConfig || !requestConfig.url) {
      return NextResponse.json(
        { error: 'Request configuration is missing or invalid. Must include a URL.' },
        { status: 400 }
      );
    }

    // Extract the URL and other request parameters
    const { url, headers = {}, method = 'GET', body = null } = requestConfig;
    
    console.log(`Processing global proxy request to: ${url}`);
    console.log(`Method: ${method}`);
    
    // Make the request to the target API
    const response = await fetch(url, {
      method,
      headers,
      body: body ? body : undefined,
      // Don't include credentials by default for security reasons
      // Only include if explicitly requested
      credentials: requestConfig.includeCredentials ? 'include' : 'same-origin'
    });
    
    // Get the response text
    const textResponse = await response.text();
    let data: Record<string, unknown>;
    
    try {
      // Try to parse the response as JSON
      data = JSON.parse(textResponse);
      
      // Process the response for phone numbers if it matches the expected format
      if (data.meta === 200 && data.data?.did) {
        const phoneNumber = data.data.did;
        const plusNumber = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;
        
        // Try to extract the country code from the URL or request body
        let countryCode = '';
        
        // For onepva.com API
        if (url.includes('onepva.com')) {
          const countryParam = new URL(url).searchParams.get('country');
          if (countryParam) {
            // Try to get the code from the URL parameters
            const codeParam = new URL(url).searchParams.get('code');
            if (codeParam) {
              countryCode = codeParam;
            }
          }
        } 
        // For acchub.io API
        else if (url.includes('acchub.io')) {
          // Try to extract country code from app parameter (e.g., "master--TJ-992")
          if (body && typeof body === 'string' && body.includes('app')) {
            const appMatch = body.match(/name="app"[\s\S]*?\r\n\r\n(.*?)\r\n/);
            if (appMatch && appMatch[1]) {
              const appValue = appMatch[1];
              const codeMatch = appValue.match(/-(\d+)$/);
              if (codeMatch && codeMatch[1]) {
                countryCode = codeMatch[1];
              }
            }
          }
        }
        
        // Format the response in a consistent way
        const nationalNumber = countryCode ? plusNumber.substring(countryCode.length) : plusNumber;
        
        data = {
          full: phoneNumber,
          plus: plusNumber,
          national: nationalNumber,
          original: data // Include the original response for reference
        };
      }
    } catch (parseError) {
      console.error('Error processing response:', parseError);
      // If it's not valid JSON, return the raw text
      data = { 
        raw: textResponse,
        error: 'Failed to parse response as JSON'
      };
    }
    
    // Return the processed response
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    console.error('Error in global proxy API:', error);
    return NextResponse.json(
      { error: 'Failed to process the request', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    }
  );
}
