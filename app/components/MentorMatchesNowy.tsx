import React, { useState, useEffect } from 'react';
import { MatchResult } from '@/lib/types/interview';
import { logger } from '@/lib/logger/index';
import Call from './Call';
import MeetingCreator from './MeetingCreator';
interface MentorMatchesProps {
  profile: any;
}
export default function MentorMatches({ profile }: MentorMatchesProps) {
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCall, setActiveCall] = useState(false);
  const [showMeetingCreator, setShowMeetingCreator] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<string>('');
  const [selectedMentorInitialEth, setSelectedMentorInitialEth] = useState<string | undefined>(
    undefined,
  );
  const [ethUsd, setEthUsd] = useState<number | null>(null);
  useEffect(() => {
    if (profile) {
      findMatches();
    }
  }, [profile]);
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    const fetchPrice = async () => {
      try {
        const res = await fetch('/api/prices?symbols=ETH', { cache: 'no-store' });
        const json = await res.json();
        const price = json?.data?.ETH?.value;
        if (typeof price === 'number') setEthUsd(price);
      } catch {}
    };
    fetchPrice();
    timer = setInterval(fetchPrice, 60000);
    return () => {
      if (timer) clearInterval(timer);
    };
  }, []);
  const findMatches = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      });

      const data = await response.json();

      if (data.success) {
        setMatches(data.matches);
        logger.info('Matches loaded successfully', { count: data.matches.length });
      } else {
        setError('Failed to find mentor matches');
      }
    } catch (err) {
      logger.error('Error finding matches:', err);
      setError('An error occurred while finding matches');
    } finally {
      setIsLoading(false);
    }
  };
  const getArchetypeColor = (archetype: string) => {
    switch (archetype) {
      case 'investor':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'developer':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'social_user':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  const getMatchScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };
  const getMatchScoreLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent Match';
    if (score >= 0.6) return 'Good Match';
    return 'Fair Match';
  };
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center text-red-600">
          <h2 className="text-xl font-bold mb-2">Error Finding Matches</h2>
          <p>{error}</p>
          <button
            onClick={findMatches}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  if (activeCall) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <Call />
        <button
          onClick={() => setActiveCall(false)}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          End Call
        </button>
      </div>
    );
  }
  if (showMeetingCreator) {
    return (
      <>
        <div className="bg-white rounded-lg shadow-lg">
          {/* Keep the existing mentor matches display */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold">Your Mentor Matches</h2>
              <span className="text-sm text-gray-600">
                Found {matches.length} compatible mentors
              </span>
            </div>
            {profile && (
              <div className="flex items-center gap-4 text-sm">
                <span>Your Archetype:</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium border ${getArchetypeColor(profile.archetype_classification.primary_archetype)}`}
                >
                  {profile.archetype_classification.primary_archetype
                    .replace('_', ' ')
                    .toUpperCase()}
                </span>
                <span className="text-gray-500">
                  Knowledge: {profile.crypto_interests.knowledge_level}
                </span>
              </div>
            )}
          </div>
          <div className="p-6 text-center text-gray-600">
            <p>Creating meeting with {selectedMentor}...</p>
          </div>
        </div>
        <MeetingCreator
          mentorName={selectedMentor}
          initialEthAmount={selectedMentorInitialEth}
          onMeetingCreated={() => {
            setShowMeetingCreator(false);
            setActiveCall(true);
          }}
          onCancel={() => {
            setShowMeetingCreator(false);
            setSelectedMentor('');
            setSelectedMentorInitialEth(undefined);
          }}
        />
      </>
    );
  }
  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">Your Mentor Matches</h2>
          <span className="text-sm text-gray-600">Found {matches.length} compatible mentors</span>
        </div>
        {profile && (
          <div className="flex items-center gap-4 text-sm">
            <span>Your Archetype:</span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium border ${getArchetypeColor(profile.archetype_classification.primary_archetype)}`}
            >
              {profile.archetype_classification.primary_archetype.replace('_', ' ').toUpperCase()}
            </span>
            <span className="text-gray-500">
              Knowledge: {profile.crypto_interests.knowledge_level}
            </span>
          </div>
        )}
      </div>
      <div className="max-h-[600px] overflow-y-auto">
        {matches.length === 0 ? (
          <div className="p-6 text-center text-gray-600">
            <p>No mentors found matching your criteria.</p>
            <p className="text-sm mt-2">Try adjusting your preferences or check back later.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {matches.map((match, index) => (
              <div key={match.mentor.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {match.mentor.personal_info.fullName}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getArchetypeColor(match.mentor.crypto_expertise.primary_archetype)}`}
                      >
                        {match.mentor.crypto_expertise.primary_archetype.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">⭐</span>
                        <span className="text-sm font-medium">
                          {match.mentor.metrics.community_reputation}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{match.mentor.personal_info.bio}</p>
                    {match.mentor.pricing?.is_paid ? (
                      <div className="mt-2 border border-amber-300 bg-amber-50 rounded-md p-3 text-sm">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold rounded bg-amber-600 text-white">
                            PAID
                          </span>
                          <span className="font-semibold text-amber-900">Pricing</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="flex flex-col">
                            <span className="text-xs text-amber-800">Price (USD)</span>
                            <span className="font-medium text-black">
                              {match.mentor.pricing.rate_type === 'per_call'
                                ? `$${match.mentor.pricing.rate_usd.toFixed(0)} / call`
                                : match.mentor.pricing.rate_type === 'per_minute'
                                  ? `$${match.mentor.pricing.rate_usd.toFixed(2)} / min`
                                  : `$${(match.mentor.pricing.rate_usd / 60).toFixed(2)} / min`}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-amber-800">ETH equiv</span>
                            <span className="font-medium text-black">
                              {ethUsd
                                ? match.mentor.pricing.rate_type === 'per_call'
                                  ? (match.mentor.pricing.rate_usd / ethUsd).toFixed(4)
                                  : match.mentor.pricing.rate_type === 'per_minute'
                                    ? (match.mentor.pricing.rate_usd / ethUsd).toFixed(6)
                                    : (match.mentor.pricing.rate_usd / 60 / ethUsd).toFixed(6)
                                : '—'}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-amber-800">USDC equiv</span>
                            <span className="font-medium text-black">
                              {match.mentor.pricing.rate_type === 'per_call'
                                ? `${match.mentor.pricing.rate_usd.toFixed(0)} USDC`
                                : match.mentor.pricing.rate_type === 'per_minute'
                                  ? `${match.mentor.pricing.rate_usd.toFixed(2)} USDC/min`
                                  : `${(match.mentor.pricing.rate_usd / 60).toFixed(2)} USDC/min`}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3">
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-900 text-base font-semibold">
                            {(() => {
                              const usd =
                                match.mentor.pricing.rate_type === 'per_call'
                                  ? match.mentor.pricing.rate_usd
                                  : match.mentor.pricing.rate_type === 'per_minute'
                                    ? match.mentor.pricing.rate_usd * 30
                                    : match.mentor.pricing.rate_usd;
                              const pln = usd * 4.0; // rough USD→PLN
                              const coffees = Math.round(pln / 17);
                              return `≈ ${coffees} coffees in Poland`;
                            })()}
                            <span>☕</span>
                          </span>
                        </div>
                        {ethUsd && (
                          <div className="mt-1 text-[11px] text-amber-700">
                            @ ${ethUsd.toFixed(2)} / ETH (RedStone)
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-emerald-100 text-emerald-800">
                        Free
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-bold text-lg ${getMatchScoreColor(match.similarity_score)}`}
                    >
                      {Math.round(match.similarity_score * 100)}%
                    </div>
                    <div className={`text-xs ${getMatchScoreColor(match.similarity_score)}`}>
                      {getMatchScoreLabel(match.similarity_score)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Expertise</h4>
                    <div className="flex flex-wrap gap-1">
                      {match.mentor.crypto_expertise.specializations.slice(0, 3).map((spec, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                        >
                          {spec}
                        </span>
                      ))}
                      {match.mentor.crypto_expertise.specializations.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          +{match.mentor.crypto_expertise.specializations.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Experience</h4>
                    <p className="text-gray-600">
                      {match.mentor.crypto_expertise.years_in_crypto}+ years in crypto
                    </p>
                    <p className="text-gray-600">
                      {match.mentor.metrics.successful_mentees} mentees helped
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Availability</h4>
                    <p className="text-gray-600">
                      {match.mentor.availability.days.length} days/week
                    </p>
                    <p className="text-gray-600">{match.mentor.availability.timezone}</p>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium text-blue-900 mb-2">Why this is a great match:</h4>
                  <p className="text-blue-800 text-sm">{match.match_explanation}</p>
                </div>

                {match.learning_path_suggestion && (
                  <div className="bg-purple-50 p-4 rounded-lg mb-4">
                    <h4 className="font-medium text-purple-900 mb-2">Suggested Learning Path:</h4>
                    <p className="text-purple-800 text-sm">{match.learning_path_suggestion}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  {match.mentor.pricing?.is_paid ? (
                    <button
                      onClick={() => {
                        setSelectedMentor(match.mentor.personal_info.fullName);
                        if (ethUsd && match.mentor.pricing) {
                          let usdTotal = 0;
                          if (match.mentor.pricing.rate_type === 'per_call') {
                            usdTotal = match.mentor.pricing.rate_usd;
                          } else if (match.mentor.pricing.rate_type === 'per_minute') {
                            // Fallback suggestion: 30 minutes
                            usdTotal = match.mentor.pricing.rate_usd * 30;
                          } else {
                            // per_hour → use 1 hour
                            usdTotal = match.mentor.pricing.rate_usd;
                          }
                          const eth = usdTotal / ethUsd;
                          setSelectedMentorInitialEth(eth.toFixed(4));
                        } else {
                          setSelectedMentorInitialEth(undefined);
                        }
                        setShowMeetingCreator(true);
                      }}
                      className="flex-1 bg-amber-500 text-white py-2 px-4 rounded-lg hover:bg-amber-600 transition-colors font-medium"
                    >
                      {match.mentor.pricing.rate_type === 'per_call'
                        ? `Book (Paid) · $${match.mentor.pricing.rate_usd.toFixed(0)}/call`
                        : match.mentor.pricing.rate_type === 'per_minute'
                          ? `Book (Paid) · from $${match.mentor.pricing.rate_usd.toFixed(2)}/min`
                          : `Book (Paid) · from $${(match.mentor.pricing.rate_usd / 60).toFixed(2)}/min`}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedMentor(match.mentor.personal_info.fullName);
                        setSelectedMentorInitialEth('0.001');
                        setShowMeetingCreator(true);
                      }}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors font-medium"
                    >
                      Connect (Free)
                    </button>
                  )}
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
