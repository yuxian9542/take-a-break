import { generateBreakPlans, type BreakPlan as CoreBreakPlan, type BreakStep as CoreBreakStep } from './mockBreakPlans';
import type { RelaxationSpot } from './mockSpots';

// Web-specific types for PlannerPage
export interface WebBreakPlanStep {
  stepNumber: number;
  icon: string;
  title: string;
  duration: number;
  description: string;
  location?: {
    id: string;
    name: string;
    walkingDistance: number;
    eta: number;
  };
  voiceSession?: {
    sessionId: string;
    topic: string;
  };
}

export interface WebBreakPlan {
  id: string;
  status: 'tired' | 'stressed' | 'need_pause';
  totalDuration: number;
  steps: WebBreakPlanStep[];
}

function getStepIcon(step: CoreBreakStep): string {
  switch (step.type) {
    case 'breath':
      return '🫁';
    case 'walk':
      return '🚶';
    case 'voice':
      return '🎙️';
    default:
      return '✨';
  }
}

function convertStepToWebFormat(step: CoreBreakStep, stepNumber: number): WebBreakPlanStep {
  const base: WebBreakPlanStep = {
    stepNumber,
    icon: getStepIcon(step),
    title: step.title,
    duration: step.durationMinutes,
    description: step.copy
  };

  if (step.type === 'walk' && step.destination) {
    const spot = step.destination as RelaxationSpot;
    base.location = {
      id: spot.id,
      name: spot.name,
      walkingDistance: spot.distanceMeters,
      eta: spot.durationMinutes
    };
  }

  if (step.type === 'voice') {
    base.voiceSession = {
      sessionId: `session_${Date.now()}`,
      topic: step.topic
    };
  }

  return base;
}

export function generateBreakPlan(
  status: 'tired' | 'stressed' | 'need_pause',
  minutes: number,
  canGoOutside: boolean,
  canTalk: boolean
): WebBreakPlan[] {
  const corePlans = generateBreakPlans(status, minutes, canGoOutside, canTalk);
  
  return corePlans.map(plan => ({
    id: plan.id,
    status: plan.mood,
    totalDuration: plan.totalMinutes,
    steps: plan.steps.map((step, index) => convertStepToWebFormat(step, index + 1))
  }));
}

