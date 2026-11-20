import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Interceptor to transform all responses into a standardized format.
 * Wraps response data in { success, data, message } structure.
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data already has success property, return as is
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // If data has message property, extract it
        if (data && typeof data === 'object' && 'message' in data && Object.keys(data).length === 1) {
          return {
            success: true,
            data: null,
            message: data.message,
          };
        }

        // Standard transformation
        return {
          success: true,
          data,
        };
      }),
    );
  }
}
