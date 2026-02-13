'use client';
import { usePermissions } from '@/hooks/usePermissions';
import { type TeacherPermissions } from '@/lib/data';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

type PermissionGuardProps = {
    children: React.ReactNode;
    requiredPermission: keyof Omit<TeacherPermissions, 'id'>;
};

export function PermissionGuard({ children, requiredPermission }: PermissionGuardProps) {
    const { permissions, isLoading } = usePermissions();

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">অনুমতি যাচাই করা হচ্ছে...</p>
            </div>
        );
    }
    
    if (!permissions || !permissions[requiredPermission]) {
        return (
             <Card className="border-destructive bg-red-50 dark:bg-red-900/20">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit">
                     <ShieldAlert className="h-10 w-10 text-destructive" />
                    </div>
                    <CardTitle className="text-destructive mt-4">প্রবেশাধিকার নেই</CardTitle>
                    <CardDescription className="text-destructive/80">এই পৃষ্ঠাটি দেখার জন্য আপনার অনুমতি নেই। অনুগ্রহ করে প্রধান শিক্ষকের সাথে যোগাযোগ করুন।</CardDescription>
                </CardHeader>
             </Card>
        );
    }

    return <>{children}</>;
}
