import { User } from '@/auth/domain/entities/user.entity';

export const USER_REPOSITORY_TOKEN = Symbol('UserRepositoryInterface');

export interface UserRepositoryInterface {
  findByEmail(email: string): Promise<User | null>;
  create(data: {
    email: string;
    password: string;
    name?: string;
  }): Promise<User>;
  findAccountByProvider(
    provider: string,
    providerAccountId: string,
  ): Promise<{ user: User } | null>;
  findOrCreateOAuthUser(data: {
    provider: string;
    providerAccountId: string;
    email: string | null;
    name: string | null;
    image: string | null;
    accessToken: string | null;
    refreshToken: string | null;
  }): Promise<User>;
  findById(id: string): Promise<User | null>;
  update(id: string, data: { name?: string; password?: string }): Promise<User>;
  delete(id: string): Promise<void>;
}
