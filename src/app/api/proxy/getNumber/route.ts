import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    
    // Extract parameters from the request
    const country = formData.get('country');
    const carrier = formData.get('carrier');
    const authKey = formData.get('authKey');
    
    // Validate required parameters
    if (!country) {
      return NextResponse.json(
        { error: 'Country is required' },
        { status: 400 }
      );
    }
    
    // Create a new FormData object to send to the target API
    const targetFormData = new FormData();
    targetFormData.append('app', country as string);
    if (carrier) {
      targetFormData.append('carrier', carrier as string);
    }
    
    // Make the request to the target API
    const response = await fetch('https://raazit.acchub.io/api/getNumber/', {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9,bn;q=0.8',
        'Connection': 'keep-alive',
        'Origin': 'https://raazit.acchub.io',
        'Referer': 'https://raazit.acchub.io/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'auth-token': authKey as string,
        'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"'
      },
      body: targetFormData,
      // Include cookies in the request
      credentials: 'include',
    });
    
    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    let data;
    
    // Clone the response before consuming it
    const responseClone = response.clone();
    
    // Get the response as text first
    const textResponse = await response.text();
    console.log('Raw response content:', textResponse);
    
    try {
      // Try to parse as JSON if content type indicates JSON
      if (contentType && contentType.includes('application/json')) {
        try {
          data = JSON.parse(textResponse);
        } catch (jsonError) {
          console.error('Error parsing JSON:', jsonError);
          data = { error: 'Invalid JSON format', message: textResponse };
        }
      } else {
        // If not JSON, use the text response
        console.log('Response is not JSON:', textResponse);
        data = { message: textResponse };
      }
    } catch (parseError) {
      // Handle any other parsing errors
      console.error('Error processing response:', parseError);
      data = { error: 'Failed to process response', message: textResponse };
    }
    
    // Return the response from the target API
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
    console.error('Error in proxy API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from the target API' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
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