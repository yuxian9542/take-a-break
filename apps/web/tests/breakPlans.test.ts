import { describe, expect, it } from 'vitest';
import { generateBreakPlans } from '@take-a-break/break-plans';

describe('generateBreakPlans', () => {
  it('returns at least one plan', () => {
    const plans = generateBreakPlans('tired', 30, true, true);
    expect(plans.length).toBeGreaterThan(0);
  });

  it('creates walking steps when outing is allowed', () => {
    const plans = generateBreakPlans('stressed', 30, true, false);
    const hasWalk = plans.some((plan) => plan.steps.some((step) => step.type === 'walk'));
    expect(hasWalk).toBe(true);
  });
});

