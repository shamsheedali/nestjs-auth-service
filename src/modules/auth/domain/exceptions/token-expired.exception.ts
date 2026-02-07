import { UnauthorizedException } from '@nestjs/common';

export class TokenExpiredException extends UnauthorizedException {
  constructor(tokenType: string = 'Token') {
    super(`${tokenType} has expired`);
  }
}
