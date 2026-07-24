import mongoose from "mongoose";
import { CATEGORY_IDS } from "../config/badmintonChampionship.js";

/**
 * Singleton-ish settings for championship (manually closed categories / global close).
 */
const badmintonSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "default",
      unique: true,
    },
    /** Categories closed early by admin (in addition to capacity / date). */
    closedCategories: {
      type: [
        {
          type: String,
          enum: CATEGORY_IDS,
        },
      ],
      default: [],
    },
    /** Force-close all registration regardless of date. */
    registrationForceClosed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("BadmintonSettings", badmintonSettingsSchema);
