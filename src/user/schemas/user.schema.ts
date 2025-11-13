import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Exclude } from 'class-transformer';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      // @ts-expect-error" hide it becuase we got password type any error
      delete ret.password;
      // @ts-expect-error" hide it becuase we got password type any error
      delete ret.__v;
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  @Exclude()
  password: string;

  @Prop({ minLength: 4, maxLength: 20 })
  firstName: string;

  @Prop({ minLength: 4, maxLength: 20 })
  lastName: string;

  @Prop({ default: false })
  deleted: boolean;

  @Prop({ type: String })
  socketId?: string;

  @Prop({ default: false })
  online?: boolean;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// 🔹 Pre-save hook
UserSchema.pre<UserDocument>('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});
