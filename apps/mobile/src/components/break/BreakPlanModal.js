import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Navigation, MessageCircle, Play, RefreshCw } from 'lucide-react-native';
import { VoiceChatModal } from './VoiceChatModal';
export function BreakPlanModal({ open, onOpenChange, plans, onNavigate }) {
    const [currentPlanIndex, setCurrentPlanIndex] = useState(0);
    const [showVoiceModal, setShowVoiceModal] = useState(false);
    const [selectedStep, setSelectedStep] = useState(null);
    // Reset state when modal opens
    useEffect(() => {
        if (open) {
            setCurrentPlanIndex(0);
        }
        else {
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
    const getActionButton = (stepType) => {
        switch (stepType) {
            case 'walk':
                return { icon: Navigation, label: 'Navigate', variant: 'default' };
            case 'voice':
                return { icon: MessageCircle, label: 'Start Chat', variant: 'default' };
            case 'wim_hof':
                return { icon: Play, label: 'Start Session', variant: 'default' };
            default:
                return { icon: Play, label: 'Begin', variant: 'outline' };
        }
    };
    const handleDifferentPlan = () => {
        if (currentPlanIndex < plans.length - 1) {
            setCurrentPlanIndex(currentPlanIndex + 1);
        }
        else {
            setCurrentPlanIndex(0);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx(Modal, { visible: open, animationType: "slide", transparent: true, onRequestClose: () => onOpenChange(false), children: _jsx(View, { style: styles.modalOverlay, children: _jsx(View, { style: styles.modalContent, children: _jsxs(LinearGradient, { colors: ['#f0fdf4', '#ecfdf5'], style: styles.gradient, children: [_jsxs(View, { style: styles.header, children: [_jsx(View, { style: styles.headerTitleContainer, children: _jsx(Text, { style: styles.headerTitle, numberOfLines: 2, children: "Your Break Plan" }) }), _jsx(TouchableOpacity, { onPress: () => onOpenChange(false), style: styles.closeButton, children: _jsx(X, { size: 16, color: "#134e4a" }) })] }), _jsxs(ScrollView, { style: styles.stepsContainer, contentContainerStyle: styles.stepsContent, showsVerticalScrollIndicator: false, children: [_jsx(View, { children: currentPlan.steps.map((step) => {
                                                const action = getActionButton(step.type);
                                                const ActionIcon = action.icon;
                                                return (_jsx(View, { style: styles.stepCard, children: _jsxs(View, { style: styles.stepContent, children: [_jsx(View, { style: styles.stepNumber, children: _jsx(Text, { style: styles.stepNumberText, children: step.stepNumber }) }), _jsxs(View, { style: styles.stepDetails, children: [_jsx(View, { style: styles.stepHeader, children: _jsxs(View, { style: styles.stepTitleRow, children: [_jsx(Text, { style: styles.stepIcon, children: step.icon }), _jsx(Text, { style: styles.stepTitle, numberOfLines: 2, children: step.title })] }) }), _jsx(Text, { style: styles.stepDescription, children: step.description }), step.location && (_jsxs(Text, { style: styles.stepLocation, children: ["\uD83D\uDCCD ", step.location.name, " \u2022 ", Math.round(step.location.walkingDistance * 3.28084), " ft"] })), _jsxs(TouchableOpacity, { onPress: () => {
                                                                            if (step.type === 'walk' && step.location && onNavigate) {
                                                                                const location = {
                                                                                    id: step.location.id,
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
                                                                            }
                                                                            else if (step.type === 'voice') {
                                                                                setSelectedStep(step);
                                                                                onOpenChange(false); // Close BreakPlanModal first
                                                                                setTimeout(() => {
                                                                                    setShowVoiceModal(true); // Then open VoiceModal
                                                                                }, 100);
                                                                            }
                                                                        }, style: [
                                                                            styles.actionButton,
                                                                            action.variant === 'default' ? styles.actionButtonPrimary : styles.actionButtonOutline
                                                                        ], children: [_jsx(ActionIcon, { size: 14, color: action.variant === 'default' ? '#134e4a' : '#6b7280' }), _jsx(Text, { style: [
                                                                                    styles.actionButtonText,
                                                                                    action.variant === 'default' ? styles.actionButtonTextPrimary : styles.actionButtonTextOutline
                                                                                ], children: action.label })] })] })] }) }, step.stepNumber));
                                            }) }, currentPlanIndex), plans.length > 1 && (_jsx(View, { style: styles.indicatorContainer, children: plans.map((_, index) => (_jsx(View, { style: [
                                                    styles.indicator,
                                                    currentPlanIndex === index && styles.indicatorActive
                                                ] }, index))) }))] }), plans.length > 1 && (_jsx(View, { style: styles.footer, children: _jsxs(TouchableOpacity, { onPress: handleDifferentPlan, style: styles.differentPlanButton, children: [_jsx(RefreshCw, { size: 16, color: "#6b7280" }), _jsxs(Text, { style: styles.differentPlanText, children: ["Get Different Plan (", currentPlanIndex + 1, "/", plans.length, ")"] })] }) }))] }) }) }) }), _jsx(VoiceChatModal, { open: showVoiceModal, onOpenChange: setShowVoiceModal, sessionTopic: selectedStep?.voiceSession?.topic, showContinueButton: false })] }));
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
//# sourceMappingURL=BreakPlanModal.js.map