import type { UploadApiResponse, UploadApiErrorResponse, UploadApiOptions } from "cloudinary";
import { StatusCodes } from "http-status-codes";
import cloudinary from "../lib/cloudinary.js";
import AppError from "../errors/AppError.js";


export type CloudinaryUploadResult = {
    public_id: string;
    secure_url: string;
    resource_type: "image" | "video" | "raw" | string;
};

function uploadBuffer(
    buffer: Buffer,
    options: { folder: string; resource_type?: "auto" | "image" | "raw" | "video"; public_id?: string }
): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
        // Build options without passing undefined keys
        const uploadOptions: UploadApiOptions = {
            folder: options.folder,
            resource_type: options.resource_type ?? "auto",
            ...(options.public_id !== undefined ? { public_id: options.public_id } : {})
        };

        const stream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
                if (error || !result) return reject(error ?? new Error("Cloudinary upload failed"));

                resolve({
                    public_id: result.public_id,
                    secure_url: result.secure_url,
                    resource_type: result.resource_type
                });
            }
        );

        stream.end(buffer);
    });
}

export async function uploadToCloudinaryFromMulter(
    file: Express.Multer.File,
    folder: string
): Promise<CloudinaryUploadResult> {
    try {
        return await uploadBuffer(file.buffer, { folder, resource_type: "auto" });
    } catch (error: unknown) {
        console.log("Cloudinary Stream Error:", error);
        throw AppError.of(StatusCodes.BAD_GATEWAY, "Failed to upload file to Cloudinary", [
            { path: file.fieldname, message: "Cloudinary upload failed" }
        ]);
    }
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch {
        throw AppError.of(StatusCodes.BAD_GATEWAY, "Failed to delete file from Cloudinary", [
            { path: "publicId", message: "Cloudinary delete failed" }
        ]);
    }
}
