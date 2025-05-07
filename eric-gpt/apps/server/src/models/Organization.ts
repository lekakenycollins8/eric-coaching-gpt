import mongoose, { Schema, Document } from "mongoose";

export interface IOrganization extends Document {
  ownerId: Schema.Types.ObjectId;
  memberIds: Schema.Types.ObjectId[];
  stripeSubscriptionId: string;
}

const OrganizationSchema: Schema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    memberIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    stripeSubscriptionId: { type: String, required: true },
  },
  { timestamps: true }
);

// Check if the model already exists to prevent overwriting during hot reloads
export default mongoose.models.Organization || 
  mongoose.model<IOrganization>("Organization", OrganizationSchema);
