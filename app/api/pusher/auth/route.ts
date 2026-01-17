import { NextRequest, NextResponse } from 'next/server';
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const socketId = body.get('socket_id') as string;
    const channelName = body.get('channel_name') as string;

    if (!socketId || !channelName) {
      return new Response('Missing socket_id or channel_name', { status: 400 });
    }

    // 在这里你可以添加逻辑来验证用户是否有权访问该频道
    // 简单的 MVP 暂时允许所有请求
    const authResponse = pusher.authenticate(socketId, channelName);
    
    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('Pusher auth error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
