import { NextRequest, NextResponse } from 'next/server';
import Pusher from 'pusher';
import dbConnect from '@/lib/db';
import GameSession from '@/models/GameSession';

// Initialize Pusher for server-side
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export async function POST(req: NextRequest) {
  try {
    // 检查 Pusher 环境变量是否配置
    if (!process.env.PUSHER_APP_ID || !process.env.PUSHER_KEY || !process.env.PUSHER_SECRET) {
      console.error('Pusher credentials missing in environment variables');
      return NextResponse.json({ error: 'Pusher not configured' }, { status: 500 });
    }

    const { sessionId, sender, content, role } = await req.json();

    if (!sessionId || !content) {
      return NextResponse.json({ error: 'Missing sessionId or content' }, { status: 400 });
    }

    // NOTE: 人类-人类对话暂时不需要存入 MongoDB — 以下数据库写入逻辑已注释
    // await dbConnect();

    // const timestamp = new Date();
    // const messageToAdd = {
    //   role: role || 'user', // Default to user if not specified
    //   content: content,
    //   timestamp: timestamp,
    // };

    // // 保存消息到 MongoDB (存在即更新，不存在即创建会话)
    // await GameSession.findOneAndUpdate(
    //   { sessionId },
    //   {
    //     $setOnInsert: {
    //       sessionId,
    //       startTime: new Date(),
    //       actualOpponent: 'HUMAN', // 标识为真人对战
    //     },
    //     $push: {
    //       messages: messageToAdd,
    //     },
    //   },
    //   { upsert: true, new: true, setDefaultsOnInsert: true }
    // );

    // 触发 Pusher 事件进行实时广播
    // 使用 private channel 以增加安全性 (格式: private-session-ID)
    console.log('📡 Triggering Pusher event on channel:', `private-session-${sessionId}`, 'with data:', { sender, content, role: messageToAdd.role, timestamp });
    const triggerResult = await pusher.trigger(`private-session-${sessionId}`, 'new-message', {
      sender,
      content,
      role: messageToAdd.role,
      timestamp: timestamp,
    });
    console.log('📡 Pusher trigger result:', triggerResult);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in human talk route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
