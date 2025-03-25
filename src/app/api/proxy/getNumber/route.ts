import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const country = formData.get('country');
    const carrier = formData.get('carrier');
    const authKey = formData.get('authKey');
    
    if (!country) {
      return NextResponse.json(
        { error: 'Country is required' },
        { status: 400 }
      );
    }
    
    const targetFormData = new FormData();
    targetFormData.append('app', country as string);
    if (carrier) {
      targetFormData.append('carrier', carrier as string);
    }
    
    const response = await fetch('https://raazit.acchub.io/api/sms/', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Origin': 'https://raazit.acchub.io',
        'Referer': 'https://raazit.acchub.io/',
        'X-Requested-With': 'XMLHttpRequest',
        'auth-token': authKey as string
      },
      body: targetFormData,
      credentials: 'include'
    });
    
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