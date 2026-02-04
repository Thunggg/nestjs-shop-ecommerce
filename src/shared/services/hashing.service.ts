import { Injectable } from '@nestjs/common'
import * as bcrypt from 'bcrypt'

@Injectable()
export class HashingService {
  private readonly SALT_ROUNDS = 10

  hash(value) {
    return bcrypt.hash(value, this.SALT_ROUNDS)
  }

  verify(value, hashValue) {
    return bcrypt.compare(value, hashValue)
  }
}
