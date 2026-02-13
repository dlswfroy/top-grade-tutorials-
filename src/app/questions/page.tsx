import { QuestionGenerator } from './question-generator';

function QuestionPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">স্বয়ংক্রিয় প্রশ্নপত্র জেনারেটর</h1>
        <p className="text-muted-foreground">
          শ্রেণি, বিষয় ও অন্যান্য তথ্য দিয়ে মুহূর্তেই পরীক্ষার প্রশ্নপত্র তৈরি করুন।
        </p>
      </div>
      <QuestionGenerator />
    </div>
  );
}

export default function QuestionPageContainer() {
  return (
    <QuestionPage />
  );
}
