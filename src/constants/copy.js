/**
 * Single source of user-facing copy and published product rules.
 * The server also serves this object at /js/copy.js for the browser.
 * Earnings figures are never written here. Those come from database rows.
 */

const COPY = {
  brand: 'Flirta',
  tagline: 'Meet people nearby',
  homeTitle: 'Meet someone who actually wants to talk',
  homeSubtitle: 'Create a profile, browse people in your city, and chat when you both match. Flirta is a dating app for adults 18 and older.',
  ageGate: 'You must be at least 18 years old to use Flirta.',
  adultConfirm: 'You must confirm that you are at least 18 years old and eligible to register.',
  welcome: 'Account created successfully. Welcome to Flirta.',
  matchMessage: 'It is a match. You can chat now.',
  likeSent: 'Like sent.',
  passSent: 'Profile passed.',
  safetyChat: 'Meet in public. Do not send money to someone you have not met. Report or block anyone who pressures you.',
  emptyDiscover: 'No profiles match these filters.',
  emptyMatches: 'No mutual matches yet. Likes become matches only when both people like each other.',
  emptyChat: 'No messages yet. Say hello.',
  loading: 'Loading…',
  errorGeneric: 'Something went wrong. Try again.',
  privacySummary: 'Flirta stores your account, profile, photos, likes, matches, and messages so the app can run. We do not sell your profile to data brokers.',
  termsSummary: 'Flirta is a dating app for adults 18 and older. You are responsible for what you post and for any meeting you choose to attend.'
};

const RULES = {
  freeDailyLikes: 5,
  messageLimitPerMinute: 30,
  likeActionLimitPerMinute: 60,
  interests: [
    'Music',
    'Travel',
    'Food',
    'Movies',
    'Fitness',
    'Reading',
    'Art',
    'Outdoors',
    'Coffee',
    'Gaming'
  ],
  plans: {
    free: '5 likes per day. City and age filters. Report, block, and chat after a mutual match.',
    spark: 'Paid entry plan. 25 likes per day and one profile photo unlocked in Discover.',
    premium: 'Chemistry, Attraction, and Dream Match include unlimited likes, who liked you, and advanced filters (interests and photo-verified only).',
    photos: 'Spark unlocks the primary photo. Chemistry and above unlock the full photo gallery.'
  },
  referral: {
    premiumDays: 3,
    walletCreditInr: 25,
    maxRewards: 10,
    maxPremiumDays: 30,
    trigger: 'A reward is created only after a moderator approves the referred member’s photo verification.',
    order: 'Each approved referral grants 3 Premium days until this account has received 30 Premium days from referrals. After that, each remaining reward is a ₹25 wallet credit. No account can receive more than 10 referral rewards.'
  },
  host: {
    platformFeePercent: 20,
    hostSharePercent: 80,
    payoutThresholdInr: 500,
    payoutFeeInr: 0,
    minGiftInr: 50,
    maxGiftInr: 10000,
    explanation: 'Verified hosts receive 80% of each captured gift or paid session. Flirta keeps 20% as a platform fee. A payout can be requested when the captured balance is at least ₹500. The dashboard lists captured ledger rows only.'
  },
  skus: {
    super_likes_5: { amountInr: 99, superLikes: 5, boosts: 0, label: '5 Super Likes' },
    super_likes_15: { amountInr: 249, superLikes: 15, boosts: 0, label: '15 Super Likes' },
    boost_1: { amountInr: 149, superLikes: 0, boosts: 1, label: '1 Profile Boost (24 hours)' }
  }
};

module.exports = { COPY, RULES };
