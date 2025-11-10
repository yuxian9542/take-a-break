import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BreakPlan, BreakStep } from '../../data/mockBreakPlans';
import { X, Navigation, MessageCircle, Play, RefreshCw } from 'lucide-react-native';
import { VoiceChatModal } from './VoiceChatModal';

interface BreakPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: BreakPlan[];
  onNavigate?: (location: {
    name: string;
    address: string;
    walkingDistance: number;
    walkingTime: number;
    coordinates?: { lat: number; lng: number };
  }) => void;
}

export function BreakPlanModal({ open, onOpenChange, plans, onNavigate }: BreakPlanModalProps) {
  const [currentPlanIndex, setCurrentPlanIndex] = useState(0);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [selectedStep, setSelectedStep] = useState<BreakStep | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setCurrentPlanIndex(0);
    } else {
      // Reset selectedStep when main modal closes
      setSelectedStep(null);
      setShowVoiceModal(false);
    }
  }, [open]);

  // Don't render modal if no plans or modal not open
  if (!open || !plans || plans.length === 0) {
    return null;
  }

  const currentPlan = plans[currentPlanIndex];
  
  if (!currentPlan || !currentPlan.steps || currentPlan.steps.length === 0) {
    return null;
  }

  const getActionButton = (stepType: string) => {
    switch (stepType) {
      case 'walk':
        return { icon: Navigation, label: 'Navigate', variant: 'default' as const };
      case 'voice':
        return { icon: MessageCircle, label: 'Start Chat', variant: 'default' as const };
      case 'wim_hof':
        return { icon: Play, label: 'Start Session', variant: 'default' as const };
      default:
        return { icon: Play, label: 'Begin', variant: 'outline' as const };
    }
  };

  const handleDifferentPlan = () => {
    if (currentPlanIndex < plans.length - 1) {
      setCurrentPlanIndex(currentPlanIndex + 1);
    } else {
      setCurrentPlanIndex(0);
    }
  };

  return (
    <>
      <Modal
        visible={open}
        animationType="slide"
        transparent={true}
        onRequestClose={() => onOpenChange(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#f0fdf4', '#ecfdf5']}
              style={styles.gradient}
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerTitleContainer}>
                  <Text style={styles.headerTitle} numberOfLines={2}>Your Break Plan</Text>
                </View>
                <TouchableOpacity
                  onPress={() => onOpenChange(false)}
                  style={styles.closeButton}
                >
                  <X size={16} color="#134e4a" />
                </TouchableOpacity>
              </View>

              {/* Plan Steps - Scrollable */}
              <ScrollView 
                style={styles.stepsContainer}
                contentContainerStyle={styles.stepsContent}
                showsVerticalScrollIndicator={false}
              >
                <View
                  key={currentPlanIndex}
                >
                  {currentPlan.steps.map((step) => {
                    const action = getActionButton(step.type);
                    const ActionIcon = action.icon;

                    return (
                      <View key={step.stepNumber} style={styles.stepCard}>
                        <View style={styles.stepContent}>
                          {/* Step Number Badge */}
                          <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>{step.stepNumber}</Text>
                          </View>

                          {/* Content */}
                          <View style={styles.stepDetails}>
                            <View style={styles.stepHeader}>
                              <View style={styles.stepTitleRow}>
                                <Text style={styles.stepIcon}>{step.icon}</Text>
                                <Text style={styles.stepTitle} numberOfLines={2}>{step.title}</Text>
                              </View>
                            </View>

                            <Text style={styles.stepDescription}>{step.description}</Text>

                            {step.location && (
                              <Text style={styles.stepLocation}>
                                📍 {step.location.name} • {Math.round(step.location.walkingDistance * 3.28084)} ft
                              </Text>
                            )}

                            <TouchableOpacity
                              onPress={() => {
                                if (step.type === 'walk' && step.location && onNavigate) {
                                  const location = {
                                    name: step.location.name,
                                    address: step.description || step.location.name,
                                    walkingDistance: step.location.walkingDistance,
                                    walkingTime: step.location.eta,
                                    coordinates: step.location.coordinates ? {
                                      lat: step.location.coordinates.latitude,
                                      lng: step.location.coordinates.longitude,
                                    } : undefined,
                                  };
                                  onOpenChange(false); // Close BreakPlanModal
                                  onNavigate(location); // Open MapModal via callback
                                } else if (step.type === 'voice') {
                                  setSelectedStep(step);
                                  onOpenChange(false); // Close BreakPlanModal first
                                  setTimeout(() => {
                                    setShowVoiceModal(true); // Then open VoiceModal
                                  }, 100);
                                }
                              }}
                              style={[
                                styles.actionButton,
                                action.variant === 'default' ? styles.actionButtonPrimary : styles.actionButtonOutline
                              ]}
                            >
                              <ActionIcon size={14} color={action.variant === 'default' ? '#134e4a' : '#6b7280'} />
                              <Text style={[
                                styles.actionButtonText,
                                action.variant === 'default' ? styles.actionButtonTextPrimary : styles.actionButtonTextOutline
                              ]}>
                                {action.label}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* Plan Indicator */}
                {plans.length > 1 && (
                  <View style={styles.indicatorContainer}>
                    {plans.map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.indicator,
                          currentPlanIndex === index && styles.indicatorActive
                        ]}
                      />
                    ))}
                  </View>
                )}
              </ScrollView>

              {/* Footer Actions */}
              {plans.length > 1 && (
                <View style={styles.footer}>
                  <TouchableOpacity
                    onPress={handleDifferentPlan}
                    style={styles.differentPlanButton}
                  >
                    <RefreshCw size={16} color="#6b7280" />
                    <Text style={styles.differentPlanText}>
                      Get Different Plan ({currentPlanIndex + 1}/{plans.length})
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Voice Chat Modal */}
      <VoiceChatModal
        open={showVoiceModal}
        onOpenChange={setShowVoiceModal}
        sessionTopic={selectedStep?.voiceSession?.topic}
        showContinueButton={false}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    maxHeight: '85%',
    minHeight: 200,
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#f0fdf4',
  },
  gradient: {
    minHeight: 200,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(94, 234, 212, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  headerTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    color: '#134e4a',
    fontWeight: '300',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsContainer: {
    maxHeight: 400,
  },
  stepsContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  stepCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.3)',
    marginBottom: 8,
  },
  stepContent: {
    flexDirection: 'row',
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#5eead4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#134e4a',
    fontWeight: '500',
    fontSize: 14,
  },
  stepDetails: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  stepIcon: {
    fontSize: 18,
  },
  stepTitle: {
    fontSize: 18,
    color: '#134e4a',
    fontWeight: '400',
    flexShrink: 1,
    flex: 1,
  },
  stepDescription: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '300',
    lineHeight: 20,
  },
  stepLocation: {
    color: '#14b8a6',
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '400',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: '100%',
  },
  actionButtonPrimary: {
    backgroundColor: '#5eead4',
  },
  actionButtonOutline: {
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtonTextPrimary: {
    color: '#134e4a',
  },
  actionButtonTextOutline: {
    color: '#6b7280',
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 8,
  },
  indicator: {
    height: 6,
    width: 8,
    borderRadius: 3,
    backgroundColor: 'rgba(94, 234, 212, 0.3)',
  },
  indicatorActive: {
    width: 24,
    backgroundColor: '#5eead4',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(94, 234, 212, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  differentPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  differentPlanText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '300',
  },
});
