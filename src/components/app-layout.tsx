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
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const allMenuItems = [
  { href: '/', label: 'ড্যাসবোর্ড', icon: LayoutDashboard },
  { href: '/students', label: 'শিক্ষার্থী', icon: Users },
  { href: '/accounting', label: 'হিসাব', icon: Calculator },
  { href: '/attendance', label: 'হাজিরা', icon: CalendarCheck },
  { href: '/questions', label: 'প্রশ্ন তৈরি', icon: BrainCircuit },
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

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const firestore = useFirestore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'institution_settings', 'default');
  }, [firestore]);

  const { data: settings, isLoading: isLoadingSettings } = useDoc<InstitutionSettings>(settingsRef);

  return (
      <div className="min-h-screen flex flex-col">
          <header className="sticky top-0 z-40 w-full border-b bg-primary text-primary-foreground">
              <div className="container flex h-20 items-center">
                  <Logo settings={settings} isLoading={isLoadingSettings} className="ml-2 mr-6" iconClassName="text-primary-foreground"/>
                  
                  <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
                      {allMenuItems.map((item) => (
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

                  <div className="flex flex-1 items-center justify-end space-x-2">
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
                                  {allMenuItems.map((item) => (
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
