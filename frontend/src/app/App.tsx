import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { BooksProvider } from './contexts/BooksContext';

export default function App() {
  return (
    <AuthProvider>
      <BooksProvider>
        <CartProvider>
          <RouterProvider router={router} />
        </CartProvider>
      </BooksProvider>
    </AuthProvider>
  );
}
