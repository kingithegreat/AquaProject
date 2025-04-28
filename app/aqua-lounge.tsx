import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function AquaLoungeScreen() {
  return (
    <>
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.container}>
          
          <ThemedView style={styles.imageContainer}>
            {/* Placeholder for image - you can add actual images later */}
            <ThemedView style={styles.imagePlaceholder}>
              <ThemedText style={styles.imagePlaceholderText}>Aqua Lounge Image</ThemedText>
            </ThemedView>
          </ThemedView>
          
          <ThemedText style={styles.description}>
            Bring your family and friends and let Aqua 360° take care of the rest. Our Aqua Lounge provides the perfect relaxation spot by the bay before or after your jet ski adventure.
          </ThemedText>
          
          <ThemedView style={styles.featuresContainer}>
            <ThemedText type="heading2" style={styles.sectionTitle}>Aqua Lounge Features:</ThemedText>
            
            <ThemedView style={styles.featureCard}>
              <ThemedText type="heading3" style={styles.featureTitle}>Beach Dome & BBQ</ThemedText>
              <ThemedText style={styles.featureDesc}>
                Enjoy our comfortable beach dome setup with BBQ facilities, perfect for family gatherings and corporate events.
              </ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.featureCard}>
              <ThemedText type="heading3" style={styles.featureTitle}>Relaxation Zone</ThemedText>
              <ThemedText style={styles.featureDesc}>
                Comfortable seating area to relax before or after your water adventure.
              </ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.featureCard}>
              <ThemedText type="heading3" style={styles.featureTitle}>Event Setup</ThemedText>
              <ThemedText style={styles.featureDesc}>
                Let Aqua 360° take care of the setup and pack down of your event. Have fun on the beach with jet ski hire, beach dome & BBQ, all included!
              </ThemedText>
            </ThemedView>
          </ThemedView>
          
          <TouchableOpacity style={styles.bookButton}>
            <ThemedText style={styles.buttonText}>BOOK THE AQUA LOUNGE</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    backgroundColor: '#e0f0ff',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    color: '#0077CC',
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 15,
  },
  featureCard: {
    backgroundColor: '#f0f8ff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  featureDesc: {
    fontSize: 14,
    lineHeight: 22,
  },
  bookButton: {
    backgroundColor: '#0077CC',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginVertical: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});