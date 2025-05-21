import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, Image, Dimensions, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useFocusEffect } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Asset } from 'expo-asset';
import { StatusBar } from 'expo-status-bar';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ReviewCard from '@/components/ui/ReviewCard';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/config/firebase';

// Pre-load images to prevent rendering delays
const preloadImages = async () => {
  try {
    const images = [
      require('../../assets/images/about-us-image.webp'),
    ];
    
    await Promise.all(images.map(image => Asset.fromModule(image).downloadAsync()));
    return true;
  } catch (error) {
    console.log('Error preloading images', error);
    return false;
  }
};

// Glass effect component
interface GlassBackgroundProps {
  style?: any;
  intensity?: number;
  children: React.ReactNode;
  noRadius?: boolean;
}

function GlassBackground({ style, intensity = 50, children, noRadius = false }: GlassBackgroundProps) {
  const isIOS = Platform.OS === 'ios';
  
  if (isIOS) {
    return (
      <BlurView 
        intensity={intensity} 
        tint="light" 
        style={[
          styles.glassEffect, 
          noRadius ? styles.noRadius : null,
          style
        ]}
      >
        {children}
      </BlurView>
    );
  } else {
    // Fallback for Android (no blur, just semi-transparent bg)
    return (
      <View 
        style={[
          styles.glassEffectAndroid, 
          noRadius ? styles.noRadius : null,
          style
        ]}
      >
        {children}
      </View>
    );
  }
}

// Define Review interface
interface Review {
  id?: string;
  author: string;
  text: string;
  rating: number;
  createdAt?: Date;
}

