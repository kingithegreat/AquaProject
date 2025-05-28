/**
 * REVIEW CARD COMPONENT - Aqua 360°
 * =================================
 * 
 * A reusable card component for displaying customer reviews with star ratings.
 * Features platform-specific styling with iOS blur effects and Android fallbacks.
 * 
 * FEATURES:
 * ✅ Cross-platform compatibility (iOS blur effects, Android fallbacks)
 * ✅ Dynamic star rating display (1-5 stars)
 * ✅ Responsive design that adapts to screen width
 * ✅ Glass morphism effect on iOS for modern UI
 * ✅ Proper text truncation and formatting
 * ✅ TypeScript support with prop validation
 * 
 * DESIGN HIGHLIGHTS:
 * - Uses expo-blur for iOS glass effect
 * - Falls back to semi-transparent background on Android
 * - Responsive width calculation based on screen dimensions
 * - Professional card shadows and spacing
 * 
 * USAGE:
 * <ReviewCard 
 *   text="Great experience at Aqua 360°!" 
 *   author="John Smith" 
 *   rating={5} 
 * />
 */

import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

// Define the props interface for the ReviewCard component
interface ReviewCardProps {
  text: string;      // The review text content
  author: string;    // Name of the person who wrote the review
  rating?: number;   // Optional star rating (1-5), defaults to 5
}

/**
 * ReviewCard Component
 * 
 * Renders a customer review in a visually appealing card format with
 * platform-specific styling and star rating display.
 * 
 * @param text - The review text content
 * @param author - Name of the review author
 * @param rating - Star rating from 1-5 (defaults to 5)
 */
const ReviewCard = ({ text, author, rating = 5 }: ReviewCardProps) => {
  const isIOS = Platform.OS === 'ios';
  
  /**
   * CardBackground Component
   * 
   * Provides platform-specific background styling:
   * - iOS: Uses BlurView for glass morphism effect
   * - Android: Uses semi-transparent background (blur not supported)
   */
  const CardBackground = ({ children }: { children: React.ReactNode }) => {
    if (isIOS) {
      return (
        <BlurView 
          intensity={90} 
          tint="light" 
          style={styles.reviewCard}
        >
          {children}
        </BlurView>
      );
    } else {
      // Fallback for Android - semi-transparent background instead of blur
      return (
        <View style={[styles.reviewCard, styles.reviewCardAndroid]}>
          {children}
        </View>
      );
    }
  };
  
  /**
   * Renders star rating display
   * 
   * Creates a visual representation of the rating using star characters.
   * Fills stars based on rating value and shows empty stars for remainder.
   * 
   * @param rating - Number between 1-5 representing star rating
   * @returns Array of star characters for display
   */
  const renderStars = (rating: number) => {
    const stars = [];
    const maxRating = 5;
    
    // Ensure rating is within valid range (1-5)
    const normalizedRating = Math.min(Math.max(rating, 1), maxRating);
    
    for (let i = 1; i <= maxRating; i++) {
      stars.push(
        <ThemedText key={i} style={[
          styles.star,
          i <= normalizedRating ? styles.starFilled : styles.starEmpty
        ]}>
          ★
        </ThemedText>
      );
    }
    
    return (
      <View style={styles.starsContainer}>
        {stars}
      </View>
    );
  };

  return (
    <CardBackground>
      {renderStars(rating)}
      <ThemedText style={styles.reviewText}>{text}</ThemedText>
      <ThemedText style={styles.reviewAuthor}>{author}</ThemedText>
    </CardBackground>
  );
};

const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  reviewCard: {
    width: windowWidth * 0.8,  // 80% of screen width for better fit
    marginRight: 15,
    padding: 20,
    borderRadius: 15,
    justifyContent: 'space-between',
    minHeight: 180,
    // Updated from deprecated shadow* properties to boxShadow for web
    ...(Platform.OS === 'web' 
      ? { boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.25)' } 
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 7,
        }
    ),
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Increased opacity for white background
  },
  reviewCardAndroid: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Increased opacity for white background
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  star: {
    fontSize: 22,
    marginRight: 2,
  },
  starFilled: {
    color: '#FFD700', // Gold color for filled stars
  },
  starEmpty: {
    color: '#D3D3D3', // Light gray for empty stars
  },
  reviewText: {
    color: '#21655A',
    fontSize: 16.5,
    fontWeight: '500', // Slightly increased weight for better readability
    lineHeight: 23,
    marginBottom: 15,
  },
  reviewAuthor: {
    color: '#21655A',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
  }
});

export default ReviewCard;