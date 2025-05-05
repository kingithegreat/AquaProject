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
}

interface FormErrors {
  author?: string;
  email?: string;
  text?: string;
  rating?: string;
}

export default function ReviewsScreen() {
  // Review state
  const [reviews, setReviews] = useState<Review[]>([]);
  
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

  // Function to fetch reviews from Firestore
  const fetchReviews = async () => {
    try {
      setIsInitialLoading(true);
      const reviewsQuery = query(
        collection(db, 'reviews'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(reviewsQuery);
      const fetchedReviews: Review[] = [];
      
      querySnapshot.forEach((doc) => {
        fetchedReviews.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate() // Convert Firestore Timestamp to Date
        } as Review);
      });
      
      setReviews(fetchedReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    if (!author.trim()) {
      newErrors.author = "Name is required";
      isValid = false;
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email";
      isValid = false;
    }

    if (!text.trim()) {
      newErrors.text = "Review text is required";
      isValid = false;
    }

    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      newErrors.rating = "Rating must be between 1 and 5";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    
    if (!validateForm()) {
      return;
    }

    // Set loading state for API submission
    setIsLoading(true);
    
    try {
      console.log('Submitting new review...');
      
      // Create review object
      const reviewData: Omit<Review, 'id'> = {
        author,
        email,
        text,
        rating: Math.max(1, Math.min(5, parseInt(rating))),
        createdAt: new Date() // This will be automatically converted to Firestore timestamp
      };
      
      console.log('Review data to submit:', JSON.stringify(reviewData));
      
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'reviews'), reviewData);
      console.log('Review saved with ID:', docRef.id);
      
      // Add to local state with generated ID
      const newReview = {
        id: docRef.id,
        ...reviewData
      };
      
      setReviews([newReview, ...reviews]);
      
      // Reset form
      setAuthor('');
      setEmail('');
      setText('');
      setRating('5');
      setErrors({});
    } catch (error) {
      console.error('Error saving review:', error);
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
      
      {/* Back button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        keyboardShouldPersistTaps="handled"
      >
        {/* Review Form */}
        <GlassBackground style={styles.formContainer} intensity={40}>
          <ThemedText type="heading3" style={styles.formTitle}>
            Share Your Experience
          </ThemedText>
          
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
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
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
    gap: 16,
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