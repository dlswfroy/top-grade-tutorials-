'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  Calculator,
  Settings,
  Loader2,
  CalendarCheck,
  Menu,
  GraduationCap,
  LogOut,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useFirestore, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';
import { signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import type { UserRole } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const menuItems = [
  { href: '/', label: 'ড্যাসবোর্ড', icon: LayoutDashboard, key: 'dashboard' },
  { href: '/students', label: 'শিক্ষার্থী', icon: Users, key: 'students' },
  { href: '/teachers', label: 'শিক্ষক', icon: GraduationCap, key: 'teachers' },
  { href: '/accounting', label: 'হিসাব', icon: Calculator, key: 'accounting' },
  { href: '/attendance', label: 'হাজিরা', icon: CalendarCheck, key: 'attendance' },
  { href: '/settings', label: 'সেটিংস', icon: Settings, key: 'settings' },
];

const menuItemStyles: { [key: string]: string } = {
    dashboard: 'border-yellow-300 text-yellow-300',
    students: 'border-orange-400 text-orange-400',
    teachers: 'border-cyan-300 text-cyan-300',
    accounting: 'border-teal-300 text-teal-300',
    attendance: 'border-lime-300 text-lime-300',
    settings: 'border-green-400 text-green-400',
};


type InstitutionSettings = {
    institutionName?: string;
    logoUrl?: string;
};

function Logo({ settings, isLoading }: { settings: InstitutionSettings | null, isLoading: boolean }) {
    const institutionName = settings?.institutionName || 'টপ গ্রেড টিউটোরিয়ালস';
    const logoFromPlaceholders = PlaceHolderImages.find(p => p.id === 'logo-placeholder');
    const logoUrl = settings?.logoUrl || logoFromPlaceholders?.imageUrl;

    return (
        <Link href="/" className="flex items-center gap-4">
            {isLoading ? (
                <Loader2 className="h-16 w-16 animate-spin text-white" />
            ) : (
                <Avatar className="h-16 w-16 bg-white">
                    <AvatarImage src={logoUrl} alt={institutionName} className="object-contain p-1" />
                    <AvatarFallback>{institutionName.slice(0, 2)}</AvatarFallback>
                </Avatar>
            )}
            <h1 className="text-3xl font-headline font-bold text-yellow-300 [text-shadow:1px_1px_1px_#8B4513] whitespace-nowrap">{institutionName}</h1>
        </Link>
    );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (!isLoadingAuth && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [isLoadingAuth, user, pathname, router]);

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'institution_settings', 'default');
  }, [firestore]);
  
  const { data: settings, isLoading: isLoadingSettings } = useDoc<InstitutionSettings>(settingsRef);
  
  const userRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'user_roles', user.uid);
  }, [firestore, user]);
  const { data: userRole } = useDoc<UserRole>(userRoleRef);
  
  const handleLogout = async () => {
    try {
        await signOut(auth);
        router.push('/login');
        toast({ title: 'লগ আউট', description: 'আপনি সফলভাবে লগ আউট করেছেন।' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'ত্রুটি', description: 'লগ আউট করতে সমস্যা হয়েছে।' });
    }
  };

  const visibleMenuItems = useMemo(() => {
    if (!userRole) return [];
    if (userRole.role === 'admin') {
      return menuItems;
    }
    if (userRole.role === 'teacher') {
      if (userRole.permissions) {
        return menuItems.filter(item => userRole.permissions![item.key]);
      }
      // Default permissions for teacher if not set
      return menuItems.filter(item => item.key !== 'settings');
    }
    return [];
  }, [userRole]);
  
  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (isLoadingAuth || !user) {
    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
      <div className="min-h-screen flex flex-col bg-muted/40">
          <header className="sticky top-0 z-40 w-full bg-[#1A73E8] text-white shadow-lg border-b-2 border-black/30">
              <div className="flex h-20 items-center justify-between px-4">
                  <div className="flex items-center gap-6">
                    <Logo settings={settings} isLoading={isLoadingSettings} />
                  </div>
                  
                  <nav className="hidden lg:flex items-center space-x-2">
                        {visibleMenuItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-2 justify-center rounded-lg px-3 py-1.5 text-sm font-bold transition-colors border-2",
                                    pathname === item.href 
                                        ? "border-red-500 text-red-500 bg-white/20" 
                                        : `${menuItemStyles[item.key]} hover:bg-white/10`
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </nav>

                  <div className="flex items-center justify-end gap-4">
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-14 w-14 rounded-full p-0 focus-visible:ring-white">
                                    <Avatar className="h-14 w-14 ring-2 ring-offset-2 ring-red-500 ring-offset-[#1A73E8]">
                                        <AvatarImage src={userRole?.imageUrl || user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`} alt={user.displayName || 'User'} />
                                        <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user.displayName}</p>
                                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>লগ আউট</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button asChild variant="secondary">
                            <Link href="/login">লগইন করুন</Link>
                        </Button>
                    )}
                    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:bg-white/10 focus:bg-white/10 lg:hidden">
                                <Menu className="h-6 w-6" />
                                <span className="sr-only">Open Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[240px] bg-[#1A73E8] text-white border-r-0 p-0">
                             <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
                            <div className="p-4 border-b border-white/20">
                                <Logo settings={settings} isLoading={isLoadingSettings} />
                            </div>
                            <nav className="flex flex-col space-y-1 p-4">
                                {visibleMenuItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 rounded-md p-3 text-lg font-medium transition-colors",
                                            pathname === item.href ? "bg-white/20 text-yellow-300" : "text-white",
                                            "hover:bg-white/10"
                                        )}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        <span>{item.label}</span>
                                    </Link>
                                ))}
                            </nav>
                        </SheetContent>
                    </Sheet>
                  </div>
              </div>
          </header>
          <main className="flex-1 container py-8">
              {children}
          </main>
      </div>
  );
}
