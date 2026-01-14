import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import GameSession from '@/models/GameSession';

interface SubmitRequest {
  sessionId: string;
  playerGuess: 'AI' | 'HUMAN';
  decisionTime: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: SubmitRequest = await req.json();
    const { sessionId, playerGuess, decisionTime } = body;

    if (!sessionId || !playerGuess || !decisionTime) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, playerGuess, or decisionTime' },
        { status: 400 }
      );
    }

    if (playerGuess !== 'AI' && playerGuess !== 'HUMAN') {
      return NextResponse.json(
        { error: 'playerGuess must be either "AI" or "HUMAN"' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find the session
    const session = await GameSession.findOne({ sessionId });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Calculate if the guess is correct
    // The actual opponent is always 'AI' in this MVP
    const isCorrect = playerGuess === 'AI';

    // Calculate score
    let score = 0;
    if (isCorrect) {
      // Base score for correct guess
      score = 100;

      // Bonus for speed (based on how quickly they figured it out)
      const decisionTimeDate = new Date(decisionTime);
      const startTime = session.startTime;
      const timeElapsedSeconds = (decisionTimeDate.getTime() - startTime.getTime()) / 1000;

      // Speed bonus: up to 50 points if decided within 30 seconds
      // Linear decay: 50 points at 0 seconds, 0 points at 30+ seconds
      const speedBonus = Math.max(0, Math.min(50, 50 - (timeElapsedSeconds / 30) * 50));
      score += Math.round(speedBonus);

      // Bonus for fewer messages (quick detection)
      const messageCount = session.messages.length;
      if (messageCount <= 4) {
        score += 25; // Quick detection bonus
      } else if (messageCount <= 8) {
        score += 10;
      }
    } else {
      // Wrong guess: 0 points
      score = 0;
    }

    // Update the session with the guess and score
    session.playerGuess = playerGuess;
    session.isCorrect = isCorrect;
    session.decisionTime = new Date(decisionTime);
    session.score = score;

    await session.save();

    // Return the result
    return NextResponse.json({
      success: true,
      isCorrect,
      score,
      actualOpponent: session.actualOpponent,
      playerGuess,
      messageCount: session.messages.length,
      sessionId,
    });
  } catch (error) {
    console.error('Error in submit route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
