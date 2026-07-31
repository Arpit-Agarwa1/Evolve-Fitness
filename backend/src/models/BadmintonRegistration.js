import mongoose from "mongoose";
import {
  ALL_PLAYER_LEVELS,
  CATEGORY_IDS,
} from "../config/badmintonChampionship.js";

/**
 * One championship registration — member or open (both paid carts via Cashfree).
 */
const eventEntrySchema = new mongoose.Schema(
  {
    categoryId: {
      type: String,
      required: true,
      enum: CATEGORY_IDS,
    },
    categoryLabel: {
      type: String,
      required: true,
      trim: true,
    },
    partnerName: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    /** As entered on the open cart form (also merged into partnerName). */
    partnerFirstName: {
      type: String,
      trim: true,
      maxlength: 60,
      default: "",
    },
    partnerLastName: {
      type: String,
      trim: true,
      maxlength: 60,
      default: "",
    },
    /** Partner age in years (open tournament cart). */
    partnerAge: {
      type: Number,
      min: 1,
      max: 120,
      default: null,
    },
    partnerMobile: {
      type: String,
      trim: true,
      maxlength: 20,
      default: "",
    },
  },
  { _id: false }
);

const badmintonRegistrationSchema = new mongoose.Schema(
  {
    registrationId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    tournamentType: {
      type: String,
      enum: ["member", "open"],
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: 120,
    },
    mobile: {
      type: String,
      required: [true, "Mobile is required"],
      trim: true,
      maxlength: 20,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
      default: "",
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", ""],
      default: "",
    },
    /** Optional DOB (members); open flow uses `age` instead. */
    dateOfBirth: {
      type: Date,
      default: null,
    },
    /** Age in years (open tournament form). */
    age: {
      type: Number,
      min: 1,
      max: 120,
      default: null,
    },
    playerLevel: {
      type: String,
      enum: ALL_PLAYER_LEVELS,
      required: true,
    },
    /** Flattened category ids (for counts / admin filters). */
    categories: {
      type: [
        {
          type: String,
          enum: CATEGORY_IDS,
        },
      ],
      default: [],
    },
    /** Per-event partner info (open cart / member single category). */
    events: {
      type: [eventEntrySchema],
      default: [],
    },
    eventCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    amountInr: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "waived"],
      default: "pending",
    },
    status: {
      type: String,
      enum: ["draft", "confirmed", "cancelled"],
      default: "draft",
      index: true,
    },
    /** Cashfree merchant order id (usually registrationId with safe chars). */
    cashfreeOrderId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    cashfreePaymentSessionId: {
      type: String,
      trim: true,
      default: "",
    },
    cashfreePaymentId: {
      type: String,
      trim: true,
      default: "",
    },
    /** Legacy Razorpay fields (kept for older documents). */
    razorpayOrderId: {
      type: String,
      trim: true,
      default: "",
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
      default: "",
    },
    razorpaySignature: {
      type: String,
      trim: true,
      default: "",
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

badmintonRegistrationSchema.index({ tournamentType: 1, status: 1 });
badmintonRegistrationSchema.index({ createdAt: -1 });

export default mongoose.model(
  "BadmintonRegistration",
  badmintonRegistrationSchema
);