export default function HomeScreen() {
  const { user, logout, loading } = useAuth();
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  
  // Function to fetch reviews from Firestore
  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      setReviewsError(null);
      
      const reviewsQuery = query(
        collection(db, 'reviews'),
        orderBy('createdAt', 'desc'),
        limit(3) // Only get the 3 most recent reviews for the homepage
      );
      
      const querySnapshot = await getDocs(reviewsQuery);
      const fetchedReviews: Review[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        try {
          fetchedReviews.push({
            id: doc.id,
            author: data.author || 'Anonymous',
            text: data.text || '',
            rating: typeof data.rating === 'number' ? data.rating : 5,
            createdAt: data.createdAt?.toDate?.() || new Date()
          });
        } catch (err) {
          console.warn('Error processing review document:', err);
        }
      });
      
      setReviews(fetchedReviews);
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
      setReviewsError("Couldn't load reviews. Please try again later.");
    } finally {
      setReviewsLoading(false);
    }
  };
  
  // Preload images when component mounts
  useEffect(() => {
    preloadImages().then(() => setImagesLoaded(true));
  }, []);
  
  // Fetch reviews from Firestore
  useEffect(() => {
    fetchReviews();
  }, []);
  
  // Reset image loading state when screen gains focus
  useFocusEffect(
    useCallback(() => {
      if (!imagesLoaded) {
        preloadImages().then(() => setImagesLoaded(true));
      }
      return () => {};
    }, [imagesLoaded])
  );

  // Handle user logout
  const handleLogout = async () => {
    await logout();
    // No need to navigate - the auth state change will trigger UI updates
  };

  // Navigation handlers
  const handleLogin = () => {
    router.push('/login');
  };

  const handleSignup = () => {
    router.push('/signup');
  };
  
  const handleAboutUs = () => {
    router.push('/about-us');
  };

  const handleWaiver = () => {
    router.push('/waiver');
  };

  const handleAiAssist = () => {
    router.push('/ai-assist');
  };

  const handleBooking = () => {
    router.push('/booking');
  };

  const handleSeeAllReviews = () => {
    router.push('/reviews');
  };

  const handleMyAccount = () => {
    if (user) {
      router.push('/account');
    } else {
      router.push({
        pathname: '/login',
        params: { redirect: '/account' }
      });
    }
  };

  // If images or auth are still loading, show loading indicator
  if (loading || !imagesLoaded) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#21655A" />
        <ThemedText style={styles.loadingText}>Loading Aqua 360°...</ThemedText>
      </SafeAreaView>
    );
  }
    return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" backgroundColor="#21655A" />
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header Section - no rounded borders */}
      <GlassBackground style={styles.header} intensity={80} noRadius={true}>
        {loading ? (
          // Show placeholder during authentication loading
          <View style={styles.headerContent}>
            <ThemedText style={styles.loadingText}>Loading...</ThemedText>
          </View>
        ) : user ? (
          // User is logged in - show email and account button
          <View style={styles.headerContent}>
            <ThemedText style={styles.userEmail} numberOfLines={1}>
              {user.email}
            </ThemedText>
            <TouchableOpacity style={styles.accountButton} onPress={handleMyAccount}>
              <ThemedText style={styles.accountButtonText}>My Account</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          // User is not logged in - show login and signup buttons
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <ThemedText style={styles.loginButtonText}>Login</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
              <ThemedText style={styles.signupButtonText}>Sign Up</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </GlassBackground>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollViewContent}
      >
        <ThemedView style={styles.container}>          {/* Enhanced About Us Button with Image */}
          <TouchableOpacity style={styles.aboutUsButton} onPress={handleAboutUs}>
            <Image 
              source={require('../../assets/images/about-us-image.webp')}
              style={styles.aboutUsImage}
            />
            <GlassBackground style={styles.aboutUsTextContainer} intensity={40}>
              <ThemedText style={styles.aboutUsButtonText}>About Us</ThemedText>
            </GlassBackground>
            <Image 
              source={require('../../assets/images/aqua-360-logo.png')}
              style={styles.logoCorner}
              resizeMode="contain"
            />
          </TouchableOpacity>

          {/* Action Buttons Section - Modern buttons without container */}
          <View style={styles.actionButtonsWrapper}>
            <TouchableOpacity style={styles.actionButton} onPress={handleWaiver}>
              <View style={styles.buttonIconPlaceholder}>
                <ThemedText style={styles.buttonIcon}>🏄</ThemedText>
              </View>
              <ThemedText style={styles.actionButtonText}>Waiver</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleAiAssist}>
              <View style={styles.buttonIconPlaceholder}>
                <ThemedText style={styles.buttonIcon}>🤖</ThemedText>
              </View>
              <ThemedText style={styles.actionButtonText}>AI Assistant</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleBooking}>
              <View style={styles.buttonIconPlaceholder}>
                <ThemedText style={styles.buttonIcon}>📅</ThemedText>
              </View>
              <ThemedText style={styles.actionButtonText}>Book Now</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleMyAccount}>
              <View style={styles.buttonIconPlaceholder}>
                <ThemedText style={styles.buttonIcon}>👤</ThemedText>
              </View>
              <ThemedText style={styles.actionButtonText}>My Account</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Reviews Section */}
          <ThemedView style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <ThemedText type="heading2" style={styles.sectionTitle}>
                Customer Reviews
              </ThemedText>
            </View>
            
            {reviewsLoading ? (
              <View style={styles.reviewsLoadingContainer}>
                <ActivityIndicator size="small" color="#21655A" />
                <ThemedText style={styles.reviewsLoadingText}>Loading reviews...</ThemedText>
              </View>
            ) : reviewsError ? (
              <View style={styles.reviewsErrorContainer}>
                <Ionicons name="warning" size={24} color="#cc0000" />
                <ThemedText style={styles.reviewsErrorText}>{reviewsError}</ThemedText>
              </View>
            ) : reviews.length === 0 ? (
              <View style={styles.reviewsErrorContainer}>
                <ThemedText style={styles.reviewsErrorText}>No reviews found.</ThemedText>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.reviewsCarousel}
                contentContainerStyle={styles.reviewsContentContainer}
              >
                {reviews.map((review, index) => (
                  <ReviewCard
                    key={index}
                    text={review.text}
                    author={review.author}
                    rating={review.rating}
                  />
                ))}
              </ScrollView>
            )}
            
            <TouchableOpacity 
              style={styles.seeAllReviewsButton}
              onPress={handleSeeAllReviews}
            >
              <ThemedText style={styles.seeAllReviewsText}>
                See all customer reviews
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
          
          {/* Flexible spacer to push footer to the bottom */}
          <View style={styles.flexSpacer} />
          
          {/* Footer Section - now scrollable with the content but pushed to bottom */}
          <GlassBackground style={styles.footer} intensity={90} noRadius={true}>
            <ThemedText style={styles.footerTitle}>Aqua 360°</ThemedText>
            <ThemedText style={styles.footerText}>
              Pilot Bay (Mount End) Beach, Mount Maunganui
            </ThemedText>
            <ThemedText style={styles.footerText}>
              Email: admin@aqua360.co.nz
            </ThemedText>
            <ThemedText style={styles.footerText}>
              Phone: 021 2782 360
            </ThemedText>
            <ThemedText style={styles.footerCopyright}>
              © 2025 Aqua 360° - All Rights Reserved
            </ThemedText>
          </GlassBackground>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#52D6E2',  // Solid color background throughout the app
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#52D6E2',  // Solid color background throughout the app
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 0, // Remove extra padding at bottom
  },
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#52D6E2',  // Solid color background throughout the app
    paddingBottom: 0, // Remove padding at bottom
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%', // Ensure container fills at least the screen height
  },
  // Glass effect styles
  glassEffect: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    borderRadius: 15, // Default rounded borders for middle elements
  },
  glassEffectAndroid: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 15, // Default rounded borders for middle elements
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  noRadius: {
    borderRadius: 0, // Remove border radius for header and footer
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 30,
    paddingVertical: 15,
    backgroundColor: 'rgba(33, 101, 90, 1)', // Changed to match buttons' solid color
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.5)',
    borderBottomLeftRadius: 20,  // Round the bottom left corner
    borderBottomRightRadius: 20, // Round the bottom right corner
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  loadingText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  userEmail: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
    flex: 1,
    marginRight: 10,
  },
  accountButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  accountButtonText: {
    color: '#21655A',
    fontWeight: '700',
    fontSize: 16,
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  logoutButtonText: {
    color: '#21655A',
    fontWeight: '700',
    fontSize: 16,
  },
  loginButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(29, 154, 150, 0.8)',
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  loginButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  signupButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  signupButtonText: {
    color: '#21655A',
    fontWeight: '700',
    fontSize: 16,
  },
  aboutUsButton: {
    width: '90%',
    height: windowHeight * 0.25, 
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 30,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#21655A', // Add background color in case image doesn't load
  },
  aboutUsImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    resizeMode: 'cover', // Move resizeMode here from the style
  },
  aboutUsTextContainer: {
    paddingVertical: 14,  // Increased from 10 to give more vertical space
    paddingHorizontal: 30,
    borderRadius: 15,
    minHeight: 60,  // Added minimum height to ensure text has enough space
    justifyContent: 'center',  // Center text vertically
    alignItems: 'center',  // Center text horizontally
  },  aboutUsButtonText: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    lineHeight: 36,  // Added line height to ensure proper text rendering
    includeFontPadding: false,  // Prevents Android from cutting off top of text
    textAlignVertical: 'center',  // Ensures text is centered vertically (Android)
  },
  logoCorner: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 5,
  },
  // New styles for action button layout
  actionButtonsWrapper: {
    width: '100%',
    flexDirection: 'column', // Stack buttons vertically
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 30,
    backgroundColor: 'transparent', // Ensure wrapper is transparent
  },
  actionButton: {
    width: '100%',
    height: 90,
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(33, 101, 90, 1)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    borderLeftWidth: 6,
    borderLeftColor: '#52D6E2',
  },
  buttonIconPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  buttonIcon: {
    fontSize: 26,
    color: '#ffffff',
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 18,
    flex: 1,
  },
  // Review carousel styles
  reviewsSection: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 15,
    width: '90%',
    marginHorizontal: '5%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    marginBottom: 15,
    textAlign: 'center',
    color: '#005662',
    fontSize: 22,
    fontWeight: 'bold',
  },
  reviewsLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  reviewsLoadingText: {
    marginTop: 10,
    color: '#21655A',
    fontSize: 16,
  },
  reviewsErrorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  reviewsErrorText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  seeAllReviewsButton: {
    backgroundColor: '#21655A',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'center',
    marginTop: 15,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  seeAllReviewsText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  reviewsCarousel: {
    width: '100%',
    maxHeight: 250,
  },
  reviewsContentContainer: {
    paddingHorizontal: 8,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: '#21655A',
    opacity: 0.6,
  },
  flexSpacer: {
    flex: 1, // This will push the footer to the bottom
    minHeight: 10, // Minimum height for some minimal spacing
  },
  footer: {
    width: '100%',
    backgroundColor: 'rgba(33, 101, 90, 1)', // Changed to match the exact same solid color as buttons
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.6)',
    marginTop: 0, // Remove margin at top
    marginBottom: 0, // Remove margin at bottom
    borderTopLeftRadius: 20,  // Round the top left corner
    borderTopRightRadius: 20, // Round the top right corner
  },
  footerTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  footerText: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  footerCopyright: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 20,
    opacity: 0.8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#52D6E2',
  },
});
