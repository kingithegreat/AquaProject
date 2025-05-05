/**
 * About Us Screen for Aqua 360° App
 * 
 * This screen displays information about the business, including:
 * - Company overview
 * - Available services with interactive carousel
 * - Operating hours
 * - Contact information
 * 
 * The screen features a horizontal carousel of services that can be tapped
 * to view more details in a modal popup.
 */
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Modal, 
  Dimensions, 
  Platform, 
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Pressable,
  FlatList
} from 'react-native';
import { BlurView } from 'expo-blur';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import ReviewCard from '../components/ui/ReviewCard';

// Define interfaces for our data
interface Review {
  id: string;
  author: string;
  text: string;
  rating: number;
}

interface AddOn {
  id: number;
  name: string;
  price: number;
  selected: boolean;
  image: any;
}

// Enhanced service type that matches the booking page's structure
interface Service {
  id: number;
  type: 'jetski' | 'aqualounge' | 'tours' | 'biscuit' | 'wakeboard' | 'fishing' | string;
  name: string;
  description: string;
  image: any;
  basePrice: number;
  formattedPrice: string;
  duration: string;
  addOns?: AddOn[];
}

export default function AboutUsScreen() {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([]);
  const [jetSkiCount, setJetSkiCount] = useState(1);
  const [activeTab, setActiveTab] = useState('services');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Available add-ons with pricing
  const availableAddOns: AddOn[] = [
    { id: 1, name: 'Biscuit Ride', price: 60, selected: false, image: require('../assets/images/biscuir.jpg') },
    { id: 2, name: 'Wakeboard', price: 50, selected: false, image: require('../assets/images/wakeboard.webp') },
    { id: 3, name: 'Water Skis', price: 50, selected: false, image: require('../assets/images/skis.jpg') },
    { id: 4, name: 'Fishing Package', price: 60, selected: false, image: require('../assets/images/fishing.jpg') },
  ];

  // Fetch reviews from Firestore
  useEffect(() => {
    // Reset the selected add-ons when the selected service changes
    if (selectedService) {
      setSelectedAddOns([...availableAddOns.map(addon => ({...addon, selected: false}))]);
      setJetSkiCount(1);
    }
  }, [selectedService]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const reviewsRef = collection(db, 'reviews');
        const q = query(reviewsRef, orderBy('timestamp', 'desc'), limit(5));
        const querySnapshot = await getDocs(q);
        
        const fetchedReviews: Review[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedReviews.push({
            id: doc.id,
            author: data.author || 'Anonymous',
            text: data.text || '',
            rating: data.rating || 5
          });
        });
        
        setReviews(fetchedReviews);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);
  
  // List of services offered based on Aqua360 website
  const services: Service[] = [
    { 
      id: 1,
      type: 'jetski',
      name: 'Jet Ski Rental', 
      description: 'Experience the thrill of riding our premium Sea-Doo GTI 130 jet skis in the beautiful Bay of Plenty. Perfect for beginners and experienced riders alike. Feel the freedom and extreme exhilaration that Aqua 360° provides while our A-Team ensures your safety on the water.', 
      image: require('../assets/images/Jetski-image.webp'),
      basePrice: 110,
      formattedPrice: '$110 per 30 minutes',
      duration: '30 minutes - 2 hours',
      addOns: availableAddOns
    },
    { 
      id: 2, 
      type: 'aqualounge',
      name: 'Aqua Lounge', 
      description: 'Bring your family and friends and let Aqua 360° take care of the rest. Our Aqua Lounge package includes a beach dome, BBQ setup, and all the amenities you need for a perfect day by the water. Relax in comfort while enjoying the beautiful views of Mount Maunganui.', 
      image: require('../assets/images/Aqua-lounge.webp'),
      basePrice: 250,
      formattedPrice: '$250 for 2 hours',
      duration: '2 hours',
      addOns: availableAddOns.slice(0, 3)
    },
    { 
      id: 3, 
      type: 'tours',
      name: 'Guided Tours', 
      description: 'Discover some of Tauranga\'s most hidden gems lying in our backyard! Our guided jet ski tours take you to the most beautiful spots around Mount Maunganui and the Bay of Plenty. Let our experienced guides show you the natural beauty of the area from a unique perspective.', 
      image: require('../assets/images/tours2.png'),
      basePrice: 195,
      formattedPrice: '$195 per hour',
      duration: '1-3 hours',
      addOns: availableAddOns.slice(0, 2)
    },
    {
      id: 4,
      type: 'biscuit',
      name: 'Biscuit Rides',
      description: 'Hold on tight for the ride of your life! Our biscuit rides (also known as tube rides) offer pure adrenaline as you\'re towed behind one of our boats on an inflatable tube. Perfect for thrill-seekers of all ages who want to experience the excitement of bouncing across the water at speed.',
      image: require('../assets/images/biscuir.jpg'),
      basePrice: 60,
      formattedPrice: '$60 per session',
      duration: '30 minutes',
      addOns: []
    },
    {
      id: 5,
      type: 'wakeboard',
      name: 'Wakeboarding',
      description: 'Experience the thrill of wakeboarding with Aqua 360°! Whether you\'re a beginner looking to learn the basics or an experienced rider wanting to perfect your tricks, our expert instructors will guide you every step of the way. Enjoy cutting through the water on our professional-grade equipment.',
      image: require('../assets/images/wakeboard.webp'),
      basePrice: 50,
      formattedPrice: '$50 per session',
      duration: '30 minutes',
      addOns: []
    },
    { 
      id: 6, 
      type: 'fishing',
      name: 'Jet Ski Fishing', 
      description: 'Don\'t let this one get away! Choose your own fishing adventure today. Cruise the waters and catch a big one on a jet ski fishing adventure. Our fishing packages come with all the equipment you need for a successful day on the water.', 
      image: require('../assets/images/fishing.jpg'),
      basePrice: 175,
      formattedPrice: '$175 for 2 hours',
      duration: '2-4 hours',
      addOns: [availableAddOns[3]]
    },
  ];

  const handleServicePress = (service: Service) => {
    setSelectedService(service);
  };

  const toggleAddOn = (addOn: AddOn) => {
    setSelectedAddOns(
      selectedAddOns.map(item => 
        item.id === addOn.id 
          ? { ...item, selected: !item.selected } 
          : item
      )
    );
  };

  const incrementJetSkis = () => {
    if (jetSkiCount < 4) {
      setJetSkiCount(jetSkiCount + 1);
    }
  };

  const decrementJetSkis = () => {
    if (jetSkiCount > 1) {
      setJetSkiCount(jetSkiCount - 1);
    }
  };

  const calculateTotal = () => {
    if (!selectedService) return 0;
    
    let total = selectedService.basePrice;
    
    // For jet skis, multiply by quantity
    if (selectedService.type === 'jetski') {
      total *= jetSkiCount;
    }
    
    // Add the cost of selected add-ons
    selectedAddOns.forEach(addon => {
      if (addon.selected) {
        total += addon.price;
      }
    });
    
    return total;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#52D6E2' }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: '#52D6E2' }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={true}
      >
        <ThemedView style={styles.contentBox}>
          <ThemedText style={styles.sectionTitle}>Our Story</ThemedText>
          <ThemedText style={styles.paragraph}>
            Founded in 2023 with a passion for watersports, Aqua 360° has quickly established itself as Rotorua's premier destination for water activities. 
            Our mission is to provide accessible, safe, and unforgettable aquatic experiences for visitors and locals alike.
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            Located on the picturesque shores of Lake Rotorua, we offer a wide range of services including jet ski rentals, 
            water skiing, wake boarding, guided fishing trips, and boat tours. Our experienced staff are dedicated to 
            ensuring your safety while helping you create lasting memories on the water.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.contentBox}>
          <ThemedText style={styles.sectionTitle}>Our Services</ThemedText>
          <ThemedText style={styles.paragraph}>
            Explore our range of exciting water activities and services:
          </ThemedText>
          
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.servicesContainer}
          >
            {services.map((service) => (
              <TouchableOpacity 
                key={service.id}
                style={styles.serviceCard}
                onPress={() => handleServicePress(service)}
                activeOpacity={0.9}
              >
                <Image source={service.image} style={styles.serviceImage} />
                <View style={styles.serviceTextContainer}>
                  <ThemedText style={styles.serviceName}>{service.name}</ThemedText>
                  <ThemedText style={styles.servicePrice}>{service.formattedPrice}</ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ThemedView>

        <ThemedView style={styles.contentBox}>
          <View style={styles.hoursTitleContainer}>
            <ThemedText style={styles.sectionTitle}>Operating Hours</ThemedText>
            <Ionicons name="time-outline" size={24} color="#21655A" />
          </View>
          
          <View style={styles.hoursContainer}>
            <View style={styles.hoursRow}>
              <ThemedText style={styles.hoursDay}>Monday - Friday</ThemedText>
              <ThemedText style={styles.hoursTime}>9:00 AM - 6:00 PM</ThemedText>
            </View>
            <View style={styles.hoursRow}>
              <ThemedText style={styles.hoursDay}>Saturday</ThemedText>
              <ThemedText style={styles.hoursTime}>8:00 AM - 7:00 PM</ThemedText>
            </View>
            <View style={styles.hoursRow}>
              <ThemedText style={styles.hoursDay}>Sunday</ThemedText>
              <ThemedText style={styles.hoursTime}>10:00 AM - 5:00 PM</ThemedText>
            </View>
            <View style={styles.hoursNote}>
              <Ionicons name="information-circle-outline" size={18} color="#21655A" />
              <ThemedText style={styles.noteText}>Hours may vary during holidays & peak season</ThemedText>
            </View>
          </View>
        </ThemedView>

        <ThemedView style={styles.contentBox}>
          <ThemedText style={styles.sectionTitle}>Customer Reviews</ThemedText>
          
          {loading ? (
            <ActivityIndicator size="large" color="#21655A" style={styles.loader} />
          ) : (
            <ScrollView 
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.reviewsContainer}
            >
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <ReviewCard 
                    key={review.id}
                    author={review.author}
                    rating={review.rating}
                    text={review.text}
                  />
                ))
              ) : (
                <ThemedText style={styles.noReviews}>No reviews yet. Be the first to leave one!</ThemedText>
              )}
            </ScrollView>
          )}
          
          <TouchableOpacity 
            style={styles.reviewsButton}
            onPress={() => router.push('/reviews')}
          >
            <ThemedText style={styles.reviewsButtonText}>Read All Reviews</ThemedText>
            <Ionicons name="arrow-forward" size={18} color="#ffffff" />
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.contentBox}>
          <ThemedText style={styles.sectionTitle}>Contact Us</ThemedText>
          
          <View style={styles.contactInfo}>
            <View style={styles.contactRow}>
              <Ionicons name="location-outline" size={22} color="#21655A" />
              <ThemedText style={styles.contactText}>123 Lake Front Road, Rotorua, New Zealand</ThemedText>
            </View>
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={22} color="#21655A" />
              <ThemedText style={styles.contactText}>+64 7 123 4567</ThemedText>
            </View>
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={22} color="#21655A" />
              <ThemedText style={styles.contactText}>info@aqua360.co.nz</ThemedText>
            </View>
          </View>
        </ThemedView>

        <View style={styles.footerContainer}>
          <ThemedText style={styles.footerText}>© 2025 Aqua 360° Ltd. All rights reserved.</ThemedText>
        </View>
      </ScrollView>

      {/* Service Detail Modal with Booking Features */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={selectedService !== null}
        onRequestClose={() => setSelectedService(null)}
      >
        {selectedService && (
          <View style={styles.modalContainer}>
            <ScrollView style={styles.modalScrollView}>
              <BlurView intensity={90} tint="light" style={styles.modalContent}>
                <Image source={selectedService.image} style={styles.modalImage} />
                <View style={styles.modalHeader}>
                  <ThemedText style={styles.modalTitle}>{selectedService.name}</ThemedText>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setSelectedService(null)}
                  >
                    <Ionicons name="close" size={28} color="#21655A" />
                  </TouchableOpacity>
                </View>
                
                {/* Tabs for navigating between service info and booking options */}
                <View style={styles.tabsContainer}>
                  <TouchableOpacity 
                    style={[styles.tab, activeTab === 'services' && styles.activeTab]}
                    onPress={() => setActiveTab('services')}
                  >
                    <ThemedText style={[styles.tabText, activeTab === 'services' && styles.activeTabText]}>
                      Service Info
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.tab, activeTab === 'booking' && styles.activeTab]}
                    onPress={() => setActiveTab('booking')}
                  >
                    <ThemedText style={[styles.tabText, activeTab === 'booking' && styles.activeTabText]}>
                      Booking Options
                    </ThemedText>
                  </TouchableOpacity>
                </View>
                
                {/* Content based on active tab */}
                {activeTab === 'services' ? (
                  <>
                    <ThemedText style={styles.modalDescription}>{selectedService.description}</ThemedText>
                    <View style={styles.modalDetailsContainer}>
                      <View style={styles.modalDetailItem}>
                        <Ionicons name="cash-outline" size={24} color="#21655A" />
                        <ThemedText style={styles.modalDetailText}>{selectedService.formattedPrice}</ThemedText>
                      </View>
                      <View style={styles.modalDetailItem}>
                        <Ionicons name="time-outline" size={24} color="#21655A" />
                        <ThemedText style={styles.modalDetailText}>{selectedService.duration}</ThemedText>
                      </View>
                    </View>
                  </>
                ) : (
                  <View style={styles.bookingOptionsContainer}>
                    {/* Jet Ski Quantity Selector - Only for Jet Ski service */}
                    {selectedService.type === 'jetski' && (
                      <View style={styles.quantityContainer}>
                        <ThemedText style={styles.optionTitle}>Number of Jet Skis</ThemedText>
                        <View style={styles.quantitySelector}>
                          <TouchableOpacity 
                            style={styles.quantityButton}
                            onPress={decrementJetSkis}
                            disabled={jetSkiCount <= 1}
                          >
                            <Ionicons 
                              name="remove" 
                              size={24} 
                              color={jetSkiCount <= 1 ? '#ccc' : '#21655A'} 
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
                              color={jetSkiCount >= 4 ? '#ccc' : '#21655A'} 
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                    
                    {/* Add-ons Section */}
                    {selectedService.addOns && selectedService.addOns.length > 0 && (
                      <View style={styles.addOnsSection}>
                        <ThemedText style={styles.optionTitle}>Available Add-ons</ThemedText>
                        {selectedAddOns.map((addon) => (
                          <TouchableOpacity 
                            key={addon.id}
                            style={[styles.addOnOption, addon.selected && styles.selectedAddOn]}
                            onPress={() => toggleAddOn(addon)}
                          >
                            <View style={styles.addOnContent}>
                              <Image source={addon.image} style={styles.addOnImage} />
                              <View style={styles.addOnInfo}>
                                <ThemedText style={styles.addOnName}>{addon.name}</ThemedText>
                                <ThemedText style={styles.addOnPrice}>${addon.price}</ThemedText>
                              </View>
                            </View>
                            <View style={[styles.checkboxContainer, addon.selected && styles.selectedCheckbox]}>
                              {addon.selected && <Ionicons name="checkmark" size={20} color="#fff" />}
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                    
                    {/* Booking Summary */}
                    <View style={styles.summaryContainer}>
                      <ThemedText style={styles.optionTitle}>Summary</ThemedText>
                      <View style={styles.summaryCard}>
                        <View style={styles.summaryRow}>
                          <ThemedText style={styles.summaryLabel}>
                            {selectedService.type === 'jetski' 
                              ? `${selectedService.name} (${jetSkiCount})`
                              : selectedService.name}
                          </ThemedText>
                          <ThemedText style={styles.summaryValue}>
                            ${selectedService.type === 'jetski' 
                              ? selectedService.basePrice * jetSkiCount 
                              : selectedService.basePrice}
                          </ThemedText>
                        </View>
                        
                        {/* Selected Add-ons */}
                        {selectedAddOns.filter(addon => addon.selected).map(addon => (
                          <View key={addon.id} style={styles.summaryRow}>
                            <ThemedText style={styles.summaryLabel}>- {addon.name}</ThemedText>
                            <ThemedText style={styles.summaryValue}>${addon.price}</ThemedText>
                          </View>
                        ))}
                        
                        <View style={styles.divider} />
                        
                        <View style={styles.summaryRow}>
                          <ThemedText style={styles.totalLabel}>Total:</ThemedText>
                          <ThemedText style={styles.totalValue}>${calculateTotal()}</ThemedText>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
                
                {/* Book Now Button - shows total price when on booking tab */}
                <TouchableOpacity 
                  style={styles.bookButton}
                  onPress={() => {
                    setSelectedService(null);
                    router.push({
                      pathname: '/booking',
                      params: { 
                        serviceType: selectedService.type,
                        quantity: jetSkiCount
                      }
                    });
                  }}
                >
                  <ThemedText style={styles.bookButtonText}>
                    {activeTab === 'booking' 
                      ? `Book Now - $${calculateTotal()}` 
                      : 'Book Now'}
                  </ThemedText>
                </TouchableOpacity>
              </BlurView>
            </ScrollView>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  contentBox: {
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#21655A',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 16,
  },

  // Services Section
  servicesContainer: {
    paddingVertical: 16,
  },
  serviceCard: {
    width: 220,
    marginRight: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  serviceTextContainer: {
    padding: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#21655A',
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 14,
    color: '#666',
  },

  // Hours Section
  hoursTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  hoursContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  hoursDay: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  hoursTime: {
    fontSize: 16,
    color: '#21655A',
    fontWeight: '500',
  },
  hoursNote: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontStyle: 'italic',
  },

  // Reviews Section
  reviewsContainer: {
    paddingVertical: 12,
  },
  loader: {
    marginVertical: 20,
  },
  noReviews: {
    padding: 20,
    fontStyle: 'italic',
    color: '#666',
  },
  reviewsButton: {
    marginTop: 16,
    backgroundColor: '#21655A',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  reviewsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },

  // Contact Section
  contactInfo: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  contactText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalScrollView: {
    width: '100%',
  },
  modalContent: {
    width: windowWidth * 0.9,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  modalImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#21655A',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    padding: 16,
    paddingTop: 0,
  },
  modalDetailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  modalDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalDetailText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#21655A',
    marginLeft: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  activeTab: {
    backgroundColor: '#21655A',
  },
  tabText: {
    fontSize: 16,
    color: '#333',
  },
  activeTabText: {
    color: '#fff',
  },
  bookingOptionsContainer: {
    padding: 16,
  },
  quantityContainer: {
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#21655A',
    marginBottom: 8,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  quantityTextContainer: {
    marginHorizontal: 16,
  },
  jetSkiCountText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addOnsSection: {
    marginBottom: 16,
  },
  addOnOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
  },
  selectedAddOn: {
    backgroundColor: '#21655A',
  },
  addOnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addOnImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  addOnInfo: {
    flex: 1,
  },
  addOnName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  addOnPrice: {
    fontSize: 14,
    color: '#666',
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheckbox: {
    backgroundColor: '#21655A',
  },
  summaryContainer: {
    marginBottom: 16,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#333',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#21655A',
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#21655A',
  },
  bookButton: {
    backgroundColor: '#21655A',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },

  // Footer
  footerContainer: {
    marginTop: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
  },
});