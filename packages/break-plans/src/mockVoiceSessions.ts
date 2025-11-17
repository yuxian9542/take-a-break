export interface VoiceSession {
  id: string;
  startTime: Date;
  duration: number; // in seconds
  summary: string;
  moodBefore?: string;
  moodAfter?: string;
  topics: string[];
}

export const mockVoiceSessions: VoiceSession[] = [
  {
    id: 'session_1',
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    duration: 420, // 7 minutes
    summary: 'Discussion about work-life balance and stress management',
    moodBefore: '😰 Stressed',
    moodAfter: '😌 Calm',
    topics: ['work_stress', 'boundaries', 'self_care']
  },
  {
    id: 'session_2',
    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    duration: 540, // 9 minutes
    summary: 'Morning reflection on personal goals and priorities',
    moodBefore: '😴 Tired',
    moodAfter: '✨ Energized',
    topics: ['goals', 'motivation', 'planning']
  },
  {
    id: 'session_3',
    startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    duration: 360, // 6 minutes
    summary: 'Quick check-in about feeling overwhelmed with tasks',
    moodBefore: '😟 Anxious',
    moodAfter: '😊 Better',
    topics: ['anxiety', 'task_management', 'breathing']
  },
  {
    id: 'session_4',
    startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    duration: 600, // 10 minutes
    summary: 'Exploring creative ideas and overcoming mental blocks',
    moodBefore: '😐 Neutral',
    moodAfter: '💡 Inspired',
    topics: ['creativity', 'problem_solving', 'mindfulness']
  },
  {
    id: 'session_5',
    startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    duration: 480, // 8 minutes
    summary: 'Evening wind-down and gratitude practice',
    moodBefore: '😤 Frustrated',
    moodAfter: '🙏 Grateful',
    topics: ['gratitude', 'reflection', 'sleep_prep']
  },
  {
    id: 'session_6',
    startTime: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
    duration: 300, // 5 minutes
    summary: 'Quick energy boost and motivation check',
    moodBefore: '😴 Sluggish',
    moodAfter: '⚡ Ready',
    topics: ['energy', 'motivation', 'quick_reset']
  },
  {
    id: 'session_7',
    startTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    duration: 720, // 12 minutes
    summary: 'Deep dive into relationship dynamics and communication',
    moodBefore: '😔 Down',
    moodAfter: '😌 Clear',
    topics: ['relationships', 'communication', 'empathy']
  }
];

