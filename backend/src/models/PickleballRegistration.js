import mongoose from "mongoose";
import { PICKLEBALL_CATEGORY_IDS } from "../config/pickleballChampionship.js";

/**
 * Open Pickleball Championship registration (paid cart via Cashfree).
 */
const eventEntrySchema = new mongoose.Schema(
  {
    categoryId: {
      type: String,
      required: true,
      enum: PICKLEBALL_CATEGORY_IDS,
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

const pickleballRegistrationSchema = new mongoose.Schema(
  {
    registrationId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
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
      enum: ["male", "female", ""],
      default: "",
    },
    age: {
      type: Number,
      min: 1,
      max: 120,
      default: null,
    },
    categories: {
      type: [
        {
          type: String,
          enum: PICKLEBALL_CATEGORY_IDS,
        },
      ],
      default: [],
    },
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
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    status: {
      type: String,
      enum: ["draft", "confirmed", "cancelled"],
      default: "draft",
      index: true,
    },
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
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

pickleballRegistrationSchema.index({ createdAt: -1 });

export default mongoose.model(
  "PickleballRegistration",
  pickleballRegistrationSchema
);
