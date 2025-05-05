import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, View, Image, Dimensions, Alert } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { format } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/hooks/useAuth';
import withProtectedRoute from '@/hooks/withProtectedRoute';
import { Colors } from '@/constants/Colors';

// Define Booking type for proper state typing
type Booking = {
  id: string;
  reference?: string;
  createdAt: { toDate?: () => Date } | Date | string;
  status: string;
  serviceType: string;
  quantity: number;
  totalAmount: number;
  notes?: string;
  isLocal?: boolean;
  date?: string;
  time?: string;
  addOns?: Array<{ id: number, name: string, price: number }>;
};

function AccountPage() {
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // Used to force re-render

  // Fetch both local and remote bookings
  useEffect(() => {
    const fetchAllBookings = async () => {
      if (!user || !user.uid) return;

      try {
        setLoading(true);

        // Fetch both local and remote bookings in parallel
        const [firestoreBookings, localBookings] = await Promise.all([
          fetchFirestoreBookings(),
          fetchLocalBookings()
        ]);

        // Merge and deduplicate bookings
        const mergedBookings = mergeAndDeduplicateBookings(firestoreBookings, localBookings);
        setBookings(mergedBookings);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        Alert.alert('Error', 'Could not load all your bookings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllBookings();
  }, [user, refreshKey]);

  // Fetch bookings from Firestore
  const fetchFirestoreBookings = async (): Promise<Booking[]> => {
    try {
      const q = query(
        collection(db, 'bookings'),
        where('userId', '==', user?.uid)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Booking,
        isLocal: false
      }));
    } catch (error) {
      console.error('Error fetching Firestore bookings:', error);
      return [];
    }
  };

  // Fetch bookings from local storage
  const fetchLocalBookings = async (): Promise<Booking[]> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const bookingKeys = keys.filter(key => key.startsWith('booking_'));
      
      if (bookingKeys.length === 0) return [];
      
      console.log(`Found ${bookingKeys.length} local bookings in AsyncStorage`);
      
      const localBookingsData = await AsyncStorage.multiGet(bookingKeys);
      return localBookingsData
        .map(([key, value]) => {
          if (!value) return null;
          
          try {
            const booking = JSON.parse(value);
            return {
              ...booking,
              id: key,
              isLocal: true,
              status: 'pending sync', // Always show local bookings as pending sync
              // The key difference - we keep these bookings permanently marked as local
              // until we get positive confirmation they're in Firestore
            };
          } catch (parseError) {
            console.error(`Error parsing booking ${key}:`, parseError);
            return null;
          }
        })
        .filter(booking => booking && booking.userId === user?.uid);
    } catch (error) {
      console.error('Error fetching local bookings:', error);
      return [];
    }
  };

  // Merge and deduplicate bookings by reference number
  const mergeAndDeduplicateBookings = (firestoreBookings: Booking[], localBookings: Booking[]): Booking[] => {
    const bookingMap = new Map();

    // Add all Firestore bookings to the map
    firestoreBookings.forEach(booking => {
      if (booking.reference) {
        bookingMap.set(booking.reference, booking);
      } else {
        bookingMap.set(booking.id, booking);
      }
    });

    // Only add local bookings if they don't exist in Firestore
    localBookings.forEach(booking => {
      if (booking.reference && !bookingMap.has(booking.reference)) {
        bookingMap.set(booking.reference, booking);
      }
    });

    // Convert map back to array and sort
    const allBookings = Array.from(bookingMap.values());
    allBookings.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime(); // Sort by date, newest first
    });

    return allBookings;
  };

  // Refresh bookings data
  const handleRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  // Handle user logout
  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Logout Error', 'There was a problem logging out. Please try again.');
    }
  };

  // Navigate to make a new booking
  const handleNewBooking = () => {
    router.push('/booking');
  };

  // Format timestamp to readable date and time
  const formatBookingDate = (timestamp: Booking['createdAt']): string => {
    try {
      // Handle both Firestore Timestamp and regular Date objects
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, 'PPP p'); // Format like "Apr 29, 2025, 2:30 PM"
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid date';
    }
  };

  return (
    <ThemedView
      style={styles.container}
      lightColor={Colors.light.palette.primary.light}
      darkColor={Colors.dark.palette.primary.light}
    >
      <Stack.Screen options={{ 
        title: 'My Account',
        headerStyle: {
          backgroundColor: '#ffffff', // changed to white header
        },
        headerTintColor: '#000000', // changed tint to black
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImagePlaceholder}>
              <ThemedText style={styles.profileInitial}>
                {user?.email?.[0]?.toUpperCase() || 'A'}
              </ThemedText>
            </View>
          </View>
          
          <ThemedText style={styles.userEmail}>{user?.email || 'Guest'}</ThemedText>
          
          <View style={styles.accountActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleNewBooking}>
              <ThemedText style={styles.actionButtonText}>New Booking</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <ThemedText style={styles.logoutButtonText}>Sign Out</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* My Bookings Section */}
        <View style={styles.bookingsSection}>
          <ThemedText style={styles.sectionTitle}>My Bookings</ThemedText>
          
          {loading ? (
            <ActivityIndicator size="large" color="#21655A" style={styles.loader} />
          ) : bookings.length > 0 ? (
            bookings.map((booking, index) => (
              <View key={booking.id} style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <ThemedText style={styles.bookingDate}>
                    {formatBookingDate(booking.createdAt)}
                  </ThemedText>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: booking.status === 'confirmed' ? '#2ecc71' : '#f39c12' }
                  ]}>
                    <ThemedText style={styles.statusText}>
                      {booking.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                    </ThemedText>
                  </View>
                </View>
                
                <View style={styles.bookingDetails}>
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Service:</ThemedText>
                    <ThemedText style={styles.detailValue}>
                      {booking.serviceType === 'jetski' ? `Jet Skis (${booking.quantity})` : 
                       booking.serviceType === 'aqualounge' ? 'Aqua Lounge' : 'Guided Tours'}
                    </ThemedText>
                  </View>
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Quantity:</ThemedText>
                    <ThemedText style={styles.detailValue}>{booking.quantity}</ThemedText>
                  </View>
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Total:</ThemedText>
                    <ThemedText style={styles.detailValue}>${booking.totalAmount}</ThemedText>
                  </View>
                  {booking.notes && (
                    <View style={styles.notesContainer}>
                      <ThemedText style={styles.notesLabel}>Notes:</ThemedText>
                      <ThemedText style={styles.notesText}>{booking.notes}</ThemedText>
                    </View>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyStateText}>
                You don't have any bookings yet.
              </ThemedText>
              <TouchableOpacity style={styles.newBookingButton} onPress={handleNewBooking}>
                <ThemedText style={styles.newBookingButtonText}>Book Now</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

// Wrap the component with protected route HOC
export default withProtectedRoute(AccountPage);

const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    marginTop: 20,
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#21655A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
    lineHeight: 46, // Added line height for proper text rendering
    includeFontPadding: false, // Prevents Android from cutting off top of text
    textAlignVertical: 'center', // Ensures text is centered vertically (Android)
    paddingTop: 4, // Small padding to ensure character is visibly centered
  },
  userEmail: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333',
  },
  accountActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  actionButton: {
    backgroundColor: '#21655A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#f8f8f8',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 8,
  },
  logoutButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 24,
    marginHorizontal: 16,
  },
  bookingsSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#21655A',
  },
  loader: {
    marginTop: 30,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
  },
  bookingDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  bookingDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#555',
    width: 110,
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  notesContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
    color: '#555',
  },
  notesText: {
    fontSize: 15,
    color: '#333',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 12,
    marginTop: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  newBookingButton: {
    backgroundColor: '#21655A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  newBookingButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});