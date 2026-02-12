export type Student = {
  id: number;
  roll: number;
  name: string;
  class: string;
  fatherName: string;
  mobile: string;
  monthlyFee: number;
  image: string;
  imageHint: string;
};

export type Teacher = {
  id: number;
  name: string;
  mobile: string;
  image: string;
  imageHint: string;
};

export const classNames = ["ষষ্ঠ", "সপ্তম", "অষ্টম", "নবম", "দশম"];

export const students: Student[] = [
  { id: 1, roll: 101, name: 'আবির আহমেদ', class: 'দশম', fatherName: 'কামাল আহমেদ', mobile: '01712345678', monthlyFee: 1500, image: 'https://picsum.photos/seed/1/100/100', imageHint: "student boy" },
  { id: 2, roll: 102, name: 'সুমন চৌধুরী', class: 'দশম', fatherName: 'জামাল চৌধুরী', mobile: '01812345679', monthlyFee: 1500, image: 'https://picsum.photos/seed/2/100/100', imageHint: "student boy" },
  { id: 3, roll: 201, name: 'ফারিয়া ইসলাম', class: 'নবম', fatherName: 'নজরুল ইসলাম', mobile: '01912345680', monthlyFee: 1200, image: 'https://picsum.photos/seed/3/100/100', imageHint: "student girl" },
  { id: 4, roll: 202, name: 'তামান্না খাতুন', class: 'নবম', fatherName: 'শফিক খাতুন', mobile: '01612345681', monthlyFee: 1200, image: 'https://picsum.photos/seed/4/100/100', imageHint: "student girl" },
  { id: 5, roll: 301, name: 'রাকিব হাসান', class: 'অষ্টম', fatherName: 'রফিক হাসান', mobile: '01512345682', monthlyFee: 1000, image: 'https://picsum.photos/seed/5/100/100', imageHint: "student boy" },
  { id: 6, roll: 401, name: 'নাফিস ইকবাল', class: 'সপ্তম', fatherName: 'বশির ইকবাল', mobile: '01312345683', monthlyFee: 800, image: 'https://picsum.photos/seed/6/100/100', imageHint: "student boy" },
  { id: 7, roll: 501, name: 'সাদিয়া আফরিন', class: 'ষষ্ঠ', fatherName: 'আনোয়ার হোসেন', mobile: '01412345684', monthlyFee: 700, image: 'https://picsum.photos/seed/7/100/100', imageHint: "student girl" },
];

export const teachers: Teacher[] = [
    { id: 1, name: 'জনাব আব্দুল করিম', mobile: '01700000001', image: 'https://picsum.photos/seed/t1/100/100', imageHint: 'male teacher' },
    { id: 2, name: 'জনাব শফিকুর রহমান', mobile: '01800000002', image: 'https://picsum.photos/seed/t2/100/100', imageHint: 'male teacher' },
    { id: 3, name: 'মিসেস ফাতেমা বেগম', mobile: '01900000003', image: 'https://picsum.photos/seed/t3/100/100', imageHint: 'female teacher' },
];

export const classStudentCount = [
    { class: "ষষ্ঠ", total: 15 },
    { class: "সপ্তম", total: 25 },
    { class: "অষ্টম", total: 20 },
    { class: "নবম", total: 30 },
    { class: "দশম", total: 22 },
];
