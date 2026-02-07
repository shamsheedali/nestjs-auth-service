import { UnauthorizedException } from '@nestjs/common';

export class InvalidCredentialsException extends UnauthorizedException {
  constructor(message?: string) {
    super(message || 'Invalid email or password');
  }
}
