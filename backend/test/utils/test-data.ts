export const testData = {
  uuid: (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },

  email: (): string => {
    const domains = ['example.com', 'test.com', 'demo.com', 'mail.com'];
    const prefix = Math.random().toString(36).substring(2, 10);
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `${prefix}@${domain}`;
  },

  name: (): string => {
    const firstNames = [
      'John',
      'Jane',
      'Alex',
      'Maria',
      'Carlos',
      'Laura',
      'Pedro',
      'Ana',
    ];
    const lastNames = [
      'Smith',
      'Johnson',
      'Williams',
      'Brown',
      'Jones',
      'Garcia',
      'Miller',
      'Davis',
    ];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${firstName} ${lastName}`;
  },

  firstName: (): string => {
    const firstNames = [
      'John',
      'Jane',
      'Alex',
      'Maria',
      'Carlos',
      'Laura',
      'Pedro',
      'Ana',
      'Michael',
      'Sarah',
    ];
    return firstNames[Math.floor(Math.random() * firstNames.length)];
  },

  lastName: (): string => {
    const lastNames = [
      'Smith',
      'Johnson',
      'Williams',
      'Brown',
      'Jones',
      'Garcia',
      'Miller',
      'Davis',
      'Wilson',
      'Moore',
    ];
    return lastNames[Math.floor(Math.random() * lastNames.length)];
  },

  password: (length: number = 10): string => {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  alpha: (length: number = 10): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  alphanumeric: (length: number = 10): string => {
    const chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  url: (): string => {
    const protocols = ['http', 'https'];
    const domains = [
      'example.com',
      'test.com',
      'demo.org',
      'app.io',
      'localhost',
    ];
    const protocol = protocols[Math.floor(Math.random() * protocols.length)];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const path = Math.random().toString(36).substring(2, 8);
    return `${protocol}://${domain}/${path}`;
  },

  avatar: (): string => {
    const id = Math.floor(Math.random() * 1000);
    return `https://i.pravatar.cc/150?img=${id}`;
  },

  username: (): string => {
    const prefixes = ['user', 'dev', 'test', 'admin', 'guest'];
    const suffix = Math.floor(Math.random() * 10000);
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    return `${prefix}${suffix}`;
  },
};
