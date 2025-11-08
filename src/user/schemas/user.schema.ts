import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

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
  password: string;

  @Prop({ minLength: 4, maxLength: 20 })
  firstName: string;

  @Prop({ minLength: 4, maxLength: 20 })
  lastName: string;

  @Prop({ default: false })
  deleted: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Create index for email
UserSchema.index({ email: 1 }, { unique: true });
