import { mockSpots, type RelaxationSpot } from './mockSpots';

export type BreakMood = 'tired' | 'stressed' | 'need_pause';

export type BreakStep =
  | {
      type: 'breath';
      title: string;
      durationMinutes: number;
      copy: string;
    }
  | {
      type: 'walk';
      title: string;
      durationMinutes: number;
      copy: string;
      destination: RelaxationSpot;
    }
  | {
      type: 'voice';
      title: string;
      durationMinutes: number;
      copy: string;
      topic: string;
    };

export type BreakPlan = {
  id: string;
  mood: BreakMood;
  totalMinutes: number;
  canGoOutside: boolean;
  canTalk: boolean;
  steps: BreakStep[];
};

export function generateBreakPlans(
  mood: BreakMood,
  minutes: number,
  canGoOutside: boolean,
  canTalk: boolean
): BreakPlan[] {
  if (minutes <= 10) {
    return [
      {
        id: `plan_${Date.now()}_breath`,
        mood,
        totalMinutes: minutes,
        canGoOutside,
        canTalk,
        steps: [
          {
            type: 'breath',
            title: 'Wim Hof breathing',
            durationMinutes: minutes,
            copy: 'Three rounds of power breathing to lift energy and calm the nervous system.'
          }
        ]
      }
    ];
  }

  const outdoorSpots = canGoOutside ? mockSpots : [];

  const plans: BreakPlan[] = [];

  if (outdoorSpots.length > 0) {
    outdoorSpots.forEach((spot, index) => {
      plans.push({
        id: `plan_${Date.now()}_${index}`,
        mood,
        totalMinutes: minutes,
        canGoOutside,
        canTalk,
        steps: [
          {
            type: 'walk',
            title: `Walk to ${spot.name}`,
            durationMinutes: Math.min(minutes, spot.durationMinutes + 10),
            copy: spot.description,
            destination: spot
          }
        ]
      });
    });
  }

  plans.push({
    id: `plan_${Date.now()}_reflection`,
    mood,
    totalMinutes: minutes,
    canGoOutside,
    canTalk,
    steps: [
      {
        type: 'breath',
        title: 'Reset breathing',
        durationMinutes: Math.round(minutes * 0.4),
        copy: 'Box breathing to settle the nervous system.'
      },
      canTalk
        ? {
            type: 'voice',
            title: 'Voice companion check-in',
            durationMinutes: minutes - Math.round(minutes * 0.4),
            copy: 'Reflect on how you feel and plan your next mindful step.',
            topic: mood === 'stressed' ? 'Release tension' : 'Celebrate small wins'
          }
        : {
            type: 'breath',
            title: 'Guided meditation',
            durationMinutes: minutes - Math.round(minutes * 0.4),
            copy: 'Five-minute gratitude meditation followed by loose body scan.'
          }
    ].flat()
  });

  return plans.slice(0, 3);
}

