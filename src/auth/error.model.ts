import { UnprocessableEntityException } from '@nestjs/common';

export const InvalidOTPException = new UnprocessableEntityException([
  {
    message: 'OTP is not valid',
    path: 'code',
  },
]);
