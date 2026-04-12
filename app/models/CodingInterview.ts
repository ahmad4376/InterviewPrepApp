// import mongoose, { Document, Schema, Model } from "mongoose";

// export interface ISubmissionEntry {
//   problemId: string;
//   language: string;
//   code: string;
//   status: "accepted" | "wrong_answer" | "error" | "not_attempted";
//   testsPassed: number;
//   testsTotal: number;
//   runtime: string;
//   submittedAt: Date | null;
// }

// export interface ICodingInterview extends Document {
//   userId: string;
//   title: string;
//   difficulty: "easy" | "medium" | "hard" | "mixed";
//   numProblems: number;
//   timeLimit: number | null;
//   tags: string[];
//   status: "scheduled" | "in-progress" | "completed";
//   problems: string[];
//   submissions: ISubmissionEntry[];
//   isMassInterview: boolean;
//   shareToken: string | null;
//   startedAt: Date | null;
//   completedAt: Date | null;
//   createdAt: Date;
//   updatedAt: Date;
// }

// const SubmissionEntrySchema = new Schema<ISubmissionEntry>(
//   {
//     problemId: { type: String, required: true },
//     language: { type: String, required: true },
//     code: { type: String, default: "" },
//     status: {
//       type: String,
//       enum: ["accepted", "wrong_answer", "error", "not_attempted"],
//       default: "not_attempted",
//     },
//     testsPassed: { type: Number, default: 0 },
//     testsTotal: { type: Number, default: 0 },
//     runtime: { type: String, default: "N/A" },
//     submittedAt: { type: Date, default: null },
//   },
//   { _id: false },
// );

// const CodingInterviewSchema = new Schema<ICodingInterview>(
//   {
//     userId: { type: String, required: true },
//     title: { type: String, required: true },
//     difficulty: {
//       type: String,
//       enum: ["easy", "medium", "hard", "mixed"],
//       default: "mixed",
//     },
//     numProblems: { type: Number, required: true },
//     timeLimit: { type: Number, default: null },
//     tags: { type: [String], default: [] },
//     status: {
//       type: String,
//       enum: ["scheduled", "in-progress", "completed"],
//       default: "scheduled",
//     },
//     problems: { type: [String], default: [] },
//     submissions: { type: [SubmissionEntrySchema], default: [] },
//     isMassInterview: { type: Boolean, default: false },
//     shareToken: { type: String, default: null },
//     startedAt: { type: Date, default: null },
//     completedAt: { type: Date, default: null },
//   },
//   { timestamps: true },
// );

// CodingInterviewSchema.index({ userId: 1, createdAt: -1 });
// CodingInterviewSchema.index({ userId: 1, status: 1 });
// CodingInterviewSchema.index({ shareToken: 1 }, { unique: true, sparse: true });

// const CodingInterview: Model<ICodingInterview> =
//   (mongoose.models.CodingInterview as Model<ICodingInterview>) ||
//   mongoose.model<ICodingInterview>("CodingInterview", CodingInterviewSchema);

// export default CodingInterview;
import mongoose, { Document, Schema, Model } from "mongoose";

export interface IMCQOption {
  id: string;
  text: string;
}

export interface IMCQuestion {
  id: string;
  question: string;
  options: IMCQOption[];
  correctOptionId: string;
}

export interface IMCQSubmission {
  mcqId: string;
  selectedOptionId: string | null;
  isCorrect: boolean;
}

export interface ISubmissionEntry {
  problemId: string;
  language: string;
  code: string;
  status: "accepted" | "wrong_answer" | "error" | "not_attempted";
  testsPassed: number;
  testsTotal: number;
  runtime: string;
  submittedAt: Date | null;
}

export interface ICodingInterview extends Document {
  userId: string;
  title: string;
  difficulty: string;
  numProblems: number;
  timeLimit: number | null;
  tags: string[];
  status: "scheduled" | "in-progress" | "completed";
  problems: string[];
  mcqQuestions: IMCQuestion[];
  submissions: ISubmissionEntry[];
  mcqSubmissions: IMCQSubmission[];
  isMassInterview: boolean;
  shareToken: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const MCQOptionSchema = new Schema<IMCQOption>(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
  },
  { _id: false },
);

const MCQQuestionSchema = new Schema<IMCQuestion>(
  {
    id: { type: String, required: true },
    question: { type: String, required: true },
    options: { type: [MCQOptionSchema], required: true },
    correctOptionId: { type: String, required: true },
  },
  { _id: false },
);

const MCQSubmissionSchema = new Schema<IMCQSubmission>(
  {
    mcqId: { type: String, required: true },
    selectedOptionId: { type: String, default: null },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false },
);

const SubmissionEntrySchema = new Schema<ISubmissionEntry>(
  {
    problemId: { type: String, required: true },
    language: { type: String, required: true },
    code: { type: String, default: "" },
    status: {
      type: String,
      enum: ["accepted", "wrong_answer", "error", "not_attempted"],
      default: "not_attempted",
    },
    testsPassed: { type: Number, default: 0 },
    testsTotal: { type: Number, default: 0 },
    runtime: { type: String, default: "N/A" },
    submittedAt: { type: Date, default: null },
  },
  { _id: false },
);

const CodingInterviewSchema = new Schema<ICodingInterview>(
  {
    userId: { type: String, required: true },
    title: { type: String, required: true },
    difficulty: {
      type: String,
      default: "3",
    },
    numProblems: { type: Number, required: true },
    timeLimit: { type: Number, default: null },
    tags: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["scheduled", "in-progress", "completed"],
      default: "scheduled",
    },
    problems: { type: [String], default: [] },
    mcqQuestions: { type: [MCQQuestionSchema], default: [] },
    submissions: { type: [SubmissionEntrySchema], default: [] },
    mcqSubmissions: { type: [MCQSubmissionSchema], default: [] },
    isMassInterview: { type: Boolean, default: false },
    shareToken: { type: String, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

CodingInterviewSchema.index({ userId: 1, createdAt: -1 });
CodingInterviewSchema.index({ userId: 1, status: 1 });
CodingInterviewSchema.index({ shareToken: 1 }, { unique: true, sparse: true });

const CodingInterview: Model<ICodingInterview> =
  (mongoose.models.CodingInterview as Model<ICodingInterview>) ||
  mongoose.model<ICodingInterview>("CodingInterview", CodingInterviewSchema);

export default CodingInterview;