import mongoose from "mongoose";
import { CATEGORY_IDS } from "../config/badmintonChampionship.js";

const badmintonSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "default",
      unique: true,
    },
    closedCategories: {
      type: [
        {
          type: String,
          enum: CATEGORY_IDS,
        },
      ],
      default: [],
    },
    registrationForceClosed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("BadmintonSettings", badmintonSettingsSchema);
