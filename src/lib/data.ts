export type Student = {
  id: string;
  name: string;
  classGrade: string;
  rollNumber: string;
  fatherName: string;
  mobileNumber: string;
  monthlyFee: number;
  imageUrl?: string;
  imageHint?: string;
  dateAdded: string;
};

export type Teacher = {
  id: string;
  name: string;
  mobileNumber: string;
  imageUrl?: string;
  imageHint?: string;
  dateAdded: string;
};

export type Payment = {
  id: string;
  studentId: string;
  teacherId: string;
  amount: number;
  paymentDate: string;
  paymentMonth: string;
  receiptNumber: string;
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  expenseDate: string;
  spentByTeacherId: string;
}

export type Attendance = {
    id: string;
    studentId: string;
    classGrade: string;
    date: string; // YYYY-MM-DD
    status: 'present' | 'absent';
    recordedByTeacherId?: string;
}

export type TeacherPermissions = {
    id: string;
    canViewDashboard: boolean;
    canManageStudents: boolean;
    canManageTeachers: boolean;
    canManageAccounting: boolean;
    canManageAttendance: boolean;
    canGenerateQuestions: boolean;
    canManageSettings: boolean;
    canManagePermissions: boolean;
};


export const classNames = ["ষষ্ঠ", "সপ্তম", "অষ্টম", "নবম", "দশম"];
