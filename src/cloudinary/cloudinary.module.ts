import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { CloudinaryProvider } from './cloudinary.provider';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryController } from './cloudinary.controller';

@Module({
  imports: [ConfigModule],
  controllers: [CloudinaryController],
  providers: [CloudinaryProvider, CloudinaryService],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
