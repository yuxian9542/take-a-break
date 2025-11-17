import { useMemo, useState } from 'react';
import { generateBreakPlans, type BreakMood, type BreakPlan } from '@take-a-break/break-plans';

const MOOD_OPTIONS: Array<{ value: BreakMood; label: string; tip: string }> = [
  { value: 'tired', label: '感觉疲惫', tip: '需要提振能量与注意力' },
  { value: 'stressed', label: '紧张焦虑', tip: '释放压力，放松神经系统' },
  { value: 'need_pause', label: '想暂停一下', tip: '按下暂停键，重新整理心绪' }
];

const TIME_OPTIONS = [10, 30, 60];

export function PlanPage() {
  const [mood, setMood] = useState<BreakMood>('tired');
  const [minutes, setMinutes] = useState<number>(30);
  const [canGoOutside, setCanGoOutside] = useState(true);
  const [canTalk, setCanTalk] = useState(true);
  const [plans, setPlans] = useState<BreakPlan[]>([]);

  const moodTip = useMemo(() => MOOD_OPTIONS.find((option) => option.value === mood)?.tip ?? '', [mood]);

  return (
    <section className="page">
      <header className="page__header">
        <h1>个性化放松计划</h1>
        <p>根据当下感受与时间，为你生成 1~3 个可立即执行的小型放松序列。</p>
      </header>

      <div className="card-grid">
        <div className="card">
          <h2>当前状态</h2>
          <div className="chip-row">
            {MOOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`chip ${option.value === mood ? 'chip--active' : ''}`}
                onClick={() => setMood(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="muted">{moodTip}</p>

          <h2>可用时间</h2>
          <div className="chip-row">
            {TIME_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className={`chip ${option === minutes ? 'chip--active' : ''}`}
                onClick={() => setMinutes(option)}
              >
                {option} 分钟
              </button>
            ))}
          </div>

          <div className="toggle-list">
            <label>
              <input
                type="checkbox"
                checked={canGoOutside}
                onChange={(event) => setCanGoOutside(event.target.checked)}
              />
              可以外出
            </label>
            <label>
              <input type="checkbox" checked={canTalk} onChange={(event) => setCanTalk(event.target.checked)} />
              想要与语音伙伴聊天
            </label>
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={() => setPlans(generateBreakPlans(mood, minutes, canGoOutside, canTalk))}
          >
            生成放松计划
          </button>
        </div>

        <div className="card">
          <h2>推荐计划</h2>
          {plans.length === 0 ? (
            <p className="muted">点击“生成放松计划”即可查看建议。</p>
          ) : (
            <div className="plan-stack">
              {plans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function PlanCard({ plan }: { plan: BreakPlan }) {
  return (
    <article className="plan-card">
      <header>
        <h3>
          {plan.mood === 'stressed' ? '舒压散步' : plan.mood === 'tired' ? '能量回充' : '暂停回心'}
          <span className="pill">{plan.totalMinutes} 分钟</span>
        </h3>
        <p className="muted">
          {plan.canGoOutside ? '包含室外活动' : '室内即可'} · {plan.canTalk ? '结合语音伙伴' : '静心练习'}
        </p>
      </header>
      <ol>
        {plan.steps.map((step, index) => (
          <li key={`${plan.id}_${index}`}>
            <strong>{step.title}</strong>
            <span className="pill pill--soft">{step.durationMinutes} 分钟</span>
            <p>{'copy' in step ? step.copy : ''}</p>
            {'destination' in step && step.destination ? (
              <p className="muted">
                目的地：{step.destination.name} · {(step.destination.distanceMeters / 1000).toFixed(1)} km
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    </article>
  );
}

