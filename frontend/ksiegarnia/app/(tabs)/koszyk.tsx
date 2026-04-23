import React from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  useColorScheme 
} from 'react-native';
import { useCart } from '../../context/CartContext';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CartScreen() {
  const { items, total, removeFromCart, updateQuantity } = useCart();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const theme = {
    bg: isDark ? '#121212' : '#fff',
    text: isDark ? '#fff' : '#000',
    card: isDark ? '#1E1E1E' : '#F9F9F9',
    accent: '#6200EE',
    border: isDark ? '#333' : '#eee'
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.bg }]}>
        <Ionicons name="cart-outline" size={100} color={isDark ? '#222' : '#f0f0f0'} />
        <Text style={[styles.emptyText, { color: theme.text }]}>Twój koszyk jest pusty</Text>
        <TouchableOpacity 
          style={styles.backToStore} 
          onPress={() => alert("Wróć do przeglądania książek!")}
        >
          <Text style={{ color: theme.accent, fontWeight: 'bold' }}>Zacznij zakupy</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.headerContainer}>
        <Text style={[styles.header, { color: theme.text }]}>Mój Koszyk</Text>
        <Text style={styles.itemCount}>{items.length} {items.length === 1 ? 'pozycja' : 'pozycje'}</Text>
      </View>
      
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 180 }}
        renderItem={({ item }) => (
          <View style={[styles.cartItem, { backgroundColor: theme.card }]}>
            <Image source={{ uri: item.okladka }} style={styles.image} resizeMode="cover" />
            
            <View style={styles.info}>
              <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{item.tytul}</Text>
              <Text style={styles.author}>{item.autor}</Text>
              
              <View style={styles.quantityContainer}>
                <TouchableOpacity 
                  onPress={() => updateQuantity(item.id, -1)}
                  style={styles.qtyButton}
                >
                  <Ionicons name="remove-circle-outline" size={26} color={theme.accent} />
                </TouchableOpacity>
                
                <Text style={[styles.quantityText, { color: theme.text }]}>{item.quantity}</Text>
                
                <TouchableOpacity 
                  onPress={() => updateQuantity(item.id, 1)}
                  style={[styles.qtyButton, item.quantity >= item.ilosc_sztuk && { opacity: 0.3 }]}
                  disabled={item.quantity >= item.ilosc_sztuk} // Blokada kliknięcia
                  >
                  <Ionicons name="add-circle-outline" size={26} color={theme.accent} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.rightActions}>
              <TouchableOpacity 
                onPress={() => removeFromCart(item.id)} 
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={22} color="#ff4444" />
              </TouchableOpacity>
              <Text style={[styles.price, { color: theme.accent }]}>
                {(item.cena_jednostkowa * item.quantity).toFixed(2)} zł
              </Text>
            </View>
          </View>
        )}
      />

      <View style={[styles.footer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: theme.text }]}>Suma: </Text>
          <Text style={[styles.totalPrice, { color: theme.accent }]}>{total.toFixed(2)} zł</Text>
        </View>

        <TouchableOpacity 
          style={[styles.checkoutButton, { backgroundColor: theme.accent }]}
          activeOpacity={0.8}
          onPress={() => alert("Zamówienie wysłane do bazy danych! (Lab 8)")}
        >
          <Text style={styles.checkoutText}>Złóż zamówienie</Text>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 20, fontWeight: '500', marginTop: 15 },
  backToStore: { marginTop: 20, padding: 10 },
  headerContainer: { padding: 20, paddingBottom: 10 },
  header: { fontSize: 28, fontWeight: 'bold' },
  itemCount: { fontSize: 14, color: '#888' },
  cartItem: { 
    flexDirection: 'row', 
    marginHorizontal: 20, 
    marginVertical: 10, 
    padding: 15, 
    borderRadius: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: { width: 60, height: 90, borderRadius: 10 },
  info: { marginLeft: 15, flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold' },
  author: { fontSize: 13, color: '#888', marginBottom: 5 },
  quantityContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 5,
    gap: 12
  },
  qtyButton: { padding: 2 },
  quantityText: { fontSize: 18, fontWeight: 'bold', minWidth: 20, textAlign: 'center' },
  rightActions: { alignItems: 'flex-end', justifyContent: 'space-between', height: 90 },
  deleteButton: { padding: 5 },
  price: { fontSize: 16, fontWeight: 'bold' },
  footer: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    padding: 25, paddingBottom: 40, borderTopWidth: 1 
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  totalLabel: { fontSize: 18, opacity: 0.7 },
  totalPrice: { fontSize: 26, fontWeight: 'bold' },
  checkoutButton: { 
    flexDirection: 'row', height: 60, borderRadius: 18, 
    justifyContent: 'center', alignItems: 'center', gap: 10,
    elevation: 5
  },
  checkoutText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});