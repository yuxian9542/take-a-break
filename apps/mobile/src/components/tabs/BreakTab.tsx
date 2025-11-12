import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BreakPlanModal } from '../break/BreakPlanModal';
import { MapModal } from '../break/MapModal';
import { generateBreakPlan, BreakPlan } from '../../data/mockBreakPlans';

type FeelingStatus = 'stressed' | 'tired' | 'need_pause';

const statusOptions: { value: FeelingStatus; label: string }[] = [
  { value: 'tired', label: 'Tired' },
  { value: 'stressed', label: 'Stressed' },
  { value: 'need_pause', label: 'Pause' },
];

const timeOptions = [10, 30, 60];

export function BreakTab() {
  const [selectedStatus, setSelectedStatus] = useState<FeelingStatus>('tired');
  const [selectedTime, setSelectedTime] = useState<number>(10);
  const [canGoOutside, setCanGoOutside] = useState(true);
  const [canTalk, setCanTalk] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [generatedPlans, setGeneratedPlans] = useState<BreakPlan[]>([]);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapLocation, setMapLocation] = useState<{
    id?: string;
    name: string;
    address: string;
    walkingDistance: number;
    walkingTime: number;
    coordinates?: { lat: number; lng: number };
  } | null>(null);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceCompanionActive, setVoiceCompanionActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleNeedBreak = () => {
    try {
      console.log('Generating plans with:', { selectedStatus, selectedTime, canGoOutside, canTalk });
      const plans = generateBreakPlan(selectedStatus, selectedTime, canGoOutside, canTalk);
      console.log('Generated plans:', plans, 'Length:', plans?.length);
      if (!plans || plans.length === 0) {
        console.error('No plans generated');
        return;
      }
      setGeneratedPlans(plans);
      setShowPlanModal(true);
      console.log('Modal should be open');
    } catch (error) {
      console.error('Error generating break plan:', error);
    }
  };

  const getTimeLabel = (minutes: number) => {
    if (minutes >= 60) return `${minutes / 60} hour`;
    return `${minutes} min`;
  };

  return (
    <LinearGradient
      colors={['#f0fdf4', '#ecfdf5', '#d1fae5']}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Take a Moment</Text>
          <Text style={styles.subtitle}>How can we help you relax?</Text>
        </View>

        {/* Status Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>I'm feeling...</Text>
          <View style={styles.optionsRow}>
            {statusOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setSelectedStatus(option.value)}
                style={[
                  styles.optionButton,
                  selectedStatus === option.value && styles.optionButtonActive
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedStatus === option.value && styles.optionTextActive
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Time Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>I have...</Text>
          <View style={styles.optionsRow}>
            {timeOptions.map((time) => (
              <TouchableOpacity
                key={time}
                onPress={() => setSelectedTime(time)}
                style={[
                  styles.optionButton,
                  selectedTime === time && styles.optionButtonActive
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedTime === time && styles.optionTextActive
                  ]}
                >
                  {getTimeLabel(time)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Breathing Circle Animation */}
        <View style={styles.breathingContainer}>
          <View style={styles.breathingCircle}>
            {/* Outer breathing ring */}
            <View style={[styles.breathingRing, styles.outerRing]} />
            
            {/* Middle breathing ring */}
            <View style={[styles.breathingRing, styles.middleRing]} />

            {/* Center button */}
            <TouchableOpacity
              onPress={handleNeedBreak}
              style={styles.centerButton}
              activeOpacity={0.9}
            >
              <Text style={styles.startText}>Start</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Break Plan Modal */}
      <BreakPlanModal
        open={showPlanModal}
        onOpenChange={setShowPlanModal}
        plans={generatedPlans}
        onNavigate={(location) => {
          setMapLocation(location);
          setShowMapModal(true);
        }}
      />

      {/* Map Modal */}
      <MapModal
        open={showMapModal}
        onOpenChange={(open) => {
          setShowMapModal(open);
          if (!open) {
            setVoiceCompanionActive(false);
            setShowVoiceModal(false);
            setIsListening(false);
            setIsSpeaking(false);
          }
        }}
        location={mapLocation}
        onOpenVoice={() => {
          if (!voiceCompanionActive) {
            setVoiceCompanionActive(true);
          }
          setShowVoiceModal(true);
        }}
        showVoiceModal={showVoiceModal}
        onCloseVoice={() => {
          setShowVoiceModal(false);
          // Keep companion active even when modal closes
        }}
        voiceCompanionActive={voiceCompanionActive}
        isListening={isListening}
        isSpeaking={isSpeaking}
        onListeningChange={setIsListening}
        onSpeakingChange={setIsSpeaking}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    color: '#134e4a',
    fontWeight: '300',
    letterSpacing: -0.64,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(20, 184, 166, 0.6)',
    fontWeight: '300',
  },
  section: {
    width: '100%',
    marginBottom: 40,
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 15,
    color: 'rgba(20, 184, 166, 0.6)',
    fontWeight: '300',
    marginBottom: 16,
    textAlign: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  optionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  optionButtonActive: {
    backgroundColor: '#5eead4',
    shadowColor: '#5eead4',
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 4,
  },
  optionText: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '400',
  },
  optionTextActive: {
    color: '#134e4a',
    fontWeight: '500',
  },
  breathingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingBottom: 32,
  },
  breathingCircle: {
    width: 200,
    height: 200,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathingRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#5eead4',
    borderRadius: 999,
  },
  outerRing: {
    width: 200,
    height: 200,
    top: 0,
    left: 0,
  },
  middleRing: {
    width: 176,
    height: 176,
    top: 12,
    left: 12,
  },
  centerButton: {
    width: 150,
    height: 150,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5eead4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.3)',
  },
  startText: {
    fontSize: 20,
    color: '#134e4a',
    fontWeight: '300',
    letterSpacing: 1,
  },
});
