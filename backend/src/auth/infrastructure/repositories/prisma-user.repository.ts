import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { User } from '../../domain/entities/user.entity';
import * as bcrypt from 'bcrypt';
import type { UserRepositoryInterface } from '../../domain/repositories/user.repository.interface';

const BCRYPT_SALT_ROUNDS = 10;

@Injectable()
export class PrismaUserRepository implements UserRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user ? this.mapToDomain(user) : null;
  }

  async create(data: { email: string; password: string; name?: string }): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
      },
    });
    return this.mapToDomain(user);
  }

  async findAccountByProvider(provider: string, providerAccountId: string): Promise<{ user: User } | null> {
    const account = await this.prisma.account.findUnique({
      where: {
        provider_providerAccountId: { provider, providerAccountId },
      },
      include: { user: true },
    });
    if (!account) return null;
    return { user: this.mapToDomain(account.user) };
  }

  async findOrCreateOAuthUser(data: {
    provider: string;
    providerAccountId: string;
    email: string | null;
    name: string | null;
    image: string | null;
    accessToken: string | null;
    refreshToken: string | null;
  }): Promise<User> {
    // Check if account already exists
    const existing = await this.findAccountByProvider(data.provider, data.providerAccountId);
    if (existing) return existing.user;

    // Find or create user by email
    let user = data.email
      ? await this.prisma.user.findUnique({ where: { email: data.email } })
      : null;

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: data.email || '',
          name: data.name || undefined,
          image: data.image || undefined,
        },
      });
    }

    // Link OAuth account
    await this.prisma.account.create({
      data: {
        userId: user.id,
        type: 'oauth',
        provider: data.provider,
        providerAccountId: data.providerAccountId,
        access_token: data.accessToken || undefined,
        refresh_token: data.refreshToken || undefined,
      },
    });

    return this.mapToDomain(user);
  }

  private mapToDomain(prismaModel: any): User {
    return User.create({
      id: prismaModel.id,
      email: prismaModel.email,
      name: prismaModel.name,
      password: prismaModel.password,
      image: prismaModel.image,
    });
  }
}
