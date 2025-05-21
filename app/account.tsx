import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, View, Image, Dimensions, Alert } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, syncOfflineData } from '@/config/firebase';
import { format } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/hooks/useAuth';
import withProtectedRoute from '@/hooks/withProtectedRoute';
import { Colors } from '@/constants/Colors';

// Define Booking type for proper state typing
interface Booking {
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
  // Additional properties for enhanced offline support
  syncing?: boolean;
  source?: 'local' | 'firestore';
  localVersion?: any; // To prevent recursive type definition
  synced?: boolean;
  userId?: string;
}

function AccountPage() {
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // Used to force re-render
  const [waiverCompleted, setWaiverCompleted] = useState(false);
  const [waiverLoading, setWaiverLoading] = useState(true);
  const [waiverCompletedDate, setWaiverCompletedDate] = useState<string | null>(null);
  
  // Fetch both local and remote bookings and trigger sync if needed
  useEffect(() => {
    const fetchAllBookings = async () => {
      if (!user || !user.uid) return;

      try {
        setLoading(true);
          // Try to sync any offline data first
        try {
          const didSync = await syncOfflineData();
          if (didSync) {
            console.log('Offline data synced on account page load');
          }
        } catch (syncError) {
          console.error('Error syncing offline data:', syncError);
          // Continue loading bookings even if sync fails
        }

        // Fetch both local and remote bookings in parallel with a small delay
        // after sync attempt to ensure we get the latest data
        setTimeout(async () => {
          const [firestoreBookings, localBookings] = await Promise.all([
            fetchFirestoreBookings(),
            fetchLocalBookings()
          ]);

          // Merge and deduplicate bookings
          const mergedBookings = mergeAndDeduplicateBookings(firestoreBookings, localBookings);
          setBookings(mergedBookings);
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        Alert.alert('Error', 'Could not load all your bookings. Please try again later.');
        setLoading(false);
      }
    };

    fetchAllBookings();
  }, [user, refreshKey]);
  // Fetch bookings from Firestore with improved data mapping
  const fetchFirestoreBookings = async (): Promise<Booking[]> => {
    try {
      const q = query(
        collection(db, 'bookings'),
        where('userId', '==', user?.uid)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data() as Omit<Booking, 'id'>;
        return {
          ...data,
          id: doc.id,
          isLocal: false,
          source: 'firestore' as 'firestore'
        };
      });
    } catch (error) {
      console.error('Error fetching Firestore bookings:', error);
      return [];
    }
  };
  // Fetch bookings from local storage with improved error handling and data validation
  const fetchLocalBookings = async (): Promise<Booking[]> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const bookingKeys = keys.filter(key => key.startsWith('booking_'));
      
      if (bookingKeys.length === 0) {
        console.log('No local bookings found in AsyncStorage');
        return [];
      }
      
      console.log(`Found ${bookingKeys.length} local bookings in AsyncStorage`);
      
      const localBookingsData = await AsyncStorage.multiGet(bookingKeys);
      const validBookings = localBookingsData
        .map(([key, value]) => {
          if (!value) {
            console.log(`Empty booking value for key: ${key}`);
            return null;
          }
          
          try {
            const booking = JSON.parse(value);
            
            // Validate booking data
            if (!booking.reference) {
              console.warn(`Booking without reference found: ${key}`);
              return null;
            }
            
            // Fix common data inconsistencies
            if (typeof booking.createdAt === 'string') {
              // Convert string dates to Date objects
              try {
                booking.createdAt = new Date(booking.createdAt);
              } catch (dateError) {
                console.warn(`Invalid date format in booking ${booking.reference}:`, dateError);
                booking.createdAt = new Date(); // Fallback to current date
              }
            }
            
            return {
              ...booking,
              id: key.replace('booking_', ''),
              isLocal: true,
              status: booking.status || 'pending sync', // Use existing status or default
              syncing: true // Flag to indicate this booking may need syncing
            };
          } catch (parseError) {
            console.error(`Error parsing booking ${key}:`, parseError);
            return null;
          }
        })
        .filter(booking => booking && booking.userId === user?.uid);
        
      console.log(`Returning ${validBookings.length} valid local bookings`);
      return validBookings;
    } catch (error) {
      console.error('Error fetching local bookings:', error);
      return [];
    }
  };
  // Merge and deduplicate bookings by reference number with improved error handling
  const mergeAndDeduplicateBookings = (firestoreBookings: Booking[], localBookings: Booking[]): Booking[] => {
    const bookingMap = new Map();

    console.log(`Merging ${firestoreBookings.length} Firestore bookings and ${localBookings.length} local bookings`);

    // Add all Firestore bookings to the map
    firestoreBookings.forEach(booking => {
      try {
        if (booking.reference) {
          bookingMap.set(booking.reference, {
            ...booking,
            source: 'firestore'
          });
        } else {
          bookingMap.set(booking.id, {
            ...booking,
            source: 'firestore'
          });
        }
      } catch (error) {
        console.error('Error processing Firestore booking:', error);
      }
    });

    // Process local bookings - prioritize Firestore versions but flag conflicts
    localBookings.forEach(booking => {
      try {
        if (!booking.reference) {
          console.warn('Local booking has no reference number, skipping:', booking);
          return;
        }
        
        const existingBooking = bookingMap.get(booking.reference);
        
        if (!existingBooking) {
          // This booking only exists locally
          bookingMap.set(booking.reference, {
            ...booking,
            source: 'local'
          });
        } else if (booking.syncing) {
          // Mark that this booking exists in both places for UI treatment
          bookingMap.set(booking.reference, {
            ...existingBooking,
            localVersion: booking,
            synced: true
          });
        }
      } catch (error) {
        console.error('Error processing local booking:', error);
      }
    });

    // Convert map back to array and sort, with better error handling
    const allBookings = Array.from(bookingMap.values());
    
    // Safe sort with error handling
    try {
      allBookings.sort((a, b) => {
        try {
          const getDateValue = (booking: any) => {
            try {
              if (booking.createdAt?.toDate) return booking.createdAt.toDate().getTime();
              if (booking.createdAt instanceof Date) return booking.createdAt.getTime();
              if (typeof booking.createdAt === 'string') return new Date(booking.createdAt).getTime();
              return 0; // Default value if no valid date found
            } catch (dateError) {
              console.warn('Error processing date:', dateError);
              return 0;
            }
          };
          
          return getDateValue(b) - getDateValue(a); // Sort by date, newest first
        } catch (sortError) {
          console.error('Error during sort comparison:', sortError);
          return 0;
        }
      });
    } catch (error) {
      console.error('Error sorting bookings:', error);
    }

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

  // Fetch waiver status
  useEffect(() => {
    const fetchWaiverStatus = async () => {
      if (!user) {
        setWaiverLoading(false);
        return;
      }
      
      try {
        const userProfileRef = doc(db, 'userProfiles', user.uid);
        const userProfileSnap = await getDoc(userProfileRef);
        
        if (userProfileSnap.exists()) {
          const userData = userProfileSnap.data();
          setWaiverCompleted(userData.waiverCompleted || false);
          setWaiverCompletedDate(userData.waiverCompletedAt || null);
        } else {
          setWaiverCompleted(false);
          setWaiverCompletedDate(null);
        }
      } catch (error) {
        console.error('Error fetching waiver status:', error);
        setWaiverCompleted(false);
        setWaiverCompletedDate(null);
      } finally {
        setWaiverLoading(false);
      }
    };
    
    fetchWaiverStatus();
  }, [user]);

  // Navigate to make a new booking
  const handleNewBooking = () => {
    router.push('/booking');
  };
  // Format timestamp to readable date and time with improved error handling
  const formatBookingDate = (timestamp: Booking['createdAt']): string => {
    try {
      // Handle different timestamp formats safely
      let date: Date;
      
      if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
        // Firestore Timestamp object
        date = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        // JavaScript Date object
        date = timestamp;
      } else if (typeof timestamp === 'string') {
        // ISO string date
        date = new Date(timestamp);
      } else {
        // Fallback
        console.warn('Unknown date format:', timestamp);
        return 'Unknown date';
      }
      
      if (isNaN(date.getTime())) {
        console.warn('Invalid date value:', timestamp);
        return 'Invalid date';
      }
      
      return format(date, 'PPP p'); // Format like "Apr 29, 2025, 2:30 PM"
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Error formatting date';
    }
  };

  return (
    <ThemedView
      style={styles.container}
      lightColor="#52D6E2" // Changed to match the app's main teal color
      darkColor="#52D6E2" // Same for dark mode for consistency
    >
      <Stack.Screen options={{ 
        title: 'My Account',
        headerStyle: {
          backgroundColor: '#ffffff', // Changed to white
        },
        headerTintColor: '#21655A', // Changed to teal to match the app's color scheme
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Section */}
        <View style={styles.profileSection}>          <View style={styles.profileImageContainer}>
            <Image 
              source={require('../assets/images/aqua-360-logo.png')} 
              style={styles.profileImage}
              resizeMode="contain"
            />
          </View>
          
          <ThemedText style={styles.userEmail}>{user?.email || 'Guest'}</ThemedText>
          
          <View style={styles.accountActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleNewBooking}>
              <ThemedText style={styles.actionButtonText}>New Booking</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <ThemedText style={styles.logoutButtonText}>Sign Out</ThemedText>
            </TouchableOpacity>          </View>
        </View>

        {/* Waiver Status Section */}
        <View style={styles.waiverStatusSection}>
          <ThemedText style={styles.waiverStatusTitle}>Safety Waiver Status</ThemedText>
          
          {waiverLoading ? (
            <ActivityIndicator size="small" color="#21655A" style={styles.smallLoader} />
          ) : (
            <View style={styles.waiverStatusContent}>
              <View style={[
                styles.waiverStatusBadge,
                waiverCompleted ? styles.waiverCompletedBadge : styles.waiverPendingBadge
              ]}>
                <Ionicons 
                  name={waiverCompleted ? "checkmark-circle" : "alert-circle"} 
                  size={20} 
                  color={waiverCompleted ? "#ffffff" : "#ffffff"} 
                />
                <ThemedText style={styles.waiverStatusText}>
                  {waiverCompleted ? "Waiver Completed" : "Waiver Not Completed"}
                </ThemedText>
              </View>
              
              {waiverCompleted && waiverCompletedDate && (
                <ThemedText style={styles.waiverCompletedDate}>
                  Completed on: {new Date(waiverCompletedDate).toLocaleDateString()}
                </ThemedText>
              )}
              
              {!waiverCompleted && (
                <TouchableOpacity 
                  style={styles.completeWaiverButton}
                  onPress={() => router.push('/waiver')}
                >
                  <ThemedText style={styles.completeWaiverButtonText}>Complete Waiver</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* My Bookings Section */}
        <View style={styles.bookingsSection}>
          <ThemedText style={styles.sectionTitle}>My Bookings</ThemedText>
          
          {loading ? (
            <ActivityIndicator size="large" color="#21655A" style={styles.loader} />
          ) : bookings.length > 0 ? (            bookings.map((booking, index) => (
              <View key={booking.id || `booking-${index}`} style={[
                styles.bookingCard,
                booking.isLocal && styles.localBookingCard
              ]}>
                {booking.synced && (
                  <View style={styles.syncBadge}>
                    <Ionicons name="sync" size={14} color="#fff" />
                    <ThemedText style={styles.syncText}>Synced</ThemedText>
                  </View>
                )}
                
                <View style={styles.bookingHeader}>
                  <ThemedText style={styles.bookingDate}>
                    {formatBookingDate(booking.createdAt)}
                  </ThemedText>
                  <View style={[
                    styles.statusBadge,
                    booking.isLocal ? 
                      { backgroundColor: '#f39c12' } : // Local always shows as pending
                      { backgroundColor: booking.status === 'confirmed' ? '#2ecc71' : '#f39c12' }
                  ]}>
                    <ThemedText style={styles.statusText}>
                      {booking.isLocal ? 'Pending Sync' : 
                       booking.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                    </ThemedText>
                  </View>
                </View>
                
                {booking.reference && (
                  <View style={styles.referenceRow}>
                    <ThemedText style={styles.referenceLabel}>Ref #:</ThemedText>
                    <ThemedText style={styles.referenceValue}>{booking.reference}</ThemedText>
                  </View>
                )}
                
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
                    <ThemedText style={styles.detailValue}>{booking.quantity || 1}</ThemedText>
                  </View>
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Total:</ThemedText>
                    <ThemedText style={styles.detailValue}>${booking.totalAmount || 0}</ThemedText>
                  </View>
                  {booking.notes && (
                    <View style={styles.notesContainer}>
                      <ThemedText style={styles.notesLabel}>Notes:</ThemedText>
                      <ThemedText style={styles.notesText}>{booking.notes}</ThemedText>
                    </View>
                  )}
                </View>
                
                {booking.isLocal && (
                  <View style={styles.localIndicator}>
                    <Ionicons name="cloud-offline" size={16} color="#f39c12" />
                    <ThemedText style={styles.localText}>Stored on device</ThemedText>
                  </View>
                )}
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
    backgroundColor: '#52D6E2', // Explicitly set the background color
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#52D6E2', // Added explicit background color
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
  },  profileImageContainer: {
    marginBottom: 16,
    marginTop: 30, // Increased top margin to further shift the image down
  },profileImage: {
    width: 150,
    height: 150,
    borderRadius: 10, // Slightly rounded corners for the logo
  },// Profile placeholder styles removed as we're using logo image now
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
  },  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  localBookingCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
  },
  syncBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#3498db',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  referenceRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  referenceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    width: 50,
  },
  referenceValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  localIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(243, 156, 18, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  localText: {
    fontSize: 12,
    color: '#f39c12',
    marginLeft: 4,
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
  },  newBookingButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },  // Waiver Status Section Styles
  waiverStatusSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  waiverStatusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#21655A',
    marginBottom: 12,
  },
  waiverStatusContent: {
    alignItems: 'center',
  },
  waiverStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  waiverCompletedBadge: {
    backgroundColor: '#2ecc71',
  },
  waiverPendingBadge: {
    backgroundColor: '#f39c12',
  },
  waiverStatusText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
  },
  waiverCompletedDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  completeWaiverButton: {
    backgroundColor: '#21655A',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 8,
  },
  completeWaiverButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  smallLoader: {
    marginVertical: 10,
  },
});