import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Trash2, Edit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useBooks } from '../contexts/BooksContext';
import { Book, BookCreatePayload } from '../types';
import { apiClient } from '../../api';
import { useTranslation } from 'react-i18next';

type Category = {
    id: number;
    nazwa: string;
  };

type FormData = {
  title: string;
  author: string;
  description: string;
  price: string;
  stock: string;
  publisher: string;
  categoryId: string;
  language: string;
  editionNumber: string;
  releaseDate: string;
  cover: string;
  publishYear: string;
  trend: 'up' | 'stable' | 'down';
};

const emptyForm: FormData = {
  title: '',
  author: '',
  description: '',
  price: '',
  stock: '',
  publisher: '',
  categoryId: '1',
  language: 'polski',
  editionNumber: '1',
  releaseDate: new Date().toISOString().split('T')[0],
  cover: '',
  publishYear: '',
  trend: 'stable'
};

export function Admin() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { books, addBook, updateBook, deleteBook } = useBooks();
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  
  const fetchCategories = async () => {
    const response = await apiClient.get('/kategorie/');
    setCategories(response.data);
  };

  const fetchOrders = async () => {
    try {
      const response = await apiClient.get('/zamowienia/');
      setOrders(response.data);
    } catch (err) {
      console.error('Błąd pobierania zamówień', err);
    }
  };

  const approveOfflinePayment = async (
  orderId: number
) => {
  try {
    await apiClient.put(
      `/zamowienia/${orderId}/zatwierdz-offline`
    );

    fetchOrders();
  } catch (err) {
    console.error(err);
    alert('Nie udało się zatwierdzić płatności offline');
  }
};

  const handleAddCategory = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!newCategoryName.trim()) return;

  try {
    setAddingCategory(true);

    await apiClient.post('/kategorie/', {
      nazwa: newCategoryName.trim()
    });

    setNewCategoryName('');
    await fetchCategories();
  } catch (error) {
    console.error('Błąd podczas dodawania kategorii:', error);
    alert('Nie udało się dodać kategorii.');
  } finally {
    setAddingCategory(false);
  }
};

  useEffect(() => {
    fetchCategories();
    fetchOrders();
  }, []);
  if (!isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Brak dostępu</h1>
        <p className="text-gray-600 dark:text-slate-300 mb-8">Tylko administratorzy mają dostęp do tego panelu</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Wróć do strony głównej
        </button>
      </div>
    );
  }

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const buildPayload = (): BookCreatePayload => ({
    tytul: formData.title.trim(),
    autor: formData.author.trim(),
    opis: formData.description.trim(),
    wydawnictwo: formData.publisher.trim() || 'Nieznane',
    jezyk_wydania: formData.language.trim() || 'polski',
    numer_wydania: Number(formData.editionNumber) || 1,
    data_premiery: formData.releaseDate
      ? new Date(formData.releaseDate).toISOString()
      : new Date().toISOString(),
    okladka: formData.cover.trim() || 'brak',
    cena_jednostkowa: Number(formData.price) || 0,
    ilosc_sztuk: Number(formData.stock) || 0,
    kategoria_id: Number(formData.categoryId) || 1,
    trend: formData.trend
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      const bookData = buildPayload();

      if (editingBook) {
        await updateBook(editingBook.id, bookData);
      } else {
        await addBook(bookData);
      }

      resetForm();
    } catch (error) {
      console.error('Błąd podczas zapisywania książki:', error);
      alert('Nie udało się zapisać książki. Sprawdź dane formularza oraz backend.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setShowForm(false);
    setEditingBook(null);
  };

  const handleEdit = (book: Book) => {
    const publishDate = book.publishDate
      ? book.publishDate.substring(0, 10)
      : book.publishYear
        ? `${book.publishYear}-01-01`
        : new Date().toISOString().split('T')[0];

    setEditingBook(book);
    setFormData({
      title: book.title || '',
      author: book.author || '',
      description: book.description || '',
      price: String(book.price ?? ''),
      stock: String(book.stock ?? ''),
      publisher: book.publisher || '',
      categoryId: String(book.categoryId ?? '1'),
      language: book.language || 'polski',
      editionNumber: String(book.edition ?? '1'),
      releaseDate: publishDate,
      cover: book.zdjecie_url || book.cover || '',
      publishYear: book.publishYear?.toString() || '',
      trend: book.trend || 'stable'
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Czy na pewno chcesz usunąć tę książkę?')) return;

    try {
      await deleteBook(id);
    } catch (error) {
      console.error('Usuwanie książki:', error);
    }
  };

  const updateOrderStatus = async (
    orderId: number,
    status: string
  ) => {
    try {
      await apiClient.put(
        `/zamowienia/${orderId}/status`,
        { status }
      );

      fetchOrders();
    } catch (err) {
      console.error(err);
      alert('Nie udało się zmienić statusu');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('admin.title')}</h1>
          <p className="text-gray-600 dark:text-slate-300">{t('admin.description')}</p>
        </div>
        <button
          onClick={() => {
            setEditingBook(null);
            setFormData(emptyForm);
            setShowForm((prev) => !prev);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          <Plus className="w-5 h-5" />
          {t('admin.addBook')}
        </button>
      </div>

      {showForm && (
      <>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="font-bold text-xl mb-4">{t('admin.addCategory')}</h2>

          <form onSubmit={handleAddCategory} className="flex gap-3">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nazwa kategorii"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500"
            />

            <button
              type="submit"
              disabled={addingCategory}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
            >
              {addingCategory ? t('admin.adding') : t('admin.addCategory')}
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="font-bold text-xl mb-6">
            {editingBook ? t('admin.editBook') : t('admin.addNewBook')}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.titleLabel')} *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.author')} *</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => updateField('author', e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.price')} *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => updateField('price', e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.stock')} *</label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => updateField('stock', e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.category')}
                </label>

                <select
                  value={formData.categoryId}
                  onChange={(e) => updateField('categoryId', e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value=""> {t('admin.selectCategory')} </option>

                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.nazwa}
                    </option>
                  ))}
                </select>
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.publisher')}</label>
                <input
                  type="text"
                  value={formData.publisher}
                  onChange={(e) => updateField('publisher', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.language')}</label>
                <input
                  type="text"
                  value={formData.language}
                  onChange={(e) => updateField('language', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.edition')}</label>
                <input
                  type="number"
                  min="1"
                  value={formData.editionNumber}
                  onChange={(e) => updateField('editionNumber', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.releaseDate')}</label>
                <input
                  type="date"
                  value={formData.releaseDate}
                  onChange={(e) => updateField('releaseDate', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.coverUrl')}</label>
                <input
                  type="text"
                  value={formData.cover}
                  onChange={(e) => updateField('cover', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.trend')}</label>
                <select
                  value={formData.trend}
                  onChange={(e) => updateField('trend', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="up"> {t('admin.rising')} </option>
                  <option value="stable"> {t('admin.stable')} </option>
                  <option value="down"> {t('admin.falling')} </option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.descriptionLabel')}</label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                required
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? t('admin.saving') : editingBook ? t('admin.saveChanges') : t('admin.addBook')}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                {t('admin.cancel')}
              </button>
            </div>
          </form>
        </div>
        </>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tytuł</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Autor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategoria</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cena</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trend</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {books.map((book) => (
                <tr key={book.id} className="hover:bg-gray-50 dark:bg-slate-900">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{book.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{book.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-300">{book.author}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {book.category || book.categoryId || 'Brak'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {(book.price ?? 0).toFixed(2)} zł
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{book.stock}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {book.trend === 'up' && '📈'}
                    {book.trend === 'down' && '📉'}
                    {book.trend === 'stable' && '➡️'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(book)}
                        className="text-blue-600 hover:text-blue-700"
                        title="Edytuj"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(book.id)}
                        className="text-red-600 hover:text-red-700"
                        title="Usuń"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {books.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    Brak książek do wyświetlenia
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden mt-10">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">
            Zamówienia
          </h2>
        </div>

        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-slate-900">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Kwota</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Dostawa</th>
              <th className="px-4 py-3">Akcje</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className="border-t"
              >
                <td className="px-4 py-3">
                  {order.id}
                </td>

                <td className="px-4 py-3">
                  {order.status}
                </td>

                <td className="px-4 py-3">
                  {order.cena_calkowita} zł
                </td>

                <td className="px-4 py-3">
                  {new Date(
                    order.data_zamowienia
                  ).toLocaleDateString()}
                </td>

                <td className="px-4 py-3">
                  {order.metoda_dostawy}
                </td>

                <td className="px-4 py-3">
                  <div className="flex gap-2">

                    {(order.status === 'OCZEKUJE_NA_PŁATNOŚĆ_OFFLINE') && (
                      <button
                        onClick={() => approveOfflinePayment(order.id)}
                        className="px-2 py-1 bg-green-600 text-white rounded"
                      >
                        Offline OK
                      </button>
                    )}

                    <button
                      onClick={() =>
                        updateOrderStatus(
                          order.id,
                          'WYSŁANE'
                        )
                      }
                      className="px-2 py-1 bg-blue-600 text-white rounded"
                    >
                      Wyślij
                    </button>

                    <button
                      onClick={() =>
                        updateOrderStatus(
                          order.id,
                          'ANULOWANE'
                        )
                      }
                      className="px-2 py-1 bg-red-600 text-white rounded"
                    >
                      Anuluj
                    </button>

                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
