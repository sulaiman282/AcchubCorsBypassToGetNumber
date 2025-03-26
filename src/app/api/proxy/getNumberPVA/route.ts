import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const app = formData.get('app');
    const country = formData.get('country');
    const authToken = formData.get('auth-token');
    const code = formData.get('code');
    
    if (!app || !country || !authToken || !code) {
      return NextResponse.json(
        { error: 'app, country, auth-token, and code are required' },
        { status: 400 }
      );
    }
    
    const url = `https://onepva.com/api/sms/?app=${app}&country=${country}&auth-token=${authToken}&code=${code}`;
    
    const headers = {
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Accept-Language': 'en-US,en;q=0.9,bn;q=0.8',
      'Connection': 'keep-alive',
      'Referer': 'https://onepva.com/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
      'X-Requested-With': 'XMLHttpRequest',
      'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'Cookie': `authToken=${authToken}; authRole=Normal`
    };
    
    const response = await fetch(url, { method: 'GET', headers });
    const textResponse = await response.text();

    let data: Record<string, unknown>;
    
    try {
      const parsedData = JSON.parse(textResponse);
      
      if (parsedData.meta === 200 && parsedData.data?.did) {
        const phoneNumber = parsedData.data.did;
        const plusNumber = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;
        
        const nationalMatch = (country as string).match(/-([\d]+)$/);
        const nationalNumber = nationalMatch?.[1] 
          ? plusNumber.substring(nationalMatch[1].length)
          : '';
        
        data = {
          full: phoneNumber,
          plus: plusNumber,
          national: nationalNumber
        };
      } else {
        data = parsedData;
      }
    } catch (parseError) {
      console.error('Error processing response:', parseError);
      data = { error: 'Failed to process response', message: textResponse };
    }

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization'
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
