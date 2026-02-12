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

export const classNames = ["ষষ্ঠ", "সপ্তম", "অষ্টম", "নবম", "দশম"];
