import mongoose from "mongoose";

/**
 * Public-facing trainer profile — photo either on Cloudinary (`imageUrl`) or local disk (`imagePath`).
 */
const trainerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: 120,
    },
    role: {
      type: String,
      required: [true, "Role is required"],
      trim: true,
      maxlength: 160,
    },
    /** HTTPS URL from Cloudinary when configured (persists across deploys). */
    imageUrl: {
      type: String,
      default: null,
      maxlength: 1024,
    },
    /** Cloudinary public_id — used to delete/replace images. */
    cloudinaryPublicId: {
      type: String,
      default: null,
      maxlength: 512,
    },
    /** Relative to `uploads/` when not using Cloudinary; served at `/api/uploads/...` */
    imagePath: {
      type: String,
      default: null,
      maxlength: 512,
    },
    /** Lower numbers appear first on the website */
    sortOrder: {
      type: Number,
      default: 0,
    },
    /** When false, hidden from the public site; admin still sees and can edit. */
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Trainer", trainerSchema);
