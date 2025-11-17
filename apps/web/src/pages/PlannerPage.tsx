import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, MessageCircle, Sparkles, Wind } from 'lucide-react';
import { generateBreakPlan, type WebBreakPlan as BreakPlan } from '@take-a-break/break-plans';
import './PlannerPage.css';

type FeelingStatus = 'stressed' | 'tired' | 'need_pause';

const feelingOptions: Array<{ value: FeelingStatus; label: string; description: string }> = [
  { value: 'tired', label: 'Tired', description: 'Need an energy lift' },
  { value: 'stressed', label: 'Stressed', description: 'Need to decompress' },
  { value: 'need_pause', label: 'Need a pause', description: 'Need a mini escape' }
];

const timeOptions = [10, 30, 60];

export function PlannerPage() {
  const [status, setStatus] = useState<FeelingStatus>('tired');
  const [minutes, setMinutes] = useState(30);
  const [plans, setPlans] = useState<BreakPlan[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);

  const heroCopy = useMemo(() => {
    switch (status) {
      case 'stressed':
        return 'Micro resets that mix breath work, meditation, and a calming walk.';
      case 'need_pause':
        return 'Gentle pauses that weave in quiet indoor rituals or a quick voice check-in.';
      default:
        return 'Brisk routes, energizing breath work, and a companion who remembers every chat.';
    }
  }, [status]);

  const handleGeneratePlan = () => {
    const generated = generateBreakPlan(status, minutes, true, true);
    setPlans(generated);
    setHasGenerated(true);
  };

  return (
    <div className="planner-page">
      <section className="planner-hero">
        <div className="planner-hero__text">
          <p className="tagline">Planner</p>
          <h1>Browser-based reset studio</h1>
          <p className="subtitle">{heroCopy}</p>
          <div className="hero-pills">
            <span>Shared break-plan engine</span>
            <span>Google Maps aware</span>
            <span>Voice companion ready</span>
          </div>
        </div>
        <div className="planner-hero__card">
          <h3>Available time</h3>
          <div className="chip-row">
            {timeOptions.map((option) => (
              <button
                key={option}
                className={`chip ${minutes === option ? 'chip--active' : ''}`}
                onClick={() => setMinutes(option)}
                type="button"
              >
                {option === 60 ? '1 hour' : `${option} min`}
              </button>
            ))}
          </div>
          <h3>How are you feeling?</h3>
          <div className="feeling-grid">
            {feelingOptions.map((option) => (
              <button
                key={option.value}
                className={`feeling-card ${status === option.value ? 'feeling-card--active' : ''}`}
                type="button"
                onClick={() => setStatus(option.value)}
              >
                <div className="feeling-card__icon">
                  {option.value === 'stressed' ? <Wind size={16} /> : <Heart size={16} />}
                </div>
                <div>
                  <p>{option.label}</p>
                  <span>{option.description}</span>
                </div>
              </button>
            ))}
          </div>
          <button className="primary-button" type="button" onClick={handleGeneratePlan}>
            Generate plan
          </button>
        </div>
      </section>

      <section className="planner-results">
        <header>
          <div>
            <p className="tagline">Break plans</p>
            <h2>Personalized sequences</h2>
          </div>
          {plans.length > 0 && (
            <p className="result-meta">
              {plans.length} plan{plans.length > 1 ? 's' : ''} generated with shared mocks
            </p>
          )}
        </header>

        {plans.length === 0 && hasGenerated && (
          <div className="empty-state">
            <p>No plans available for that combination yet. Try toggling outside or voice access.</p>
          </div>
        )}

        {!hasGenerated && (
          <div className="empty-state">
            <p>Choose your mood and time, then generate a plan to mirror the mobile planner.</p>
          </div>
        )}

        <div className="plans-grid">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      </section>
    </div>
  );
}

function PlanCard({ plan }: { plan: BreakPlan }) {
  return (
    <article className="plan-card">
      <div className="plan-card__header">
        <div>
          <p className="plan-duration">{plan.totalDuration} min reset</p>
          <h3>
            {plan.status === 'stressed'
              ? 'Calm & Ground'
              : plan.status === 'need_pause'
                ? 'Gentle pause'
                : 'Energy stack'}
          </h3>
        </div>
        <Sparkles size={20} />
      </div>
      <div className="plan-steps">
        {plan.steps.map((step) => (
          <div key={step.stepNumber} className="step-row">
            <div className="step-icon">
              <span>{step.icon}</span>
            </div>
            <div className="step-details">
              <p className="step-title">
                Step {step.stepNumber}: {step.title}
              </p>
              <span className="step-duration">{step.duration} min</span>
              <p className="step-description">{step.description}</p>
              {step.location && (
                <div className="step-extra">
                  <MapPin size={14} />
                  <span>
                    {step.location.name} · {formatDistance(step.location.walkingDistance)} away · ~
                    {step.location.eta} min walk
                  </span>
                </div>
              )}
              {step.voiceSession && (
                <div className="step-extra">
                  <MessageCircle size={14} />
                  <span>Topic: {step.voiceSession.topic.replace(/_/g, ' ')}</span>
                </div>
              )}
              <div className="step-actions">
                {step.location && (
                  <Link
                    to={`/explore?highlight=${encodeURIComponent(step.location.id)}`}
                    className="step-action"
                  >
                    <MapPin size={16} />
                    View on map
                  </Link>
                )}
                {step.voiceSession && (
                  <Link
                    to={`/voice?session=${encodeURIComponent(step.voiceSession.sessionId)}`}
                    className="step-action"
                  >
                    <MessageCircle size={16} />
                    Resume voice
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function formatDistance(meters: number) {
  if (!Number.isFinite(meters)) {
    return '~';
  }
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}
