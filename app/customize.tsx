import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Stack } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function CustomizeScreen() {
  const [selectedOptions, setSelectedOptions] = useState({
    jetSki: true,
    biscuitRide: false,
    wakeboard: false,
    waterSkis: false,
    beachSetup: false,
    bbq: false,
  });
  
  const [duration, setDuration] = useState(1); // hours
  
  const toggleOption = (option: keyof typeof selectedOptions) => {
    setSelectedOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };
  
  const changeDuration = (amount: number) => {
    const newDuration = duration + amount;
    if (newDuration >= 1 && newDuration <= 8) {
      setDuration(newDuration);
    }
  };
  
  // Calculate estimated price based on selections
  const calculatePrice = () => {
    let basePrice = 120; // Base jet ski rental price per hour
    
    if (selectedOptions.biscuitRide) basePrice += 30;
    if (selectedOptions.wakeboard) basePrice += 40;
    if (selectedOptions.waterSkis) basePrice += 40;
    if (selectedOptions.beachSetup) basePrice += 50;
    if (selectedOptions.bbq) basePrice += 30;
    
    return basePrice * duration;
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Customize Your Experience',
        headerStyle: {
          backgroundColor: '#0077CC',
        },
        headerTintColor: '#fff'
      }} />
      
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.container}>
          <ThemedText type="heading1" style={styles.title}>CUSTOMISE YOUR ADVENTURE</ThemedText>
          
          <ThemedText style={styles.description}>
            Mix and match to create the ultimate experience just for you. Choose from our range of watersport accessories to accompany your jet ski hire.
          </ThemedText>
          
          <ThemedView style={styles.durationContainer}>
            <ThemedText type="heading2" style={styles.sectionTitle}>Duration:</ThemedText>
            <ThemedView style={styles.durationControls}>
              <TouchableOpacity 
                style={[styles.durationButton, duration === 1 && styles.durationButtonDisabled]} 
                onPress={() => changeDuration(-1)}
                disabled={duration === 1}
              >
                <ThemedText style={styles.durationButtonText}>-</ThemedText>
              </TouchableOpacity>
              <ThemedText style={styles.durationText}>{duration} {duration === 1 ? 'hour' : 'hours'}</ThemedText>
              <TouchableOpacity 
                style={[styles.durationButton, duration === 8 && styles.durationButtonDisabled]} 
                onPress={() => changeDuration(1)}
                disabled={duration === 8}
              >
                <ThemedText style={styles.durationButtonText}>+</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
          
          <ThemedView style={styles.optionsContainer}>
            <ThemedText type="heading2" style={styles.sectionTitle}>Options:</ThemedText>
            
            <Option 
              title="Jet Ski Hire" 
              description="Standard Jet Ski rental (required)"
              price="$120/hour"
              selected={selectedOptions.jetSki}
              onToggle={() => {}} // Can't deselect this option
              disabled={true}
            />
            
            <Option 
              title="Biscuit Ride" 
              description="2-4 person tubing experience"
              price="+$30/hour"
              selected={selectedOptions.biscuitRide}
              onToggle={() => toggleOption('biscuitRide')}
            />
            
            <Option 
              title="Wakeboard" 
              description="Includes wakeboard and rope"
              price="+$40/hour"
              selected={selectedOptions.wakeboard}
              onToggle={() => toggleOption('wakeboard')}
            />
            
            <Option 
              title="Water Skis" 
              description="Includes water skis and rope"
              price="+$40/hour"
              selected={selectedOptions.waterSkis}
              onToggle={() => toggleOption('waterSkis')}
            />
            
            <Option 
              title="Beach Setup" 
              description="Beach dome and seating area"
              price="+$50/rental"
              selected={selectedOptions.beachSetup}
              onToggle={() => toggleOption('beachSetup')}
            />
            
            <Option 
              title="BBQ Setup" 
              description="Portable BBQ with cooking essentials"
              price="+$30/rental"
              selected={selectedOptions.bbq}
              onToggle={() => toggleOption('bbq')}
            />
          </ThemedView>
          
          <ThemedView style={styles.totalContainer}>
            <ThemedText type="heading2" style={styles.totalText}>
              Estimated Total: ${calculatePrice()}
            </ThemedText>
            <ThemedText style={styles.taxNote}>
              (Prices include GST)
            </ThemedText>
          </ThemedView>
          
          <TouchableOpacity style={styles.bookButton}>
            <ThemedText style={styles.buttonText}>BOOK THIS PACKAGE</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </>
  );
}

// Option component for each customizable item
interface OptionProps {
  title: string;
  description: string;
  price: string;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

function Option({ title, description, price, selected, onToggle, disabled = false }: OptionProps) {
  return (
    <ThemedView style={[styles.optionCard, selected && styles.selectedOption]}>
      <ThemedView style={styles.optionInfo}>
        <ThemedText type="heading3" style={styles.optionTitle}>{title}</ThemedText>
        <ThemedText style={styles.optionDesc}>{description}</ThemedText>
        <ThemedText style={styles.optionPrice}>{price}</ThemedText>
      </ThemedView>
      <Switch
        value={selected}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: '#d9d9d9', true: '#8dd4ff' }}
        thumbColor={selected ? '#0077CC' : '#f4f4f4'}
      />
    </ThemedView>
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
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  durationContainer: {
    width: '100%',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 15,
  },
  durationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationButton: {
    backgroundColor: '#0077CC',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationButtonDisabled: {
    backgroundColor: '#b3d9ff',
  },
  durationButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  durationText: {
    fontSize: 18,
    marginHorizontal: 20,
    minWidth: 60,
    textAlign: 'center',
  },
  optionsContainer: {
    width: '100%',
    marginBottom: 30,
  },
  optionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: '#0077CC',
    backgroundColor: '#e6f2ff',
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  optionDesc: {
    fontSize: 14,
    marginBottom: 5,
  },
  optionPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0077CC',
  },
  totalContainer: {
    width: '100%',
    padding: 20,
    backgroundColor: '#0077CC',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  totalText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  taxNote: {
    color: 'white',
    fontSize: 12,
    marginTop: 5,
  },
  bookButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginVertical: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});