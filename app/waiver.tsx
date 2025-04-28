import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, View, Platform, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Checkbox } from 'expo-checkbox';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';

// Glass effect component similar to about-us page
interface GlassBackgroundProps {
  style?: any;
  intensity?: number;
  children: React.ReactNode;
  noRadius?: boolean;
  solid?: boolean;
}

function GlassBackground({ style, intensity = 50, children, noRadius = false, solid = false }: GlassBackgroundProps) {
  const isIOS = Platform.OS === 'ios';
  
  if (solid) {
    // Completely solid background with no transparency
    return (
      <View
        style={[
          styles.solidBackground,
          noRadius ? styles.noRadius : null,
          style
        ]}
      >
        {children}
      </View>
    );
  } else if (isIOS) {
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

export default function WaiverScreen() {
  const [isChecked, setIsChecked] = useState(false);
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');

  // Convert tintColor to string to fix type error
  const checkboxColor = typeof tintColor === 'string' ? tintColor : '#005662';

  const handleConfirm = () => {
    if (isChecked) {
      // Navigate back to home
      router.push('/');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <View style={styles.contentContainer}>
          <GlassBackground style={styles.titleContainer}>
            <ThemedText style={styles.title}>Waiver Agreement</ThemedText>
          </GlassBackground>

          <GlassBackground style={styles.waiverContainer} solid={true}>
            <ScrollView style={styles.scrollContainer}>
              <ThemedText style={styles.waiverText}>
                {`WAIVER AND RELEASE OF LIABILITY

By participating in activities offered by AquaLounge, you acknowledge and agree to the following terms and conditions:

1. ACKNOWLEDGMENT OF RISKS
I understand that water activities including but not limited to jet skiing, wakeboarding, water skiing, fishing, and biscuit rides involve inherent risks that could result in injury, disability, death, or property damage. These risks include but are not limited to:
- Changing water flow, tides, currents, wave action, and boat wakes
- Collision with other participants, watercraft, or objects in the water
- Weather conditions including temperature exposure, storms, and lightning
- Equipment failure or misuse
- My own physical condition and physical exertion

2. ASSUMPTION OF RISK
I voluntarily assume all risks associated with participation in these activities, whether identified or not, even if arising from the negligence of AquaLounge or others, and assume full responsibility for my participation.

3. MEDICAL CONFIRMATION
I certify that I am physically fit, can swim, and have not been advised not to participate by a qualified medical professional. I confirm that I am not under the influence of alcohol or any drugs that would impair my judgment or abilities.

4. RELEASE OF LIABILITY
I, for myself and on behalf of my heirs, assigns, personal representatives and next of kin, hereby release and hold harmless AquaLounge, its officers, officials, agents, employees, other participants, and sponsors from any and all claims, demands, losses, and liability arising out of or related to any injury, disability or death I may suffer, or loss or damage to property.

5. INDEMNIFICATION
I agree to indemnify and hold harmless AquaLounge from any claims, damages, or expenses arising from my participation in their activities.

6. PHOTOGRAPHIC RELEASE
I grant AquaLounge permission to take photographs or videos of me in connection with the activity and to use these for promotional purposes without compensation.

7. COMPLIANCE WITH RULES
I agree to comply with all rules and regulations of AquaLounge and to follow the instructions of staff members.

8. SEVERABILITY
If any portion of this waiver is found to be void or unenforceable, the remaining portions shall remain in full force and effect.

By checking the box below, I acknowledge that I have read this waiver, understand its contents, and agree to be bound by its terms.`}
              </ThemedText>
            </ScrollView>
          </GlassBackground>

          <View style={styles.checkboxContainer}>
            <Checkbox
              style={styles.checkbox}
              value={isChecked}
              onValueChange={setIsChecked}
              color={isChecked ? checkboxColor : undefined}
            />
            <ThemedText style={styles.checkboxLabel}>
              I confirm that I have read and agree to the waiver terms
            </ThemedText>
          </View>

          <TouchableOpacity 
            style={[
              styles.confirmButton, 
              isChecked ? { backgroundColor: 'rgba(33, 101, 90, 1)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 } : styles.disabledButton
            ]}
            onPress={handleConfirm}
            disabled={!isChecked}
          >
            <ThemedText style={styles.confirmButtonText}>Confirm</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#52D6E2', // Background color to match home page
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#52D6E2', // Adding background color here as well to ensure consistency
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingTop: 20,
  },
  titleContainer: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignSelf: 'center',
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.85)', // Increased opacity for better contrast
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  title: {
    fontSize: 28, // Increased from 24 to 28
    fontWeight: '700', // Changed from 'bold' to '700' for consistency and better weight
    textAlign: 'center',
    color: '#005662', // Added specific color for better contrast against the glass background
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  waiverContainer: {
    width: '100%',
    height: '60%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF', // Ensure solid white background (no transparency)
  },
  scrollContainer: {
    padding: 20,
  },
  waiverText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#000000', // Ensure text is visible against white background
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  checkbox: {
    marginRight: 10,
  },
  checkboxLabel: {
    fontSize: 16,
  },
  confirmButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    width: '100%',
    maxWidth: 300,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  glassEffect: {
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  glassEffectAndroid: {
    overflow: 'hidden', 
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  solidBackground: {
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  noRadius: {
    borderRadius: 0,
  },
});