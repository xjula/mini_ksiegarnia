export interface Book {
  id: number;
  title: string;
  author: string;
  description: string;
  price: number;
  category: string;
  rating: number;
  reviewCount: number;
  trend: 'up' | 'stable' | 'down';
  stock: number;
  isbn?: string;
  publishYear?: number;
  publisher?: string;
}

export interface Review {
  id: number;
  bookId: number;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

export interface CartItem {
  bookId: number;
  quantity: number;
}

export interface Address {
  id: number;
  userId: number;
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id: number;
  userId: number;
  items: OrderItem[];
  totalPrice: number;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  addressId: number;
  deliveryMethod: string;
  deliveryCost: number;
  tax: number;
  createdAt: string;
}

export interface OrderItem {
  bookId: number;
  bookTitle: string;
  quantity: number;
  price: number;
}

export interface Payment {
  id: number;
  orderId: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  method: 'online' | 'offline';
  externalId?: string;
  amount: number;
  createdAt: string;
}
