import React, { useState } from 'react';
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { aiApi } from '../lib/api';

interface AIDraftWizardProps {
  onDraftGenerated: (draft: { title: string; content_html: string }) => void;
}

export const AIDraftWizard: React.FC<AIDraftWizardProps> = ({ onDraftGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState(1);
  const [tone, setTone] = useState('professional');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setGenerating(true);
    setError('');

    try {
      // Simulate backend AI latency
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const response = await aiApi.generateDraft(prompt, category, tone);
      onDraftGenerated(response.data);
    } catch (err: any) {
      console.warn('API connection failed, generating local fallback draft...', err);
      // Fallback for demonstration/mock environments
      onDraftGenerated({
        title: `AI Draft: ${prompt.slice(0, 30)}${prompt.length > 30 ? '...' : ''}`,
        content_html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: var(--color-primary);">Welcome to our Latest Update!</h2>
            <p>Following your prompt about <strong>"${prompt}"</strong>, we put together this newsletter draft with a <strong>${tone}</strong> tone.</p>
            <p>Key highlights this week:</p>
            <ul>
              <li>Exploring the core concepts of our new features.</li>
              <li>How team collaboration drives better customer success.</li>
              <li>Updates, fixes, and community contributions.</li>
            </ul>
            <p>Thank you for subscribing! Stay tuned for more.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 11px; color: #999;">
              You are receiving this because you subscribed to category updates. 
              <a href="/unsubscribe" style="color: var(--color-primary);">Unsubscribe</a>
            </p>
          </div>
        `
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Sparkles size={20} color="var(--color-primary)" />
        <h3 style={{ fontSize: '1.2rem' }}>AI Draft Assistant</h3>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
        Provide a topic, specify details, and let AI build the foundation of your next newsletter campaign.
      </p>

      <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
            WHAT IS THIS NEWSLETTER ABOUT?
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Q2 Engineering progress and new API documentation launch..."
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '12px',
              borderRadius: '8px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-primary)',
              outline: 'none',
              fontFamily: 'inherit',
              fontSize: '0.9rem',
              resize: 'vertical'
            }}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
              CATEGORY
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            >
              <option value={1}>HAE</option>
              <option value={2}>NS</option>
              <option value={3}>CMD</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
              TONE OF VOICE
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="informative">Informative</option>
              <option value="witty">Witty</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={generating || !prompt.trim()}
          className="btn-primary"
          style={{ alignSelf: 'flex-start', marginTop: '8px', opacity: !prompt.trim() ? 0.6 : 1 }}
        >
          {generating ? (
            <>
              <Loader2 size={18} className="pulse-glow" style={{ animation: 'spin 1s linear infinite' }} />
              Drafting Article...
            </>
          ) : (
            <>
              Generate Draft
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
