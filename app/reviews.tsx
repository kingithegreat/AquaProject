// Customer Review System

import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  View, 
  Platform, 
  Keyboard,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import ReviewCard from '@/components/ui/ReviewCard';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

// GlassBackground component with proper return type
function GlassBackground({ 
  style, 
  intensity = 50, 
  children, 
  noRadius = false 
}: { 
  style?: object; 
  intensity?: number; 
  children: React.ReactNode; 
  noRadius?: boolean 
}): React.ReactElement {
  const isIOS = Platform.OS === 'ios';
  if (isIOS) {
    return (
      <BlurView
        intensity={intensity}
        tint="light"
        style={[
          styles.glassEffect,
          noRadius ? styles.noRadius : null,
          style,
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
          style,
        ]}
      >
        {children}
      </View>
    );
  }
}

interface Review {
  id?: string;
  author: string;
  email: string; // Email won't be displayed in ReviewCard but stored
  text: string;
  rating: number;
  createdAt?: Date; // Changed from Timestamp to Date for Expo Go compatibility
  userId?: string; // Added for Firebase security and user tracking
  userEmail?: string; // Authenticated user's email
}

interface FormErrors {
  author?: string;
  email?: string;
  text?: string;
  rating?: string;
}

export default function ReviewsScreen() {  // Review state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Form state
  const [author, setAuthor] = useState('');
  const [email, setEmail] = useState('');
  const [text, setText] = useState('');
  const [rating, setRating] = useState('5');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // Auth context
  const { user } = useAuth();
    // Refs for text inputs to help with focus management
  const emailInputRef = useRef<TextInput>(null);
  const reviewInputRef = useRef<TextInput>(null);
  const ratingInputRef = useRef<TextInput>(null);

  // Fetch reviews from Firestore on component mount
  useEffect(() => {
    fetchReviews();
  }, []);

  // Fetch reviews from Firebase
  const fetchReviews = async () => {
    try {
      setIsInitialLoading(true);  // Show loading spinner
      setFetchError(null);        // Clear any previous errors
      
      // Create a Firebase query to get reviews sorted by newest first
      const reviewsQuery = query(
        collection(db, 'reviews'),
        orderBy('createdAt', 'desc')  // Sort by date, newest at top
      );
      
      // Execute the query and get all matching documents
      const querySnapshot = await getDocs(reviewsQuery);
      const fetchedReviews: Review[] = [];
      
      // Process each review document from the database
      querySnapshot.forEach((doc) => {
        const data = doc.data();  // Get the actual review data
        
        // Safely convert database format to our app format
        try {
          fetchedReviews.push({
            id: doc.id,  // Unique document ID from Firebase
            author: data.author || 'Anonymous',  // Default if missing
            email: data.email || '',
            text: data.text || '',
            rating: typeof data.rating === 'number' ? data.rating : 5,
            createdAt: data.createdAt?.toDate?.() || new Date()  // Convert Firebase timestamp
          });
        } catch (err) {
          // If individual review is corrupted, skip it but log the issue
          console.warn('Error processing review document:', err);
        }
      });
      
      // Update our app state with the fetched reviews
      setReviews(fetchedReviews);
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      setReviews([]);  // Show empty list instead of broken state
      setFetchError("Couldn't load reviews. Please try again later.");
    } finally {
      setIsInitialLoading(false);  // Hide loading spinner regardless of outcome
    }
  };
  /**
   * EMAIL VALIDATION
   * ================
   * 
   * This function checks if an email address is properly formatted.
   * It uses a "regular expression" (regex) pattern to validate.
   * 
   * WHAT THE REGEX PATTERN MEANS:
   * ^[^\s@]+@[^\s@]+\.[^\s@]+$
   * 
   * Breaking it down:
   * ^ = Start of string
   * [^\s@]+ = One or more characters that are NOT spaces or @ symbols
   * @ = Must contain exactly one @ symbol
   * [^\s@]+ = One or more characters that are NOT spaces or @ symbols  
   * \. = Must contain a dot (period)
   * [^\s@]+ = One or more characters that are NOT spaces or @ symbols
   * $ = End of string
   * 
   * EXAMPLES:
   * ✅ john@email.com (valid)
   * ✅ user.name@company.co.nz (valid)
   * ❌ john@email (invalid - missing .com)
   * ❌ @email.com (invalid - missing username)
   * ❌ john email@test.com (invalid - contains space)
   */
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);  // test() returns true/false
  };

  // Validate review form fields
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};  // Collect all validation errors
    let isValid = true;  // Assume form is valid until we find problems

    // Check if name field is filled out
    if (!author.trim()) {
      newErrors.author = "Name is required";
      isValid = false;
    }

    // Check email field - must exist AND be valid format
    if (!email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email";
      isValid = false;
    }

    // Check if review text is provided
    if (!text.trim()) {
      newErrors.text = "Review text is required";
      isValid = false;
    }

    // Check if rating is a valid number between 1-5
    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      newErrors.rating = "Rating must be between 1 and 5";
      isValid = false;
    }

    setErrors(newErrors);  // Show error messages to user
    return isValid;  // Tell caller if form passed all checks
  };  
  /**
   * REVIEW SUBMISSION PROCESS
   * =========================
   * 
   * This is the main function that handles when a user submits their review.
   * It's like processing a form submission on a website.
   * 
   * STEP-BY-STEP PROCESS:
   * 1. Hide the keyboard (better user experience)
   * 2. Validate all form fields (name, email, text, rating)
   * 3. Check if user is logged in (Firebase security requirement)
   * 4. Create a review data object with all the information
   * 5. Save to Firebase database in the cloud
   * 6. Update the local display with the new review
   * 7. Reset the form for the next review
   * 8. Show success message to user
   * 
   * SECURITY FEATURES:
   * • Only authenticated users can submit (prevents spam)
   * • Rating is clamped between 1-5 (Math.max/Math.min)
   * • User ID is tracked for moderation purposes
   * • All data is validated before submission
   * 
   * ERROR HANDLING:
   * • Form validation errors → Show specific field errors
   * • Authentication missing → Redirect to login
   * • Database save fails → Show error message
   * • Always stop loading spinner when done
   * 
   * TECHNICAL DETAILS:
   * • addDoc() adds a new document to Firebase collection
   * • Spread operator (...) copies arrays and objects
   * • Keyboard.dismiss() hides the on-screen keyboard
   * • async/await handles the database operation
   */
  const handleSubmit = async () => {
    Keyboard.dismiss();  // Hide keyboard for better UX
    
    // STEP 1: Validate all form fields
    if (!validateForm()) {
      return;  // Stop here if validation failed
    }

    // STEP 2: Security check - ensure user is authenticated
    if (!user) {
      setErrors({ 
        ...errors, 
        author: "Please log in to submit a review. Firebase security requires authentication." 
      });
      router.push('/account');  // Redirect to login page
      return;
    }

    // STEP 3: Show loading state while processing
    setIsLoading(true);
    
    try {
      // STEP 4: Create review data object with all required fields
      const reviewData: Omit<Review, 'id'> = {
        author,
        email,
        text,
        rating: Math.max(1, Math.min(5, parseInt(rating))),  // Ensure rating is 1-5
        createdAt: new Date(),  // Current timestamp
        userId: user.uid,       // For security and moderation
        userEmail: user.email || email  // Use authenticated email when available
      };
      
      // STEP 5: Save to Firebase database
      const docRef = await addDoc(collection(db, 'reviews'), reviewData);
      console.log('✅ Review saved to database with ID:', docRef.id);
      
      // STEP 6: Update local display immediately (optimistic update)
      setReviews([
        {
          id: docRef.id,  // Use the ID Firebase generated
          ...reviewData   // Copy all the review data
        },
        ...reviews  // Keep all existing reviews below the new one
      ]);
      
      // STEP 7: Reset form for next review
      setAuthor('');
      setEmail('');
      setText('');
      setRating('5');
      setErrors({});
      
      console.log('🎉 Review submission completed successfully');
      console.log('Review submitted successfully!');
    } catch (error: any) {
      console.error('Error saving review:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'permission-denied') {
        setErrors({ 
          ...errors, 
          author: "Permission denied. Please ensure you're logged in and try again." 
        });
      } else if (error.code === 'unauthenticated') {
        setErrors({ 
          ...errors, 
          author: "Authentication required. Please log in to submit a review." 
        });
        router.push('/account');
      } else {
        setErrors({ 
          ...errors, 
          author: "Failed to submit review. Please try again." 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <ThemedView style={styles.page}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="rgba(33, 101, 90, 1)"
      />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        keyboardShouldPersistTaps="handled"
      >        {/* Review Form */}
        <GlassBackground style={styles.formContainer} intensity={40}>
          <ThemedText type="heading3" style={styles.formTitle}>
            Share Your Experience
          </ThemedText>
          
          {/* Authentication Status Indicator */}
          {user ? (
            <View style={styles.authStatusContainer}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <ThemedText style={styles.authStatusText}>
                Logged in as {user.email}
              </ThemedText>
            </View>
          ) : (
            <View style={styles.authStatusContainer}>
              <Ionicons name="warning" size={20} color="#F59E0B" />
              <ThemedText style={styles.authStatusWarning}>
                Please log in to submit reviews
              </ThemedText>
              <TouchableOpacity 
                style={styles.loginButton}
                onPress={() => router.push('/account')}
              >
                <ThemedText style={styles.loginButtonText}>
                  Go to Login
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}
          <TextInput
            style={[styles.input, errors.author ? styles.inputError : null]}
            placeholder="Your Name"
            placeholderTextColor="#888"
            value={author}
            onChangeText={(text) => {
              setAuthor(text);
              if (errors.author) setErrors({...errors, author: undefined});
            }}
            returnKeyType="next"
            onSubmitEditing={() => emailInputRef.current?.focus()}
            accessibilityLabel="Your name"
          />
          {errors.author && 
            <ThemedText style={styles.errorText}>{errors.author}</ThemedText>
          }
          
          <TextInput
            ref={emailInputRef}
            style={[styles.input, errors.email ? styles.inputError : null]}
            placeholder="Your Email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors({...errors, email: undefined});
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => reviewInputRef.current?.focus()}
            accessibilityLabel="Your email address"
          />
          {errors.email && 
            <ThemedText style={styles.errorText}>{errors.email}</ThemedText>
          }
          
          <TextInput
            ref={reviewInputRef}
            style={[styles.input, styles.textArea, errors.text ? styles.inputError : null]}
            placeholder="Write your review..."
            placeholderTextColor="#888"
            value={text}
            onChangeText={(text) => {
              setText(text);
              if (errors.text) setErrors({...errors, text: undefined});
            }}
            multiline
            returnKeyType="next"
            onSubmitEditing={() => ratingInputRef.current?.focus()}
            accessibilityLabel="Your review"
          />
          {errors.text && 
            <ThemedText style={styles.errorText}>{errors.text}</ThemedText>
          }
          
          <TextInput
            ref={ratingInputRef}
            style={[styles.input, errors.rating ? styles.inputError : null]}
            placeholder="Rating (1-5)"
            placeholderTextColor="#888"
            value={rating}
            onChangeText={(text) => {
              setRating(text);
              if (errors.rating) setErrors({...errors, rating: undefined});
            }}
            keyboardType="numeric"
            maxLength={1}
            accessibilityLabel="Rating from 1 to 5"
          />
          {errors.rating && 
            <ThemedText style={styles.errorText}>{errors.rating}</ThemedText>
          }
          
          <TouchableOpacity
            style={[
              styles.submitButton,
              isLoading && styles.disabledButton
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <ThemedText style={styles.submitButtonText}>Submit Review</ThemedText>
            )}
          </TouchableOpacity>
        </GlassBackground>
        
        {/* Reviews List */}
        <View style={styles.reviewsSection}>
          <ThemedText type="heading2" style={styles.sectionTitle}>
            Customer Reviews
          </ThemedText>
            {isInitialLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.light.palette.secondary.main} />
              <ThemedText style={styles.loadingText}>Loading reviews...</ThemedText>
            </View>
          ) : fetchError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="warning" size={24} color="#cc0000" />
              <ThemedText style={styles.errorText}>{fetchError}</ThemedText>
            </View>
          ) : reviews.length === 0 ? (
            <ThemedText style={styles.noReviewsText}>
              No reviews yet. Be the first to share your experience!
            </ThemedText>
          ) : (
            <View style={styles.reviewsList}>
              {reviews.map((review, index) => (
                <ReviewCard
                  key={review.id || index}
                  author={review.author}
                  text={review.text}
                  rating={review.rating}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#52D6E2',
    paddingTop: Platform.OS === 'ios' ? 45 : StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 30,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  formContainer: {
    width: '90%',
    marginBottom: 30,
    padding: 20,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
  },
  formTitle: {
    marginBottom: 15,
    color: '#21655A',
    fontSize: 20,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
    color: '#222',
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#e74c3c',
    backgroundColor: '#fdeaea',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#21655A',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 12,
    alignSelf: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    textAlign: 'center',
  },
  reviewsSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
    paddingBottom: 30,
  },
  sectionTitle: {
    marginBottom: 15,
    color: '#21655A',
    fontSize: 20,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255,255,255,0.5)',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center', 
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 240, 240, 0.8)',
    borderRadius: 8,
    marginVertical: 10,
  },
  loadingText: {
    marginTop: 16,
    color: Colors.light.palette.neutral[700],
  },
  noReviewsText: {
    padding: 20,
    textAlign: 'center',
    color: Colors.light.palette.neutral[700],
  },
  reviewsList: {
    gap: 16,  },
  // Authentication status styles
  authStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 8,
    width: '100%',
  },
  authStatusText: {
    marginLeft: 8,
    color: '#10B981',
    fontSize: 14,
    fontWeight: '500',
  },
  authStatusWarning: {
    marginLeft: 8,
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  loginButton: {
    backgroundColor: '#21655A',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Glass styles
  glassEffect: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
    borderRadius: 15,
  },
  glassEffectAndroid: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  noRadius: {
    borderRadius: 0,
  },
});