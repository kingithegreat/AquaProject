import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Text
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Colors } from '@/constants/Colors';
import { withProtectedRoute } from '@/hooks/withProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { db, checkOnlineStatus, addToOfflineQueue } from '@/config/firebase';
import { ThemedText } from '@/components/ThemedText';

// Define Booking interface
interface Booking {
  id: string;
  userId: string;
  createdAt: Date | string | any;
  serviceType: string;
  quantity: number;
  totalAmount: number;
  date: string;
  time: string;
  status: string;
  reference?: string;
  notes?: string;
  isLocal?: boolean;
  addOns?: Array<{id: string | number, name: string, price: number}>;
}

function MyBookingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      console.warn("Date formatting error:", e);
      return "Date unavailable";
    }
  };

  // Format time for display
  const formatTime = (timeString) => {
    try {
      const time = new Date(timeString);
      return time.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.warn("Time formatting error:", e);
      return "Time unavailable";
    }
  };

  // Get service name from service type
  const getServiceName = (serviceType, quantity) => {
    switch(serviceType) {
      case 'jetski':
        return `Jet Skis (${quantity})`;
      case 'aqualounge':
        return 'Aqua Lounge';
      case 'tours':
        return 'Guided Tour';
      default:
        return serviceType || 'Unknown Service';
    }
  };
  
  // Check for locally stored bookings that haven't been synced yet
  const getLocalBookings = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const bookingKeys = keys.filter(key => key.startsWith('booking_'));
      
      if (bookingKeys.length === 0) return [];
      
      const localBookingsData = await AsyncStorage.multiGet(bookingKeys);
      return localBookingsData.map(([key, value]) => {
        const booking = JSON.parse(value);
        return {
          ...booking,
          id: key, // Use the AsyncStorage key as ID
          isLocal: true, // Mark as locally stored booking
          status: 'pending sync' // Special status for local bookings
        };
      }).filter(booking => booking.userId === user?.uid);
    } catch (error) {
      console.error('Error fetching local bookings:', error);
      return [];
    }
  };

  // Fetch bookings from Firestore and local storage
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const online = await checkOnlineStatus();
      setIsOnline(online);
      
      if (!user?.uid) {
        console.log('No user logged in');
        setBookings([]);
        setLoading(false);
        return;
      }
      
      // Get local bookings first (these will show regardless of connection)
      const localBookings = await getLocalBookings();
      console.log(`Found ${localBookings.length} local bookings`);

      let firestoreBookings = [];
      
      // Only attempt to fetch from Firestore if online
      if (online) {
        try {
          console.log('Fetching bookings from Firestore for user:', user.uid);
          const q = query(
            collection(db, 'bookings'),
            where('userId', '==', user.uid)
          );

          const querySnapshot = await getDocs(q);
          
          firestoreBookings = querySnapshot.docs.map(doc => {
            const data = doc.data();
            // Handle createdAt field safely
            let createdAtDate;
            if (data.createdAt) {
              if (typeof data.createdAt === 'string') {
                createdAtDate = new Date(data.createdAt);
              } else if (typeof data.createdAt.toDate === 'function') {
                createdAtDate = data.createdAt.toDate();
              } else {
                createdAtDate = new Date();
              }
            } else {
              createdAtDate = new Date();
            }
            
            return {
              id: doc.id,
              ...data,
              createdAt: createdAtDate,
              isLocal: false
            };
          });
          
          console.log(`Found ${firestoreBookings.length} Firestore bookings`);
        } catch (firestoreError) {
          console.error('Error fetching from Firestore:', firestoreError);
          if (!localBookings.length) {
            Alert.alert(
              'Connection Issue',
              'Could not load bookings from the server. Showing locally stored bookings only.'
            );
          }
        }
      } else {
        console.log('Device is offline, showing local bookings only');
        if (!localBookings.length) {
          Alert.alert(
            'You\'re Offline',
            'Internet connection not available. Please connect to the internet to see all your bookings.'
          );
        }
      }

      // Combine bookings from both sources and sort them
      const allBookings = [...firestoreBookings, ...localBookings];
      allBookings.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA; // Sort by date, newest first
      });

      setBookings(allBookings);
    } catch (error) {
      console.error('Error in fetchBookings:', error);
      Alert.alert('Error', 'Failed to load your bookings. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchBookings();
  }, [user]);

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ 
        title: 'My Bookings',
        headerStyle: {
          backgroundColor: '#000000',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }} />

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#21655A" />
          <ThemedText style={styles.loadingText}>Loading your bookings...</ThemedText>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#21655A']} />
          }
        >
          {bookings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={80} color="#21655A" />
              <ThemedText style={styles.emptyTitle}>No Bookings Yet</ThemedText>
              <ThemedText style={styles.emptyText}>
                You haven't made any bookings yet. Start your aquatic adventure today!
              </ThemedText>
              <TouchableOpacity
                style={styles.bookNowButton}
                onPress={() => router.push('/booking')}
              >
                <ThemedText style={styles.bookNowButtonText}>Book Now</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.headerContainer}>
                <ThemedText style={styles.headerText}>
                  Your Aqua 360° Adventures
                </ThemedText>
                <TouchableOpacity
                  style={styles.newBookingButton}
                  onPress={() => router.push('/booking')}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <ThemedText style={styles.newBookingButtonText}>New Booking</ThemedText>
                </TouchableOpacity>
              </View>              {bookings.map((booking) => (
                <View key={booking.id} style={styles.bookingCard}>
                  <View style={styles.bookingCardHeader}>
                    <View style={{backgroundColor: 'white', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4}}>
                      <Text
                        style={{
                          color: 'black',
                          fontWeight: '700',
                          fontSize: 16,
                        }}
                      >
                        {getServiceName(booking.serviceType, booking.quantity)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.bookingInfo}>
                    <View style={styles.infoRow}>
                      <Ionicons name="calendar" size={18} color="#21655A" />
                      <ThemedText style={styles.infoText}>
                        {formatDate(booking.date)}
                      </ThemedText>
                    </View>
                    
                    <View style={styles.infoRow}>
                      <Ionicons name="time" size={18} color="#21655A" />
                      <ThemedText style={styles.infoText}>
                        {formatTime(booking.time)}
                      </ThemedText>
                    </View>
                    
                    <View style={styles.infoRow}>
                      <Ionicons name="pricetag" size={18} color="#21655A" />
                      <ThemedText style={styles.infoText}>
                        Total: ${booking.totalAmount}
                      </ThemedText>
                    </View>
                      {booking.addOns && booking.addOns.length > 0 && (
                      <View style={styles.addOnsContainer}>
                        <ThemedText style={styles.addOnsHeader}>Add-ons:</ThemedText>
                        {booking.addOns.map((addon) => (
                          <ThemedText key={addon.id} style={styles.addonText}>
                            • {addon.name} (${addon.price})
                          </ThemedText>
                        ))}
                      </View>
                    )}
                  </View>
                    <View style={styles.referenceContainer}>                    <ThemedText style={styles.referenceLabel}>
                      Booking Reference:
                    </ThemedText>
                    <ThemedText style={styles.referenceNumber}>
                      {booking.reference || 'N/A'}
                    </ThemedText>
                  </View>
                    <View style={[styles.statusBadge, styles.statusBadgeBottom]}>
                    <ThemedText style={[styles.statusText, { color: '#000' }]}>
                      {booking.status ? booking.status.toUpperCase() : 'PENDING'}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#52D6E2',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#21655A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#21655A',
  },
  newBookingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#21655A',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  newBookingButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 80,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#21655A',
    marginTop: 16,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
    marginBottom: 24,
  },
  bookNowButton: {
    backgroundColor: '#21655A',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  bookNowButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  bookingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#21655A',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  serviceType: {
    color: '#000',
    fontWeight: '700',
    fontSize: 18,
  },  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeBottom: {
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(33, 101, 90, 0.2)',
  },
  statusText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 12,
  },
  bookingInfo: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  addOnsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  addOnsHeader: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4,
    color: '#21655A',
  },
  addonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  referenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  referenceLabel: {
    fontSize: 14,
    color: '#666',
  },
  referenceNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#21655A',
  },
});

export default withProtectedRoute(MyBookingsScreen);