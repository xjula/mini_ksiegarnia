import { useEffect, useState } from 'react';
import { 
  View, Text, Image, StyleSheet, ScrollView, 
  ActivityIndicator, TouchableOpacity, useColorScheme 
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { apiClient } from '@/constants/api';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useCart } from '../../context/CartContext';

const InfoRow = ({ label, value, isDark }: { label: string, value: string, isDark: boolean }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: isDark ? '#333' : '#eee', paddingBottom: 4 }}>
    <Text style={{ color: '#888', fontSize: 14 }}>{label}:</Text>
    <Text style={{ color: isDark ? '#fff' : '#000', fontWeight: '600', fontSize: 14 }}>{value}</Text>
  </View>
);

export default function BookDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const theme = {
    bg: isDark ? '#121212' : '#fff',
    text: isDark ? '#fff' : '#000',
    card: isDark ? '#1E1E1E' : '#F9F9F9',
    accent: '#6200EE',
    secondaryText: '#888'
  };

  useEffect(() => {
    apiClient.get(`/ksiazki/`)
      .then(res => {
        const foundBook = res.data.find((b: any) => b.id.toString() === id);
        setBook(foundBook);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return (
    <View style={[styles.centered, { backgroundColor: theme.bg }]}>
      <ActivityIndicator size="large" color={theme.accent} />
    </View>
  );

  if (!book) return (
    <View style={[styles.centered, { backgroundColor: theme.bg }]}>
      <Text style={{ color: theme.text }}>Nie znaleziono książki.</Text>
    </View>
  );

  return (
    
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* PRZYCISK WSTECZ */}
      <TouchableOpacity 
        style={[styles.backButton, { backgroundColor: isDark ? '#333' : '#fff' }]} 
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <Ionicons name="arrow-back" size={26} color={isDark ? "#fff" : "#000"} />
      </TouchableOpacity>

      <ScrollView 
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Sekcja Okładki */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: book.okladka || 'https://via.placeholder.com/300x450' }} 
            style={styles.coverImage} 
            resizeMode="contain" 
          />
        </View>

        {/* Sekcja Detali */}
        <View style={[styles.detailsContainer, { backgroundColor: theme.card }]}>
          {book.seria && <Text style={styles.series}>{book.seria}</Text>}
          
          <Text style={[styles.title, { color: theme.text }]}>{book.tytul}</Text>
          <Text style={styles.author}>Autor: {book.autor}</Text>

          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: theme.accent }]}>
              {book.cena_jednostkowa.toFixed(2)} zł
            </Text>
            <View style={[styles.stockBadge, { backgroundColor: isDark ? '#332D41' : '#E8DEF8' }]}>
              <Text style={styles.stockText}>Dostępne: {book.ilosc_sztuk} szt.</Text>
            </View>
          </View>

          <View style={[styles.separator, { backgroundColor: isDark ? '#333' : '#eee' }]} />

          <Text style={[styles.sectionTitle, { color: theme.text }]}>O czym jest ta książka?</Text>
          <Text style={[styles.description, { color: theme.text }]}>
            {book.opis || "Brak opisu dla tej pozycji."}
          </Text>

          <View style={[styles.infoBox, { backgroundColor: isDark ? '#252525' : 'rgba(0,0,0,0.03)' }]}>
            <Text style={[styles.sectionTitle, { color: theme.text, fontSize: 16, marginBottom: 15 }]}>
              Informacje szczegółowe
            </Text>
            
            <InfoRow label="Seria" value={book.seria || "Brak"} isDark={isDark} />
            <InfoRow label="Wydawnictwo" value={book.wydawnictwo} isDark={isDark} />
            <InfoRow label="Język" value={book.jezyk_wydania} isDark={isDark} />
            <InfoRow label="Wydanie" value={`${book.numer_wydania}`} isDark={isDark} />
            <InfoRow 
              label="Data premiery" 
              value={new Date(book.data_premiery).toLocaleDateString('pl-PL')} 
              isDark={isDark} 
            />
            <InfoRow label="Dostępność" value={`${book.ilosc_sztuk} szt.`} isDark={isDark} />
          </View>
        </View>
      </ScrollView>

      {/* PRZYCISK KOSZYKA */}
      <View style={[styles.bottomButtonContainer, { backgroundColor: theme.bg }]}>
        <TouchableOpacity 
          style={[styles.addToCartButton, { backgroundColor: theme.accent }]}
          onPress={() => addToCart(book)}
          activeOpacity={0.8}
        >
          <Ionicons name="cart-outline" size={22} color="#fff" />
          <Text style={styles.addToCartText}>Dodaj do koszyka</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backButton: { 
    position: 'absolute', top: 50, left: 20, zIndex: 999,
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    elevation: 10, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5,
  },
  imageContainer: { width: '100%', height: 420, paddingTop: 60, alignItems: 'center', backgroundColor: '#f0f0f0' },
  coverImage: { width: '85%', height: '90%' },
  detailsContainer: { flex: 1, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30, padding: 25, minHeight: 500 },
  series: { color: '#6200EE', fontWeight: 'bold', textTransform: 'uppercase', fontSize: 12, marginBottom: 5 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 5 },
  author: { fontSize: 18, color: '#888', marginBottom: 20 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  price: { fontSize: 24, fontWeight: 'bold' },
  stockBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  stockText: { color: '#6200EE', fontSize: 13, fontWeight: 'bold' },
  separator: { height: 1, marginVertical: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  description: { fontSize: 15, lineHeight: 24, opacity: 0.8, textAlign: 'justify' },
  infoBox: { marginTop: 25, padding: 15, borderRadius: 12 },
  infoLabel: { fontSize: 14, marginBottom: 6 },
  addToCartButton: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 18, 
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 50,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  addToCartText: { color: '#fff', fontSize: 17, fontWeight: 'bold', marginLeft: 10 }
});