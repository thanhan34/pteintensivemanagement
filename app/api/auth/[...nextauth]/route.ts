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
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('SignIn Callback - User:', user.email);
      console.log('SignIn Callback - Account:', account?.provider);
      console.log('SignIn Callback - Profile:', profile?.sub);

      if (!user.email || !profile?.sub) {
        console.error('Missing required user data:', { email: user.email, sub: profile?.sub });
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
        if (!userDoc) {
          console.error('Failed to create/update user document');
          return false;
        }
        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false;
      }
    },

    async jwt({ token, account, user }) {
      try {
        if (account && user) {
          console.log('JWT Callback - Creating new token');
          const userRef = doc(db, 'users', token.sub as string);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserData;
            token.role = userData.role;
            token.name = userData.name;
            token.email = userData.email;
          } else {
            console.error('User document not found in jwt callback');
          }
        }
        return token;
      } catch (error) {
        console.error('Error in jwt callback:', error);
        return token;
      }
    },

    async session({ session, token }) {
      try {
        if (session?.user) {
          session.user.id = token.sub as string;
          session.user.role = token.role as UserRole;
          session.user.name = token.name as string || 'Unknown User';
          session.user.email = token.email as string;
        }
        return session;
      } catch (error) {
        console.error('Error in session callback:', error);
        return session;
      }
    },

    async redirect({ url, baseUrl }) {
      console.log('Redirect Callback - URL:', url);
      console.log('Redirect Callback - Base URL:', baseUrl);
      
      // If the url starts with the base url or is a relative url, allow it
      if (url.startsWith(baseUrl) || url.startsWith('/')) {
        // If it's a relative URL, make it absolute
        if (url.startsWith('/')) {
          return `${baseUrl}${url}`;
        }
        return url;
      }
      // Default to the attendance page
      return `${baseUrl}/attendance`;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: true,
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
