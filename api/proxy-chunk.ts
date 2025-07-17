import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  maxDuration: 30,
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // Set CORS headers for all responses from this function
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Origin', '*'); // In production, you might want to restrict this to 'https://teletransfer.vercel.app'
  response.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-Gdrive-Url, X-Content-Range, X-Content-Length, Content-Type'
  );

  // Handle the CORS preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    return response.status(204).send(null);
  }

  // We only accept PUT for the actual data transfer
  if (request.method !== 'PUT') {
    response.setHeader('Allow', 'PUT');
    return response.status(405).send('Method Not Allowed');
  }

  // Extract metadata from the custom headers
  const gdrive_upload_url = request.headers['x-gdrive-url'] as string;
  const content_range = request.headers['x-content-range'] as string;
  const content_length = request.headers['x-content-length'] as string;
  
  if (!gdrive_upload_url || !content_range || !content_length) {
    return response.status(400).json({ 
      error: 'Missing required proxy headers' 
    });
  }

  try {
    const gdriveResponse = await fetch(gdrive_upload_url, {
      method: 'PUT',
      headers: {
        'Content-Length': content_length,
        'Content-Range': content_range,
      },
      body: request.body,
    });

    if (!gdriveResponse.ok && gdriveResponse.status !== 308) {
      const errorBody = await gdriveResponse.text();
      console.error('Google Drive API Error:', { status: gdriveResponse.status, body: errorBody });
      return response.status(gdriveResponse.status).json({ error: `Google Drive API Error: ${errorBody}` });
    }

    if (gdriveResponse.status === 200 || gdriveResponse.status === 201) {
        const gdriveFinalData = await gdriveResponse.json();
        return response.status(200).json({ final: true, data: gdriveFinalData });
    }

    return response.status(200).json({ final: false });

  } catch (error: any) {
    console.error('Proxy function internal error:', error);
    return response.status(500).json({ error: 'Proxy server failed', details: error.message });
  }
}