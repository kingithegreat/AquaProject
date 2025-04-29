import React from 'react';
import { StyleSheet, View, Dimensions, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

interface ReviewCardProps {
  text: string;
  author: string;
  rating?: number; // Optional rating between 1-5
}

const ReviewCard = ({ text, author, rating = 5 }: ReviewCardProps) => {
  const isIOS = Platform.OS === 'ios';
  
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
      // Fallback for Android (no blur, just semi-transparent bg)
      return (
        <View style={[styles.reviewCard, styles.reviewCardAndroid]}>
          {children}
        </View>
      );
    }
  };

  // Function to render star rating
  const renderStars = (rating: number) => {
    const stars = [];
    const maxRating = 5;
    
    // Make sure rating is between 1 and 5
    const normalizedRating = Math.min(Math.max(rating, 1), maxRating);
    
    for (let i = 1; i <= maxRating; i++) {
      stars.push(
        <Text key={i} style={[
          styles.star,
          i <= normalizedRating ? styles.starFilled : styles.starEmpty
        ]}>
          ★
        </Text>
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