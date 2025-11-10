export interface BreakRecord {
  id: string;
  userId: string;
  date: Date;
  planId: string;
  completedSteps: number;
  totalSteps: number;
  actualDuration: number; // minutes
  status: 'stressed' | 'tired' | 'anxious' | 'frustrated' | 'need_pause';
  usedVoice: boolean;
  visitedLocation?: string;
  summary: string;
  rating?: number; // 1-5
}

export const mockHistory: BreakRecord[] = [
  {
    id: 'record_001',
    userId: 'user_123',
    date: new Date('2024-11-08T14:30:00'),
    planId: 'break_001',
    completedSteps: 3,
    totalSteps: 3,
    actualDuration: 15,
    status: 'stressed',
    usedVoice: true,
    visitedLocation: 'Riverside Park',
    summary: 'Full break completed. Breathing helped center, walk was refreshing, voice chat provided clarity on work stress.',
    rating: 5,
  },
  {
    id: 'record_002',
    userId: 'user_123',
    date: new Date('2024-11-08T10:15:00'),
    planId: 'break_002',
    completedSteps: 2,
    totalSteps: 2,
    actualDuration: 10,
    status: 'tired',
    usedVoice: false,
    visitedLocation: 'Tranquil Grounds Cafe',
    summary: 'Quick coffee break with gentle walk. Felt more energized after.',
    rating: 4,
  },
  {
    id: 'record_003',
    userId: 'user_123',
    date: new Date('2024-11-07T16:15:00'),
    planId: 'break_003',
    completedSteps: 3,
    totalSteps: 3,
    actualDuration: 20,
    status: 'anxious',
    usedVoice: true,
    summary: 'Breathing and meditation followed by supportive chat about presentation anxiety.',
    rating: 5,
  },
  {
    id: 'record_004',
    userId: 'user_123',
    date: new Date('2024-11-07T11:30:00'),
    planId: 'break_004',
    completedSteps: 1,
    totalSteps: 2,
    actualDuration: 5,
    status: 'need_pause',
    usedVoice: false,
    summary: 'Quick breathing exercise. Interrupted by meeting but still helpful.',
    rating: 3,
  },
  {
    id: 'record_005',
    userId: 'user_123',
    date: new Date('2024-11-06T14:45:00'),
    planId: 'break_005',
    completedSteps: 2,
    totalSteps: 2,
    actualDuration: 15,
    status: 'frustrated',
    usedVoice: true,
    visitedLocation: 'Hudson River Overlook',
    summary: 'Walk to overlook followed by venting session. Helped process team frustration.',
    rating: 4,
  },
  {
    id: 'record_006',
    userId: 'user_123',
    date: new Date('2024-11-06T10:15:00'),
    planId: 'break_006',
    completedSteps: 2,
    totalSteps: 2,
    actualDuration: 10,
    status: 'tired',
    usedVoice: false,
    summary: 'Stretches and brief walk. Felt more awake.',
    rating: 4,
  },
  {
    id: 'record_007',
    userId: 'user_123',
    date: new Date('2024-11-05T15:20:00'),
    planId: 'break_007',
    completedSteps: 3,
    totalSteps: 3,
    actualDuration: 20,
    status: 'stressed',
    usedVoice: true,
    visitedLocation: 'Central Park',
    summary: 'Complete break sequence. Park visit was especially calming.',
    rating: 5,
  },
  {
    id: 'record_008',
    userId: 'user_123',
    date: new Date('2024-11-05T09:00:00'),
    planId: 'break_008',
    completedSteps: 1,
    totalSteps: 1,
    actualDuration: 5,
    status: 'need_pause',
    usedVoice: false,
    summary: 'Morning meditation to start the day centered.',
    rating: 4,
  },
  {
    id: 'record_009',
    userId: 'user_123',
    date: new Date('2024-11-04T13:30:00'),
    planId: 'break_009',
    completedSteps: 2,
    totalSteps: 3,
    actualDuration: 12,
    status: 'anxious',
    usedVoice: false,
    summary: 'Breathing and meditation completed. Skipped voice chat due to time.',
    rating: 3,
  },
  {
    id: 'record_010',
    userId: 'user_123',
    date: new Date('2024-11-04T10:00:00'),
    planId: 'break_010',
    completedSteps: 2,
    totalSteps: 2,
    actualDuration: 15,
    status: 'tired',
    usedVoice: false,
    visitedLocation: 'Bloom Coffee Roasters',
    summary: 'Energizing walk to cafe. Coffee and fresh air helped wake up.',
    rating: 4,
  },
  {
    id: 'record_011',
    userId: 'user_123',
    date: new Date('2024-11-03T14:15:00'),
    planId: 'break_011',
    completedSteps: 3,
    totalSteps: 3,
    actualDuration: 20,
    status: 'stressed',
    usedVoice: true,
    visitedLocation: 'Riverside Park',
    summary: 'Full afternoon break. Voice chat helped work through project stress.',
    rating: 5,
  },
  {
    id: 'record_012',
    userId: 'user_123',
    date: new Date('2024-11-01T16:00:00'),
    planId: 'break_012',
    completedSteps: 2,
    totalSteps: 2,
    actualDuration: 10,
    status: 'need_pause',
    usedVoice: false,
    summary: 'Quick end-of-day reset with stretches and breathing.',
    rating: 4,
  },
];

export const getWeeklyStats = () => {
  const thisWeek = mockHistory.filter(record => {
    const daysDiff = Math.floor((Date.now() - record.date.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff < 7;
  });

  const totalBreaks = thisWeek.length;
  const totalMinutes = thisWeek.reduce((sum, record) => sum + record.actualDuration, 0);
  const statusCounts = thisWeek.reduce((acc, record) => {
    acc[record.status] = (acc[record.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const mostCommonStatus = Object.entries(statusCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'stressed';

  // Calculate streak
  const sortedDates = [...new Set(mockHistory.map(r => r.date.toDateString()))].sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );
  let streak = 0;
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  
  if (sortedDates[0] === today || sortedDates[0] === yesterday) {
    streak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const current = new Date(sortedDates[i]);
      const previous = new Date(sortedDates[i - 1]);
      const diff = Math.floor((previous.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) streak++;
      else break;
    }
  }

  return {
    totalBreaks,
    totalMinutes,
    mostCommonStatus,
    streak,
  };
};

export const getInsights = () => [
  {
    id: 'insight_1',
    icon: '📊',
    title: 'Monday Pattern',
    description: 'You take 40% more breaks on Mondays. Consider scheduling buffer time at the start of your week.',
    color: '#6366f1',
  },
  {
    id: 'insight_2',
    icon: '🌳',
    title: 'Outdoor Benefits',
    description: 'Your breaks are 30% longer and rated higher when you can go outside. Fresh air makes a difference!',
    color: '#10b981',
  },
  {
    id: 'insight_3',
    icon: '💬',
    title: 'Voice Chat Impact',
    description: 'Voice sessions help most when you\'re anxious or stressed. You rated these breaks 4.8/5 on average.',
    color: '#8b5cf6',
  },
  {
    id: 'insight_4',
    icon: '⏰',
    title: 'Afternoon Timing',
    description: '2-4pm is your most common break time. Your energy naturally dips then - keep taking those breaks!',
    color: '#f59e0b',
  },
];
