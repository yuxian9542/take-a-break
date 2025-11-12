import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { mockVoiceSessions } from '../../data/mockVoiceSessions';
import { MessageCircle, Clock, ChevronRight } from 'lucide-react-native';
export function VoiceTab() {
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    const formatDate = (date) => {
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0)
            return 'Today';
        if (diffDays === 1)
            return 'Yesterday';
        if (diffDays < 7)
            return `${diffDays} days ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    return (_jsx(LinearGradient, { colors: ['#f0fdf4', '#ecfdf5', '#d1fae5'], style: styles.container, children: _jsxs(View, { style: styles.content, children: [_jsxs(View, { style: styles.header, children: [_jsx(Text, { style: styles.headerTitle, children: "Chat History" }), _jsx(Text, { style: styles.headerSubtitle, children: "Your recent conversations" })] }), _jsx(View, { style: styles.sessionsContainer, children: _jsx(ScrollView, { style: styles.scrollView, contentContainerStyle: styles.scrollContent, showsVerticalScrollIndicator: false, children: mockVoiceSessions.map((session, index) => (_jsxs(View, { style: styles.sessionCard, children: [_jsxs(View, { style: styles.sessionHeader, children: [_jsxs(View, { style: styles.sessionInfo, children: [_jsx(View, { style: styles.iconContainer, children: _jsx(MessageCircle, { size: 20, color: "#134e4a" }) }), _jsxs(View, { style: styles.sessionMeta, children: [_jsx(Text, { style: styles.sessionDate, children: formatDate(session.startTime) }), _jsxs(View, { style: styles.badgesRow, children: [_jsxs(View, { style: styles.badge, children: [_jsx(Clock, { size: 12, color: "#134e4a" }), _jsx(Text, { style: styles.badgeText, children: formatDuration(session.duration) })] }), session.moodBefore && (_jsx(View, { style: styles.moodBadge, children: _jsxs(Text, { style: styles.moodBadgeText, children: [session.moodBefore, " \u2192 ", session.moodAfter] }) }))] })] })] }), _jsx(ChevronRight, { size: 20, color: "#14b8a6" })] }), _jsx(Text, { style: styles.sessionSummary, children: session.summary }), _jsx(View, { style: styles.topicsContainer, children: session.topics.slice(0, 3).map((topic) => (_jsx(View, { style: styles.topicBadge, children: _jsx(Text, { style: styles.topicBadgeText, children: topic.replace('_', ' ') }) }, topic))) })] }, session.id))) }) })] }) }));
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        maxWidth: 448,
        width: '100%',
        alignSelf: 'center',
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(94, 234, 212, 0.2)',
    },
    headerTitle: {
        fontSize: 24,
        color: '#134e4a',
        fontWeight: '300',
        letterSpacing: -0.48,
        marginBottom: 4,
    },
    headerSubtitle: {
        color: '#6b7280',
        fontSize: 14,
        fontWeight: '300',
    },
    sessionsContainer: {
        flex: 1,
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 16,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        gap: 8,
    },
    sessionCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(94, 234, 212, 0.3)',
        marginBottom: 8,
    },
    sessionHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    sessionInfo: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#5eead4',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sessionMeta: {
        flex: 1,
    },
    sessionDate: {
        color: '#134e4a',
        fontWeight: '400',
        fontSize: 15,
        marginBottom: 4,
    },
    badgesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 2,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(94, 234, 212, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        color: '#134e4a',
    },
    moodBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(94, 234, 212, 0.4)',
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    moodBadgeText: {
        fontSize: 12,
        color: '#6b7280',
    },
    sessionSummary: {
        color: '#6b7280',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
        fontWeight: '300',
    },
    topicsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    topicBadge: {
        backgroundColor: 'rgba(94, 234, 212, 0.3)',
        borderWidth: 1,
        borderColor: 'rgba(94, 234, 212, 0.4)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    topicBadgeText: {
        fontSize: 12,
        color: '#134e4a',
    },
});
//# sourceMappingURL=VoiceTab.js.map