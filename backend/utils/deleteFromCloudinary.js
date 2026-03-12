import cloudinary from "../configs/cloudinary.config.js";

export const deleteResource = (publicId, resourceType = "raw") => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      publicId,
      { resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);

        resolve(result);
      },
    );
  });
};
