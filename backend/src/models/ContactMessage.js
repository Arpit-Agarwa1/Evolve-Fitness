import mongoose from "mongoose";

/**
 * Website contact form submissions.
 */
const contactMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [120, "Name is too long"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      maxlength: [254, "Email is too long"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [5000, "Message is too long"],
    },
    source: {
      type: String,
      default: "website",
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ContactMessage", contactMessageSchema);
