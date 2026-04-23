import { useEffect, useState } from 'react';
import { 
  FlatList, Text, View, StyleSheet, ActivityIndicator, 
  Image, useColorScheme, TextInput, ScrollView, TouchableOpacity 
} from 'react-native';
import { apiClient } from '@/constants/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

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
      console.error(err);
      setLoading(false);
    });
  }, []);

  const theme = {
    bg: isDark ? '#121212' : '#fff',
    text: isDark ? '#fff' : '#000',
    input: isDark ? '#333' : '#F0F0F0',
    card: isDark ? '#1E1E1E' : '#fff',
  };

  if (loading) return <ActivityIndicator size="large" color="purple" style={{ flex: 1 }} />;

  // Komponent nagłówka (Wyszukiwarka + Kategorie)
  const ListHeader = () => (
    <View>
      <View style={[styles.searchBar, { backgroundColor: theme.input }]}>
        <Ionicons name="search" size={20} color="#888" />
        <TextInput placeholder="Wyszukaj" placeholderTextColor="#888" style={[styles.searchInput, { color: theme.text }]} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Kategorie</Text>
        <Ionicons name="chevron-forward" size={20} color={theme.text} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
        {categories.map((cat) => (
          <View key={cat.id} style={styles.categoryItem}>
            <View style={styles.categoryCircle} />
            <Text style={[styles.categoryLabel, { color: theme.text }]}>{cat.nazwa}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Książki</Text>
        <Ionicons name="chevron-forward" size={20} color={theme.text} />
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <FlatList
        data={books}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        ListHeaderComponent={ListHeader} // Wrzucamy resztę do nagłówka listy
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.bookCard, { backgroundColor: theme.card }]}
            onPress={() => router.push(`/book/${item.id}`)} // Dowód interakcji na VI zajęcia
            activeOpacity={0.7} // Efekt wizualny przy kliknięciu
          >
            <Image 
              source={{ uri: 'https://via.placeholder.com/150x220' }} 
              style={styles.bookImage} 
            />
            {/* Kontener z paddingiem, żeby tekst nie dotykał krawędzi */}
            <View style={styles.bookInfoContainer}>
              <Text style={styles.bookAuthor} numberOfLines={1}>{item.autor}</Text>
              <Text style={[styles.bookTitle, { color: theme.text }]} numberOfLines={2}>
                {item.tytul}
              </Text>
              <Text style={[styles.bookPrice, { color: theme.text }]}>{item.cena_jednostkowa} zł</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 15 },
  searchBar: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 10, marginVertical: 20 },
  searchInput: { marginLeft: 10, flex: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  categoriesScroll: { marginBottom: 20 },
  categoryItem: { alignItems: 'center', marginRight: 15 },
  categoryCircle: { width: 65, height: 65, borderRadius: 32.5, backgroundColor: '#EEE', marginBottom: 5 },
  categoryLabel: { fontSize: 12 },
  columnWrapper: { justifyContent: 'space-between' },
  bookCard: { 
    width: '48%', 
    marginBottom: 20, 
    borderRadius: 12,
    // Cień, żeby kafelek "odstawał" od tła
    elevation: 4, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden', 
  },
  bookImage: { 
    width: '100%', 
    height: 200, 
    backgroundColor: '#eee' 
  },
  bookInfoContainer: {
    padding: 10, 
  },
  bookAuthor: { 
    fontSize: 11, 
    color: '#888', 
    textTransform: 'uppercase',
    marginBottom: 2
  },
  bookTitle: { 
    fontSize: 14, 
    fontWeight: '600', 
    height: 40, // Stała wysokość, żeby kafelki były równe
    lineHeight: 18
  },
  bookPrice: { 
    fontSize: 15, 
    fontWeight: '700', 
    marginTop: 8,
    color: '#6200EE' 
  },
  columnWrapper: { 
    justifyContent: 'space-between',
    paddingHorizontal: 2 // Dodatkowy margines od krawędzi ekranu
  },
});