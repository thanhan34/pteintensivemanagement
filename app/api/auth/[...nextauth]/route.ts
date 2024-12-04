import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { db } from '../../../config/firebase';
import { doc, getDoc, setDoc, Firestore } from 'firebase/firestore';
import { UserRole } from '../../../types/roles';

interface UserData {
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  lastLogin: string;
  provider?: string;
  providerAccountId?: string;
}

const ensureUserDocument = async (
  db: Firestore,
  userId: string,
  userData: UserData
): Promise<UserData | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        ...userData,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      });

      const verifyDoc = await getDoc(userRef);
      if (!verifyDoc.exists()) {
        return null;
      }
      
      return userData;
    } else {
      const existingData = userDoc.data() as UserData;
      
      await setDoc(userRef, {
        ...existingData,
        lastLogin: new Date().toISOString(),
      }, { merge: true });

      return existingData;
    }
  } catch (error) {
    console.error('Error in ensureUserDocument:', error);
    return null;
  }
};

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email || !profile?.sub) {
        return false;
      }

      try {
        const defaultRole: UserRole = 'trainer';
        const userData: UserData = {
          email: user.email,
          name: user.name || 'Unknown User',
          role: defaultRole,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          provider: account?.provider,
          providerAccountId: account?.providerAccountId,
        };

        const userDoc = await ensureUserDocument(db, profile.sub, userData);
        return !!userDoc;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false;
      }
    },

    async jwt({ token, account, user }) {
      if (account && user) {
        // Initial sign in
        const userRef = doc(db, 'users', token.sub as string);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserData;
          token.role = userData.role;
          token.name = userData.name;
          token.email = userData.email;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as UserRole;
        session.user.name = token.name as string || 'Unknown User';
        session.user.email = token.email as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
