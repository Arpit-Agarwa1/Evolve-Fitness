import mongoose from "mongoose";
import { PICKLEBALL_CATEGORY_IDS } from "../config/pickleballChampionship.js";

const pickleballSettingsSchema = new mongoose.Schema(
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
          enum: PICKLEBALL_CATEGORY_IDS,
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

export default mongoose.model("PickleballSettings", pickleballSettingsSchema);
