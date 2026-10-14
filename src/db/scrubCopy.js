function scrubFestivalCopy(db) {
  db.prepare(`
    UPDATE profiles
    SET bio = 'Looking to meet someone nearby.'
    WHERE bio LIKE '%Garba%'
       OR bio LIKE '%garba%'
       OR bio LIKE '%Navratri%'
       OR bio LIKE '%Raas%'
       OR bio LIKE '%Dandiya%'
       OR bio LIKE '%Dodhiya%'
  `).run();

  db.prepare(`
    UPDATE profiles
    SET display_name = 'Flirta Admin'
    WHERE display_name LIKE '%Garba%'
  `).run();

  db.prepare(`
    UPDATE subscription_plans
    SET daily_likes_limit = -1
    WHERE can_see_likes = 1
  `).run();

  const replacements = {
    spark: [
      '25 likes per day',
      'Primary photo unlocked in Discover',
      'City and age filters'
    ],
    chemistry: [
      'Unlimited likes',
      'See who liked you',
      'Advanced filters: interests and photo-verified profiles',
      'Full photo gallery',
      '1 Profile Boost credit'
    ],
    attraction: [
      'Unlimited likes',
      'See who liked you',
      'Advanced filters',
      'Full photo gallery',
      '3 Profile Boost credits'
    ],
    dream_match: [
      'Unlimited likes',
      'See who liked you',
      'Advanced filters',
      'Full photo gallery',
      '8 Profile Boost credits'
    ]
  };

  const plans = db.prepare('SELECT id, code, features_json FROM subscription_plans').all();
  const update = db.prepare('UPDATE subscription_plans SET features_json = ? WHERE id = ?');
  for (const plan of plans) {
    if (/garba|navratri|dance/i.test(plan.features_json || '') && replacements[plan.code]) {
      update.run(JSON.stringify(replacements[plan.code]), plan.id);
    }
  }
}

module.exports = { scrubFestivalCopy };
