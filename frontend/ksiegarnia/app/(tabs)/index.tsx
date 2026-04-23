import { useEffect, useState } from 'react';
import { 
  FlatList, Text, View, StyleSheet, ActivityIndicator, 
  Image, useColorScheme, TextInput, ScrollView, TouchableOpacity 
} from 'react-native';
import { apiClient } from '@/constants/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    Promise.all([
      apiClient.get('/ksiazki/'),
      apiClient.get('/kategorie/')
    ]).then(([booksRes, catsRes]) => {
      setBooks(booksRes.data);
      setCategories(catsRes.data);
      setLoading(false);
    }).catch(err => {
      console.error("Błąd pobierania danych:", err);
      setLoading(false);
    });
  }, []);

  const theme = {
    bg: isDark ? '#121212' : '#fff',
    text: isDark ? '#fff' : '#000',
    input: isDark ? '#333' : '#F0F0F0',
    card: isDark ? '#1E1E1E' : '#fff',
    accent: '#6200EE'
  };

  if (loading) return <ActivityIndicator size="large" color="purple" style={{ flex: 1 }} />;

  const ListHeader = () => (
    <View>
      <View style={[styles.searchBar, { backgroundColor: theme.input }]}>
        <Ionicons name="search" size={20} color="#888" />
        <TextInput 
          placeholder="Wyszukaj książkę lub autora..." 
          placeholderTextColor="#888" 
          style={[styles.searchInput, { color: theme.text }]} 
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Kategorie</Text>
        <Ionicons name="chevron-forward" size={20} color={theme.text} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
        {categories.map((cat) => (
          <View key={cat.id} style={styles.categoryItem}>
            <View style={[styles.categoryCircle, { backgroundColor: theme.input }]}>
              <Ionicons name="book" size={24} color={theme.accent} />
            </View>
            <Text style={[styles.categoryLabel, { color: theme.text }]}>{cat.nazwa}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Książki</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <FlatList
        data={books}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        ListHeaderComponent={ListHeader}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.bookCard, { backgroundColor: theme.card }]}
            onPress={() => router.push(`/book/${item.id}`)}
            activeOpacity={0.8}
          >
            <Image 
              source={{ 
                uri: item.okladka && item.okladka.length > 5 
                  ? item.okladka 
                  : 'https://mebas.pl/grafika/grafika-strony/brak.jpg' 
              }} 
              style={styles.bookImage}
              resizeMode="cover"
            />
            
            <View style={styles.bookInfoContainer}>
              {item.seria && (
                <Text style={styles.bookSeries} numberOfLines={1}>{item.seria}</Text>
              )}
              
              <Text style={styles.bookAuthor} numberOfLines={1}>{item.autor}</Text>
              
              <Text style={[styles.bookTitle, { color: theme.text }]} numberOfLines={2}>
                {item.tytul}
              </Text>
              
              <View style={styles.priceRow}>
                <Text style={[styles.bookPrice, { color: theme.accent }]}>
                  {item.cena_jednostkowa.toFixed(2)} zł
                </Text>
                {item.ilosc_sztuk < 5 && item.ilosc_sztuk > 0 && (
                  <Text style={styles.lastItems}>Ostatnie!</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 15 },
  searchBar: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginVertical: 20 },
  searchInput: { marginLeft: 10, flex: 1, fontSize: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold' },
  categoriesScroll: { marginBottom: 25 },
  categoryItem: { alignItems: 'center', marginRight: 18 },
  categoryCircle: { 
    width: 65, 
    height: 65, 
    borderRadius: 32.5, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)'
  },
  categoryLabel: { fontSize: 12, fontWeight: '500' },
  columnWrapper: { justifyContent: 'space-between' },
  bookCard: { 
    width: '48%', 
    marginBottom: 20, 
    borderRadius: 15,
    elevation: 3, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    overflow: 'hidden', 
  },
  bookImage: { 
    width: '100%', 
    height: 220, 
    backgroundColor: '#f0f0f0' 
  },
  bookInfoContainer: { padding: 10 },
  bookSeries: { fontSize: 10, color: '#6200EE', fontWeight: 'bold', marginBottom: 2, textTransform: 'uppercase' },
  bookAuthor: { fontSize: 11, color: '#888', marginBottom: 2 },
  bookTitle: { fontSize: 14, fontWeight: 'bold', height: 38, lineHeight: 18 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  bookPrice: { fontSize: 16, fontWeight: 'bold' },
  lastItems: { fontSize: 10, color: '#FF3B30', fontWeight: 'bold' }
});