// Aqua360 Homepage - Main landing screen
// Main homepage combining authentication, video playback, reviews, and navigation.

// Import all the React Native components and libraries we need
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, Image, Dimensions, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useFocusEffect } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Asset } from 'expo-asset';
import { StatusBar } from 'expo-status-bar';

// Firebase imports for real-time database operations
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';

// UI and icon libraries
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';

// Custom components and utilities specific to Aqua360
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ReviewCard from '@/components/ui/ReviewCard';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/config/firebase';

/**
 * Preloads images for better performance.
 */
const preloadImages = async () => {
  try {
    const images = [
      require('../assets/images/about-us-image.webp'),
    ];
    
    await Promise.all(images.map(image => Asset.fromModule(image).downloadAsync()));
    return true;
  } catch (error) {
    console.log('Error preloading images', error);
    return false;
  }
};

/**
 * Glass morphism component for modern UI effects.
 */
interface GlassBackgroundProps {
  style?: any; // Custom styles for the glass effect container
  intensity?: number; // Blur intensity (0-100, iOS only)
  children: React.ReactNode; // Content to display inside the glass effect
  noRadius?: boolean; // Disable border radius for header/footer elements
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

/**
 * TypeScript interface for customer reviews.
 */
interface Review {
  id?: string; // Firebase document ID (optional for new reviews)
  author: string; // Customer name who wrote the review
  text: string; // The actual review content/testimonial
  rating: number; // Star rating (1-5 scale)
  createdAt?: Date; // Review creation timestamp
}

/**
 * Main homepage component.
 */
export default function HomeScreen() {
  // AUTHENTICATION STATE: Manages user login status and loading states
  const { user, logout, loading } = useAuth();
  
  /**
   * COMPONENT STATE MANAGEMENT
   * ==========================
   * Manages multiple asynchronous operations and UI states:
   */
  // Image preloading state for performance optimization
  const [imagesLoaded, setImagesLoaded] = useState(false);
  
  // Customer reviews data and loading states
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  
  /**
   * VIDEO PLAYBACK SYSTEM
   * =====================
   * Implements advanced video features using Expo's latest video API:
   * - Automatic looping for continuous engagement
   * - Muted autoplay (mobile best practice)
   * - User-controlled play/pause functionality
   * - Error handling with graceful degradation
   */
  const player = useVideoPlayer(require('../assets/video/Biscuit-ride.mp4'), (player) => {
    player.loop = true;      // Continuous playback for engagement
    player.muted = true;     // Respectful autoplay (no sound)
    player.play();           // Start immediately when loaded
  });
  const [videoError, setVideoError] = useState<boolean>(false);
    
  /**
   * VIDEO CONTROL FUNCTIONS
   * =======================
   * Provides user control over video playback with error handling
   */
  const toggleVideoPlayback = () => {
    try {
      if (player.playing) {
        player.pause();
      } else {
        player.play();
      }
    } catch (error) {
      console.error('Error toggling video playback:', error);
      setVideoError(true);
    }
  };
  
  // Handle video playback errors gracefully
  const handleVideoError = () => {
    console.error('Video playback error occurred');
    setVideoError(true);
  };

  /**
   * FIREBASE REVIEW SYSTEM
   * ======================
   * Fetches customer reviews from Firestore with comprehensive error handling.
   * Implements pagination (limit 3) for performance and loads newest reviews first.
   * 
   * QUERY STRATEGY:
   * - Orders by creation date (newest first)
   * - Limits to 3 reviews for homepage preview
   * - Handles missing fields gracefully with defaults
   * - Provides user feedback for loading and error states
   */
  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      setReviewsError(null);
      
      const reviewsQuery = query(
        collection(db, 'reviews'),
        orderBy('createdAt', 'desc'),
        limit(3)
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
    
  /**
   * COMPONENT LIFECYCLE MANAGEMENT
   * ==============================
   * Coordinates multiple asynchronous operations during component lifecycle:
   */
  
  // Initialize image preloading on component mount
  useEffect(() => {
    preloadImages().then(() => setImagesLoaded(true));
  }, []);
  
  // Fetch reviews data on component mount
  useEffect(() => {
    fetchReviews();
  }, []);
  
  // Re-preload images when screen comes back into focus (navigation)
  useFocusEffect(
    useCallback(() => {
      if (!imagesLoaded) {
        preloadImages().then(() => setImagesLoaded(true));
      }
      return () => {}; // Cleanup function (currently no cleanup needed)
    }, [imagesLoaded])
  );

  /**
   * NAVIGATION HANDLERS
   * ==================
   * Centralized navigation functions for all app sections.
   * Each function uses Expo Router for type-safe navigation.
   */
  const handleLogout = async () => {
    await logout();
  };

  const handleLogin = () => router.push('/login');
  const handleSignup = () => router.push('/signup');
  const handleAboutUs = () => router.push('/about-us');
  const handleWaiver = () => router.push('/waiver');
  const handleAiAssist = () => router.push('/ai-assist');
  const handleBooking = () => router.push('/booking');
  const handleSeeAllReviews = () => router.push('/reviews');

  // Smart account navigation: redirects to login if not authenticated
  const handleMyAccount = () => {
    if (user) {
      router.push('/account');
    } else {
      router.push({
        pathname: '/login',
        params: { redirect: '/account' } // Redirect back after login
      });
    }
  };

  /**
   * LOADING STATE MANAGEMENT
   * ========================
   * Shows loading screen while critical resources are being prepared.
   * Prevents showing incomplete UI to users.
   */

  if (loading || !imagesLoaded) {    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#21655A" />
        <ThemedText style={styles.loadingText}>Loading Aqua 360°...</ThemedText>
      </SafeAreaView>
    );
  }
  
  /**
   * MAIN RENDER FUNCTION
   * ====================
   * Renders the complete homepage with multiple sections:
   * 1. Dynamic authentication header
   * 2. Interactive video hero section  
   * 3. Main navigation buttons
   * 4. Customer reviews carousel
   * 5. Business information footer
   */
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" backgroundColor="#21655A" />
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* 
        DYNAMIC AUTHENTICATION HEADER
        =============================
        Displays different UI based on user authentication state:
        - Loading: Shows loading indicator
        - Logged in: Shows user email and account access
        - Logged out: Shows login and signup buttons
        
        Uses glass morphism effect for modern appearance
      */}
      <GlassBackground style={styles.header} intensity={80} noRadius={true}>
        {loading ? (
          // Authentication state is still being determined
          <View style={styles.headerContent}>
            <ThemedText style={styles.loadingText}>Loading...</ThemedText>
          </View>
        ) : user ? (
          // User is authenticated - show personalized header
          <View style={styles.headerContent}>
            <ThemedText style={styles.userEmail} numberOfLines={1}>
              {user.email}
            </ThemedText>
            <TouchableOpacity style={styles.accountButton} onPress={handleMyAccount}>
              <ThemedText style={styles.accountButtonText}>My Account</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          // User is not authenticated - show authentication options
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
      >        <ThemedView style={styles.container}>
          {/* 
            INTERACTIVE VIDEO HERO SECTION
            ==============================
            The centerpiece of the homepage featuring:
            
            🎥 VIDEO TECHNOLOGY:
            - Expo Video API for modern playback controls
            - MP4 format for universal compatibility
            - Automatic looping for continuous engagement
            - Muted autoplay following mobile best practices
            
            🎯 USER INTERACTION:
            - Tap-to-play/pause functionality
            - Navigation to About Us section on tap
            - Floating control button for easy access
            
            🛡️ FALLBACK SYSTEM:
            - Static image backup if video fails to load
            - Graceful error handling maintains app stability
            - Loading states provide user feedback
            
            🎨 VISUAL DESIGN:
            - Glass morphism text overlay
            - Responsive sizing based on screen dimensions
            - Shadow effects for depth and professionalism
            
            BUSINESS IMPACT:
            This video showcases Aqua360's services in action, building excitement
            and trust while demonstrating the quality of the experience customers
            can expect. Video content significantly increases engagement rates.
          */}
          <TouchableOpacity style={styles.aboutUsButton} onPress={handleAboutUs}>{/* 
              MAIN VIDEO PLAYER
              ================
              This VideoView component from expo-video handles all video playback functionality.
              Key props explained:
              - player: The video player instance created with useVideoPlayer hook
              - style: CSS styling for the video container
              - allowsFullscreen: Enables fullscreen mode for better viewing
              - allowsPictureInPicture: Enables picture-in-picture mode
              - contentFit: How to fit the video in the container (cover = fills space, may crop)
              
              The video source, looping, muted state, and autoplay are configured in the useVideoPlayer hook.
            */}
            <VideoView
              style={styles.aboutUsImage}
              player={player}
              allowsFullscreen
              allowsPictureInPicture
              contentFit="cover"
            />
            
            {/* 
              FALLBACK IMAGE SYSTEM
              ====================
              If the video fails to load (poor internet, unsupported format, etc.),
              we show a static image instead. This is called "graceful degradation" -
              the app still works even if one feature fails.
            */}            {videoError ? (
              <Image 
                source={require('../assets/images/about-us-image.webp')}
                style={styles.aboutUsImage}
                resizeMode="cover"
              />
            ) : null}
            
            {/* 
              GLASS MORPHISM TEXT OVERLAY
           
              This creates a semi-transparent overlay with text on top of the video.
              The GlassBackground component uses different techniques on iOS vs Android:
              - iOS: Real blur effect using native BlurView
              - Android: Semi-transparent background (Android doesn't support native blur)
            */}
            <GlassBackground style={styles.aboutUsTextContainer} intensity={40}>
              <ThemedText style={styles.aboutUsButtonText}>About Us</ThemedText>
            </GlassBackground>
            
            {/* 
              PLAY/PAUSE CONTROL BUTTON
            
              This floating button appears in the bottom-right corner of the video.
              It shows different icons based on the video state:
              - Play icon (▶) when video is paused or not loaded
              - Pause icon (⏸) when video is currently playing
              
              The complex conditional logic checks:
              1. Is there a video error? (if so, don't show button)
              2. Is the video loaded and playing? (show pause icon)
              3. Otherwise show play icon
            */}
            {!videoError && (
              <TouchableOpacity 
                style={styles.videoControlButton}
                onPress={toggleVideoPlayback}
              >                <Ionicons 
                  name={player.playing ? "pause" : "play"} 
                  size={30}
                  color="white" 
                />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {/* 
            MAIN NAVIGATION BUTTONS
          
            These four buttons provide quick access to the main app features.
            Each button follows the same pattern:
            1. TouchableOpacity for tap handling
            2. Icon placeholder with Ionicons
            3. Text label
            4. onPress handler that navigates to different screens
          */}
          <View style={styles.actionButtonsWrapper}>
            <TouchableOpacity style={styles.actionButton} onPress={handleWaiver}>
              <View style={styles.buttonIconPlaceholder}>
                <Ionicons name="document-text-outline" size={26} color="#ffffff" />
              </View>
              <ThemedText style={styles.actionButtonText}>Waiver</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleAiAssist}>
              <View style={styles.buttonIconPlaceholder}>
                <Ionicons name="chatbubble-ellipses-outline" size={26} color="#ffffff" />
              </View>
              <ThemedText style={styles.actionButtonText}>AI Assistant</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleBooking}>
              <View style={styles.buttonIconPlaceholder}>
                <Ionicons name="calendar-outline" size={26} color="#ffffff" />
              </View>
              <ThemedText style={styles.actionButtonText}>Book Now</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleMyAccount}>
              <View style={styles.buttonIconPlaceholder}>
                <Ionicons name="person-outline" size={26} color="#ffffff" />
              </View>
              <ThemedText style={styles.actionButtonText}>My Account</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Reviews section */}
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
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Ionicons name="star-half-outline" size={18} color="#ffffff" style={styles.reviewButtonIcon} />
                <ThemedText style={styles.seeAllReviewsText}>
                  Reviews & Share Experience
                </ThemedText>
              </View>
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
    shadowRadius: 5,    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#21655A', // Add background color in case image doesn't load
  },  aboutUsImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
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
  },  seeAllReviewsButton: {
    backgroundColor: '#21655A',
    paddingVertical: 12,
    paddingHorizontal: 24,
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
  reviewButtonIcon: {
    marginRight: 8,
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
  videoLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoControlButton: {
    position: 'absolute',
    bottom: 70, // Position it above the text
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});


