import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BreakPlanModal } from '../break/BreakPlanModal';
import { MapModal } from '../break/MapModal';
import { generateBreakPlan } from '../../data/mockBreakPlans';
const statusOptions = [
    { value: 'tired', label: 'Tired' },
    { value: 'stressed', label: 'Stressed' },
    { value: 'need_pause', label: 'Pause' },
];
const timeOptions = [10, 30, 60];
export function BreakTab() {
    const [selectedStatus, setSelectedStatus] = useState('tired');
    const [selectedTime, setSelectedTime] = useState(10);
    const [canGoOutside, setCanGoOutside] = useState(true);
    const [canTalk, setCanTalk] = useState(true);
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [generatedPlans, setGeneratedPlans] = useState([]);
    const [showMapModal, setShowMapModal] = useState(false);
    const [mapLocation, setMapLocation] = useState(null);
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
        }
        catch (error) {
            console.error('Error generating break plan:', error);
        }
    };
    const getTimeLabel = (minutes) => {
        if (minutes >= 60)
            return `${minutes / 60} hour`;
        return `${minutes} min`;
    };
    return (_jsxs(LinearGradient, { colors: ['#f0fdf4', '#ecfdf5', '#d1fae5'], style: styles.container, children: [_jsxs(ScrollView, { contentContainerStyle: styles.scrollContent, showsVerticalScrollIndicator: false, children: [_jsxs(View, { style: styles.header, children: [_jsx(Text, { style: styles.title, children: "Take a Moment" }), _jsx(Text, { style: styles.subtitle, children: "How can we help you relax?" })] }), _jsxs(View, { style: styles.section, children: [_jsx(Text, { style: styles.sectionLabel, children: "I'm feeling..." }), _jsx(View, { style: styles.optionsRow, children: statusOptions.map((option) => (_jsx(TouchableOpacity, { onPress: () => setSelectedStatus(option.value), style: [
                                        styles.optionButton,
                                        selectedStatus === option.value && styles.optionButtonActive
                                    ], children: _jsx(Text, { style: [
                                            styles.optionText,
                                            selectedStatus === option.value && styles.optionTextActive
                                        ], children: option.label }) }, option.value))) })] }), _jsxs(View, { style: styles.section, children: [_jsx(Text, { style: styles.sectionLabel, children: "I have..." }), _jsx(View, { style: styles.optionsRow, children: timeOptions.map((time) => (_jsx(TouchableOpacity, { onPress: () => setSelectedTime(time), style: [
                                        styles.optionButton,
                                        selectedTime === time && styles.optionButtonActive
                                    ], children: _jsx(Text, { style: [
                                            styles.optionText,
                                            selectedTime === time && styles.optionTextActive
                                        ], children: getTimeLabel(time) }) }, time))) })] }), _jsx(View, { style: styles.breathingContainer, children: _jsxs(View, { style: styles.breathingCircle, children: [_jsx(View, { style: [styles.breathingRing, styles.outerRing] }), _jsx(View, { style: [styles.breathingRing, styles.middleRing] }), _jsx(TouchableOpacity, { onPress: handleNeedBreak, style: styles.centerButton, activeOpacity: 0.9, children: _jsx(Text, { style: styles.startText, children: "Start" }) })] }) })] }), _jsx(BreakPlanModal, { open: showPlanModal, onOpenChange: setShowPlanModal, plans: generatedPlans, onNavigate: (location) => {
                    setMapLocation(location);
                    setShowMapModal(true);
                } }), _jsx(MapModal, { open: showMapModal, onOpenChange: (open) => {
                    setShowMapModal(open);
                    if (!open) {
                        setVoiceCompanionActive(false);
                        setShowVoiceModal(false);
                        setIsListening(false);
                        setIsSpeaking(false);
                    }
                }, location: mapLocation, onOpenVoice: () => {
                    if (!voiceCompanionActive) {
                        setVoiceCompanionActive(true);
                    }
                    setShowVoiceModal(true);
                }, showVoiceModal: showVoiceModal, onCloseVoice: () => {
                    setShowVoiceModal(false);
                    // Keep companion active even when modal closes
                }, voiceCompanionActive: voiceCompanionActive, isListening: isListening, isSpeaking: isSpeaking, onListeningChange: setIsListening, onSpeakingChange: setIsSpeaking })] }));
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
//# sourceMappingURL=BreakTab.js.map