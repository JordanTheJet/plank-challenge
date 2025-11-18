'use client';

import { useState } from 'react';
import { generateShareText, saveCompletion, hasSubmittedToday } from '@/utils/localLeaderboard';

interface ShareToDiscordProps {
  day: number;
  duration: number;
  targetDuration: number;
}

export default function ShareToDiscord({ day, duration, targetDuration }: ShareToDiscordProps) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(hasSubmittedToday(day));

  const handleSaveAndCopy = async () => {
    // Save to localStorage first
    if (!saved) {
      const success = saveCompletion(day, duration, targetDuration);
      if (success) {
        setSaved(true);
      }
    }

    // Generate share text
    const shareText = generateShareText(day, duration, targetDuration);

    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch (err) {
        console.error('Fallback copy failed:', err);
      }
      document.body.removeChild(textArea);
    }
  };

  const shareText = generateShareText(day, duration, targetDuration);

  return (
    <div className="mt-6 w-full max-w-md">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">
          Share to Discord
        </h3>

        {/* Preview */}
        <div className="bg-white rounded-lg p-3 mb-4 border border-gray-200">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
            {shareText}
          </pre>
        </div>

        {/* Status Messages */}
        {saved && (
          <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700 text-center">
            ✓ Saved to your local progress
          </div>
        )}

        {copied && (
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700 text-center">
            ✓ Copied! Paste in Discord
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleSaveAndCopy}
          className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center justify-center"
        >
          {saved ? (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {copied ? 'Copied to Clipboard!' : 'Copy Results'}
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Save & Copy Results
            </>
          )}
        </button>

        {/* Discord Link */}
        <div className="mt-4 text-center">
          <a
            href={process.env.NEXT_PUBLIC_DISCORD_URL || 'https://discord.com/channels/1210290974601773056/1438326766279196782'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-semibold text-sm"
          >
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            Open Discord to Share
          </a>
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 text-center text-sm text-gray-600">
        Your progress is saved locally on this device
      </div>
    </div>
  );
}
