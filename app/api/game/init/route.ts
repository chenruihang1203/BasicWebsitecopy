import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import GameSession from '@/models/GameSession';

interface InitRequest {
  sessionId: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: InitRequest = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Create a new game session document
    const session = new GameSession({
      sessionId,
      startTime: new Date(),
      messages: [],
      actualOpponent: 'AI',
    });

    await session.save();

    return NextResponse.json({
      success: true,
      sessionId,
    });
  } catch (error) {
    console.error('Error initializing game session:', error);
    return NextResponse.json(
      { error: 'Failed to initialize game session' },
      { status: 500 }
    );
  }
}
