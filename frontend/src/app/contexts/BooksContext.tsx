import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Book, Review } from '../types';
import { apiClient } from '../../api';

interface BooksContextType {
  books: Book[];
  reviews: Review[];
  loading: boolean;
  fetchBooks: () => Promise<void>; 
  getBookById: (id: number) => Book | undefined;
  getReviewsByBookId: (bookId: number) => Review[];
  addBook: (book: Omit<Book, 'id'>) => void;
  updateBook: (id: number, book: Partial<Book>) => void;
  deleteBook: (id: number) => void;
  addReview: (review: Omit<Review, 'id' | 'createdAt'>) => void;
}

const BooksContext = createContext<BooksContextType | undefined>(undefined);

export function BooksProvider({ children }: { children: ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

    const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/ksiazki/');
      
      const mappedBooks = response.data.map((b: any) => ({
        id: b.id,
        title: b.tytul,
        author: b.autor,
        description: b.opis || "Brak opisu",
        series: b.seria || "",
        publisher: b.wydawnictwo || "Nieznane",
        language: b.jezyk_wydania || "Polski",
        edition: b.numer_wydania || 1,
        publishDate: b.data_premiery,
        zdjecie_url: b.okladka, 
        price: b.cena_jednostkowa,
        stock: b.ilosc_sztuk,
        categoryId: b.kategoria_id,
        category: b.kategoria_nazwa,
        publishYear: b.data_premiery ? new Date(b.data_premiery).getFullYear() : 2024,
        isbn: "Brak ISBN", 
        rating: 5.0,       
        reviewCount: 0,  
        trend: 'stable'    
      }));
      mappedBooks.sort((a: any, b: any) => a.title.localeCompare(b.title));

      setBooks(mappedBooks);
    } catch (error) {
      console.error("Błąd podczas pobierania książek:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchBooks();
  }, []);

  const getBookById = (id: number) => {
    return books.find(book => book.id === id);
  };

  const getReviewsByBookId = (bookId: number) => {
    return reviews.filter(review => review.bookId === bookId);
  };

  const addBook = (book: Omit<Book, 'id'>) => {
    const newBook: Book = { ...book, id: Date.now() };
    setBooks([...books, newBook]);
  };

  const updateBook = (id: number, updatedBook: Partial<Book>) => {
    setBooks(books.map(book => book.id === id ? { ...book, ...updatedBook } : book));
  };

  const deleteBook = (id: number) => {
    setBooks(books.filter(book => book.id !== id));
  };

  const addReview = (review: Omit<Review, 'id' | 'createdAt'>) => {
    const newReview: Review = {
      ...review,
      id: Date.now(),
      createdAt: new Date().toISOString().split('T')[0]
    };
    setReviews([...reviews, newReview]);
  };

  return (
    <BooksContext.Provider value={{
      books,
      reviews,
      loading,
      fetchBooks,
      getBookById,
      getReviewsByBookId,
      addBook,
      updateBook,
      deleteBook,
      addReview
    }}>
      {children}
    </BooksContext.Provider>
  );
}

export function useBooks() {
  const context = useContext(BooksContext);
  if (context === undefined) {
    throw new Error('useBooks must be used within a BooksProvider');
  }
  return context;
}