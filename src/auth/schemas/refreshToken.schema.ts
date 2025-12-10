import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import type { ObjectId } from 'mongoose';

export type RefreshTokenDocument = RefreshToken & Document;

@Schema({ timestamps: true })
export class RefreshToken {
  @Prop({
    required: true,
    type: mongoose.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  })
  _id: ObjectId;

  @Prop({ required: true })
  token: string;

  @Prop({ required: true, ref: 'User', type: mongoose.Types.ObjectId })
  userId: ObjectId;

  @Prop({ required: true, type: Date })
  expiresAt: Date;

  @Prop({ default: true })
  isActive: boolean;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);
