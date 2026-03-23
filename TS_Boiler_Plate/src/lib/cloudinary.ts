import { v2 as cloudinary } from "cloudinary";
import config from "../config/index.js";
import { logger } from "../config/logger.js";

if (config.features.cloudinaryEnabled) {
    const cloudName = config.cloudinary.cloud_name;
    const apiKey = config.cloudinary.api_key;
    const apiSecret = config.cloudinary.api_secret;
    if (!cloudName || !apiKey || !apiSecret) {
        throw new Error("Cloudinary is enabled but credentials are missing");
    }

    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret
    });
    logger.info("Cloudinary enabled");
} else {
    logger.info("Cloudinary disabled via CLOUDINARY_ENABLED flag");
}

export default cloudinary;
