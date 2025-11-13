import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/nest-auth',
  testUri:
    process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/nest-auth-test',
}));
