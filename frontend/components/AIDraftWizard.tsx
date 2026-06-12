import React, { useState } from 'react';
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { aiApi } from '../lib/api';

interface AIDraftWizardProps {
  onDraftGenerated: (draft: { title: string; content_html: string }) => void;
}

export const AIDraftWizard: React.FC<AIDraftWizardProps> = ({ onDraftGenerated }) => {
  const [htmlContent, setHtmlContent] = useState('');
  const [category, setCategory] = useState(1);
  const [tone, setTone] = useState('professional');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();

    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');

    const pastedContent = html || text.replace(/\n/g, '<br />');

    e.currentTarget.innerHTML = pastedContent;
    setHtmlContent(pastedContent);
    setError('');
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    setHtmlContent(e.currentTarget.innerHTML);
    setError('');
  };

  const handleGenerateOverview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!htmlContent.trim()) {
      setError('Please paste HTML email content first.');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const response = await aiApi.generateOverview(
        htmlContent,
        category,
        tone
      );

      const aiOverviewHtml = response.data.content_html;

      onDraftGenerated({
        title: response.data.title || 'Imported HTML Newsletter',
        content_html: `
          <div style="font-family: Arial, sans-serif; padding: 16px; margin-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
            ${aiOverviewHtml}
          </div>
          ${htmlContent}
        `
      });
    } catch (err: any) {
      console.warn('AI overview generation failed, using local fallback...', err);

      onDraftGenerated({
        title: 'Imported HTML Newsletter',
        content_html: `
          <div style="font-family: Arial, sans-serif; padding: 16px; margin-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
            <h2 style="margin-top: 0;">Newsletter Overview</h2>
            <p>Here is a quick overview of the newsletter content below. Please review the imported email before sending.</p>
          </div>
          ${htmlContent}
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
        <h3 style={{ fontSize: '1.2rem' }}>AI HTML Newsletter Assistant</h3>
      </div>

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
        Paste an Outlook-style HTML email. AI will add a short summary/overview before the original email content while keeping the HTML format.
      </p>

      <form onSubmit={handleGenerateOverview} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
            PASTE HTML EMAIL CONTENT
          </label>

          <div
            contentEditable
            suppressContentEditableWarning
            onPaste={handlePaste}
            onInput={handleInput}
            data-placeholder="Paste your Outlook-style HTML email here..."
            style={{
              width: '100%',
              minHeight: '260px',
              padding: '16px',
              borderRadius: '8px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-primary)',
              outline: 'none',
              fontFamily: 'inherit',
              fontSize: '0.9rem',
              overflow: 'auto'
            }}
          />
        </div>

        {error && (
          <div style={{ color: '#dc2626', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

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
              OVERVIEW TONE
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
          disabled={generating || !htmlContent.trim()}
          className="btn-primary"
          style={{ alignSelf: 'flex-start', marginTop: '8px', opacity: !htmlContent.trim() ? 0.6 : 1 }}
        >
          {generating ? (
            <>
              <Loader2 size={18} className="pulse-glow" style={{ animation: 'spin 1s linear infinite' }} />
              Generating Overview...
            </>
          ) : (
            <>
              Add AI Overview & Continue
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </div>
  );
};