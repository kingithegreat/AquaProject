import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  View, 
  Platform, 
  Keyboard,
  StatusBar
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import ReviewCard from '@/components/ui/ReviewCard';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';

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
  author: string;
  email: string; // Email won't be displayed in ReviewCard but stored
  text: string;
  rating: number;
}

interface FormErrors {
  author?: string;
  email?: string;
  text?: string;
  rating?: string;
}

export default function ReviewsScreen() {
  // Sample review data
  const [reviews, setReviews] = useState<Review[]>([
    { author: 'Alice', email: 'alice@email.com', text: 'Great experience! Highly recommend.', rating: 5 },
    { author: 'Bob', email: 'bob@email.com', text: 'Nice place, friendly staff.', rating: 4 },
  ]);
  
  // Form state
  const [author, setAuthor] = useState('');
  const [email, setEmail] = useState('');
  const [text, setText] = useState('');
  const [rating, setRating] = useState('5');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs for text inputs to help with focus management
  const emailInputRef = useRef<TextInput>(null);
  const reviewInputRef = useRef<TextInput>(null);
  const ratingInputRef = useRef<TextInput>(null);

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

  const handleSubmit = () => {
    Keyboard.dismiss();
    
    if (!validateForm()) {
      return;
    }

    // Simulate loading state for API submission
    setIsLoading(true);
    
    setTimeout(() => {
      setReviews([
        { 
          author, 
          email, 
          text, 
          rating: Math.max(1, Math.min(5, parseInt(rating))) 
        },
        ...reviews,
      ]);
      
      // Reset form
      setAuthor('');
      setEmail('');
      setText('');
      setRating('5');
      setErrors({});
      setIsLoading(false);
    }, 500);
  };

  return (
    <ThemedView style={styles.page}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="rgba(33, 101, 90, 1)"
      />
      
      {/* The green back button has been removed */}

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
            style={[styles.button, isLoading ? styles.buttonDisabled : null]}
            onPress={handleSubmit}
            disabled={isLoading}
            accessibilityLabel="Submit review"
            accessibilityHint="Submit your review and rating"
          >
            <ThemedText style={styles.buttonText}>
              {isLoading ? "Submitting..." : "Submit Review"}
            </ThemedText>
          </TouchableOpacity>
        </GlassBackground>

        {/* Reviews List */}
        <View style={styles.reviewsList}>
          <ThemedText type="heading3" style={styles.reviewsListTitle}>
            What Others Are Saying
          </ThemedText>
          
          {reviews.length === 0 ? (
            <ThemedText style={styles.noReviewsText}>
              No reviews yet. Be the first to leave one!
            </ThemedText>
          ) : (
            reviews.map((review, idx) => (
              <ReviewCard
                key={idx}
                text={review.text}
                author={review.author}
                rating={review.rating}
                style={styles.reviewCard}
              />
            ))
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
  // backButton styles removed
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
  button: {
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
  buttonDisabled: {
    backgroundColor: '#93beab',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    textAlign: 'center',
  },
  reviewsList: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
    paddingBottom: 30,
  },
  reviewsListTitle: {
    marginBottom: 15,
    color: '#21655A',
    fontSize: 20,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255,255,255,0.5)',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  noReviewsText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 15,
    borderRadius: 10,
  },
  reviewCard: {
    marginBottom: 18,
    width: '90%',
    alignSelf: 'center',
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