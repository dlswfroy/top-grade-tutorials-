
'use client';

import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase/provider';
import { Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export interface AuthContextType {
  user: User | null;
  role: 'admin' | 'teacher' | null;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'admin' | 'teacher' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setRole(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [auth]);

  useEffect(() => {
    if (user) {
      const roleDocRef = doc(firestore, 'user_roles', user.uid);
      const unsubscribeRole = onSnapshot(roleDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setRole(docSnap.data().role);
        } else {
          setRole(null);
        }
        setIsLoading(false);
      }, () => {
        setRole(null);
        setIsLoading(false);
      });
      return () => unsubscribeRole();
    }
  }, [user, firestore]);
  
  useEffect(() => {
    // Auth guard logic
    if (!isLoading) {
      const isAuthPage = pathname === '/login';
      if (!user && !isAuthPage) {
        router.push('/login');
      }
      if (user && isAuthPage) {
        router.push('/');
      }
    }
  }, [user, isLoading, pathname, router]);

  const value = { user, role, isLoading };

  if (isLoading) {
     return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
     )
  }
  
  // Render children only when not loading and auth state is resolved
  // to prevent flicker or showing content to unauthenticated users.
  if (!user && pathname !== '/login') {
    return null;
  }
  
  if (user && pathname === '/login') {
    return null;
  }


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

