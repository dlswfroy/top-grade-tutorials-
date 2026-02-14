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
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
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

type InstitutionSettings = {
    institutionName?: string;
    logoUrl?: string;
};

const navLinkColors: Record<string, string> = {
  dashboard: 'border-yellow-400 text-yellow-300',
  students: 'border-orange-400 text-orange-300',
  teachers: 'border-slate-200 text-slate-100',
  accounting: 'border-green-400 text-green-300',
  attendance: 'border-red-500 text-red-400',
  settings: 'border-yellow-400 text-yellow-300',
};

const activeNavLinkClasses: Record<string, string> = {
    dashboard: 'bg-yellow-400/30',
    students: 'bg-orange-400/30',
    teachers: 'bg-slate-200/30',
    accounting: 'bg-green-400/30',
    attendance: 'bg-red-500/30',
    settings: 'bg-yellow-400/30',
};

function Logo({ settings, isLoading, className, iconClassName, titleClassName }: { settings: InstitutionSettings | null, isLoading: boolean, className?: string, iconClassName?: string, titleClassName?: string }) {
    const institutionName = settings?.institutionName || 'টপ গ্রেড টিউটোরিয়ালস';
    const logoFromPlaceholders = PlaceHolderImages.find(p => p.id === 'logo-placeholder');
    const logoUrl = settings?.logoUrl || logoFromPlaceholders?.imageUrl;

    return (
        <Link href="/" className={cn("flex items-center gap-4", className)}>
            <div className="p-1 bg-white rounded-full shadow-md">
            {isLoading ? (
                <Loader2 className={cn("h-16 w-16 animate-spin", iconClassName || "text-primary")} />
            ) : (
                <Avatar className="h-16 w-16">
                    <AvatarImage src={logoUrl} alt={institutionName} className="object-cover" />
                    <AvatarFallback>{institutionName.slice(0, 2)}</AvatarFallback>
                </Avatar>
            )}
            </div>
            <div>
              <h1 className={cn("text-3xl font-headline font-bold fancy-title", titleClassName)}>{institutionName}</h1>
              <p className="text-red-500 font-mono tracking-[0.2em] -mt-1">---- ---- ----</p>
            </div>
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

  // While checking auth state, or if we need to redirect, show a loader.
  if (isLoadingAuth || !user) {
    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
      <div className="min-h-screen flex flex-col bg-muted/40">
          <header className="sticky top-0 z-40 w-full bg-primary text-primary-foreground shadow-lg">
              <div className="container mx-auto flex h-24 items-center">
                  <div className="md:hidden mr-4">
                    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:bg-primary/90 focus:bg-primary/90">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Open Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                            <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
                            <Logo settings={settings} isLoading={isLoadingSettings} className="mb-8 ml-4" iconClassName="text-primary h-16 w-16" titleClassName="text-slate-900 dark:text-slate-100 text-3xl fancy-title" />
                            <div className="flex flex-col space-y-2 px-4">
                                {visibleMenuItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 rounded-md p-3 text-lg font-medium transition-colors border-2",
                                            navLinkColors[item.key] || 'border-transparent',
                                            pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                        )}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        <span>{item.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </SheetContent>
                    </Sheet>
                  </div>
                  
                  <div className="hidden md:flex items-center">
                     <Logo settings={settings} isLoading={isLoadingSettings} className="mr-6"/>
                  </div>

                  <nav className="hidden md:flex flex-1 items-center justify-center space-x-1 lg:space-x-2 text-sm font-medium">
                      {visibleMenuItems.map((item) => (
                          <Link
                              key={item.href}
                              href={item.href}
                              className={cn(
                                  "flex h-10 items-center justify-center rounded-lg border-2 bg-black/10 px-3 py-1.5 font-bold transition-colors",
                                  navLinkColors[item.key],
                                  pathname === item.href ? (activeNavLinkClasses[item.key] + ' ring-1 ring-white') : "hover:bg-white/10"
                              )}
                          >
                              {item.label}
                          </Link>
                      ))}
                  </nav>

                  <div className="flex items-center justify-end space-x-4">
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-14 w-14 rounded-full hover:bg-primary/90 focus-visible:ring-primary-foreground ring-2 ring-red-500 ring-offset-2 ring-offset-primary">
                                    <Avatar className="h-12 w-12">
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
                  </div>
              </div>
          </header>
          <main className="flex-1 container py-8">
              {children}
          </main>
      </div>
  );
}
