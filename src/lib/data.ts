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

export type Payment = {
  id: string;
  studentId: string;
  collectorName: string;
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
  spentByName: string;
}

export type Attendance = {
    id: string;
    studentId: string;
    classGrade: string;
    date: string; // YYYY-MM-DD
    status: 'present' | 'absent';
}

export const classNames = ["ষষ্ঠ", "সপ্তম", "অষ্টম", "নবম", "দশম"];
