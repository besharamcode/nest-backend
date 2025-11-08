import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
  findHello(): string {
    return 'Hello Mohit!';
  }
}
