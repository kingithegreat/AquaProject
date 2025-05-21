import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Modal,
  Platform,
  Alert
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';

import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { Colors } from '../constants/Colors';
import { withProtectedRoute } from '@/hooks/withProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { 
  getFirebaseFirestore, 
  checkOnlineStatus, 
  addToOfflineQueue, 
  checkConnectionWithTimeout,
  db 
} from '@/config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * BookingScreen Component
 * 
 * This screen allows users to book water activities with Aqua 360°.
 * Users can select date, time, service type, and add-ons.
 * The booking process includes:
 * 1. Date and time selection
 * 2. Service selection (Jet Skis, Aqua Lounge, or Guided Tours)
 * 3. Quantity selection for Jet Skis (1-4)
 * 4. Selection of add-on activities
 * 5. Review of booking summary and total cost
 * 6. Confirmation with booking reference
 */
function BookingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  // State for tracking waiver completion status
  const [waiverCompleted, setWaiverCompleted] = useState(false);
  const [checkingWaiver, setCheckingWaiver] = useState(true);
  
  // State for date and time selection
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // State for tracking selected service type
  const [selectedService, setSelectedService] = useState<string | null>(null);
  
  // State to track number of jet skis (1-4)
  const [jetSkiCount, setJetSkiCount] = useState(1);
  
  // Available add-ons with pricing and selection state
  const [addOns, setAddOns] = useState([
    { id: 1, name: 'Biscuit Ride (2-4 Person)', price: 70, selected: false, image: require('../assets/images/biscuir.jpg') },
    { id: 2, name: 'Wakeboard', price: 60, selected: false, image: require('../assets/images/wakeboard.webp') },
    { id: 3, name: 'Water Skis', price: 60, selected: false, image: require('../assets/images/skis.jpg') },
    { id: 4, name: 'Fishing Package', price: 70, selected: false, image: require('../assets/images/fishing.jpg') },
  ]);
  
  // State for confirmation modal visibility
  const [showConfirmation, setShowConfirmation] = useState(false);
    // State to store the generated booking reference number
  const [bookingReference, setBookingReference] = useState('');
  
  // Check waiver completion status when component loads
  useEffect(() => {
    const checkWaiverStatus = async () => {
      if (!user) {
        setCheckingWaiver(false);
        return;
      }
      
      try {
        // Check if user profile document exists and has waiver completed
        const userProfileRef = doc(db, 'userProfiles', user.uid);
        const userProfileSnap = await getDoc(userProfileRef);
        
        if (userProfileSnap.exists() && userProfileSnap.data().waiverCompleted) {
          setWaiverCompleted(true);
        } else {
          setWaiverCompleted(false);
        }
      } catch (error) {
        console.error('Error checking waiver status:', error);
        setWaiverCompleted(false);
      } finally {
        setCheckingWaiver(false);
      }
    };

    checkWaiverStatus();
  }, [user]);
  
  /**
   * Helper function to format date in a user-friendly way
   * @param {Date} date - Date object to format
   * @returns {string} Formatted date string (e.g., "Monday, April 28, 2025")
   */
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };
  
  /**
   * Helper function to format time in a user-friendly way
   * @param {Date} time - Time object to format
   * @returns {string} Formatted time string (e.g., "2:30 PM")
   */
  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };
  
  /**
   * Handles date selection from the date picker
   * Platform-specific behavior for iOS and Android
   */
  const handleDateChange = (event: DateTimePickerEvent, date: Date | undefined) => {
    setShowCalendar(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  /**
   * Handles time selection from the time picker
   * Platform-specific behavior for iOS and Android
   */
  const handleTimeChange = (event: DateTimePickerEvent, time: Date | undefined) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (time) {
      setSelectedTime(time);
    }
  };
  
  /**
   * Updates selected service type state
   * @param {string} service - Service identifier ('jetski', 'aqualounge', or 'tours')
   */
  const handleServiceSelect = (service: string) => {
    setSelectedService(service);
  };
  
  /**
   * Toggles selection state of an add-on item
   * @param {number} id - ID of the add-on to toggle
   */
  const handleAddOnToggle = (id: number) => {
    setAddOns(addOns.map(addon => 
      addon.id === id 
        ? { ...addon, selected: !addon.selected } 
        : addon
    ));
  };
  
  /**
   * Increases jet ski count (max 4)
   */
  const incrementJetSkis = () => {
    if (jetSkiCount < 4) {
      setJetSkiCount(jetSkiCount + 1);
    }
  };
  
  /**
   * Decreases jet ski count (min 1)
   */
  const decrementJetSkis = () => {
    if (jetSkiCount > 1) {
      setJetSkiCount(jetSkiCount - 1);
    }
  };
  
  /**
   * Calculates the total booking cost based on selected services and add-ons
   * @returns {number} Total booking cost in dollars
   */
  const calculateTotal = () => {
    let total = 0;
    
    // Base price based on service
    if (selectedService === 'jetski') {
      total += 130 * jetSkiCount; // $130 per jet ski for 30 minutes (updated price)
    } else if (selectedService === 'aqualounge') {
      total += 300; // $300 for 2-hour Aqua Lounge package (updated price)
    } else if (selectedService === 'tours') {
      total += 220; // $220 per hour for guided tours (updated price)
    }
    
    // Add-on costs
    addOns.forEach(addon => {
      if (addon.selected) {
        total += addon.price;
      }
    });
    
    return total;
  };
  
  /**
   * Handles booking confirmation
   * Validates required fields, generates booking reference, and shows confirmation modal
   */  const handleConfirmBooking = async () => {
    console.log('handleConfirmBooking start');
    
    if (!selectedService) {
      Alert.alert('Selection Required', 'Please select a service type.');
      return;
    }
    
    if (!user || !user.uid) {
      Alert.alert('Authentication Error', 'Please log in again before booking.');
      return;
    }
    
    // Check if waiver has been completed
    if (!waiverCompleted) {
      Alert.alert(
        'Waiver Required',
        'You must complete the waiver agreement before booking any activities.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Complete Waiver', onPress: () => router.push('/waiver') }
        ]
      );
      return;
    }
    
    // Generate random booking reference with 'BK-' prefix
    const ref = 'BK-' + Math.floor(100000 + Math.random() * 900000);
    setBookingReference(ref);
    
    try {
      // Create booking object with all relevant details
      const bookingData = {
        userId: user.uid,
        userEmail: user.email,
        reference: ref,
        date: selectedDate.toISOString(),
        time: selectedTime.toISOString(),
        serviceType: selectedService,
        quantity: selectedService === 'jetski' ? jetSkiCount : 1,
        addOns: addOns.filter(addon => addon.selected).map(addon => ({
          id: addon.id,
          name: addon.name,
          price: addon.price
        })),
        totalAmount: calculateTotal(),
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      };
      
      console.log('Preparing booking:', bookingData);      // Always store locally first to ensure we have a backup (except on web)
      if (Platform.OS !== 'web') {
        await AsyncStorage.setItem(`booking_${ref}`, JSON.stringify(bookingData));
        console.log('Booking saved to local storage');
      } else {
        console.log('Web platform detected - skipping AsyncStorage operation');
      }// First check if we're online to decide how to handle the booking
      const checkConnection = async () => {
        try {
          const isOnline = await checkConnectionWithTimeout(3000); // Check with a timeout
          return isOnline;
        } catch (error) {
          console.log('Network connection check failed:', error);
          return false; // Assume offline if the check fails
        }
      };
      
      // Try to save to Firestore with better error handling
      const saveToFirebase = async () => {
        const isOnline = await checkConnection();
        console.log('Network status check result:', isOnline ? 'online' : 'offline');
        
        if (!isOnline) {
          console.log('Device is offline, saving to queue for later sync');
          // Add directly to offline queue
          await addToOfflineQueue({
            type: 'booking',
            data: bookingData
          });
          return false;
        }
        
        try {
          // Try to save to Firestore with timeout for better reliability
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Firestore operation timed out')), 8000); // Increased timeout
          });
          
          const savePromise = addDoc(collection(db, 'bookings'), bookingData);
          
          // Race between the timeout and the save operation
          const result: any = await Promise.race([savePromise, timeoutPromise]);
          
          if (result && result.id) {
            console.log('Booking saved to Firestore with ID:', result.id);
            return true;
          } else {
            throw new Error('Invalid Firestore response');
          }
        } catch (firestoreError: any) {
          console.error('Firestore error:', firestoreError.message || firestoreError);
          // Add to offline queue for later sync
          await addToOfflineQueue({
            type: 'booking',
            data: bookingData
          });
          return false;
        }
      };

      // Try to save to Firestore but don't block the UI
      saveToFirebase().then(success => {
        if (!success) {
          console.log('Failed to save to Firestore, but booking is stored locally');
        }
      });
      
      // Show confirmation immediately after local save, don't wait for Firestore
      setShowConfirmation(true);
      
    } catch (error) {
      console.error('Error in booking process:', error);
      Alert.alert(
        'Booking Error',
        'There was a problem with your booking. Please try again later.'
      );
    }
  };
  
  /**
   * ServiceCard component - Displays a selectable service option
   * @param {Object} props - Component props
   * @param {string} props.title - Service title
   * @param {Object} props.image - Image source for the service
   * @param {Function} props.onPress - Function to call when service is selected
   * @param {boolean} props.selected - Whether this service is currently selected
   */
  const ServiceCard = ({ title, image, onPress, selected }: any) => (
    <TouchableOpacity
      style={[styles.serviceCard, selected && styles.selectedServiceCard]}
      onPress={onPress}
    >
      <Image source={image} style={styles.serviceImage} />
      <ThemedText style={[styles.serviceTitle, {color: '#21655A'}]}>
        {title}
      </ThemedText>
    </TouchableOpacity>
  );
  
  /**
   * AddOnOption component - Displays a selectable add-on option
   * @param {Object} props - Component props
   * @param {Object} props.item - Add-on item data
   * @param {boolean} props.selected - Whether this add-on is currently selected
   * @param {Function} props.onToggle - Function to call when add-on is toggled
   */
  const AddOnOption = ({ item, selected, onToggle }: any) => (
    <TouchableOpacity
      style={[styles.addOnOption, selected && styles.selectedAddOn]}
      onPress={onToggle}
    >
      <View style={styles.addOnContent}>
        <Image source={item.image} style={styles.addOnImage} />
        <View style={styles.addOnInfo}>
          <ThemedText style={styles.addOnName}>{item.name}</ThemedText>
          <ThemedText style={styles.addOnPrice}>${item.price}</ThemedText>
        </View>
      </View>
      <View style={[styles.checkboxContainer, selected && styles.selectedCheckbox]}>
        {selected && <Ionicons name="checkmark" size={20} color="#fff" />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Configure screen header */}
      <Stack.Screen options={{ title: 'Book Your Adventure' }} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Date Selection Section */}
        <View style={styles.section}>
          <ThemedText type="heading2" style={styles.sectionTitle}>Select Date</ThemedText>
          <TouchableOpacity
            style={styles.dateSelector}
            onPress={() => setShowCalendar(true)}
          >
            <ThemedText style={styles.dateText}>{formatDate(selectedDate)}</ThemedText>
            <Ionicons name="calendar" size={24} color={Colors.light.palette.secondary.main} />
          </TouchableOpacity>
        </View>
        
        {/* Time Selection Section */}
        <View style={styles.section}>
          <ThemedText type="heading2" style={styles.sectionTitle}>Select Time</ThemedText>
          <TouchableOpacity
            style={styles.dateSelector}
            onPress={() => setShowTimePicker(true)}
          >
            <ThemedText style={styles.dateText}>{formatTime(selectedTime)}</ThemedText>
            <Ionicons name="time-outline" size={24} color={Colors.light.palette.secondary.main} />
          </TouchableOpacity>
        </View>
        
        {/* Service Selection Section */}
        <View style={styles.section}>
          <ThemedText type="heading2" style={styles.sectionTitle}>Select Service</ThemedText>
          <View style={styles.serviceContainer}>
            <ServiceCard
              title="Jet Skis"
              image={require('../assets/images/Jetski-image.webp')}
              onPress={() => handleServiceSelect('jetski')}
              selected={selectedService === 'jetski'}
            />
            <ServiceCard
              title="Aqua Lounge"
              image={require('../assets/images/Aqua-lounge.webp')}
              onPress={() => handleServiceSelect('aqualounge')}
              selected={selectedService === 'aqualounge'}
            />
            <ServiceCard
              title="Guided Tours"
              image={require('../assets/images/tours2.png')}
              onPress={() => handleServiceSelect('tours')}
              selected={selectedService === 'tours'}
            />
          </View>
        </View>
        
        {/* Jet Ski Quantity Selection - Only shown when Jet Ski service is selected */}
        {selectedService === 'jetski' && (
          <View style={styles.section}>
            <ThemedText type="heading2" style={styles.sectionTitle}>Number of Jet Skis</ThemedText>
            <ThemedText style={styles.labelText}>Select how many jet skis you want to book:</ThemedText>
            <View style={styles.quantitySelector}>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={decrementJetSkis}
                disabled={jetSkiCount <= 1}
              >
                <Ionicons 
                  name="remove" 
                  size={24} 
                  color={jetSkiCount <= 1 ? '#ccc' : Colors.light.palette.secondary.main} 
                />
              </TouchableOpacity>
              <View style={styles.quantityTextContainer}>
                <ThemedText style={styles.jetSkiCountText}>{jetSkiCount}</ThemedText>
              </View>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={incrementJetSkis}
                disabled={jetSkiCount >= 4}
              >
                <Ionicons 
                  name="add" 
                  size={24} 
                  color={jetSkiCount >= 4 ? '#ccc' : Colors.light.palette.secondary.main} 
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* Add-ons Section - Only shown after a service is selected */}
        {selectedService && (
          <View style={styles.section}>
            <ThemedText type="heading2" style={styles.sectionTitle}>Add-ons</ThemedText>
            <View style={styles.addOnContainer}>
              {addOns.map((addOn) => (
                <AddOnOption
                  key={addOn.id}
                  item={addOn}
                  selected={addOn.selected}
                  onToggle={() => handleAddOnToggle(addOn.id)}
                />
              ))}
            </View>
          </View>
        )}
        
        {/* Booking Summary Section - Only shown after a service is selected */}
        {selectedService && (
          <View style={styles.section}>
            <ThemedText type="heading2" style={styles.sectionTitle}>Booking Summary</ThemedText>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>Date:</ThemedText>
                <ThemedText style={styles.summaryValue}>{formatDate(selectedDate)}</ThemedText>
              </View>
              
              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>Time:</ThemedText>
                <ThemedText style={styles.summaryValue}>{formatTime(selectedTime)}</ThemedText>
              </View>
              
              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>Service:</ThemedText>
                <ThemedText style={styles.summaryValue}>
                  {selectedService === 'jetski' ? `Jet Skis (${jetSkiCount})` : 
                   selectedService === 'aqualounge' ? 'Aqua Lounge' : 'Guided Tour'}
                </ThemedText>
              </View>
              
              {/* Display selected add-ons in summary */}
              {addOns.some(addon => addon.selected) && (
                <>
                  <ThemedText style={styles.summaryLabel}>Add-ons:</ThemedText>
                  {addOns.filter(addon => addon.selected).map(addon => (
                    <View key={addon.id} style={styles.summaryAddon}>
                      <ThemedText style={styles.summaryAddonName}>- {addon.name}</ThemedText>
                      <ThemedText style={styles.summaryAddonPrice}>${addon.price}</ThemedText>
                    </View>
                  ))}
                </>
              )}
              
              <View style={styles.divider} />
              
              {/* Total booking cost */}
              <View style={styles.summaryRow}>
                <ThemedText type="heading3" style={styles.totalLabel}>Total:</ThemedText>
                <ThemedText type="heading3" style={styles.totalValue}>${calculateTotal()}</ThemedText>
              </View>
            </View>
          </View>
        )}
          {/* Waiver Required Message - Only show when not loading and waiver not completed */}
        {!checkingWaiver && !waiverCompleted && (
          <View style={styles.waiverWarning}>
            <Ionicons name="warning-outline" size={20} color="#f44336" />
            <ThemedText style={styles.waiverWarningText}>
              Waiver completion required before booking
            </ThemedText>
            <TouchableOpacity onPress={() => router.push('/waiver')}>
              <ThemedText style={styles.waiverLinkText}>Complete Waiver</ThemedText>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Confirm Booking Button */}
        <TouchableOpacity
          style={[
            styles.confirmButton, 
            (!selectedService || (!waiverCompleted && !checkingWaiver)) && { opacity: 0.5 }
          ]}
          onPress={() => { console.log('Confirm button pressed'); handleConfirmBooking(); }}
          activeOpacity={0.7}
        >
          <ThemedText style={styles.confirmButtonText}>Confirm Booking</ThemedText>
        </TouchableOpacity>
      </ScrollView>
      
      {/* Date Picker Modal - iOS Only */}
      {Platform.OS === 'ios' && showCalendar && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showCalendar}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText type="heading3">Select Date</ThemedText>
                <TouchableOpacity onPress={() => setShowCalendar(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>              <DateTimePicker
                value={selectedDate}
                onChange={handleDateChange}
                mode="date"
                display="default"
                minimumDate={new Date()}
                maximumDate={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)} // 90 days from now
                textColor="#000000"
              />
              <TouchableOpacity
                style={styles.confirmDateButton}
                onPress={() => setShowCalendar(false)}
              >
                <ThemedText style={styles.confirmDateButtonText}>Confirm Date</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      
      {/* Time Picker Modal - iOS Only */}
      {Platform.OS === 'ios' && showTimePicker && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showTimePicker}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText type="heading3">Select Time</ThemedText>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>              <DateTimePicker
                value={selectedTime}
                onChange={handleTimeChange}
                mode="time"
                display="default"
                minuteInterval={15}
                textColor="#000000"
              />
              <TouchableOpacity
                style={styles.confirmDateButton}
                onPress={() => setShowTimePicker(false)}
              >
                <ThemedText style={styles.confirmDateButtonText}>Confirm Time</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      
      {/* Date Picker for Android - Appears as a dialog */}
      {Platform.OS === 'android' && showCalendar && (
        <DateTimePicker
          value={selectedDate}
          onChange={handleDateChange}
          mode="date"
          display="default"
          minimumDate={new Date()}
          maximumDate={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)} // 90 days from now
        />
      )}
      
      {/* Time Picker for Android - Appears as a dialog */}
      {Platform.OS === 'android' && showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          onChange={handleTimeChange}
          mode="time"
          display="default"
          minuteInterval={15}
        />
      )}
      
      {/* Booking Confirmation Modal */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={showConfirmation}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationModal}>
            <Image
              source={require('../assets/images/splash-icon.png')}
              style={styles.confirmationImage}
              resizeMode="contain"
            />
            
            <ThemedText type="heading2" style={styles.confirmationTitle}>
              Booking Confirmed!
            </ThemedText>
            
            <ThemedText style={styles.confirmationMessage}>
              Thank you for booking with Aqua 360°. Your adventure awaits!
            </ThemedText>
            
            {/* Display booking reference number */}
            <View style={styles.referenceContainer}>
              <ThemedText style={styles.referenceLabel}>Booking Reference:</ThemedText>
              <ThemedText type="heading3" style={styles.referenceNumber}>{bookingReference}</ThemedText>
            </View>
            
            {/* Confirmation details */}
            <View style={styles.confirmationDetails}>
              <ThemedText style={styles.confirmationDetail}>
                <Ionicons name="calendar" size={16} color={Colors.light.palette.secondary.main} /> {formatDate(selectedDate)}
              </ThemedText>
              <ThemedText style={styles.confirmationDetail}>
                <Ionicons name="time" size={16} color={Colors.light.palette.secondary.main} /> {formatTime(selectedTime)}
              </ThemedText>
              <ThemedText style={styles.confirmationDetail}>
                <Ionicons name="cash" size={16} color={Colors.light.palette.secondary.main} /> Total: ${calculateTotal()}
              </ThemedText>
            </View>
            
            {/* Done button - closes modal and navigates to account screen */}
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => {
                setShowConfirmation(false);
                router.replace('/account'); // Navigate to account page instead of home
              }}
            >
              <ThemedText style={styles.doneButtonText}>View My Bookings</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/**
 * Styles for the BookingScreen component
 */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.palette.primary.light,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    color: Colors.light.palette.secondary.main,
    marginBottom: 16,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.surfaceVariant,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600', // Increased from 500 to 600 for better readability
    color: Colors.light.palette.neutral[900],
  },
  serviceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  serviceCard: {
    width: '30%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: Colors.light.surfaceVariant,
  },
  selectedServiceCard: {
    borderColor: Colors.light.palette.primary.main,
  },
  serviceImage: {
    width: '100%',
    height: 80,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#21655A', // Change from white to the app's teal color
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#333333', // Change from white to dark gray
    marginBottom: 8,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#21655A', // Change from white to the app's teal color
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityTextContainer: {
    backgroundColor: 'rgba(33, 101, 90, 0.1)', // Light green background matching the theme
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    borderWidth: 2,
    borderColor: 'rgba(33, 101, 90, 0.3)',
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quantityText: {
    marginHorizontal: 20,
    fontSize: 24,
  },
  jetSkiCountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#21655A', // Darker color
    textAlign: 'center',
  },
  labelText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#21655A', // Changed to darker green for better contrast
    textShadowColor: 'rgba(255, 255, 255, 0.7)', // Adding text shadow for better readability
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  addOnContainer: {
    gap: 12,
  },
  addOnOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.surfaceVariant,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedAddOn: {
    borderColor: Colors.light.palette.primary.main,
  },
  addOnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addOnImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  addOnInfo: {
    flex: 1,
  },
  addOnName: {
    fontWeight: '700', // Changed from '500' to '700' for bolder text
    fontSize: 18, // Increased from 16 to 18
    color: Colors.light.palette.neutral[900], // Added explicit color with high contrast
  },
  addOnPrice: {
    color: Colors.light.palette.secondary.main,
    marginTop: 4,
    fontWeight: '600', // Changed from '500' to '600'
    fontSize: 16, // Added explicit font size
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.palette.neutral[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheckbox: {
    backgroundColor: Colors.light.palette.primary.main,
    borderColor: Colors.light.palette.primary.main,
  },
  summaryCard: {
    backgroundColor: Colors.light.surfaceVariant,
    padding: 16,
    borderRadius: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontWeight: '600', // Increased from 500 to 600
    fontSize: 16,
    color: Colors.light.palette.neutral[900],
  },
  summaryValue: {
    textAlign: 'right',
    fontSize: 16,
    fontWeight: '600', // Increased from 500 to 600
    color: Colors.light.palette.neutral[800],
  },
  summaryAddon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: 16,
    marginBottom: 4,
  },
  summaryAddonName: {
    color: Colors.light.palette.neutral[800],
    fontSize: 15,
    fontWeight: '500', // Added font weight
  },
  summaryAddonPrice: {
    color: Colors.light.palette.neutral[800],
    fontWeight: '600', // Increased from 500 to 600
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.palette.neutral[400],
    marginVertical: 12,
  },
  totalLabel: {
    fontWeight: '700', // Increased from 600 to 700
    color: Colors.light.palette.neutral[900], // Added explicit dark color for better contrast
  },
  totalValue: {
    color: Colors.light.palette.secondary.main,
    fontWeight: '700', // Increased from 600 to 700
    fontSize: 18, // Increased from default to 18
  },
  confirmButton: {
    backgroundColor: Colors.light.palette.secondary.main,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginVertical: 16,
  },
  confirmButtonText: {
    color: Colors.light.palette.secondary.contrast,
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  confirmDateButton: {
    backgroundColor: Colors.light.palette.secondary.main,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  confirmDateButtonText: {
    color: Colors.light.palette.secondary.contrast,
    fontWeight: '600',
    fontSize: 16,
  },
  confirmationModal: {
    width: '90%',
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  confirmationImage: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  confirmationTitle: {
    color: Colors.light.palette.secondary.main,
    marginBottom: 8,
  },
  confirmationMessage: {
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 16,
    fontWeight: '500', // Added font weight
    color: Colors.light.palette.neutral[800],
  },
  referenceContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  referenceLabel: {
    fontSize: 14,
    fontWeight: '500', // Added font weight
    color: Colors.light.palette.neutral[800],
    marginBottom: 4,
  },
  referenceNumber: {
    color: Colors.light.palette.secondary.main,
    fontWeight: '700', // Increased font weight
    fontSize: 18, // Increased font size
  },
  confirmationDetails: {
    width: '100%',
    gap: 8,
    marginBottom: 24,
  },
  confirmationDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    fontSize: 16, // Increased from 15 to 16
    fontWeight: '500', // Added font weight
    color: Colors.light.palette.neutral[800],
  },
  doneButton: {
    backgroundColor: Colors.light.palette.primary.main,
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 8,
  },  doneButtonText: {
    color: Colors.light.palette.primary.contrast,
    fontWeight: '600',
    fontSize: 16,
  },
  waiverWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  waiverWarningText: {
    color: '#f44336',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  waiverLinkText: {
    color: '#0066cc',
    fontWeight: '600',
    textDecorationLine: 'underline',
    marginLeft: 8,
  },
});

export default withProtectedRoute(BookingScreen);