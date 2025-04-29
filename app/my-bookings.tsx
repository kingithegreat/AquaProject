import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { withProtectedRoute } from '@/hooks/withProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/config/firebase';

function MyBookingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (timeString) => {
    const time = new Date(timeString);
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
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
        return serviceType;
    }
  };

  // Fetch bookings from Firestore
  const fetchBookings = async () => {
    try {
      setLoading(true);
      if (!user?.uid) {
        console.log('No user logged in');
        setBookings([]);
        setLoading(false);
        return;
      }

      console.log('Fetching bookings for user:', user.uid);
      const q = query(
        collection(db, 'bookings'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const bookingData = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Handle createdAt field safely - it could be a Firestore timestamp, a Date object, or undefined
        let createdAtDate;
        if (data.createdAt) {
          // Check if it's a Firestore timestamp (has toDate() method) or already a Date
          createdAtDate = typeof data.createdAt.toDate === 'function' 
            ? data.createdAt.toDate() 
            : new Date(data.createdAt);
        } else {
          createdAtDate = new Date(); // Fallback if no date is available
        }
        
        bookingData.push({
          id: doc.id,
          ...data,
          createdAt: createdAtDate
        });
      });

      console.log(`Found ${bookingData.length} bookings`);
      setBookings(bookingData);
    } catch (error) {
      console.error('Error fetching bookings:', error);
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
              </View>

              {bookings.map((booking) => (
                <View key={booking.id} style={styles.bookingCard}>
                  <View style={styles.bookingCardHeader}>
                    <ThemedText style={styles.serviceType}>
                      {getServiceName(booking.serviceType, booking.quantity)}
                    </ThemedText>
                    <View style={styles.statusBadge}>
                      <ThemedText style={styles.statusText}>
                        {booking.status.toUpperCase()}
                      </ThemedText>
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
                    
                    {booking.addOns?.length > 0 && (
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
                  
                  <View style={styles.referenceContainer}>
                    <ThemedText style={styles.referenceLabel}>
                      Booking Reference:
                    </ThemedText>
                    <ThemedText style={styles.referenceNumber}>
                      {booking.reference}
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
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    color: '#fff',
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