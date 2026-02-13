'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  Calculator,
  BrainCircuit,
  Settings,
  Loader2,
  CalendarCheck,
  Menu,
  LogOut,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useFirestore, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';
import { signOut } from 'firebase/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


const allMenuItems = [
  { href: '/', label: 'ড্যাসবোর্ড', icon: LayoutDashboard, requiredRole: ['admin', 'teacher'] },
  { href: '/students', label: 'শিক্ষার্থী', icon: Users, requiredRole: ['admin', 'teacher'] },
  { href: '/accounting', label: 'হিসাব', icon: Calculator, requiredRole: ['admin', 'teacher'] },
  { href: '/attendance', label: 'হাজিরা', icon: CalendarCheck, requiredRole: ['admin', 'teacher'] },
  { href: '/questions', label: 'প্রশ্ন তৈরি', icon: BrainCircuit, requiredRole: ['admin', 'teacher'] },
  { href: '/settings', label: 'সেটিংস', icon: Settings, requiredRole: ['admin'] },
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
                <Loader2 className={cn("h-10 w-10 animate-spin", iconClassName || "text-primary")} />
            ) : logoUrl ? (
                <div className="w-10 h-10 relative">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={logoUrl} alt={institutionName} className="object-cover" />
                        <AvatarFallback>{institutionName.charAt(0)}</AvatarFallback>
                    </Avatar>
                </div>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("w-10 h-10", iconClassName || "text-primary")}>
                  <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                  <path d="M2 17l10 5 10-5"></path>
                  <path d="M2 12l10 5 10-5"></path>
                </svg>
            )}
            <h1 className="text-2xl font-headline font-bold">{institutionName}</h1>
        </Link>
    );
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, role } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = useMemo(() => {
    if (!role) return [];
    return allMenuItems.filter(item => item.requiredRole.includes(role));
  }, [role]);

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'institution_settings', 'default');
  }, [firestore]);

  const { data: settings, isLoading: isLoadingSettings } = useDoc<InstitutionSettings>(settingsRef);
  
  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
      <div className="min-h-screen flex flex-col">
          <header className="sticky top-0 z-40 w-full border-b bg-primary text-primary-foreground">
              <div className="container flex h-20 items-center">
                  <Logo settings={settings} isLoading={isLoadingSettings} className="ml-2 mr-6" iconClassName="text-primary-foreground"/>
                  
                  <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
                      {menuItems.map((item) => (
                          <Link
                              key={item.href}
                              href={item.href}
                              className={cn(
                                  "transition-colors",
                                  pathname === item.href ? "text-primary-foreground font-semibold" : "text-primary-foreground/70 hover:text-primary-foreground"
                              )}
                          >
                              {item.label}
                          </Link>
                      ))}
                  </nav>

                  <div className="flex flex-1 items-center justify-end space-x-4">
                      {user && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                               <Avatar className="h-10 w-10">
                                <AvatarImage src={user.photoURL || `https://avatar.vercel.sh/${user.uid}.png`} alt={user.displayName || 'User'} />
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
                      )}
                      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                          <SheetTrigger asChild>
                              <Button variant="ghost" size="icon" className="md:hidden">
                                  <Menu className="h-5 w-5" />
                                  <span className="sr-only">Open Menu</span>
                              </Button>
                          </SheetTrigger>
                          <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                              <Logo settings={settings} isLoading={isLoadingSettings} className="mb-8" />
                              <div className="flex flex-col space-y-2">
                                  {menuItems.map((item) => (
                                      <Link
                                          key={item.href}
                                          href={item.href}
                                          onClick={() => setMobileMenuOpen(false)}
                                          className={cn(
                                              "flex items-center gap-3 rounded-md p-3 text-lg font-medium",
                                              pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/80"
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
              </div>
          </header>
          <main className="flex-1 container p-4 sm:p-6 lg:p-8">
              {children}
          </main>
      </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // If we are on the login page, don't render the main app layout.
  // This prevents trying to fetch app-wide data like settings before a user is authenticated.
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // For all other pages, render the full authenticated layout.
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
