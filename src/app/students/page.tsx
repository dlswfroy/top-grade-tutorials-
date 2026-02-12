'use client';
import { useState } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { students as initialStudents, classNames } from '@/lib/data';
import { PlusCircle, Search, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function StudentsPage() {
  const [students, setStudents] = useState(initialStudents);
  const [searchTerm, setSearchTerm] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.includes(searchTerm) ||
      student.roll.toString().includes(searchTerm)
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">শিক্ষার্থী ম্যানেজমেন্ট</h1>
        <p className="text-muted-foreground">
          নতুন শিক্ষার্থী যোগ করুন এবং বিদ্যমানদের তথ্য দেখুন ও সম্পাদনা করুন।
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>শিক্ষার্থীদের তালিকা</CardTitle>
              <CardDescription>
                এখানে সকল শিক্ষার্থীর তালিকা দেখুন।
              </CardDescription>
            </div>
            <Dialog onOpenChange={() => setImagePreview(null)}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  নতুন শিক্ষার্থী
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>নতুন শিক্ষার্থী যোগ করুন</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">নাম</Label>
                    <Input id="name" placeholder="শিক্ষার্থীর নাম" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="class" className="text-right">শ্রেণি</Label>
                    <Select>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="শ্রেণি নির্বাচন করুন" />
                      </SelectTrigger>
                      <SelectContent>
                        {classNames.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="father-name" className="text-right">পিতার নাম</Label>
                    <Input id="father-name" placeholder="পিতার নাম" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="mobile" className="text-right">মোবাইল</Label>
                    <Input id="mobile" placeholder="মোবাইল নম্বর" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="fee" className="text-right">মাসিক বেতন</Label>
                    <Input id="fee" type="number" placeholder="মাসিক বেতন" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="picture" className="text-right">ছবি</Label>
                    <Input id="picture" type="file" accept="image/*" onChange={handleImageChange} className="col-span-3" />
                  </div>
                  {imagePreview && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <div className="col-start-2 col-span-3">
                        <Image src={imagePreview} alt="Image Preview" width={100} height={100} className="rounded-md" />
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="submit">সেভ করুন</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="রোল বা নাম দিয়ে খুঁজুন..."
              className="w-full rounded-lg bg-background pl-8"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ছবি</TableHead>
                <TableHead>রোল</TableHead>
                <TableHead>নাম</TableHead>
                <TableHead>শ্রেণি</TableHead>
                <TableHead>পিতার নাম</TableHead>
                <TableHead>মোবাইল</TableHead>
                <TableHead className="text-right">বেতন</TableHead>
                <TableHead className="text-center">একশন</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <Avatar>
                      <AvatarImage src={student.image} data-ai-hint={student.imageHint} alt={student.name} />
                      <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>{student.roll}</TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.class}</TableCell>
                  <TableCell>{student.fatherName}</TableCell>
                  <TableCell>{student.mobile}</TableCell>
                  <TableCell className="text-right">৳{student.monthlyFee}</TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>এডিট</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>ডিলিট</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
