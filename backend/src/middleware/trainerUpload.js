import multer from "multer";

/**
 * Accepts only common web image types; max 5MB. Uses memory — controller uploads to Cloudinary or disk.
 */
function fileFilter(_req, file, cb) {
  if (/^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error("Only JPEG, PNG, WebP, or GIF images are allowed");
    err.status = 400;
    cb(err);
  }
}

/** Optional single file field `image` for create/update trainer. */
export const trainerImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});
