'use client';

import {
  User as FirebaseAuthUser,
  UserCredential,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '@/lib/firebase';

type User = {
  uid: string;
  email: string | null;
  name: string | null;
};

type LoginCredentials = {
  email: string;
  password: string;
};

type RegisterCredentials = LoginCredentials & {
  name: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<UserCredential>;
  logout: () => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<UserCredential>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseAuthUser | null) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = (credentials: LoginCredentials) => {
    return signInWithEmailAndPassword(auth, credentials.email, credentials.password);
  };

  const register = async (credentials: RegisterCredentials) => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      credentials.email,
      credentials.password
    );
    await updateProfile(userCredential.user, {
      displayName: credentials.name,
    });
    return userCredential;
  };

  const logout = () => {
    return firebaseSignOut(auth);
  };

  const value = { user, loading, login, logout, register };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
