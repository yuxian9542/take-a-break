import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Mic, MicOff } from 'lucide-react-native';
export function VoiceChatModal({ open, onOpenChange, sessionTopic = 'general_chat', showContinueButton = false, onListeningChange, onSpeakingChange }) {
    const [isListening, setIsListening] = useState(false);
    useEffect(() => {
        console.log('VoiceChatModal - open prop:', open, 'Modal visible:', open);
    }, [open]);
    const handleToggleMic = () => {
        const newListeningState = !isListening;
        setIsListening(newListeningState);
        onListeningChange?.(newListeningState);
    };
    return (_jsx(Modal, { visible: open, animationType: "slide", transparent: true, presentationStyle: "overFullScreen", onRequestClose: () => onOpenChange(false), children: _jsx(View, { style: styles.overlay, children: _jsx(View, { style: styles.content, children: _jsxs(LinearGradient, { colors: ['#f0fdf4', '#ecfdf5'], style: styles.gradient, children: [_jsxs(View, { style: styles.header, children: [_jsx(Text, { style: styles.title, children: "Voice Chat" }), _jsx(TouchableOpacity, { onPress: () => onOpenChange(false), children: _jsx(X, { size: 20, color: "#134e4a" }) })] }), _jsxs(View, { style: styles.body, children: [_jsx(TouchableOpacity, { onPress: handleToggleMic, style: [styles.micButton, isListening && styles.micButtonActive], activeOpacity: 0.8, children: isListening ? (_jsx(Mic, { size: 64, color: "#134e4a" })) : (_jsx(MicOff, { size: 64, color: "#9ca3af" })) }), _jsxs(View, { style: styles.instructions, children: [_jsx(Text, { style: styles.instructionText, children: isListening ? "I'm listening..." : "Tap to speak" }), _jsx(Text, { style: styles.subInstruction, children: isListening
                                                ? "Share what's on your mind"
                                                : "Start talking about how you're feeling" })] }), _jsx(View, { style: styles.conversationBox, children: _jsx(Text, { style: styles.conversationPlaceholder, children: isListening
                                            ? "Listening to your voice..."
                                            : "Your conversation will appear here" }) })] }), showContinueButton && (_jsx(View, { style: styles.footer, children: _jsx(TouchableOpacity, { onPress: () => onOpenChange(false), style: styles.continueButton, activeOpacity: 0.8, children: _jsx(Text, { style: styles.continueButtonText, children: "Continue" }) }) }))] }) }) }) }));
}
const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        width: '90%',
        maxWidth: 400,
        borderRadius: 24,
        overflow: 'hidden',
        maxHeight: '85%',
    },
    gradient: {
        flex: 1,
    },
    header: {
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
    title: {
        fontSize: 18,
        fontWeight: '300',
        color: '#134e4a',
    },
    body: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 32,
    },
    micButton: {
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
    micButtonActive: {
        backgroundColor: '#5eead4',
        shadowColor: '#5eead4',
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 8,
    },
    instructions: {
        alignItems: 'center',
        marginBottom: 32,
    },
    instructionText: {
        fontSize: 18,
        fontWeight: '300',
        color: '#134e4a',
        marginBottom: 8,
    },
    subInstruction: {
        fontSize: 14,
        fontWeight: '300',
        color: '#6b7280',
    },
    conversationBox: {
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(94, 234, 212, 0.3)',
        minHeight: 120,
        maxHeight: 200,
    },
    conversationPlaceholder: {
        fontSize: 14,
        fontWeight: '300',
        color: '#6b7280',
        lineHeight: 22,
    },
    footer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(94, 234, 212, 0.2)',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        alignItems: 'center',
    },
    continueButton: {
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
    continueButtonText: {
        fontSize: 16,
        fontWeight: '400',
        color: '#134e4a',
    },
});
//# sourceMappingURL=VoiceChatModal.js.map