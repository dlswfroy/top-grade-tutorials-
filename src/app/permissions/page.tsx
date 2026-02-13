'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { type Teacher, type TeacherPermissions } from '@/lib/data';
import { Loader2, Save } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { PermissionGuard } from '@/components/permission-guard';
import { NO_PERMISSIONS } from '@/hooks/usePermissions';

const permissionLabels: Record<keyof Omit<TeacherPermissions, 'id'>, string> = {
    canViewDashboard: 'ড্যাসবোর্ড',
    canManageStudents: 'শিক্ষার্থী ম্যানেজ',
    canManageTeachers: 'শিক্ষক ম্যানেজ',
    canManageAccounting: 'হিসাবরক্ষণ',
    canManageAttendance: 'হাজিরা',
    canGenerateQuestions: 'প্রশ্ন তৈরি',
    canManageSettings: 'সেটিংস',
    canManagePermissions: 'অনুমতি ম্যানেজ',
};

function PermissionsPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    
    const teachersQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return collection(firestore, 'teachers');
    }, [firestore, user]);
    const { data: teachers, isLoading: isLoadingTeachers } = useCollection<Teacher>(teachersQuery);

    const permissionsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return collection(firestore, 'teacher_permissions');
    }, [firestore, user]);
    const { data: allPermissions, isLoading: isLoadingPermissions } = useCollection<TeacherPermissions>(permissionsQuery);

    const [permissionState, setPermissionState] = useState<Record<string, Omit<TeacherPermissions, 'id'>>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (teachers && allPermissions) {
            const initialState: Record<string, Omit<TeacherPermissions, 'id'>> = {};
            teachers.forEach(teacher => {
                const existingPerms = allPermissions.find(p => p.id === teacher.id);
                initialState[teacher.id] = existingPerms ? { ...existingPerms } : { ...NO_PERMISSIONS };
            });
            setPermissionState(initialState);
        }
    }, [teachers, allPermissions]);

    const handlePermissionChange = (teacherId: string, permissionKey: keyof Omit<TeacherPermissions, 'id'>, value: boolean) => {
        setPermissionState(prev => ({
            ...prev,
            [teacherId]: {
                ...prev[teacherId],
                [permissionKey]: value
            }
        }));
    };

    const handleSavePermissions = async () => {
        if (!firestore) return;
        setIsSaving(true);
        try {
            const batch = writeBatch(firestore);
            Object.entries(permissionState).forEach(([teacherId, permissions]) => {
                const docRef = doc(firestore, 'teacher_permissions', teacherId);
                batch.set(docRef, permissions);
            });
            await batch.commit();
            toast({ title: 'সফল', description: 'শিক্ষকদের অনুমতি সফলভাবে আপডেট করা হয়েছে।' });
        } catch (error: any) {
             toast({ variant: 'destructive', title: 'ত্রুটি', description: `অনুমতি সেভ করতে সমস্যা হয়েছে: ${error.message}` });
        } finally {
            setIsSaving(false);
        }
    };
    
    const isLoading = isLoadingTeachers || isLoadingPermissions;

    return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">অনুমতি ম্যানেজমেন্ট</h1>
        <p className="text-muted-foreground">
          কোন শিক্ষক অ্যাপের কোন অংশ ব্যবহার করতে পারবে তা নির্ধারণ করুন।
        </p>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>শিক্ষকদের অনুমতি</CardTitle>
            <CardDescription>প্রতিটি সেকশনের জন্য শিক্ষকদের প্রবেশাধিকার দিন বা বাতিল করুন।</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="min-w-[200px]">শিক্ষকের নাম</TableHead>
                            {Object.keys(permissionLabels).map(key => (
                                <TableHead key={key} className="text-center">{permissionLabels[key as keyof typeof permissionLabels]}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {teachers?.map(teacher => (
                            <TableRow key={teacher.id}>
                                <TableCell className="font-medium">{teacher.name}</TableCell>
                                {Object.keys(permissionLabels).map(key => {
                                    const pKey = key as keyof Omit<TeacherPermissions, 'id'>;
                                    return (
                                    <TableCell key={pKey} className="text-center">
                                        <Checkbox 
                                          checked={permissionState[teacher.id]?.[pKey] || false}
                                          onCheckedChange={(checked) => handlePermissionChange(teacher.id, pKey, !!checked)}
                                          id={`${teacher.id}-${pKey}`}
                                        />
                                    </TableCell>
                                )})}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            )}
        </CardContent>
        <CardFooter>
            <Button onClick={handleSavePermissions} disabled={isSaving || isLoading}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSaving ? 'সেভ হচ্ছে...' : 'পরিবর্তন সেভ করুন'}
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function PermissionsPageContainer() {
    return (
        <PermissionGuard requiredPermission="canManagePermissions">
            <PermissionsPage />
        </PermissionGuard>
    )
}
