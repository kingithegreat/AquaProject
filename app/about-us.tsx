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
  Pressable
} from 'react-native';
import { BlurView } from 'expo-blur';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/config/firebase';
import ReviewCard from '@/components/ui/ReviewCard';

// Define interfaces for our data
interface Review {
  id: string;
  author: string;
  text: string;
  rating: number;
}

interface Service {
  id: number;
  name: string;
  description: string;
  image: any;
  price: string;
  duration: string;
}

export default function AboutUsScreen() {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch reviews from Firestore
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
  
  // List of services offered
  const services: Service[] = [
    { 
      id: 1,
      name: 'Jet Ski Rental', 
      description: 'Experience the thrill of riding our premium jet skis on Lake Rotorua. Suitable for beginners and experienced riders.', 
      image: require('../assets/images/skis.jpg'),
      price: 'From $89/hour',
      duration: '1-4 hours'
    },
    { 
      id: 2, 
      name: 'Water Skiing', 
      description: 'Get pulled behind our specially designed boats for an exciting water skiing experience. Instruction available for beginners.', 
      image: require('../assets/images/fishing.jpg'),
      price: 'From $95/hour',
      duration: '1-2 hours'
    },
    { 
      id: 3, 
      name: 'Guided Fishing', 
      description: 'Join our local guides for a productive day fishing on the lake. All equipment and bait provided.', 
      image: require('../assets/images/fishing.jpg'),
      price: 'From $150/half-day',
      duration: '4-8 hours'
    },
  ];

  const handleServicePress = (service: Service) => {
    setSelectedService(service);
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
                  <ThemedText style={styles.servicePrice}>{service.price}</ThemedText>
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

      {/* Service Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={selectedService !== null}
        onRequestClose={() => setSelectedService(null)}
      >
        {selectedService && (
          <View style={styles.modalContainer}>
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
              <ThemedText style={styles.modalDescription}>{selectedService.description}</ThemedText>
              
              <View style={styles.modalDetailsContainer}>
                <View style={styles.modalDetailItem}>
                  <Ionicons name="cash-outline" size={24} color="#21655A" />
                  <ThemedText style={styles.modalDetailText}>{selectedService.price}</ThemedText>
                </View>
                <View style={styles.modalDetailItem}>
                  <Ionicons name="time-outline" size={24} color="#21655A" />
                  <ThemedText style={styles.modalDetailText}>{selectedService.duration}</ThemedText>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.bookButton}
                onPress={() => {
                  setSelectedService(null);
                  router.push('/booking');
                }}
              >
                <ThemedText style={styles.bookButtonText}>Book Now</ThemedText>
              </TouchableOpacity>
            </BlurView>
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