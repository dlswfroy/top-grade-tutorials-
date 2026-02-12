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
import { Label } from '@/components/ui/label';
import { teachers as initialTeachers } from '@/lib/data';
import { PlusCircle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState(initialTeachers);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">শিক্ষক ম্যানেজমেন্ট</h1>
        <p className="text-muted-foreground">
          নতুন শিক্ষক যোগ করুন এবং তাদের তথ্য দেখুন।
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>শিক্ষকদের তালিকা</CardTitle>
              <CardDescription>
                এখানে সকল নিবন্ধিত শিক্ষকের তালিকা দেখুন।
              </CardDescription>
            </div>
            <Dialog onOpenChange={() => setImagePreview(null)}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  নতুন শিক্ষক
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>নতুন শিক্ষক যোগ করুন</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">নাম</Label>
                    <Input id="name" placeholder="শিক্ষকের নাম" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="mobile" className="text-right">মোবাইল</Label>
                    <Input id="mobile" placeholder="মোবাইল নম্বর" className="col-span-3" />
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
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ছবি</TableHead>
                <TableHead>নাম</TableHead>
                <TableHead>মোবাইল নম্বর</TableHead>
                <TableHead className="text-center">একশন</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell>
                    <Avatar>
                      <AvatarImage src={teacher.image} data-ai-hint={teacher.imageHint} alt={teacher.name} />
                      <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{teacher.name}</TableCell>
                  <TableCell>{teacher.mobile}</TableCell>
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
