import mongoose from "mongoose";

const PLAN_VALUES = ["essential", "premium", "elite", "unknown"];

/**
 * Membership interest captured from the site (e.g. plan buttons).
 */
const membershipLeadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 32,
    },
    plan: {
      type: String,
      enum: {
        values: PLAN_VALUES,
        message: "Invalid plan",
      },
      default: "unknown",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

export default mongoose.model("MembershipLead", membershipLeadSchema);
export { PLAN_VALUES };
