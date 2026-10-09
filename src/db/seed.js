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
      bio: 'Lifelong Garba lover! Attending GMDC Mega ground and United Way Vadodara. Looking for an energetic partner to sync Dodhiya steps.',
      hobbies: 'Chaniya Choli design, Folk Singing, Dhol beats',
      connectionTypes: ['partner', 'friendship'],
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
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
      bio: 'United Way regular for 7 years. Ready with traditional Kediya. Need a dedicated partner or group circle for all 9 nights.',
      hobbies: 'Fitness, Photography, Folk Raas',
      connectionTypes: ['partner', 'group'],
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80'
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
      bio: 'Excited for Sarsana Garba in Surat! Love vibrant chaniyas, energetic music, and meeting friendly dancers.',
      hobbies: 'Dance choreography, Coffee, Dandiya',
      connectionTypes: ['partner', 'friendship', 'dating'],
      photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80'
    },
    {
      email: 'harsh.desai@example.com',
      displayName: 'Harsh Desai',
      dob: '1998-02-28',
      age: 28,
      city: 'Mumbai',
      garbaExperience: 'intermediate',
      danceStyle: 'Kora Kendra Dandiya, 3-Taali',
      preferredLanguage: 'Hindi, Gujarati, English',
      bio: 'Borivali resident heading to Kora Kendra grounds. Looking for a fun dance partner to groove together till midnight.',
      hobbies: 'Live music, Food walks, Badminton',
      connectionTypes: ['partner', 'dating'],
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80'
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
      bio: 'Kathiyawadi Heech expert. Love high-energy dhol and fast-paced circles. Join my circle or be my Garba partner!',
      hobbies: 'Traditional Art, Folk Dance, Dholak',
      connectionTypes: ['partner', 'group', 'friendship'],
      photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80'
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

      // Attach attendance to an event
      const ev = db.prepare('SELECT id FROM events WHERE city = ? LIMIT 1').get(d.city);
      if (ev) {
        db.prepare(`
          INSERT INTO event_attendances (user_id, event_id, status)
          VALUES (?, ?, 'attending')
          ON CONFLICT DO NOTHING
        `).run(uId, ev.id);
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
