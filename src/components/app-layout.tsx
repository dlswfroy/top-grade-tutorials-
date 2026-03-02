
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
  LogOut,
  UserCircle,
  Search,
  MessageSquare,
  CreditCard,
  ArrowLeft,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useFirestore, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { doc, collection, getDocs } from 'firebase/firestore';
import { signOut, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
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
import type { UserRole, Student } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const menuItems = [
  { href: '/', label: 'ড্যাসবোর্ড', icon: LayoutDashboard, key: 'dashboard' },
  { href: '/students', label: 'শিক্ষার্থী', icon: Users, key: 'students' },
  { href: '/student-profile', label: 'শিক্ষার্থী প্রোফাইল', icon: UserCircle, key: 'studentProfile' },
  { href: '/teachers', label: 'শিক্ষক', icon: UserCircle, key: 'teachers' },
  { href: '/accounting', label: 'হিসাব', icon: Calculator, key: 'accounting' },
  { href: '/attendance', label: 'হাজিরা', icon: CalendarCheck, key: 'attendance' },
  { href: '/messaging', label: 'মেসেজ ও যোগাযোগ', icon: MessageSquare, key: 'messaging' },
  { href: '/settings', label: 'সেটিংস', icon: Settings, key: 'settings' },
];

const menuItemStyles: { [key: string]: string } = {
    dashboard: 'border-yellow-300 text-yellow-300',
    students: 'border-orange-400 text-orange-400',
    studentProfile: 'border-pink-400 text-pink-400',
    teachers: 'border-cyan-300 text-cyan-300',
    accounting: 'border-teal-300 text-teal-300',
    attendance: 'border-lime-300 text-teal-200',
    messaging: 'border-purple-300 text-purple-300',
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
        <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0 max-w-[75%] sm:max-w-none">
            {isLoading ? (
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-white" />
            ) : (
                <Avatar className="h-7 w-7 sm:h-12 sm:w-12 bg-white border-2 border-white/20 shrink-0">
                    <AvatarImage src={logoUrl} alt={institutionName} className="object-contain p-1" />
                    <AvatarFallback>{institutionName.slice(0, 2)}</AvatarFallback>
                </Avatar>
            )}
            <span className="text-[1.35rem] sm:text-[3.8rem] font-headline font-black text-white whitespace-nowrap overflow-visible drop-shadow-md inline-block transform scale-x-[1.15] origin-left leading-[0.75] pt-1.5 truncate sm:overflow-visible">
                {institutionName}
            </span>
        </Link>
    );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);

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
        toast({ variant: 'destructive', title: 'ত্রুটি', description: 'লগ আউট করতে সমস্যা হয়েছে। ' });
    }
  };

  const handleGlobalSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const queryStr = searchQuery.trim().toLowerCase();
    if (!queryStr || !firestore) return;

    setIsSearching(true);
    setSearchResults([]);
    try {
        const snap = await getDocs(collection(firestore, 'students'));
        
        const results = snap.docs
            .map(d => ({ id: d.id, ...d.data() } as Student))
            .filter(s => {
                const sRoll = s.rollNumber.toString().trim();
                const queryClean = queryStr.replace(/^0+/, '') || '0';
                const sRollClean = sRoll.replace(/^0+/, '') || '0';
                
                const queryIsDigit = /^\d+$/.test(queryStr);
                if (queryIsDigit) {
                    return sRollClean === queryClean; // Exact match for numbers
                }
                return s.name.toLowerCase().includes(queryStr);
            });
        
        setSearchResults(results);
        setIsSearchDialogOpen(true);
    } catch (err) {
        toast({ variant: 'destructive', title: 'ত্রুটি', description: 'সার্চ করতে সমস্যা হয়েছে। ' });
    } finally {
        setIsSearching(false);
    }
  };

  const visibleMenuItems = useMemo(() => {
    if (!userRole) return [];
    if (userRole.role === 'admin') {
      return menuItems;
    }
    if (userRole.role === 'teacher') {
      if (userRole.permissions) {
        return menuItems.filter(item => userRole.permissions![item.key] || item.key === 'studentProfile');
      }
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
              <div className="flex h-14 sm:h-20 items-center justify-between px-3 sm:px-4 gap-2 border-b border-white/10">
                  <Logo settings={settings} isLoading={isLoadingSettings} />
                  
                  <div className="flex items-center justify-end gap-2 shrink-0">
                    {user && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 sm:h-12 sm:w-12 rounded-full p-0">
                                    <Avatar className="h-8 w-8 sm:h-12 sm:w-12 border-2 border-white/50">
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
                    )}
                    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="xl:hidden text-white h-8 w-8">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[300px] bg-[#1A73E8] text-white border-r-0 p-0">
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
                                            pathname === item.href ? "bg-white/20 text-white" : "text-white/80 hover:text-white hover:bg-white/10"
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

          <main className="flex-1 container py-8 pb-24 relative">
              {children}
          </main>

          <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#1A73E8] text-white border-t-2 border-black/30 py-1.5 sm:py-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
              <div className="container px-3 sm:px-4 flex items-center gap-2 sm:gap-4">
                  {/* Permanent Back Button */}
                  <Button 
                      variant="ghost" 
                      size="sm" 
                      className="bg-white/10 border border-white/20 text-white hover:bg-white/20 h-8 sm:h-9 px-2 sm:px-4 text-[10px] sm:text-xs font-bold shrink-0 shadow-sm"
                      onClick={() => router.back()}
                  >
                      <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      ফিরে যান
                  </Button>

                  {/* Scrolling Menu Links */}
                  <nav className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto scrollbar-hide flex-1 py-1">
                    {visibleMenuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-1.5 sm:gap-2 rounded-lg px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold transition-colors border-2 whitespace-nowrap",
                                pathname === item.href 
                                    ? "border-white bg-white/20 text-white" 
                                    : `${menuItemStyles[item.key] || 'border-white/20 text-white'} hover:bg-white/10`
                            )}
                        >
                            <item.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>{item.label}</span>
                        </Link>
                    ))}
                  </nav>

                  {/* Search Bar */}
                  <form onSubmit={handleGlobalSearch} className="relative w-28 sm:w-48 md:w-64 shrink-0">
                      <Search className="absolute left-2.5 top-2 h-3 w-3 text-white/60" />
                      <Input 
                        placeholder="খুঁজুন..." 
                        className="pl-8 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus-visible:ring-white h-7 text-[10px] sm:text-xs rounded-full w-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                  </form>
              </div>
          </div>

          <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
              <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                      <DialogTitle>শিক্ষার্থী অনুসন্ধান</DialogTitle>
                      <DialogDescription>
                          নাম বা রোল দিয়ে শিক্ষার্থী খুঁজে দ্রুত অপশনে যান।
                      </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input 
                            placeholder="সার্চ করুন (যেমন: ১ বা নাম)..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleGlobalSearch()}
                        />
                        <Button size="icon" onClick={() => handleGlobalSearch()} disabled={isSearching}>
                            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </Button>
                      </div>

                      <div className="max-h-80 overflow-y-auto space-y-2">
                          {searchResults.length > 0 ? (
                              searchResults.map(student => (
                                  <div key={student.id} className="p-3 border rounded-lg flex items-center justify-between group hover:bg-slate-50 transition-colors">
                                      <div className="flex items-center gap-3">
                                          <Avatar className="h-10 w-10">
                                              <AvatarImage src={student.imageUrl} />
                                              <AvatarFallback>{student.name[0]}</AvatarFallback>
                                          </Avatar>
                                          <div>
                                              <p className="font-bold text-sm">{student.name}</p>
                                              <p className="text-xs text-muted-foreground">রোল: {student.rollNumber} | শ্রেণি: {student.classGrade}</p>
                                          </div>
                                      </div>
                                      <div className="flex gap-1">
                                          <Button size="icon" variant="ghost" className="h-8 w-8 text-pink-600" title="প্রোফাইল" asChild onClick={() => setIsSearchDialogOpen(false)}>
                                              <Link href={`/student-profile?class=${encodeURIComponent(student.classGrade)}&roll=${student.rollNumber}`}>
                                                  <UserCircle className="h-4 w-4" />
                                              </Link>
                                          </Button>
                                          <Button size="icon" variant="ghost" className="h-8 w-8 text-teal-600" title="বেতন আদায়" asChild onClick={() => setIsSearchDialogOpen(false)}>
                                              <Link href="/accounting">
                                                  <CreditCard className="h-4 w-4" />
                                              </Link>
                                          </Button>
                                          <Button size="icon" variant="ghost" className="h-8 w-8 text-lime-600" title="হাজিরা" asChild onClick={() => setIsSearchDialogOpen(false)}>
                                              <Link href="/attendance">
                                                  <CalendarCheck className="h-4 w-4" />
                                              </Link>
                                          </Button>
                                      </div>
                                  </div>
                              ))
                          ) : searchQuery && !isSearching ? (
                              <p className="text-center text-sm text-muted-foreground py-4">কোনো শিক্ষার্থী পাওয়া যায়নি।</p>
                          ) : null}
                      </div>
                  </div>
              </DialogContent>
          </Dialog>
      </div>
  );
}
