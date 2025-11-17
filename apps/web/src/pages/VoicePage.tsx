import React, { useMemo, useState } from 'react';
import { MessageCircle, Clock, Headphones, FileText, Sparkles } from 'lucide-react';
import {
  mockVoiceSessions,
  type VoiceSession
} from '@take-a-break/break-plans';
import { VoiceChat } from '../components/voice/VoiceChat';
import { webEnvironment } from '../config/env';
import './VoicePage.css';

type VoiceAction = 'resume' | 'listen' | 'transcript';

export function VoicePage() {
  const sessions = useMemo(
    () =>
      [...mockVoiceSessions].sort(
        (a, b) => b.startTime.getTime() - a.startTime.getTime()
      ),
    []
  );
  const [spotlightId, setSpotlightId] = useState<string>(sessions[0]?.id ?? '');
  const [actionToast, setActionToast] = useState<string | null>(null);

  const spotlight = sessions.find((session) => session.id === spotlightId) ?? sessions[0];
  const totalMinutes = Math.round(sessions.reduce((sum, session) => sum + session.duration, 0) / 60);
  const sessionsThisWeek = sessions.filter((session) => daysAgo(session.startTime) <= 7).length;

  const handleAction = (session: VoiceSession, action: VoiceAction) => {
    setSpotlightId(session.id);
    const label =
      action === 'resume'
        ? 'Voice companion ready'
        : action === 'listen'
          ? 'Playback queued'
          : 'Transcript reopened';
    setActionToast(`${label} · ${session.summary.slice(0, 72)}…`);
    window.setTimeout(() => setActionToast(null), 3200);
  };

  return (
    <div className="voice-page">
      <section className="voice-hero">
        <div>
          <p className="tagline">Voice</p>
          <h1>Live chat & session history</h1>
          <p className="subtitle">
            Start a new voice conversation or review past sessions. Every browser session references the same AI companion memory and transcripts used on mobile.
          </p>
        </div>
        <div className="voice-stats">
          <div>
            <p className="stat-value">{sessionsThisWeek}</p>
            <p className="stat-label">Sessions this week</p>
          </div>
          <div>
            <p className="stat-value">{totalMinutes} min</p>
            <p className="stat-label">Time listened</p>
          </div>
        </div>
      </section>

      <div className="voice-content">
        <section className="voice-live-chat">
          <VoiceChat wsUrl={webEnvironment.voiceWsUrl} />
        </section>
        <div className="voice-history">
        <section className="voice-highlight">
          <header>
            <div>
              <p className="tagline">Spotlight</p>
              <h2>{spotlight?.summary ?? 'Select a session'}</h2>
            </div>
            <Sparkles size={20} />
          </header>
          {spotlight && (
            <>
              <div className="highlight-meta">
                <div>
                  <span>Duration</span>
                  <p>{formatDuration(spotlight.duration)}</p>
                </div>
                {spotlight.moodBefore && spotlight.moodAfter && (
                  <div>
                    <span>Mood shift</span>
                    <p>
                      {spotlight.moodBefore} → {spotlight.moodAfter}
                    </p>
                  </div>
                )}
                <div>
                  <span>Topics</span>
                  <p>{spotlight.topics.slice(0, 2).join(', ')}</p>
                </div>
              </div>
              <div className="highlight-actions">
                <button type="button" onClick={() => handleAction(spotlight, 'resume')}>
                  <MessageCircle size={16} />
                  Resume talking
                </button>
                <button type="button" onClick={() => handleAction(spotlight, 'listen')}>
                  <Headphones size={16} />
                  Listen back
                </button>
                <button type="button" onClick={() => handleAction(spotlight, 'transcript')}>
                  <FileText size={16} />
                  Open transcript
                </button>
              </div>
            </>
          )}
          {actionToast && <div className="voice-toast">{actionToast}</div>}
        </section>

        <section className="voice-list">
          <header>
            <p className="tagline">Recent sessions</p>
            <Clock size={18} />
          </header>
          <div className="session-list">
            {sessions.map((session) => (
              <article
                key={session.id}
                className={`session-card ${session.id === spotlightId ? 'session-card--active' : ''}`}
                onClick={() => setSpotlightId(session.id)}
              >
                <div className="session-head">
                  <div className="session-icon">
                    <MessageCircle size={18} />
                  </div>
                  <div className="session-info">
                    <p className="session-date">{formatRelativeDate(session.startTime)}</p>
                    <p className="session-summary">{session.summary}</p>
                  </div>
                </div>
                <div className="session-meta">
                  <span>{formatDuration(session.duration)}</span>
                  {session.moodBefore && session.moodAfter && (
                    <span>
                      {session.moodBefore} → {session.moodAfter}
                    </span>
                  )}
                </div>
                <div className="topics-row">
                  {session.topics.slice(0, 3).map((topic) => (
                    <span key={topic} className="topic-pill">
                      {topic.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
                <div className="card-actions">
                  <button type="button" onClick={() => handleAction(session, 'resume')}>
                    Resume
                  </button>
                  <button type="button" onClick={() => handleAction(session, 'listen')}>
                    Listen
                  </button>
                  <button type="button" onClick={() => handleAction(session, 'transcript')}>
                    Transcript
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
        </div>
      </div>
    </div>
  );
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function daysAgo(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function formatRelativeDate(date: Date) {
  const diff = daysAgo(date);
  if (diff === 0) {
    return 'Today';
  }
  if (diff === 1) {
    return 'Yesterday';
  }
  if (diff < 7) {
    return `${diff} days ago`;
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
