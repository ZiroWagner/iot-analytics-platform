import { User } from '../../src/auth/domain/entities/user.entity';

export class UserBuilder {
  private props = {
    id: 'usr_123',
    email: 'test@example.com',
    password: 'hashed_password',
    name: 'Test User',
    image: undefined as string | undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  static aUser() {
    return new UserBuilder();
  }

  withEmail(email: string) {
    this.props.email = email;
    return this;
  }

  withName(name: string) {
    this.props.name = name;
    return this;
  }

  build(): User {
    return new (User as any)(...Object.values(this.props));
  }
}
