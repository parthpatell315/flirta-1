const bcrypt = require('bcryptjs');
const { getDb } = require('./database');

async function seed() {
  const db = getDb();
  console.log('Seeding initial data...');

  // 1. Seed Admin user if not exists
  const adminEmail = 'admin@garbajodi.com';
  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);

  let adminId;
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('AdminGarba2026!', 10);
    const result = db.prepare(`
      INSERT INTO users (email, password_hash, role, status)
      VALUES (?, ?, 'admin', 'active')
    `).run(adminEmail, passwordHash);
    adminId = Number(result.lastInsertRowid);

    // Create Admin Profile
    db.prepare(`
      INSERT INTO profiles (
        user_id, display_name, dob, age, city, preferred_language,
        bio, garba_experience, dance_style, hobbies, connection_types,
        is_discoverable, is_adult_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      adminId,
      'GarbaJodi Official Admin',
      '1995-01-01',
      31,
      'Ahmedabad',
      'Gujarati, English, Hindi',
      'Platform admin ensuring community safety, verified venues and festive celebrations for Navratri 2026.',
      'advanced',
      '3-Taali, Dodhiya, Popat',
      'Dandiya Raas, Folk Music',
      JSON.stringify(['group', 'friendship']),
      0, // not discoverable in user dating/matching pool
      1
    );
    console.log('Admin account created: admin@garbajodi.com');
  } else {
    adminId = existingAdmin.id;
  }

  // 2. Seed Real Navratri 2026 Garba Events
  const eventsCount = db.prepare('SELECT COUNT(*) as count FROM events').get().count;
  if (eventsCount === 0) {
    const sampleEvents = [
      {
        name: 'United Way of Baroda Navratri Mahotsav 2026',
        organizer: 'United Way of Baroda Trust',
        venue_name: 'United Way Garba Ground, Atladra',
        address: 'Old Padra Road, Atladra, Vadodara, Gujarat',
        city: 'Vadodara',
        event_date: '2026-10-11',
        start_time: '20:00',
        end_time: '01:30',
        description: 'The world-famous authentic traditional Garba festival in the Cultural Capital of Gujarat. Non-commercial, celebrated for charity and heritage.',
        is_published: 1,
        ticket_url: 'https://unitedwaybaroda.org/garba',
        capacity: 35000
      },
      {
        name: 'Ahmedabad Heritage Garba Nights 2026',
        organizer: 'Gujarat Tourism & Vibrant Cultural Council',
        venue_name: 'GMDC Mega Ground',
        address: '132 Feet Ring Road, Vastrapur, Ahmedabad, Gujarat',
        city: 'Ahmedabad',
        event_date: '2026-10-12',
        start_time: '19:30',
        end_time: '01:00',
        description: 'Vibrant multi-circle authentic Raas-Garba with world-class acoustics, traditional folk artists, and safe cultural ambiance.',
        is_published: 1,
        ticket_url: 'https://gujarattourism.com/navratri-2026',
        capacity: 25000
      },
      {
        name: 'Suvarna Navratri Mahotsav Surat 2026',
        organizer: 'Surat Cultural Arts Foundation',
        venue_name: 'Sarsana International Exhibition Ground',
        address: 'Sarsana, Khajod, Surat, Gujarat',
        city: 'Surat',
        event_date: '2026-10-13',
        start_time: '20:00',
        end_time: '02:00',
        description: 'Surat grandest Navratri celebration with air-conditioned arena zones, high-energy live orchestra, and safe family atmosphere.',
        is_published: 1,
        ticket_url: 'https://suratculture.org/navratri',
        capacity: 18000
      },
      {
        name: 'Kora Kendra Navratri Dandiya Night 2026',
        organizer: 'Naidu Cultural Club Borivali',
        venue_name: 'Kora Kendra Grounds',
        address: 'Shimpoli Road, Borivali West, Mumbai, Maharashtra',
        city: 'Mumbai',
        event_date: '2026-10-14',
        start_time: '19:00',
        end_time: '00:00',
        description: 'Mumbai premier traditional Garba & Dandiya Raas destination with iconic folk performers and dedicated group dance circles.',
        is_published: 1,
        ticket_url: 'https://korakendra.com/dandiya2026',
        capacity: 20000
      },
      {
        name: 'Race Course Heritage Garba Rajkot 2026',
        organizer: 'Kathiyawad Folk Society',
        venue_name: 'Race Course Ring Road Ground',
        address: 'Race Course Road, Rajkot, Saurashtra, Gujarat',
        city: 'Rajkot',
        event_date: '2026-10-15',
        start_time: '20:30',
        end_time: '01:30',
        description: 'Soulful Kathiyawadi Heech and Tran-Taali Garba with traditional costumes, authentic Shenai & Dhol beats.',
        is_published: 1,
        ticket_url: 'https://rajkotcultural.in/events',
        capacity: 15000
      }
    ];

    const insertEvent = db.prepare(`
      INSERT INTO events (
        name, organizer, venue_name, address, city, event_date,
        start_time, end_time, description, is_published, ticket_url, capacity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const ev of sampleEvents) {
      insertEvent.run(
        ev.name, ev.organizer, ev.venue_name, ev.address, ev.city,
        ev.event_date, ev.start_time, ev.end_time, ev.description,
        ev.is_published, ev.ticket_url, ev.capacity
      );
    }
    console.log(`Seeded ${sampleEvents.length} real published Garba events.`);
  }

  // 2B. Seed Flirta Official Subscription Plans (Spark, Chemistry, Attraction, Dream Match)
  const plansCount = db.prepare('SELECT COUNT(*) as count FROM subscription_plans').get().count;
  if (plansCount === 0) {
    const defaultPlans = [
      {
        code: 'spark',
        name: 'Spark',
        price_inr: 249,
        duration_days: 9,
        daily_likes_limit: 25,
        boost_credits: 0,
        can_see_likes: 0,
        can_see_photo: 1,
        can_see_all_photos: 0,
        priority_level: 1,
        is_popular: 0,
        features_json: JSON.stringify([
          'Discover local cultural dance enthusiasts',
          'Unlock 1 profile photo per dancer',
          'Set preferences for age, location, and dance style',
          '25 daily interest expressions (likes)',
          'Filter by Navratri event dates',
          'Basic compatibility insights'
        ])
      },
      {
        code: 'chemistry',
        name: 'Chemistry',
        price_inr: 549,
        duration_days: 9,
        daily_likes_limit: 60,
        boost_credits: 1,
        can_see_likes: 1,
        can_see_photo: 1,
        can_see_all_photos: 1,
        priority_level: 2,
        is_popular: 1,
        features_json: JSON.stringify([
          'Everything included in Spark',
          'Explore all photos & full dancer photo gallery',
          '60 daily interest expressions',
          'See who liked you (Instant Mutual Matching)',
          'Advanced community filters',
          '1 Profile Boost Credit included',
          'Priority customer support'
        ])
      },
      {
        code: 'attraction',
        name: 'Attraction',
        price_inr: 749,
        duration_days: 9,
        daily_likes_limit: 120,
        boost_credits: 3,
        can_see_likes: 1,
        can_see_photo: 1,
        can_see_all_photos: 1,
        priority_level: 3,
        is_popular: 0,
        features_json: JSON.stringify([
          'Everything included in Chemistry',
          'Explore all photos & full dancer photo gallery',
          '120 daily interest expressions',
          '3 Profile Boost Credits (High Visibility)',
          'Enhanced partner matching algorithm',
          'Priority profile placement in discovery feed',
          'Verified event attendee badge'
        ])
      },
      {
        code: 'dream_match',
        name: 'Dream Match',
        price_inr: 949,
        duration_days: 9,
        daily_likes_limit: -1, // Unlimited
        boost_credits: 8,
        can_see_likes: 1,
        can_see_photo: 1,
        can_see_all_photos: 1,
        priority_level: 4,
        is_popular: 0,
        features_json: JSON.stringify([
          'Everything included in Attraction',
          'Explore all photos & full dancer photo gallery',
          'Unlimited daily likes & interest expressions',
          '8 Profile Boost Credits for peak Navratri nights',
          'Top priority visibility in discovery deck',
          'Exclusive Dream Match badge on profile',
          'Advanced security & verified profile filtering tools'
        ])
      }
    ];

    const insertPlan = db.prepare(`
      INSERT INTO subscription_plans (
        code, name, price_inr, duration_days, daily_likes_limit,
        boost_credits, can_see_likes, can_see_photo, can_see_all_photos, priority_level, is_popular, features_json, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    for (const pl of defaultPlans) {
      insertPlan.run(
        pl.code, pl.name, pl.price_inr, pl.duration_days, pl.daily_likes_limit,
        pl.boost_credits, pl.can_see_likes, pl.can_see_photo, pl.can_see_all_photos, pl.priority_level, pl.is_popular, pl.features_json
      );
    }
    console.log(`Seeded ${defaultPlans.length} Flirta subscription plans.`);
  } else {
    db.prepare('UPDATE subscription_plans SET can_see_photo = 1 WHERE price_inr >= 249').run();
    db.prepare('UPDATE subscription_plans SET can_see_all_photos = 1 WHERE price_inr >= 549').run();
  }

  // 3. Seed Realistic Discoverable Dancers for Partner Matching
  const initialDancers = [
    {
      email: 'diya.shah@example.com',
      displayName: 'Diya Shah',
      dob: '2001-07-15',
      age: 25,
      city: 'Ahmedabad',
      garbaExperience: 'advanced',
      danceStyle: 'Dodhiya, 3-Taali, Popat',
      preferredLanguage: 'Gujarati, Hindi, English',
      bio: 'Lifelong Garba lover! Looking for an energetic partner to sync Dodhiya steps and celebrate Navratri with style.',
      hobbies: 'Chaniya Choli design, Folk Singing, Dhol beats',
      connectionTypes: ['partner', 'friendship'],
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      extraPhotos: [
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80'
      ]
    },
    {
      email: 'rohan.patel@example.com',
      displayName: 'Rohan Patel',
      dob: '1999-11-20',
      age: 26,
      city: 'Vadodara',
      garbaExperience: 'advanced',
      danceStyle: 'Traditional Baroda Style, Tran-Taali',
      preferredLanguage: 'Gujarati, English',
      bio: 'Vadodara Garba regular for 7 years. Ready with traditional Kediya. Need a dedicated partner for all 9 nights.',
      hobbies: 'Fitness, Photography, Folk Raas',
      connectionTypes: ['partner', 'friendship'],
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      extraPhotos: [
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80'
      ]
    },
    {
      email: 'priya.mehta@example.com',
      displayName: 'Priya Mehta',
      dob: '2003-04-12',
      age: 23,
      city: 'Surat',
      garbaExperience: 'intermediate',
      danceStyle: 'Popat, 2-Taali, Free Style',
      preferredLanguage: 'Gujarati, Hindi',
      bio: 'Excited for Surat Garba! Love vibrant chaniyas, energetic music, and meeting friendly dance partners.',
      hobbies: 'Dance choreography, Coffee, Dandiya',
      connectionTypes: ['partner', 'friendship', 'dating'],
      photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
      extraPhotos: [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
      ]
    },
    {
      email: 'harsh.desai@example.com',
      displayName: 'Harsh Desai',
      dob: '1998-02-28',
      age: 28,
      city: 'Mumbai',
      garbaExperience: 'intermediate',
      danceStyle: 'Mumbai Dandiya, 3-Taali',
      preferredLanguage: 'Hindi, Gujarati, English',
      bio: 'Mumbai resident looking for a fun dance partner to groove together till midnight.',
      hobbies: 'Live music, Food walks, Badminton',
      connectionTypes: ['partner', 'dating'],
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
      extraPhotos: [
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80'
      ]
    },
    {
      email: 'ananya.joshi@example.com',
      displayName: 'Ananya Joshi',
      dob: '2002-09-05',
      age: 24,
      city: 'Rajkot',
      garbaExperience: 'advanced',
      danceStyle: 'Kathiyawadi Heech, 3-Taali',
      preferredLanguage: 'Gujarati, Hindi',
      bio: 'Kathiyawadi Heech expert. Love high-energy dhol and fast-paced beats. Looking for my Garba partner!',
      hobbies: 'Traditional Art, Folk Dance, Dholak',
      connectionTypes: ['partner', 'friendship'],
      photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80'
    },
    {
      email: 'kavya.verma@example.com',
      displayName: 'Kavya Verma',
      dob: '2001-03-14',
      age: 25,
      city: 'Indore',
      garbaExperience: 'advanced',
      danceStyle: 'Dodhiya, 2-Taali, Fast Beats',
      preferredLanguage: 'Hindi, Gujarati',
      bio: 'Passionate Garba dancer in Indore! Ready with authentic chaniya choli. Seeking an energetic dance partner for Navratri 2026.',
      hobbies: 'Folk Choreography, Fashion, Travel',
      connectionTypes: ['partner', 'friendship', 'dating'],
      photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
      extraPhotos: [
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80'
      ]
    },
    {
      email: 'manav.shah@example.com',
      displayName: 'Manav Shah',
      dob: '2000-08-22',
      age: 26,
      city: 'Gandhinagar',
      garbaExperience: 'intermediate',
      danceStyle: '3-Taali, Popat, Free Style',
      preferredLanguage: 'Gujarati, Hindi, English',
      bio: 'Gandhinagar resident eager for Navratri nights. Looking for a partner who loves vibrant Gujarati folk music.',
      hobbies: 'Dhol Beats, Fitness, Photography',
      connectionTypes: ['partner', 'dating'],
      photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80'
    }
  ];

  for (const d of initialDancers) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(d.email);
    if (!existing) {
      const pHash = await bcrypt.hash('Dancer2026!', 10);
      const res = db.prepare(`
        INSERT INTO users (email, password_hash, role, status)
        VALUES (?, ?, 'user', 'active')
      `).run(d.email, pHash);
      const uId = Number(res.lastInsertRowid);

      const profRes = db.prepare(`
        INSERT INTO profiles (
          user_id, display_name, dob, age, city, preferred_language,
          bio, garba_experience, dance_style, hobbies, connection_types,
          is_discoverable, is_adult_verified
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
      `).run(
        uId, d.displayName, d.dob, d.age, d.city, d.preferredLanguage,
        d.bio, d.garbaExperience, d.danceStyle, d.hobbies, JSON.stringify(d.connectionTypes)
      );

      const pId = Number(profRes.lastInsertRowid);
      db.prepare(`
        INSERT INTO profile_photos (profile_id, photo_url, is_primary)
        VALUES (?, ?, 1)
      `).run(pId, d.photoUrl);

      if (d.extraPhotos && d.extraPhotos.length) {
        for (const extraUrl of d.extraPhotos) {
          db.prepare(`
            INSERT INTO profile_photos (profile_id, photo_url, is_primary)
            VALUES (?, ?, 0)
          `).run(pId, extraUrl);
        }
      }

      // Attach attendance to an event
      const ev = db.prepare('SELECT id FROM events WHERE city = ? LIMIT 1').get(d.city);
      if (ev) {
        db.prepare(`
          INSERT INTO event_attendances (user_id, event_id, status)
          VALUES (?, ?, 'attending')
          ON CONFLICT DO NOTHING
        `).run(uId, ev.id);
      }
    } else {
      const p = db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(existing.id);
      if (p && d.extraPhotos) {
        for (const extraUrl of d.extraPhotos) {
          const hasPhoto = db.prepare('SELECT id FROM profile_photos WHERE profile_id = ? AND photo_url = ?').get(p.id, extraUrl);
          if (!hasPhoto) {
            db.prepare('INSERT INTO profile_photos (profile_id, photo_url, is_primary) VALUES (?, ?, 0)').run(p.id, extraUrl);
          }
        }
      }
    }
  }

  console.log('Seeding complete.');
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(err => {
    console.error('Seeding error:', err);
    process.exit(1);
  });
}

module.exports = { seed };
