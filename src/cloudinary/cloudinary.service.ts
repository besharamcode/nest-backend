import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { Readable } from 'stream';
import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { v2 as CloudinaryType } from 'cloudinary';
import { UploadResult, DeleteResult } from './cloudinary.interface';

@Injectable()
export class CloudinaryService {
  constructor(
    @Inject('CLOUDINARY') private readonly cloudinary: typeof CloudinaryType,
  ) {}

  uploadStream(
    file: NodeJS.ReadableStream | Buffer,
    folder = 'uploads',
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        { folder, resource_type: 'auto' }, // 👈 Added here },
        (error: UploadApiErrorResponse, result: UploadApiResponse) => {
          if (error) {
            return reject(new BadRequestException(error.message));
          }

          if (!result) {
            return reject(new BadRequestException('Upload failed: No result.'));
          }

          const uploadResult: UploadResult = {
            public_id: result.public_id,
            secure_url: result.secure_url,
            resource_type: result.resource_type,
          };

          return resolve(uploadResult);
        },
      );

      if (Buffer.isBuffer(file)) {
        const readable = new Readable();
        readable.push(file);
        readable.push(null);
        readable.pipe(uploadStream);
      } else {
        file.pipe(uploadStream);
      }
    });
  }

  async uploadMultiple(
    files: (NodeJS.ReadableStream | Buffer)[],
    folder = 'uploads',
  ): Promise<UploadResult[]> {
    if (!Array.isArray(files) || files.length === 0) {
      throw new BadRequestException('No files provided for upload.');
    }

    // Run all uploads in parallel for performance
    const results = await Promise.all(
      files.map((file) => this.uploadStream(file, folder)),
    );

    return results;
  }

  async deleteFile(publicId: string): Promise<DeleteResult> {
    return new Promise((resolve, reject) => {
      this.cloudinary.uploader
        .destroy(
          publicId,
          (
            error: UploadApiErrorResponse | null,
            result: { result?: string } | undefined,
          ) => {
            if (error) {
              return reject(new BadRequestException(error.message));
            }

            if (!result || !result.result) {
              return reject(
                new BadRequestException('Delete failed: No valid response.'),
              );
            }

            const deleteResult: DeleteResult = {
              result: result.result,
            };

            return resolve(deleteResult);
          },
        )
        .then(() => {})
        .catch(() => {});
    });
  }
}
