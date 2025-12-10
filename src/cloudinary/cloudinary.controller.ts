import {
  Controller,
  Post,
  Delete,
  Body,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import type { FastifyRequest } from 'fastify';

@Controller('cloudinary')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('upload')
  async upload(@Request() req: FastifyRequest) {
    const file = await req.file();

    if (!file) throw new BadRequestException('No file uploaded');

    const buffer = await file.toBuffer(); // Convert stream to buffer
    const result = await this.cloudinaryService.uploadStream(
      buffer,
      'enterprise_uploads',
    );

    return result;
  }

  @Post('multiple')
  async uploadMultiple(@Request() req: FastifyRequest) {
    const files = req.files(); // <-- plural, gets all files
    const buffers: Buffer[] = [];

    for await (const file of files) {
      const buffer = await file.toBuffer();
      buffers.push(buffer);
    }

    if (buffers.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    const results = await this.cloudinaryService.uploadMultiple(
      buffers,
      'enterprise_uploads',
    );

    return results;
  }

  @Delete('delete')
  async delete(@Body('public_id') publicId: string) {
    return await this.cloudinaryService.deleteFile(publicId);
  }
}
