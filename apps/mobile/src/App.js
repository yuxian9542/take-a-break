import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BreakTab } from './components/tabs/BreakTab';
import { VoiceTab } from './components/tabs/VoiceTab';
import { Heart, MessageCircle } from 'lucide-react-native';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
const Tab = createBottomTabNavigator();
function TabBar({ state, descriptors, navigation }) {
    return (_jsx(View, { style: styles.tabBar, children: state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const onPress = () => {
                const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(route.name);
                }
            };
            const Icon = route.name === 'Break' ? Heart : MessageCircle;
            return (_jsxs(TouchableOpacity, { accessibilityRole: "button", accessibilityState: isFocused ? { selected: true } : {}, accessibilityLabel: options.tabBarAccessibilityLabel, testID: options.tabBarTestID, onPress: onPress, style: [
                    styles.tabButton,
                    isFocused && styles.tabButtonActive
                ], children: [_jsx(Icon, { size: 24, color: isFocused ? '#14b8a6' : '#9ca3af', strokeWidth: isFocused ? 2.5 : 2 }), _jsx(Text, { style: [
                            styles.tabLabel,
                            isFocused && styles.tabLabelActive
                        ], children: route.name === 'Break' ? 'Break' : 'Chat' })] }, route.key));
        }) }));
}
function App() {
    return (_jsx(SafeAreaProvider, { children: _jsx(NavigationContainer, { children: _jsxs(Tab.Navigator, { tabBar: (props) => _jsx(TabBar, { ...props }), screenOptions: {
                    headerShown: false,
                }, children: [_jsx(Tab.Screen, { name: "Break", component: BreakTab }), _jsx(Tab.Screen, { name: "Chat", component: VoiceTab })] }) }) }));
}
const styles = StyleSheet.create({
    tabBar: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(94, 234, 212, 0.2)',
        paddingBottom: 8,
        paddingTop: 8,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
    },
    tabButtonActive: {
        backgroundColor: 'rgba(94, 234, 212, 0.15)',
    },
    tabLabel: {
        fontSize: 11,
        color: '#6b7280',
        fontWeight: '300',
        marginTop: 2,
    },
    tabLabelActive: {
        color: '#14b8a6',
        fontWeight: '500',
    },
});
export default App;
//# sourceMappingURL=App.js.map