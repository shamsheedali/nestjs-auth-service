import { BadRequestException } from '@nestjs/common';

export class InvalidTokenException extends BadRequestException {
  constructor(tokenType: string = 'Token') {
    super(`${tokenType} is invalid or has already been used`);
  }
}
