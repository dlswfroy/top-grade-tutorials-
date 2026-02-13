'use client';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { TeacherPermissions } from '@/lib/data';

export const ALL_PERMISSIONS: Omit<TeacherPermissions, 'id'> = {
  canViewDashboard: true,
  canManageStudents: true,
  canManageTeachers: true,
  canManageAccounting: true,
  canManageAttendance: true,
  canGenerateQuestions: true,
  canManageSettings: true,
  canManagePermissions: true,
};

export const NO_PERMISSIONS: Omit<TeacherPermissions, 'id'> = {
    canViewDashboard: false,
    canManageStudents: false,
    canManageTeachers: false,
    canManageAccounting: false,
    canManageAttendance: false,
    canGenerateQuestions: false,
    canManageSettings: false,
    canManagePermissions: false,
};

export const DEFAULT_TEACHER_PERMISSIONS: Omit<TeacherPermissions, 'id'> = {
  canViewDashboard: true,
  canManageStudents: true,
  canManageTeachers: false,
  canManageAccounting: true,
  canManageAttendance: true,
  canGenerateQuestions: true,
  canManageSettings: false,
  canManagePermissions: false,
};


export function usePermissions() {
    const { user, isUserLoading: isUserHookLoading } = useUser();
    const firestore = useFirestore();

    const adminRoleRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'roles_admin', user.uid);
    }, [firestore, user]);
    const { data: adminRole, isLoading: isAdminLoading } = useDoc(adminRoleRef);

    const permissionsRef = useMemoFirebase(() => {
        if (!firestore || !user || adminRole) return null; // Don't fetch for admins
        return doc(firestore, 'teacher_permissions', user.uid);
    }, [firestore, user, adminRole]);
    const { data: permissions, isLoading: arePermissionsLoading } = useDoc<TeacherPermissions>(permissionsRef);
    
    const isLoading = isUserHookLoading || isAdminLoading || arePermissionsLoading;
    const isHeadTeacher = !!adminRole;

    if (isLoading) {
        return { permissions: null, isLoading: true, isHeadTeacher: false };
    }

    if (isHeadTeacher) {
        return { permissions: ALL_PERMISSIONS, isLoading: false, isHeadTeacher: true };
    }

    return { permissions, isLoading: false, isHeadTeacher: false };
}
