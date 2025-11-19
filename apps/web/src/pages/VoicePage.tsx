import React, { useEffect, useState } from 'react';
import type { RelaxationSpot } from '@take-a-break/break-plans';
import { VoiceChat } from '../components/voice/VoiceChat';
import { webEnvironment } from '../config/env';
import { getNearbySpots, getUserPosition, type UserPosition } from '../services/mapService';
import './VoicePage.css';

const MAX_SPOTS_IN_PROMPT = 3;

function formatSpotForPrompt(spot: RelaxationSpot, index: number) {
  const distanceKm = (spot.distanceMeters / 1000).toFixed(2);
  const amenities = spot.amenityTags.slice(0, 3);
  const amenitiesText = amenities.length > 0 ? amenities.join(', ') : 'no listed amenities';
  const categoryLabel = spot.category.replace(/_/g, ' ');

  return `${index + 1}. ${spot.name} (${categoryLabel}) - ${spot.description} Distance approx ${distanceKm} km, about ${spot.durationMinutes} min walk. Amenities: ${amenitiesText}.`;
}

function buildSystemPrompt(position: UserPosition, spots: RelaxationSpot[]) {
  const accuracyText =
    typeof position.accuracyMeters === 'number'
      ? ` (+/- ${Math.round(position.accuracyMeters)} m)`
      : '';

  const lines: string[] = [
    'Ambient context for the voice assistant:',
    `- Approximate user coordinates: ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}${accuracyText}.`,
  ];

  if (spots.length > 0) {
    lines.push('- Nearby relaxation spots to consider:');
    spots.forEach((spot, index) => {
      lines.push(`  ${formatSpotForPrompt(spot, index)}`);
    });
  } else {
    lines.push('- No curated relaxation spots were retrieved; invite the user to share preferred environments.');
  }

  lines.push('- Use this context to tailor suggestions subtly without exposing raw coordinates unless the user asks.');

  return lines.join('\n');
}

export function VoicePage() {
  const [systemPrompt, setSystemPrompt] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadLocationContext() {
      try {
        const positionPromise = getUserPosition();
        const [position, spots] = await Promise.all([
          positionPromise,
          positionPromise.then((resolvedPosition) => getNearbySpots(resolvedPosition))
        ]);
        const orderedSpots = [...spots].sort((a, b) => a.distanceMeters - b.distanceMeters).slice(0, MAX_SPOTS_IN_PROMPT);
        const prompt = buildSystemPrompt(position, orderedSpots);

        if (!isCancelled) {
          setSystemPrompt(prompt);
        }
      } catch (error) {
        console.warn('[VoicePage] Failed to prepare location context for system prompt.', error);
        if (!isCancelled) {
          setSystemPrompt(null);
        }
      }
    }

    loadLocationContext().catch((error) => {
      console.error('[VoicePage] Unexpected error while fetching location context.', error);
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="voice-page" role="main">
      <header className="voice-header">
        <div className="voice-heading">
          <p className="tagline">Voice</p>
          <h1>Live Voice Chat</h1>
          <p className="subtitle">
            Start talking with the AI companion while it quietly considers nearby spots for your next break.
          </p>
        </div>
      </header>
      <section className="voice-layout">
        <div className="voice-panel voice-panel--chat" aria-label="Live voice chat experience">
          <VoiceChat wsUrl={webEnvironment.voiceWsUrl} systemPrompt={systemPrompt ?? undefined} />
        </div>
      </section>
    </div>
  );
}
