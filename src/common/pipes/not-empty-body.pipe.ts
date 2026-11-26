import {
  BadRequestException,
  Injectable,
  type PipeTransform,
} from '@nestjs/common';
import { COMMON_ERROR_MESSAGES } from '../constants/error.messages.js';

@Injectable()
export class NotEmptyBodyPipe<T extends object> implements PipeTransform<T, T> {
  transform(value: T): T {
    if (Object.values(value).every((field) => field === undefined)) {
      throw new BadRequestException(COMMON_ERROR_MESSAGES.emptyBody);
    }
    return value;
  }
}
