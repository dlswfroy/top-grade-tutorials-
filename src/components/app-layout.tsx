'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarContent,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calculator,
  BrainCircuit,
  Settings,
  MoreVertical,
  LogOut,
  Loader2,
  CalendarCheck,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import Image from 'next/image';
import { useMemo } from 'react';

const menuItems = [
  { href: '/', label: 'ড্যাসবোর্ড', icon: LayoutDashboard },
  { href: '/students', label: 'শিক্ষার্থী', icon: Users },
  { href: '/teachers', label: 'শিক্ষক', icon: Briefcase },
  { href: '/accounting', label: 'হিসাব', icon: Calculator },
  { href: '/attendance', label: 'হাজিরা', icon: CalendarCheck },
  { href: '/questions', label: 'প্রশ্ন তৈরি', icon: BrainCircuit },
  { href: '/settings', label: 'সেটিংস', icon: Settings },
];

type InstitutionSettings = {
    institutionName?: string;
    logoUrl?: string;
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'institution_settings', 'default');
  }, [firestore, user]);

  const { data: settings, isLoading: isLoadingSettings } = useDoc<InstitutionSettings>(settingsRef);

  const institutionName = settings?.institutionName || 'টপ গ্রেড টিউটোরিয়ালস';
  const logoUrl = settings?.logoUrl;
  
  const shortInstitutionName = useMemo(() => {
    if (isLoadingSettings) return '';
    const nameParts = institutionName.split(' ');
    return nameParts.length > 1 ? nameParts.slice(0, 2).join(' ') : nameParts[0];
  }, [institutionName, isLoadingSettings]);


  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            {isLoadingSettings ? (
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            ) : logoUrl ? (
                <Image src={logoUrl} alt={institutionName} width={32} height={32} className="rounded-sm object-cover" />
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-primary">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                    <path d="M2 17l10 5 10-5"></path>
                    <path d="M2 12l10 5 10-5"></path>
                </svg>
            )}
            <h1 className="text-xl font-headline font-semibold">{isLoadingSettings ? 'Loading...' : institutionName}</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={{children: item.label, side: 'right', align: 'center'}}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-3 p-2">
            <Avatar>
              <AvatarImage src={user?.photoURL || undefined} />
              <AvatarFallback>{isUserLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (user ? 'A' : 'G')}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{isUserLoading ? 'Loading...' : (user ? 'Anonymous User' : 'Not Signed In')}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.uid}</p>
            </div>
            <Button variant="ghost" size="icon" className="shrink-0 group-data-[collapsible=icon]:hidden">
                <LogOut className="w-4 h-4"/>
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-2 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10 md:hidden">
            <Link href="/" className="flex items-center gap-2">
                {isLoadingSettings ? (
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                ) : logoUrl ? (
                    <Image src={logoUrl} alt={institutionName} width={24} height={24} className="rounded-sm object-cover" />
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-primary">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                      <path d="M2 17l10 5 10-5"></path>
                      <path d="M2 12l10 5 10-5"></path>
                    </svg>
                )}
                <h1 className="text-lg font-headline font-semibold">{shortInstitutionName}</h1>
            </Link>
            <SidebarTrigger>
                <MoreVertical />
            </SidebarTrigger>
        </header>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
