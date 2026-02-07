import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface';

@Injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  async create(token: Partial<RefreshToken>): Promise<RefreshToken> {
    const newToken = this.refreshTokenRepo.create(token);
    return await this.refreshTokenRepo.save(newToken);
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    return await this.refreshTokenRepo.findOne({
      where: { token },
      relations: ['user'],
    });
  }

  async deleteByToken(token: string): Promise<void> {
    await this.refreshTokenRepo.delete({ token });
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await this.refreshTokenRepo.delete({ userId });
  }

  async deleteExpired(): Promise<void> {
    await this.refreshTokenRepo.delete({
      expiresAt: LessThan(new Date()),
    });
  }
}
