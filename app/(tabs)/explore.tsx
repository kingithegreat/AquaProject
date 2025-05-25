/**
 * AQUA360 EXPLORE PAGE
 * ===================
 * 
 * PRESENTATION TALKING POINTS:
 * - Discover new swimming locations and features
 * - Integration with mapping services for location discovery
 * - Community-driven content and recommendations
 * - Advanced search and filtering capabilities
 * 
 * TECHNICAL FEATURES:
 * - Clean, accessible UI following Aqua360 design system
 * - Proper text component usage (all text in <Text> components)
 * - Responsive layout that works on different screen sizes
 * - Integration ready for map services and location APIs
 */

import React from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function ExploreScreen() {
  return (
    <ScrollView style={styles.container}>      <ThemedView style={styles.header}>
        <IconSymbol 
          name="map" 
          size={60} 
          color="#007AFF" 
          style={styles.headerIcon}
        />
        <ThemedText type="heading1" style={styles.title}>
          Explore
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Discover amazing swimming locations near you
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.content}>
        <ThemedView style={styles.section}>
          <ThemedText type="heading2" style={styles.sectionTitle}>
            Popular Locations
          </ThemedText>
          
          <TouchableOpacity style={styles.locationCard}>
            <ThemedView style={styles.cardContent}>
              <IconSymbol name="water.waves" size={24} color="#007AFF" />
              <ThemedView style={styles.cardText}>
                <ThemedText type="bodyBold">
                  Crystal Bay Swimming Pool
                </ThemedText>
                <ThemedText style={styles.cardSubtext}>
                  2.3 km away • 4.8★ rating
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </TouchableOpacity>

          <TouchableOpacity style={styles.locationCard}>
            <ThemedView style={styles.cardContent}>
              <IconSymbol name="beach.umbrella" size={24} color="#007AFF" />
              <ThemedView style={styles.cardText}>
                <ThemedText type="bodyBold">
                  Sunset Beach
                </ThemedText>
                <ThemedText style={styles.cardSubtext}>
                  5.1 km away • 4.6★ rating
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </TouchableOpacity>

          <TouchableOpacity style={styles.locationCard}>
            <ThemedView style={styles.cardContent}>
              <IconSymbol name="drop" size={24} color="#007AFF" />
              <ThemedView style={styles.cardText}>
                <ThemedText type="bodyBold">
                  Mountain Lake Resort
                </ThemedText>
                <ThemedText style={styles.cardSubtext}>
                  12.8 km away • 4.9★ rating
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="heading2" style={styles.sectionTitle}>
            Categories
          </ThemedText>
          
          <View style={styles.categoryGrid}>
            <TouchableOpacity style={styles.categoryCard}>
              <IconSymbol name="building.2" size={32} color="#007AFF" />
              <ThemedText style={styles.categoryText}>
                Swimming Pools
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.categoryCard}>
              <IconSymbol name="sun.max" size={32} color="#007AFF" />
              <ThemedText style={styles.categoryText}>
                Beaches
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.categoryCard}>
              <IconSymbol name="mountain.2" size={32} color="#007AFF" />
              <ThemedText style={styles.categoryText}>
                Lakes
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.categoryCard}>
              <IconSymbol name="leaf" size={32} color="#007AFF" />
              <ThemedText style={styles.categoryText}>
                Natural Springs
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="heading2" style={styles.sectionTitle}>
            Recent Reviews
          </ThemedText>
          
          <ThemedView style={styles.reviewCard}>
            <ThemedText type="bodyBold">
              "Amazing facilities and crystal clear water!"
            </ThemedText>
            <ThemedText style={styles.reviewText}>
              - Sarah M. at Crystal Bay Swimming Pool
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.reviewCard}>
            <ThemedText type="bodyBold">
              "Perfect for family swimming, highly recommend"
            </ThemedText>
            <ThemedText style={styles.reviewText}>
              - Mike D. at Sunset Beach
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerIcon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  locationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  cardText: {
    marginLeft: 16,
    flex: 1,
  },
  cardSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    color: '#333',
  },
  reviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  reviewText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
