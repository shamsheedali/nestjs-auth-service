import { ForbiddenException } from '@nestjs/common';

export class EmailNotVerifiedException extends ForbiddenException {
  constructor() {
    super(
      'Email address is not verified. Please check your email for the verification link.',
    );
  }
}
