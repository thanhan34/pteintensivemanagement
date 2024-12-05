import 'next-auth';
import { UserRole } from './roles';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      image?: string;
    }
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    image?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    provider?: string;
    providerAccountId?: string;
    role?: UserRole;
    email?: string;
    name?: string;
  }
}
