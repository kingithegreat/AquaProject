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
import { collection, query, where, getDocs, orderBy, addDoc, doc, updateDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '../components/ThemedText';
import { Colors } from '../constants/Colors';
import { withProtectedRoute } from '../hooks/withProtectedRoute';
import { useAuth } from '../hooks/useAuth';
import { db } from '../config/firebase';

function MyBookingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [syncInProgress, setSyncInProgress] = useState(false);

  // Subscribe to network state
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const isConnected = state.isConnected;
      console.log(`Network status changed: ${isConnected ? 'online' : 'offline'}`);
      setIsConnected(isConnected);
      
      // When connection is restored, try to sync offline bookings
      if (isConnected) {
        syncLocalBookingsToFirestore();
      }
    });
    
    return () => unsubscribe();
  }, [user]);

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

  // Sync locally stored bookings to Firestore when online
  const syncLocalBookingsToFirestore = async () => {
    if (!user?.uid || !isConnected || syncInProgress) return;

    try {
      setSyncInProgress(true);
      const localBookingsJSON = await AsyncStorage.getItem('local_bookings');
      
      if (!localBookingsJSON) {
        setSyncInProgress(false);
        return;
      }
      
      const localBookings = JSON.parse(localBookingsJSON);
      const unsyncedBookings = localBookings.filter(booking => 
        booking.userId === user.uid && booking.syncedToFirestore === false
      );
      
      if (unsyncedBookings.length === 0) {
        setSyncInProgress(false);
        return;
      }
      
      console.log(`Found ${unsyncedBookings.length} unsynced bookings to upload to Firestore`);
      
      for (const booking of unsyncedBookings) {
        try {
          // Remove local ID and synced flag before saving to Firestore
          const { id, syncedToFirestore, ...bookingData } = booking;
          
          const bookingRef = await addDoc(collection(db, 'bookings'), bookingData);
          console.log(`Synced local booking to Firestore with ID: ${bookingRef.id}`);
          
          // Update the local copy to mark as synced
          booking.syncedToFirestore = true;
          booking.id = bookingRef.id;
        } catch (error) {
          console.error('Error syncing booking to Firestore:', error);
        }
      }
      
      // Update local storage with the new sync status
      await AsyncStorage.setItem('local_bookings', JSON.stringify(localBookings));
      console.log('Updated local bookings with sync status');
      
    } catch (error) {
      console.error('Error during booking sync:', error);
    } finally {
      setSyncInProgress(false);
    }
  };

  // Load all bookings - both from Firestore and local storage
  const fetchAllBookings = async () => {
    try {
      setLoading(true);
      if (!user?.uid) {
        console.log('No user logged in');
        setBookings([]);
        setLoading(false);
        return;
      }

      // First, try to load from local storage for immediate display
      let allBookings = [];
      try {
        const storedBookings = await AsyncStorage.getItem('local_bookings');
        if (storedBookings) {
          const parsedBookings = JSON.parse(storedBookings);
          // Filter for this user's bookings only
          const userBookings = parsedBookings.filter(booking => booking.userId === user.uid);
          allBookings = [...userBookings];
          console.log(`Loaded ${userBookings.length} bookings from local storage`);
          
          // If we have local data, update the UI immediately
          if (userBookings.length > 0) {
            setBookings(userBookings);
          }
        }
      } catch (localError) {
        console.warn('Error loading from local storage:', localError);
      }

      // Then try to fetch from Firestore if online
      if (isConnected) {
        try {
          console.log('Fetching bookings from Firestore for user:', user.uid);
          const q = query(
            collection(db, 'bookings'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
          );

          const querySnapshot = await getDocs(q);
          const firestoreBookings = [];
          
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            let createdAtDate;
            
            if (data.createdAt) {
              createdAtDate = typeof data.createdAt.toDate === 'function' 
                ? data.createdAt.toDate() 
                : new Date(data.createdAt);
            } else {
              createdAtDate = new Date();
            }
            
            firestoreBookings.push({
              id: doc.id,
              ...data,
              createdAt: createdAtDate,
              syncedToFirestore: true
            });
          });

          console.log(`Found ${firestoreBookings.length} bookings in Firestore`);
          
          // Merge firestore bookings with local bookings, avoiding duplicates
          const firestoreIds = new Set(firestoreBookings.map(b => b.id));
          const localOnlyBookings = allBookings.filter(b => !b.syncedToFirestore || !firestoreIds.has(b.id));
          
          // Combine and sort by date
          allBookings = [...firestoreBookings, ...localOnlyBookings].sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
          });

          // Update AsyncStorage with the complete list
          await AsyncStorage.setItem('local_bookings', JSON.stringify(allBookings));
        } catch (firestoreError) {
          console.error('Error fetching from Firestore:', firestoreError);
          
          // If Firestore fetch fails, continue with local bookings
          if (!allBookings.length) {
            console.log('Using only local bookings due to Firestore error');
          }
        }
      } else {
        console.log('Offline: Using only local bookings');
      }
      
      setBookings(allBookings);
      
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
    fetchAllBookings();
  }, [user, isConnected]);

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchAllBookings();
  };

  // Cancel booking function
  const handleCancelBooking = async (bookingId, reference) => {
    Alert.alert(
      "Cancel Booking",
      `Are you sure you want to cancel booking ${reference}?`,
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes, Cancel", 
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              
              // First update local storage to ensure immediate UI feedback
              const localBookingsJSON = await AsyncStorage.getItem('local_bookings');
              if (localBookingsJSON) {
                const localBookings = JSON.parse(localBookingsJSON);
                const updatedBookings = localBookings.map(booking => {
                  if (booking.id === bookingId || booking.reference === reference) {
                    return { ...booking, status: 'cancelled' };
                  }
                  return booking;
                });
                
                await AsyncStorage.setItem('local_bookings', JSON.stringify(updatedBookings));
                
                // Update UI immediately
                setBookings(prevBookings => 
                  prevBookings.map(booking => {
                    if (booking.id === bookingId || booking.reference === reference) {
                      return { ...booking, status: 'cancelled' };
                    }
                    return booking;
                  })
                );
                
                // If online, update Firestore as well
                if (isConnected && bookingId && !bookingId.startsWith('local-')) {
                  try {
                    // Using the Firestore update method to change the status to cancelled
                    const bookingRef = doc(db, 'bookings', bookingId);
                    await updateDoc(bookingRef, {
                      status: 'cancelled',
                      cancelledAt: new Date()
                    });
                    console.log(`Booking ${reference} cancelled in Firestore`);
                  } catch (firestoreError) {
                    console.error('Error updating Firestore:', firestoreError);
                    // The local state is already updated, so the user still sees the cancellation
                    Alert.alert(
                      "Network Issue", 
                      "Your booking has been cancelled locally, but we couldn't update our servers. It will sync when your connection improves."
                    );
                  }
                }
                
                Alert.alert("Success", `Booking ${reference} has been cancelled.`);
              }
            } catch (error) {
              console.error("Error cancelling booking:", error);
              Alert.alert("Error", "There was a problem cancelling your booking. Please try again.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
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

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => handleCancelBooking(booking.id, booking.reference)}
                  >
                    <ThemedText style={styles.cancelButtonText}>Cancel Booking</ThemedText>
                  </TouchableOpacity>
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
  cancelButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    margin: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default withProtectedRoute(MyBookingsScreen);