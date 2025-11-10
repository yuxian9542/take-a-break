import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Navigation, MessageCircle, Clock, MapPin, Mic, MicOff, Volume2 } from 'lucide-react-native';

interface Location {
  name: string;
  address: string;
  walkingDistance: number;
  walkingTime: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface MapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: Location | null;
  onOpenVoice?: () => void;
  showVoiceModal?: boolean;
  onCloseVoice?: () => void;
  voiceCompanionActive?: boolean;
  isListening?: boolean;
  isSpeaking?: boolean;
  onListeningChange?: (isListening: boolean) => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
}

export function MapModal({ 
  open, 
  onOpenChange, 
  location,
  onOpenVoice,
  showVoiceModal = false,
  onCloseVoice,
  voiceCompanionActive = false,
  isListening = false,
  isSpeaking = false,
  onListeningChange,
  onSpeakingChange,
}: MapModalProps) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [localIsListening, setLocalIsListening] = useState(false);

  useEffect(() => {
    if (!open) {
      setIsNavigating(false);
    }
  }, [open]);

  const handleToggleVoiceCompanion = () => {
    onOpenVoice?.();
  };

  const handleToggleMic = () => {
    const newListeningState = !localIsListening;
    setLocalIsListening(newListeningState);
    onListeningChange?.(newListeningState);
  };

  // Show modal even without location - use fallback data
  const displayLocation = location || {
    name: 'Location',
    address: 'Address not available',
    walkingDistance: 0,
    walkingTime: 0,
  };

  return (
    <>
      <Modal
        visible={open}
        animationType="slide"
        transparent={true}
        onRequestClose={() => onOpenChange(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.content}>
            <LinearGradient
              colors={['#f0fdf4', '#dcfce7', '#d1fae5']}
              style={styles.mapArea}
            >
              {/* Top Bar */}
              <View style={styles.topBar}>
                <View style={styles.badgesRow}>
                  <View style={styles.badge}>
                    <Clock size={14} color="#14b8a6" />
                    <Text style={styles.badgeText}>{displayLocation.walkingTime} min</Text>
                  </View>
                  <View style={styles.badge}>
                    <MapPin size={14} color="#6b7280" />
                    <Text style={styles.badgeText}>{Math.round(displayLocation.walkingDistance)}m</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={() => onOpenChange(false)} 
                  style={styles.closeButtonTop}
                >
                  <X size={20} color="#134e4a" />
                </TouchableOpacity>
              </View>

              {/* Map Placeholder */}
              <View style={styles.mapPlaceholder}>
                <Text style={styles.mapPlaceholderText}>Map View</Text>
                <Text style={styles.mapPlaceholderSubtext}>Location: {displayLocation.name}</Text>
              </View>
            </LinearGradient>

            {/* Bottom Card */}
            <View style={styles.bottomCard}>
              <Text style={styles.locationName}>{displayLocation.name}</Text>
              <Text style={styles.address}>{displayLocation.address}</Text>
              
              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  onPress={() => setIsNavigating(!isNavigating)}
                  style={[styles.actionButton, styles.navButton, isNavigating && styles.navButtonActive]}
                >
                  <Navigation size={24} color={isNavigating ? "#fff" : "#134e4a"} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleToggleVoiceCompanion}
                  style={[
                    styles.actionButton, 
                    styles.voiceButton,
                    voiceCompanionActive && styles.voiceButtonActive
                  ]}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {voiceCompanionActive ? (
                    isSpeaking ? (
                      <Volume2 size={24} color="#134e4a" />
                    ) : isListening ? (
                      <Mic size={24} color="#134e4a" />
                    ) : (
                      <MessageCircle size={24} color="#134e4a" />
                    )
                  ) : (
                    <MessageCircle size={24} color="#134e4a" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Voice Chat Modal Overlay - Rendered inside MapModal */}
          {showVoiceModal && (
            <View style={styles.voiceModalOverlay}>
              <View style={styles.voiceModalContent}>
                <LinearGradient
                  colors={['#f0fdf4', '#ecfdf5']}
                  style={styles.voiceModalGradient}
                >
                  {/* Header */}
                  <View style={styles.voiceModalHeader}>
                    <Text style={styles.voiceModalTitle}>Voice Chat</Text>
                    <TouchableOpacity onPress={() => onCloseVoice?.()}>
                      <X size={20} color="#134e4a" />
                    </TouchableOpacity>
                  </View>

                  {/* Main Content */}
                  <View style={styles.voiceModalBody}>
                    {/* Microphone Button */}
                    <TouchableOpacity
                      onPress={handleToggleMic}
                      style={[styles.voiceModalMicButton, localIsListening && styles.voiceModalMicButtonActive]}
                      activeOpacity={0.8}
                    >
                      {localIsListening ? (
                        <Mic size={64} color="#134e4a" />
                      ) : (
                        <MicOff size={64} color="#9ca3af" />
                      )}
                    </TouchableOpacity>

                    {/* Instructions */}
                    <View style={styles.voiceModalInstructions}>
                      <Text style={styles.voiceModalInstructionText}>
                        {localIsListening ? "I'm listening..." : "Tap to speak"}
                      </Text>
                      <Text style={styles.voiceModalSubInstruction}>
                        {localIsListening 
                          ? "Share what's on your mind" 
                          : "Start talking about how you're feeling"
                        }
                      </Text>
                    </View>

                    {/* Conversation Placeholder */}
                    <View style={styles.voiceModalConversationBox}>
                      <Text style={styles.voiceModalConversationPlaceholder}>
                        {localIsListening 
                          ? "Listening to your voice..." 
                          : "Your conversation will appear here"
                        }
                      </Text>
                    </View>
                  </View>

                  {/* Footer */}
                  <View style={styles.voiceModalFooter}>
                    <TouchableOpacity
                      onPress={() => onCloseVoice?.()}
                      style={styles.voiceModalContinueButton}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.voiceModalContinueButtonText}>Continue</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    flex: 1,
    marginTop: 50,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#fff',
    position: 'relative',
  },
  mapArea: {
    flex: 1,
    position: 'relative',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    zIndex: 1000,
    backgroundColor: 'transparent',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    color: '#134e4a',
    fontWeight: '500',
  },
  closeButtonTop: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  mapPlaceholderText: {
    fontSize: 24,
    color: '#134e4a',
    fontWeight: '300',
    marginBottom: 8,
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '300',
  },
  bottomCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(94, 234, 212, 0.2)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  locationName: {
    fontSize: 20,
    color: '#134e4a',
    fontWeight: '400',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '300',
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  navButton: {
    backgroundColor: '#5eead4',
  },
  navButtonActive: {
    backgroundColor: '#ef4444',
  },
  voiceButton: {
    backgroundColor: '#5eead4',
  },
  voiceButtonActive: {
    backgroundColor: '#5eead4',
    shadowColor: '#5eead4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 8,
  },
  voiceModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  voiceModalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    maxHeight: '85%',
  },
  voiceModalGradient: {
    flex: 1,
  },
  voiceModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(94, 234, 212, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  voiceModalTitle: {
    fontSize: 18,
    fontWeight: '300',
    color: '#134e4a',
  },
  voiceModalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    maxHeight: '85%',
    backgroundColor: '#f0fdf4',
  },
  voiceModalGradient: {
    minHeight: 500,
  },
  voiceModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(94, 234, 212, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  voiceModalTitle: {
    fontSize: 18,
    fontWeight: '300',
    color: '#134e4a',
  },
  voiceModalBody: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
    minHeight: 400,
  },
  voiceModalMicButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  voiceModalMicButtonActive: {
    backgroundColor: '#5eead4',
    shadowColor: '#5eead4',
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 8,
  },
  voiceModalInstructions: {
    alignItems: 'center',
    marginBottom: 32,
  },
  voiceModalInstructionText: {
    fontSize: 18,
    fontWeight: '300',
    color: '#134e4a',
    marginBottom: 8,
  },
  voiceModalSubInstruction: {
    fontSize: 14,
    fontWeight: '300',
    color: '#6b7280',
  },
  voiceModalConversationBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.3)',
    minHeight: 120,
    maxHeight: 200,
  },
  voiceModalConversationPlaceholder: {
    fontSize: 14,
    fontWeight: '300',
    color: '#6b7280',
    lineHeight: 22,
  },
  voiceModalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(94, 234, 212, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
  },
  voiceModalContinueButton: {
    backgroundColor: '#5eead4',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 999,
    shadowColor: '#5eead4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 4,
  },
  voiceModalContinueButtonText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#134e4a',
  },
});
