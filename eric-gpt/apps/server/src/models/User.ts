import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  name?: string;
  createdAt: Date;
  authProvider: string;
  stripeCustomerId?: string;
  subscription?: {
    planId: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    submissionsThisPeriod: number;
  };
  orgId?: Schema.Types.ObjectId;
}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String },
    authProvider: { type: String, required: true, default: "email" },
    stripeCustomerId: { type: String },
    subscription: {
      planId: { type: String },
      status: { 
        type: String, 
        enum: ["active", "past_due", "canceled"],
        default: "active" 
      },
      currentPeriodStart: { type: Date },
      currentPeriodEnd: { type: Date },
      submissionsThisPeriod: { type: Number, default: 0 },
    },
    orgId: { type: Schema.Types.ObjectId, ref: "Organization" },
  },
  { timestamps: true }
);

// Check if the model already exists to prevent overwriting during hot reloads
export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
