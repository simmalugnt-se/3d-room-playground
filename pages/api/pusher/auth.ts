import type { NextApiRequest, NextApiResponse } from 'next';
import { createHmac } from 'crypto';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { socket_id, channel_name } = req.body;
  
  console.log('\n=== AUTH REQUEST ===');
  console.log(`Socket ID: ${socket_id}`);
  console.log(`Channel: ${channel_name}`);
  console.log(`Request body:`, req.body);

  // Get Pusher credentials from environment variables
  const PUSHER_APP_KEY = process.env.PUSHER_KEY;
  const PUSHER_APP_SECRET = process.env.PUSHER_SECRET;

  if (!PUSHER_APP_KEY || !PUSHER_APP_SECRET) {
    console.error('Missing Pusher credentials');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // For presence channels, include user info
    if (channel_name.startsWith('presence-')) {
      const userId = Math.random().toString(36).substr(2, 9);
      const userInfo = {
        user_id: userId,  // Pusher requires 'user_id' not 'id'
        user_info: {
          name: `Player ${userId.substr(0, 6)}`
        }
      };

      const stringToSign = `${socket_id}:${channel_name}:${JSON.stringify(userInfo)}`;
      const signature = createHmac('sha256', PUSHER_APP_SECRET).update(stringToSign).digest('hex');

      const response = {
        auth: `${PUSHER_APP_KEY}:${signature}`,
        channel_data: JSON.stringify(userInfo)
      };
      
      console.log(`Auth response:`, response);
      console.log(`==================\n`);
      
      return res.json(response);
    } else {
      // For private channels
      const stringToSign = `${socket_id}:${channel_name}`;
      const signature = createHmac('sha256', PUSHER_APP_SECRET).update(stringToSign).digest('hex');

      const response = {
        auth: `${PUSHER_APP_KEY}:${signature}`
      };
      
      console.log(`Auth response:`, response);
      console.log(`==================\n`);
      
      return res.json(response);
    }
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}