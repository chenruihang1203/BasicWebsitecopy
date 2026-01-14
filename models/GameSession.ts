import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface IGameSession extends Document {
  sessionId: string;
  startTime: Date;
  messages: IMessage[];
  playerGuess?: 'AI' | 'HUMAN';
  actualOpponent: 'AI';
  isCorrect?: boolean;
  decisionTime?: Date;
  score?: number;
}

const MessageSchema = new Schema<IMessage>({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const GameSessionSchema = new Schema<IGameSession>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    messages: {
      type: [MessageSchema],
      default: [],
    },
    playerGuess: {
      type: String,
      enum: ['AI', 'HUMAN'],
      required: false,
    },
    actualOpponent: {
      type: String,
      default: 'AI',
      enum: ['AI'],
    },
    isCorrect: {
      type: Boolean,
      required: false,
    },
    decisionTime: {
      type: Date,
      required: false,
    },
    score: {
      type: Number,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation during hot reload
const GameSession: Model<IGameSession> =
  mongoose.models.GameSession || mongoose.model<IGameSession>('GameSession', GameSessionSchema);

export default GameSession;
