import { mockSpots } from './mockSpots';
// AI-powered location selection (simulated)
// In production, this would call an AI API that considers:
// - User's current GPS location
// - Selected feeling/status
// - Time of day and weather
// - Personal preferences and history
// - Real-time crowd levels
// Returns 3 personalized nearby spots
const getAIRecommendedLocations = (status, userLocation) => {
    // Simulated AI selection based on user's emotional state
    // In production: const response = await aiAPI.getRecommendations({ status, location, context })
    let recommendedSpots = [];
    if (status === 'tired') {
        // AI recommends energizing spots with caffeine options
        const cafes = mockSpots.filter(s => s.category === 'cafe').slice(0, 2);
        const waterfront = mockSpots.find(s => s.category === 'waterfront');
        recommendedSpots = [...cafes];
        if (waterfront)
            recommendedSpots.push(waterfront);
    }
    else if (status === 'stressed') {
        // AI recommends calming natural environments
        recommendedSpots = mockSpots.filter(s => s.category === 'park' || s.category === 'waterfront').slice(0, 3);
    }
    else if (status === 'need_pause') {
        // AI recommends quiet, contemplative spaces
        const cafe = mockSpots.find(s => s.category === 'cafe' && s.crowdLevel === 'medium');
        const quietSpace = mockSpots.find(s => s.category === 'quiet_space');
        const indoor = mockSpots.find(s => s.category === 'indoor');
        if (cafe)
            recommendedSpots.push(cafe);
        if (quietSpace)
            recommendedSpots.push(quietSpace);
        if (indoor)
            recommendedSpots.push(indoor);
    }
    // Ensure we always return at least some spots, fallback to first 3 if needed
    if (recommendedSpots.length === 0) {
        recommendedSpots = mockSpots.slice(0, 3);
    }
    return recommendedSpots.filter(Boolean).slice(0, 3);
};
const getIconForCategory = (category) => {
    const icons = {
        cafe: '☕',
        park: '🌳',
        waterfront: '🌊',
        quiet_space: '🧘',
        indoor: '🏛️',
    };
    return icons[category] || '📍';
};
export const generateBreakPlan = (status, duration, canGoOutside, canTalk) => {
    const plans = [];
    const baseDate = new Date();
    // For 10 minute breaks: ONLY Wim Hof breathing
    if (duration === 10) {
        plans.push({
            id: `break_${Date.now()}_1`,
            userId: 'user_123',
            createdAt: baseDate,
            totalDuration: duration,
            status,
            steps: [
                {
                    stepNumber: 1,
                    type: 'wim_hof',
                    duration: 10,
                    title: 'Wim Hof Breathing',
                    description: '3 rounds of power breathing: 30 deep breaths, exhale and hold, recovery breath and hold. Energize your body and mind.',
                    icon: '❄️',
                },
            ],
        });
        return plans;
    }
    // For longer breaks with walking option
    if (canGoOutside) {
        // Get AI-recommended locations based on user's emotional state
        const aiRecommendedSpots = getAIRecommendedLocations(status);
        // Generate 3 walking plans with AI-selected locations
        aiRecommendedSpots.forEach((spot, index) => {
            plans.push({
                id: `break_${Date.now()}_${index + 1}`,
                userId: 'user_123',
                createdAt: baseDate,
                totalDuration: duration,
                status,
                steps: [
                    {
                        stepNumber: 1,
                        type: 'walk',
                        duration: duration,
                        title: `Walk to ${spot.name}`,
                        description: spot.description,
                        icon: getIconForCategory(spot.category),
                        location: {
                            id: spot.id,
                            name: spot.name,
                            category: spot.category,
                            coordinates: spot.coordinates,
                            walkingDistance: spot.walkingDistance,
                            eta: spot.eta,
                        },
                    },
                ],
            });
        });
    }
    else {
        // Indoor options with voice chat
        if (canTalk) {
            plans.push({
                id: `break_${Date.now()}_1`,
                userId: 'user_123',
                createdAt: baseDate,
                totalDuration: duration,
                status,
                steps: [
                    {
                        stepNumber: 1,
                        type: 'wim_hof',
                        duration: Math.floor(duration * 0.3),
                        title: 'Wim Hof Breathing',
                        description: '1-2 rounds of power breathing',
                        icon: '❄️',
                    },
                    {
                        stepNumber: 2,
                        type: 'voice',
                        duration: duration - Math.floor(duration * 0.3),
                        title: 'Talk It Out',
                        description: 'Share what\'s on your mind with AI companion',
                        icon: '💬',
                        voiceSession: {
                            sessionId: `voice_${Date.now()}`,
                            topic: status === 'stressed' ? 'work_stress_venting' : 'general_chat',
                        },
                    },
                ],
            });
        }
        else {
            // Indoor without voice
            plans.push({
                id: `break_${Date.now()}_1`,
                userId: 'user_123',
                createdAt: baseDate,
                totalDuration: duration,
                status,
                steps: [
                    {
                        stepNumber: 1,
                        type: 'wim_hof',
                        duration: Math.floor(duration * 0.4),
                        title: 'Wim Hof Breathing',
                        description: '2-3 rounds of power breathing',
                        icon: '❄️',
                    },
                    {
                        stepNumber: 2,
                        type: 'meditation',
                        duration: duration - Math.floor(duration * 0.4),
                        title: 'Guided Meditation',
                        description: 'Let go of tension and find calm',
                        icon: '🧘‍♀️',
                    },
                ],
            });
        }
    }
    return plans.slice(0, 3); // Return max 3 plans
};
//# sourceMappingURL=mockBreakPlans.js.map