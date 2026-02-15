import data from './board-books.json';

export type BoardBook = {
  classGrade: string;
  subject: string;
  coverImageUrl: string;
  imageHint: string;
  downloadUrl: string;
};

export const boardBooks: BoardBook[] = data.books;
