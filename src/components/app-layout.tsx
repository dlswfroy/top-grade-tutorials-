'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
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

const menuItems = [
  { href: '/', label: 'ড্যাসবোর্ড', icon: LayoutDashboard },
  { href: '/students', label: 'শিক্ষার্থী', icon: Users },
  { href: '/teachers', label: 'শিক্ষক', icon: GraduationCap },
  { href: '/accounting', label: 'হিসাব', icon: Calculator },
  { href: '/attendance', label: 'হাজিরা', icon: CalendarCheck },
  { href: '/settings', label: 'সেটিংস', icon: Settings },
];

type InstitutionSettings = {
    institutionName?: string;
    logoUrl?: string;
};

function Logo({ settings, isLoading, className, iconClassName }: { settings: InstitutionSettings | null, isLoading: boolean, className?: string, iconClassName?: string }) {
    const institutionName = settings?.institutionName || 'টপ গ্রেড টিউটোরিয়ালস';
    const logoUrl = settings?.logoUrl;

    return (
        <Link href="/" className={cn("flex items-center gap-3", className)}>
            {isLoading ? (
                <Loader2 className={cn("h-10 w-10 animate-spin", iconClassName || "text-inherit")} />
            ) : logoUrl ? (
                <div className="w-10 h-10 relative">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={logoUrl} alt={institutionName} className="object-cover" />
                        <AvatarFallback>{institutionName.charAt(0)}</AvatarFallback>
                    </Avatar>
                </div>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("w-10 h-10", iconClassName || "text-inherit")}>
                  <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                  <path d="M2 17l10 5 10-5"></path>
                  <path d="M2 12l10 5 10-5"></path>
                </svg>
            )}
            <h1 className="text-2xl font-headline font-bold text-inherit">{institutionName}</h1>
        </Link>
    );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser && pathname !== '/login') {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [auth, pathname, router]);

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'institution_settings', 'default');
  }, [firestore]);
  
  const { data: settings, isLoading: isLoadingSettings } = useDoc<InstitutionSettings>(settingsRef);
  
  const handleLogout = async () => {
    try {
        await signOut(auth);
        router.push('/login');
        toast({ title: 'লগ আউট', description: 'আপনি সফলভাবে লগ আউট করেছেন।' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'ত্রুটি', description: 'লগ আউট করতে সমস্যা হয়েছে।' });
    }
  };
  
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // While checking auth state, show a loader
  if (user === undefined) {
    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  // If user is not logged in, useEffect will redirect. Show loader in the meantime.
  if (!user) {
    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
      <div className="min-h-screen flex flex-col bg-muted/40">
          <header className="sticky top-0 z-40 w-full border-b border-primary-foreground/20 bg-primary text-primary-foreground">
              <div className="container flex h-16 items-center">
                  <div className="md:hidden mr-4">
                    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:bg-primary/90 focus:bg-primary/90">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Open Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                            <Logo settings={settings} isLoading={isLoadingSettings} className="mb-8 text-foreground" iconClassName="text-primary" />
                            <div className="flex flex-col space-y-2">
                                {menuItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 rounded-md p-3 text-lg font-medium",
                                            pathname === item.href ? "bg-accent text-accent-foreground" : "text-slate-700 dark:text-slate-300 hover:bg-accent/80 hover:text-slate-900 dark:hover:text-slate-100"
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
                     <Logo settings={settings} isLoading={isLoadingSettings} className="mr-6" iconClassName="text-inherit"/>
                      <nav className="flex items-center space-x-6 text-sm font-medium">
                          {menuItems.map((item) => (
                              <Link
                                  key={item.href}
                                  href={item.href}
                                  className={cn(
                                      "transition-colors",
                                      pathname === item.href ? "text-primary-foreground font-semibold" : "text-primary-foreground/80 hover:text-primary-foreground"
                                  )}
                              >
                                  {item.label}
                              </Link>
                          ))}
                      </nav>
                  </div>

                  <div className="flex flex-1 items-center justify-end space-x-4">
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-primary/90 focus-visible:ring-primary-foreground">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`} alt={user.displayName || 'User'} />
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
