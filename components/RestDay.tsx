'use client';

import { format } from 'date-fns';
import { getNextChallenge } from '@/utils/timerLogic';

export default function RestDay() {
  const nextChallenge = getNextChallenge();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-blue-50 to-purple-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Rest Day Icon */}
        <div className="mb-6">
          <div className="inline-block p-6 bg-blue-100 rounded-full">
            <svg
              className="w-16 h-16 text-blue-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Rest Day Title */}
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Rest Day
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          Every Sunday is a rest day
        </p>

        {/* Recovery Message */}
        <div className="bg-blue-50 rounded-lg p-4 mb-8">
          <p className="text-blue-800 font-medium">
            Take time to recover and prepare for your next challenge!
          </p>
        </div>

        {/* Next Challenge Info */}
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            Next Challenge
          </h2>

          <div className="space-y-2 text-left bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Date:</span>
              <span className="font-semibold text-gray-800">
                {format(nextChallenge.date, 'EEEE, MMM d, yyyy')}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Day:</span>
              <span className="font-semibold text-gray-800">
                Day {nextChallenge.dayNumber}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Duration:</span>
              <span className="font-semibold text-purple-600 text-xl">
                {nextChallenge.duration} seconds
              </span>
            </div>
          </div>
        </div>

        {/* Motivational Quote */}
        <div className="mt-8 pt-6 border-t">
          <p className="text-gray-500 italic text-sm">
            "Rest is not idleness, and to lie sometimes on the grass under trees on a summer's day, listening to the murmur of the water, or watching the clouds float across the sky, is by no means a waste of time."
          </p>
        </div>

        {/* Discord Link */}
        <div className="mt-8">
          <a
            href={process.env.NEXT_PUBLIC_DISCORD_URL || 'https://discord.com/channels/1210290974601773056/1438326766279196782'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            Join Discord Community
          </a>
        </div>
      </div>
    </div>
  );
}
