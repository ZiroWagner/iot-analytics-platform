export class UserBuilder {
  private user = {
    id: 'usr_123',
    email: 'user@example.com',
    name: 'Test User',
    image: undefined as string | undefined,
    role: 'user' as 'user' | 'admin',
  }

  static aUser() {
    return new UserBuilder()
  }

  withEmail(email: string) {
    this.user.email = email
    return this
  }

  withName(name: string) {
    this.user.name = name
    return this
  }

  withAdminRole() {
    this.user.role = 'admin'
    return this
  }

  build() {
    return { ...this.user }
  }
}
