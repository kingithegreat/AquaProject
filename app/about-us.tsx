// About Us screen for Aqua 360°
// Provides information about the company, services, and customer reviews.
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
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
  /**
   * Fetches customer reviews from Firestore.
   * Includes fallback data for reliability in case of errors.
   */
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const reviewsRef = collection(db, 'reviews');
        const q = query(reviewsRef, orderBy('createdAt', 'desc'), limit(5));
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
        
        if (fetchedReviews.length > 0) {
          setReviews(fetchedReviews);
        } else {
          // If no reviews were found, add sample reviews
          setReviews([
            { 
              id: 'sample1',
              author: 'Sarah M.',
              text: 'Had an amazing time on the jet skis! Highly recommend for a fun day out.',
              rating: 5
            },
            {
              id: 'sample2',
              author: 'James L.',
              text: 'The tours were excellent. Professional staff and beautiful scenery.',
              rating: 4
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        // Add fallback reviews if there's an error
        setReviews([
          { 
            id: 'sample1',
            author: 'Sarah M.',
            text: 'Had an amazing time on the jet skis! Highly recommend for a fun day out.',
            rating: 5
          },
          {
            id: 'sample2',
            author: 'James L.',
            text: 'The tours were excellent. Professional staff and beautiful scenery.',
            rating: 4
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);
  
  /**
   * List of services offered by Aqua360.
   * Includes details like name, description, price, and duration.
   */
  const services: Service[] = [
    { 
      id: 1,
      name: 'Jet Skis', 
      description: 'Experience the freedom and exhilaration of riding our brand-new luxurious Sea-Doo GTI 130 models on the beautiful blue waters of Mount Maunganui. Perfect for both beginners and experienced riders, our jet skis are fully kitted to offer the most unique and exciting water experiences in the Bay! Our professional A-Team ensures your safety on the water at all times.', 
      image: require('../assets/images/Jetski-image.webp'),
      price: 'From $130/30 minutes',
      duration: ' upto 4 hours'
    },
    { 
      id: 2, 
      name: 'Aqua Lounge', 
      description: 'Bring your family and friends and let Aqua 360° take care of the rest. Our premium floating Aqua Lounge offers a unique way to enjoy the waters of Mount Maunganui with comfortable seating, space to relax, and the perfect platform for water activities. Ideal for group gatherings, family outings, or creating unforgettable memories with friends on the water.', 
      image: require('../assets/images/Aqua-lounge.webp'),
      price: 'From $300/2 hours',
      duration: '2-4 hours'
    },
    { 
      id: 3, 
      name: 'Guided Tours', 
      description: 'Discover some of Tauranga\'s most hidden gems lying in our backyard! Our guided jet ski tours take you to explore the stunning Mount Maunganui coastline with experienced guides who know all the best spots. Cruise and explore the big beautiful blue backyard of Mount Maunganui while learning about the local area. Perfect for adventure seekers who want to discover new perspectives of this beautiful region.', 
      image: require('../assets/images/tours2.png'),
      price: 'From $220/hour',
      duration: '1-3 hours'
    },
    { 
      id: 4,
      name: 'Biscuit Ride (2-4 Person)', 
      description: 'Hold on tight for an exhilarating ride on our 2 to 4 person biscuit! Feel the excitement as you get pulled behind our powerful boats on this inflatable adventure. Our customers rave about this experience - "I have never been on a biscuit before but me and my daughter were so excited, the experience was amazing. I enjoyed every moment on the biscuit!" A favorite among families and guaranteed 100% fun!', 
      image: require('../assets/images/biscuir.jpg'),
      price: '$70/session',
      duration: '20-30 minutes'
    },
    { 
      id: 5, 
      name: 'Wakeboard', 
      description: 'Experience heart-pumping action on our wakeboarding adventures! Book your jet ski vacation with this exciting watersport accessory. Whether you\'re a beginner wanting to learn or an experienced rider looking to perfect your technique, our professional equipment and optional instruction create the perfect environment for an unforgettable wakeboarding session on the beautiful waters of Mount Maunganui.', 
      image: require('../assets/images/wakeboard.webp'),
      price: '$60/session',
      duration: '30-45 minutes'
    },
    { 
      id: 6, 
      name: 'Water Skis', 
      description: 'Enjoy the classic water sport of skiing across the beautiful waters of Mount Maunganui. Part of our popular watersports accessories that accompany your jet ski hire, water skiing offers an exciting way to experience the bay. We provide quality water skis and optional instruction for beginners. Feel the exhilaration as you glide across the water\'s surface with the stunning Mount landscape as your backdrop.', 
      image: require('../assets/images/skis.jpg'),
      price: '$60/session',
      duration: '30-45 minutes'
    },
    { 
      id: 7, 
      name: 'Fishing Package', 
      description: 'Don\'t let this one get away! Choose your own fishing adventure today with our specialized Jet Ski Fishing packages. Cruise the waters and catch a big one on a jet ski fishing adventure! Our packages include all necessary equipment and guidance on the best fishing spots in the bay. Perfect for fishing enthusiasts looking for a unique way to enjoy their favorite hobby in the beautiful waters of Mount Maunganui.', 
      image: require('../assets/images/fishing.jpg'),
      price: '$70/package',
      duration: '2-4 hours'
    },
  ];

  /**
   * Handles service card press.
   * Opens a modal with detailed information about the selected service.
   */
  const handleServicePress = (service: Service) => {
    setSelectedService(service);
  };
  /**
   * Main render function for the About Us screen.
  
   */
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#52D6E2' }}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#21655A"
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: '#52D6E2' }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={true}      >
        {/* Our Story Section */}
        <ThemedView style={styles.contentBox}>
          <ThemedText style={styles.sectionTitle}>Our Story</ThemedText>
          <ThemedText style={styles.paragraph}>
            At AQUA 360°, we take great pride in being a family-owned business dedicated to offering thrilling jet ski hire in the stunning Bay of Plenty, where adventure meets breathtaking scenery.
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            Bring the family! Bring your mates! New Zealand's big blue backyard is ready to carry you on your epic jet ski holiday adventure. Here at Aqua 360°, we focus on the Jet Ski hire & accessories logistics so you can focus on the fun.
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            Do it in style on our brand-new luxurious Sea-Doo GTI 130 models, fully kitted to offer the most unique and exciting water experiences in the Bay! Feel the freedom and extreme exhilaration that Aqua 360° provides while our A-Team reassures you and your safety on the water.
          </ThemedText>
        </ThemedView>

        {/* Our Services Section */}
        <ThemedView style={styles.contentBox}>
          <ThemedText style={styles.sectionTitle}>Our Services</ThemedText>
          <ThemedText style={styles.paragraph}>
            Explore our range of exciting water activities and services:
          </ThemedText>
          
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.servicesContainer}
            decelerationRate="fast"
            snapToInterval={236} // 220 width + 16 margin
            snapToAlignment="start"
            pagingEnabled={false}
          >
            {services.map((service) => (
              <TouchableOpacity 
                key={service.id}
                style={styles.serviceCard}
                onPress={() => handleServicePress(service)}
                activeOpacity={0.8}
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
            <ThemedText style={styles.hoursSubheading}>Seasonal Hours:</ThemedText>
            <View style={styles.hoursRow}>
              <ThemedText style={styles.hoursDay}>April to August</ThemedText>
              <ThemedText style={styles.hoursTime}>Bookings only</ThemedText>
            </View>
            <View style={styles.hoursRow}>
              <ThemedText style={styles.hoursDay}>Sept to December</ThemedText>
              <ThemedText style={styles.hoursTime}>Tue-Fri: Bookings only</ThemedText>
            </View>
            <View style={[styles.hoursRow, styles.indentedRow]}>
              <ThemedText style={styles.hoursDay}>Sat-Sun:</ThemedText>
              <ThemedText style={styles.hoursTime}>Open on-site at Pilot Bay Beach</ThemedText>
            </View>
            <View style={styles.hoursRow}>
              <ThemedText style={styles.hoursDay}>Jan to March</ThemedText>
              <ThemedText style={styles.hoursTime}>Tue-Thu: Bookings only</ThemedText>
            </View>
            <View style={[styles.hoursRow, styles.indentedRow]}>
              <ThemedText style={styles.hoursDay}>Fri-Sun:</ThemedText>
              <ThemedText style={styles.hoursTime}>Open on-site at Pilot Bay Beach</ThemedText>
            </View>
            <View style={styles.hoursRow}>
              <ThemedText style={styles.hoursDay}>Dec 19 - Jan 29</ThemedText>
              <ThemedText style={styles.hoursTime}>Open daily at Pilot Bay Beach (10am till late)</ThemedText>
            </View>
            <View style={styles.hoursNote}>
              <Ionicons name="information-circle-outline" size={18} color="#21655A" />
              <ThemedText style={styles.noteText}>Follow our socials for weather updates & opening times</ThemedText>
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
        
        {/* Contact Us Section */}
        <ThemedView style={styles.contentBox}>
          <ThemedText style={styles.sectionTitle}>Contact Us</ThemedText>
          <View style={styles.contactInfo}>
            <View style={styles.contactRow}>
              <Ionicons name="location-outline" size={22} color="#21655A" />
              <ThemedText style={styles.contactText}>Pilot Bay (Mount End) Beach, Mount Maunganui</ThemedText>
            </View>
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={22} color="#21655A" />
              <ThemedText style={styles.contactText}>021 2782 360</ThemedText>
            </View>
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={22} color="#21655A" />
              <ThemedText style={styles.contactText}>admin@aqua360.co.nz</ThemedText>
            </View>
          </View>
        </ThemedView>
        
        {/* Footer with proper spacing */}
        <View style={styles.footerContainer}>
          <ThemedText style={styles.footerText}>© {new Date().getFullYear()} Aqua 360°. All rights reserved.</ThemedText>
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
    minWidth: 200, // Add minimum width to prevent squashing
    alignSelf: 'center', // Center the button
  },
  reviewsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
    textAlign: 'center', // Ensure text is centered
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
    minWidth: 150, // Ensure minimum width
    alignSelf: 'center', // Center the button
    width: '80%', // Set width to a percentage of the container
  },
  bookButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center', // Ensure text is centered
  },
  // Footer
  footerContainer: {
    marginTop: 24,
    marginBottom: 32,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    width: '100%',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Added styles for new hours format
  hoursSubheading: {
    fontSize: 17,
    fontWeight: '600',
    color: '#21655A',
    marginBottom: 8,
  },
  indentedRow: {
    paddingLeft: 20,
  },
  qualmarkLogo: {
    height: 50,
    width: 120,
    marginTop: 16,
  },
});