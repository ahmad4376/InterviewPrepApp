import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  clerkId: string;
  email: string;
  name: string;
  accountType: "user" | "business";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    clerkId:     { type: String, required: true, unique: true },
    email:       { type: String, required: true },
    name:        { type: String, default: "" },
    accountType: { type: String, enum: ["user", "business"], required: true },
  },
  { timestamps: true },
);

export const User: Model<IUser> =
  mongoose.models.User
    ? (mongoose.models.User as Model<IUser>)
    : mongoose.model<IUser>("User", UserSchema);