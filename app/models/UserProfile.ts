import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";
import type { ResumeData } from "app/lib/resumeParser";

export interface IUserProfile extends Document {
  userId: string;
  resumeData: ResumeData | null;
  resumeFileName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const userProfileSchema = new Schema<IUserProfile>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    resumeData: { type: Schema.Types.Mixed, default: null },
    resumeFileName: { type: String, default: null },
  },
  { timestamps: true },
);

const UserProfile =
  (mongoose.models.UserProfile as mongoose.Model<IUserProfile>) ||
  mongoose.model<IUserProfile>("UserProfile", userProfileSchema);

export default UserProfile;
