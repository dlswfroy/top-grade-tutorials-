import { z } from 'zod';

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

// Input schema for the question generation flow
export const GenerateQuestionPaperInputSchema = z.object({
  class: z.string().nonempty({ message: 'শ্রেণি নির্বাচন করুন।' }),
  subject: z.string().nonempty({ message: 'বিষয় দিন।' }),
  chapter: z.string().nonempty({ message: 'অধ্যায় দিন।' }),
  questionType: z.string().nonempty({ message: 'প্রশ্নের ধরন নির্বাচন করুন।' }),
  numberOfQuestions: z.coerce.number().min(1, { message: 'কমপক্ষে ১টি প্রশ্ন দিন।' }),
  timeLimit: z.string().nonempty({ message: 'সময় নির্ধারণ করুন।' }),
  totalMarks: z.coerce.number().min(1, { message: 'কমপক্ষে ১ নম্বর দিন।' }),
});
export type GenerateQuestionPaperInput = z.infer<typeof GenerateQuestionPaperInputSchema>;
