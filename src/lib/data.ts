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
  subject: string;
  mobileNumber: string;
  email?: string;
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

export type QuestionPaper = {
  id: string;
  class: string;
  subject: string;
  chapter: string;
  questionType: string;
  numberOfQuestions: number;
  timeLimit: string;
  totalMarks: number;
  generatedContent: string;
  generatedAt: string;
};

export type UserRole = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'teacher';
  permissions?: Record<string, boolean>;
  imageUrl?: string;
  imageHint?: string;
};


export const classNames = ["ষষ্ঠ", "সপ্তম", "অষ্টম", "নবম", "দশম"];
