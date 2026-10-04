import { v2 as cloudinary } from 'cloudinary';
import { BadRequestException } from '@nestjs/common';

export async function uploadImageToImgBB(file: { buffer: Buffer; originalname: string }): Promise<string> {
    if (!file) {
        throw new BadRequestException('Yuklash uchun rasm topilmadi!');
    }

    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'market_engine',
                resource_type: 'auto',
                format: 'webp'
            },
            (error, result) => {
                if (error) {
                    console.error("Cloudinary Error:", error);
                    reject(new Error('Rasmni yuklashda xatolik yuz berdi!'));
                } else {
                    resolve(result!.secure_url);
                }
            },
        );

        uploadStream.end(file.buffer);
    });
}