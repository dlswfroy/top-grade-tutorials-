
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
  LogOut
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const menuItems = [
  { href: '/', label: 'ড্যাসবোর্ড', icon: LayoutDashboard },
  { href: '/students', label: 'শিক্ষার্থী', icon: Users },
  { href: '/teachers', label: 'শিক্ষক', icon: Briefcase },
  { href: '/accounting', label: 'হিসাব', icon: Calculator },
  { href: '/questions', label: 'প্রশ্ন তৈরি', icon: BrainCircuit },
  { href: '/settings', label: 'সেটিংস', icon: Settings },
];

const adminAvatar = PlaceHolderImages.find(p => p.id === 'admin-avatar');

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-primary">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
            <h1 className="text-xl font-headline font-semibold">টপ গ্রেড টিউটোরিয়ালস</h1>
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
              <AvatarImage src={adminAvatar?.imageUrl} data-ai-hint={adminAvatar?.imageHint} />
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">Admin User</p>
                <p className="text-xs text-muted-foreground truncate">admin@topgrade.com</p>
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
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-primary">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                  <path d="M2 17l10 5 10-5"></path>
                  <path d="M2 12l10 5 10-5"></path>
                </svg>
                <h1 className="text-lg font-headline font-semibold">টপ গ্রেড</h1>
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
