require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Puppy Data ────────────────────────────────────────────────────────────────
const puppies = {
  females: [
    {
      name: 'Joy',
      slug: 'joy',
      gender: 'Female',
      age: '11 weeks',
      price: 1100,
      color: 'Golden / Apricot',
      markings: 'Beautiful golden-apricot coat with silky ears',
      status: 'Available',
      description: 'Sweet, gentle, and deeply affectionate. Joy lives up to her name — she lights up every room and is perfect for families with children. She loves cuddles and has been raised with early socialization.',
      image: '/image/females%20(1).jpg',
      healthGuarantees: ['2-year health guarantee', 'Genetic health screening', 'Eye clearances', 'AKC Registration provided', 'Vaccinations & deworming up to date'],
    },
    {
      name: 'Chica',
      slug: 'chica',
      gender: 'Female',
      age: '11 weeks',
      price: 1100,
      color: 'Black & White Parti',
      markings: 'Classic black and white parti-color pattern',
      status: 'Available',
      description: 'Playful, curious, and people-oriented. Chica thrives on attention and bonding. She follows you everywhere and has an endearing personality that makes her impossible to resist.',
      image: '/image/females%20(2).jpg',
      healthGuarantees: ['2-year health guarantee', 'Genetic health screening', 'Eye clearances', 'AKC Registration provided', 'Vaccinations & deworming up to date'],
    },
    {
      name: 'Maple',
      slug: 'maple',
      gender: 'Female',
      age: '11 weeks',
      price: 1200,
      color: 'Light Apricot / Cream',
      markings: 'Stunning light apricot and soft cream coloring',
      status: 'Available',
      description: 'Maple is the calm, wise one of the litter. Intelligent and quick to learn, she is ideal for families who want an easy-going companion who adapts beautifully to any home environment.',
      image: '/image/females%20(3).jpg',
      healthGuarantees: ['2-year health guarantee', 'Genetic health screening', 'Eye & hip clearances', 'AKC Registration provided', 'Vaccinations & deworming up to date'],
    },
  ],
  males: [
    {
      name: 'Dino',
      slug: 'dino',
      gender: 'Male',
      age: '11 weeks',
      price: 1000,
      color: 'Dark Brown / Chocolate',
      markings: 'Rich dark chocolate brown coat',
      status: 'Available',
      description: 'Confident, friendly, and outgoing. Dino is the adventurer of the group — great for active families who enjoy walks, hikes, and outdoor adventures. Full of energy and heart.',
      image: '/image/male%20(1).jpg',
      healthGuarantees: ['2-year health guarantee', 'Genetic health screening', 'Eye & hip clearances', 'AKC Registration provided', 'Vaccinations & deworming up to date'],
    },
    {
      name: 'Romeo',
      slug: 'romeo',
      gender: 'Male',
      age: '11 weeks',
      price: 1000,
      color: 'Golden / Cream',
      markings: 'Stunning golden and cream coat',
      status: 'Available',
      description: 'Loving, playful, and people-focused. Romeo is very affectionate and social — he adores being held and will melt your heart from day one. A true companion dog through and through.',
      image: '/image/male%20(2).jpg',
      healthGuarantees: ['2-year health guarantee', 'Genetic health screening', 'Eye & hip clearances', 'AKC Registration provided', 'Vaccinations & deworming up to date'],
    },
    {
      name: 'Rio',
      slug: 'rio',
      gender: 'Male',
      age: '11 weeks',
      price: 1000,
      color: 'Buff / Golden',
      markings: 'Warm buff and golden tones',
      status: 'Available',
      description: 'Energetic, fun, and great with kids. Rio is the playful spirit — always ready for a game of fetch or a romp in the yard. He is perfect for families who enjoy an active, cheerful dog.',
      image: '/image/male%20(3).jpg',
      healthGuarantees: ['2-year health guarantee', 'Genetic health screening', 'Eye & hip clearances', 'AKC Registration provided', 'Vaccinations & deworming up to date'],
    },
    {
      name: 'Cooper',
      slug: 'cooper',
      gender: 'Male',
      age: '11 weeks',
      price: 1000,
      color: 'Black & White Parti',
      markings: 'Beautiful black and white parti-color pattern',
      status: 'Available',
      description: 'Smart, eager to please, and wonderfully gentle. Cooper is incredibly trainable and loves learning new tricks. He will grow into a well-mannered, loyal companion that the whole family will adore.',
      image: '/image/male%20(4).jpg',
      healthGuarantees: ['2-year health guarantee', 'Genetic health screening', 'Eye & hip clearances', 'AKC Registration provided', 'Vaccinations & deworming up to date'],
    },
    {
      name: 'Duncan',
      slug: 'duncan',
      gender: 'Male',
      age: '11 weeks',
      price: 1000,
      color: 'Dark Brown',
      markings: 'Beautiful dark brown coat',
      status: 'Available',
      description: 'Calm, sweet, and deeply loyal. Duncan bonds quickly and loves nothing more than curling up beside you after an adventure. He has the classic Cocker Spaniel temperament — gentle yet spirited.',
      image: '/image/male%20(5).jpg',
      healthGuarantees: ['2-year health guarantee', 'Genetic health screening', 'Eye & hip clearances', 'AKC Registration provided', 'Vaccinations & deworming up to date'],
    },
    {
      name: 'Moritz',
      slug: 'moritz',
      gender: 'Male',
      age: '11 weeks',
      price: 1000,
      color: 'Chocolate / Ruby',
      markings: 'Rich chocolate with ruby-toned highlights',
      status: 'Available',
      description: 'Distinguished, affectionate, and wonderfully expressive. Moritz has that undeniable spaniel charm — big soulful eyes, silky ears, and a personality that wins everyone over instantly.',
      image: '/image/male%20(6).jpg',
      healthGuarantees: ['2-year health guarantee', 'Genetic health screening', 'Eye & hip clearances', 'AKC Registration provided', 'Vaccinations & deworming up to date'],
    },
  ],
};

const deliveryOptions = [
  {
    title: 'Road Transport',
    price: '~$170',
    description: 'Safe, regional ground delivery by our trusted transport partners.',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>',
  },
  {
    title: 'Air Cargo',
    price: '~$250',
    description: 'Airline-regulated cargo delivery with climate-controlled compartments.',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/></svg>',
  },
  {
    title: 'Door-to-Door Ground',
    price: '~$320',
    description: 'Personalized door-to-door delivery directly to your home.',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>',
  },
  {
    title: 'Flight Nanny',
    price: '~$600',
    description: 'A professional accompanies your puppy in-cabin the entire flight.',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>',
  },
];

const testimonials = [
  {
    name: 'Sarah M.',
    location: 'New York, NY',
    rating: 5,
    text: 'We brought home Bella (now renamed!) from Golden Ears and she has been an absolute dream. The team was responsive, caring, and made the whole process so smooth. Couldn\'t be happier!',
  },
  {
    name: 'James & Carla T.',
    location: 'Chicago, IL',
    rating: 5,
    text: 'Our boy Cooper arrived healthy, happy, and already socialized. He settled in within hours. The 2-year health guarantee gave us so much peace of mind. Highly recommend!',
  },
  {
    name: 'Priya L.',
    location: 'Toronto, ON',
    rating: 5,
    text: 'The flight nanny service was exceptional — they sent updates with photos the whole trip. Our puppy arrived calm and comfortable. Golden Ears truly cares about these dogs.',
  },
  {
    name: 'Marcus D.',
    location: 'Los Angeles, CA',
    rating: 5,
    text: 'I was nervous about buying a puppy online, but Golden Ears exceeded every expectation. They answered every question quickly and the puppy documentation was thorough and complete.',
  },
  {
    name: 'Emily & Tom R.',
    location: 'Dallas, TX',
    rating: 5,
    text: 'Our family has never had a Cocker Spaniel before and Golden Ears guided us every step of the way. The breeder support after we brought her home was incredibly helpful!',
  },
  {
    name: 'Chen W.',
    location: 'Vancouver, BC',
    rating: 5,
    text: 'Absolutely wonderful experience from start to finish. The puppy was exactly as described, AKC paperwork was ready on arrival, and the team has stayed in touch to check in on her.',
  },
];

// ─── Blog Data ─────────────────────────────────────────────────────────────────
const blogPosts = [
  {
    slug: 'cocker-spaniel-new-owner-guide',
    title: 'The New Owner\'s Complete Guide to American Cocker Spaniels',
    category: 'Care Guide',
    date: 'June 12, 2025',
    readTime: '6 min read',
    excerpt: 'Bringing home a Cocker Spaniel for the first time? Here\'s everything you need to know — from puppy-proofing your home to the first vet visit and beyond.',
    image: 'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=900&auto=format&fit=crop&q=80',
    imageAlt: 'Cocker Spaniel puppy sitting on grass',
    content: [
      { type: 'p', text: 'Bringing a Cocker Spaniel puppy home is one of life\'s greatest joys — but it also comes with responsibilities. The first few weeks set the tone for your dog\'s entire life, so preparation is everything.' },
      { type: 'h2', text: 'Puppy-Proof Your Home First' },
      { type: 'p', text: 'Before your puppy arrives, get down on their level and look for hazards: loose cables, small objects, toxic plants (like lilies, aloe, and sago palm), and gaps behind appliances. Use baby gates to restrict access to stairs until they\'re old enough to navigate them safely.' },
      { type: 'tip', text: '🐾 Tip: Cocker Spaniels have long ears that drag close to the ground — keep cleaning supplies locked away as they love to sniff everything.' },
      { type: 'h2', text: 'The First 48 Hours' },
      { type: 'p', text: 'When your puppy arrives, give them time to explore their new space at their own pace. Don\'t overwhelm them with visitors right away. Set up a crate in a quiet corner of the main living area — this becomes their safe den. Leave a worn piece of your clothing inside so they associate it with your scent.' },
      { type: 'h2', text: 'Feeding Schedule' },
      { type: 'p', text: 'Cocker Spaniel puppies aged 8–12 weeks need three small meals per day of high-quality puppy kibble. Transition to twice daily at 6 months. Always keep fresh water available, and avoid feeding from the bowl at a height that would cause their ears to drag into the food (use a spaniel-specific bowl with ear guards).' },
      { type: 'h2', text: 'Vet Visit Within 3 Days' },
      { type: 'p', text: 'Schedule a vet appointment within 72 hours of bringing your puppy home. Bring all health records we\'ve provided. Your vet will do a full wellness check, confirm vaccinations, and discuss the deworming schedule. This visit also establishes your puppy\'s baseline health record.' },
      { type: 'h2', text: 'Socialization is Critical' },
      { type: 'p', text: 'The socialization window for puppies is 3–16 weeks old. Between 8–16 weeks (when most puppies come home), every new experience becomes a template for how they see the world. Safely expose them to different people, sounds, textures, and vaccinated dogs. Positive early experiences prevent fearfulness and anxiety later in life.' },
      { type: 'tip', text: '💛 Golden Ears Tip: Our puppies are raised in a home environment with children, sounds from TVs and appliances, and regular handling — so they arrive partially socialized. Build on this by continuing exposure.' },
    ],
  },
  {
    slug: 'why-cocker-spaniels-perfect-family-dogs',
    title: '5 Reasons Cocker Spaniels Are Perfect Family Dogs',
    category: 'Breed Info',
    date: 'May 28, 2025',
    readTime: '4 min read',
    excerpt: 'Looking for a dog that loves children, adapts to apartment life, and brings joy every single day? The American Cocker Spaniel checks every box.',
    image: 'https://images.unsplash.com/photo-1591856419156-3979c9edd30f?w=900&auto=format&fit=crop&q=80',
    imageAlt: 'Happy Cocker Spaniel with family outdoors',
    content: [
      { type: 'p', text: 'It\'s no accident that the American Cocker Spaniel was the most popular dog breed in the United States for over a decade. Their combination of beauty, intelligence, and affection makes them almost impossible to resist — especially for families.' },
      { type: 'h2', text: '1. They\'re Naturally Gentle with Kids' },
      { type: 'p', text: 'Cocker Spaniels have a reputation for being patient and gentle, even with toddlers. Unlike some breeds that become stressed by unpredictable children, a well-socialized Cocker Spaniel tends to roll with the chaos — and even enjoy it. Their size (20–30 lbs) is also ideal: big enough to play fetch, small enough not to knock children over.' },
      { type: 'h2', text: '2. They Adapt to Any Home' },
      { type: 'p', text: 'Whether you live in a Manhattan apartment or on a rural acreage, Cocker Spaniels adapt remarkably well. They need moderate daily exercise — a 30-minute walk plus playtime is usually enough — but they\'re happy to spend the rest of the day curled up beside you on the sofa.' },
      { type: 'h2', text: '3. They\'re Exceptionally Trainable' },
      { type: 'p', text: 'Ranked 20th most intelligent dog breed by Dr. Stanley Coren, Cocker Spaniels pick up commands quickly and respond beautifully to positive reinforcement. Many excel at obedience, agility, and even therapy dog work. Their eagerness to please makes training a genuinely enjoyable experience.' },
      { type: 'h2', text: '4. They Form Deep, Lasting Bonds' },
      { type: 'p', text: 'Cocker Spaniels are famously devoted to their families. They want to be wherever you are — in the kitchen while you cook, at your feet while you work, on the bed while you sleep. This loyalty makes them exceptional emotional companions, particularly for children who benefit from a consistent furry friend.' },
      { type: 'h2', text: '5. They\'re Low-Aggression Dogs' },
      { type: 'p', text: 'With proper socialization, American Cocker Spaniels score very low on aggression measures compared to other breeds. They typically get on well with other dogs, cats, and strangers — making them ideal in busy social households where the door is always opening.' },
      { type: 'tip', text: '🐾 Looking for your family\'s perfect companion? Browse our available puppies — males and females in multiple beautiful colors, all health-tested and ready to come home.' },
    ],
  },
  {
    slug: 'cocker-spaniel-grooming-tips',
    title: 'Grooming Your Cocker Spaniel: Expert Tips from Our Breeders',
    category: 'Grooming',
    date: 'May 5, 2025',
    readTime: '5 min read',
    excerpt: 'The Cocker Spaniel\'s silky coat is one of its most distinctive features — and with the right routine, it\'s easier to maintain than you might think.',
    image: 'https://images.unsplash.com/photo-1754816969541-d56e7d263dd7?w=900&auto=format&fit=crop&q=80',
    imageAlt: 'Golden Cocker Spaniel puppy',
    content: [
      { type: 'p', text: 'One of the first things people notice about a Cocker Spaniel is their stunning, silky coat. Those flowing ears and feathered legs are part of the breed\'s charm — but they do require a consistent grooming routine to stay healthy and tangle-free.' },
      { type: 'h2', text: 'How Often Should You Brush?' },
      { type: 'p', text: 'Aim to brush your Cocker Spaniel at least 3–4 times per week, and daily if they spend a lot of time outdoors. Use a slicker brush for the body coat and a metal comb (with both wide and narrow teeth) to work through the feathering on the ears, legs, and belly. Always brush before bathing — wet tangles become permanent mats.' },
      { type: 'tip', text: '🐾 Tip: Work in sections and hold the coat at the root to avoid pulling on your dog\'s skin. Make grooming sessions short and positive — keep treats nearby.' },
      { type: 'h2', text: 'Professional Grooming Schedule' },
      { type: 'p', text: 'Most Cocker Spaniels need professional grooming every 6–8 weeks. A groomer will trim and shape the coat, clean around the eyes, pluck the ear canal (important for preventing infections in drop-eared breeds), and trim the nails. Ask for a "puppy cut" if you prefer a shorter, lower-maintenance style.' },
      { type: 'h2', text: 'Ear Care is Critical' },
      { type: 'p', text: 'Cocker Spaniels\' long, floppy ears restrict airflow, making them prone to ear infections. Check ears weekly for redness, odor, or dark discharge. Clean with a vet-approved ear cleaner and cotton balls — never cotton swabs inside the canal. If you notice your dog shaking their head frequently or scratching at their ears, see your vet.' },
      { type: 'h2', text: 'Bathing' },
      { type: 'p', text: 'Bathe every 3–4 weeks using a gentle dog shampoo formulated for long coats. Follow with a conditioning rinse to keep the coat soft and manageable. Dry thoroughly with a warm dryer set to low heat, brushing as you go — this prevents the coat from drying wavy or matted.' },
      { type: 'h2', text: 'Starting Young' },
      { type: 'p', text: 'The secret to a well-groomed adult Cocker Spaniel is starting young. Begin handling your puppy\'s paws, ears, and mouth from day one. Introduce the brush gently during play. The earlier grooming becomes a routine, the more cooperative your dog will be throughout their life.' },
    ],
  },
  {
    slug: 'cocker-spaniel-health-guide',
    title: 'Cocker Spaniel Health: What Every Owner Should Know',
    category: 'Health',
    date: 'April 18, 2025',
    readTime: '5 min read',
    excerpt: 'A healthy Cocker Spaniel is a happy one. Learn about common health considerations, what to watch for, and how our 2-year guarantee protects your family.',
    image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=900&auto=format&fit=crop&q=80',
    imageAlt: 'Cocker Spaniel at veterinary checkup',
    content: [
      { type: 'p', text: 'American Cocker Spaniels are generally healthy, long-lived dogs — many reach 14–16 years with proper care. However, like all breeds, they have some health considerations that every responsible owner should understand.' },
      { type: 'h2', text: 'Eye Health' },
      { type: 'p', text: 'Cocker Spaniels are predisposed to certain eye conditions including progressive retinal atrophy (PRA) and cataracts. This is why we require CAER (Companion Animal Eye Registry) eye clearances on all our parent dogs. Annual eye exams by a veterinary ophthalmologist are recommended for breeding dogs and encouraged for pets.' },
      { type: 'h2', text: 'Hip Dysplasia' },
      { type: 'p', text: 'Hip dysplasia can occur in Cockers, though it\'s less prevalent than in larger breeds. Our parent dogs receive OFA hip evaluations before breeding. Keeping your dog at a healthy weight and providing low-impact exercise are the best preventive measures.' },
      { type: 'h2', text: 'Ear Infections' },
      { type: 'p', text: 'The most common health issue in Cocker Spaniels is ear infections, due to the anatomy of their long, floppy ears. Regular ear cleaning, keeping ears dry after bathing, and prompt vet attention at the first sign of infection will keep this manageable.' },
      { type: 'tip', text: '🛡️ All Golden Ears puppies come with a comprehensive 2-year health guarantee covering genetic conditions. Our parent dogs are OFA-certified for hips, heart, and eyes before any breeding takes place.' },
      { type: 'h2', text: 'Vaccination Schedule' },
      { type: 'p', text: 'Your puppy leaves us current on age-appropriate vaccinations. Typically, puppies need booster shots at 12 and 16 weeks for distemper, parvovirus, and adenovirus. Rabies vaccine is given at 16 weeks or per your local requirements. Annual or triennial boosters maintain immunity throughout adulthood.' },
      { type: 'h2', text: 'Preventive Care Saves Money' },
      { type: 'p', text: 'The single best investment in your Cocker Spaniel\'s health is consistent preventive care: annual vet exams, parasite prevention (heartworm, flea, tick), dental cleanings, and maintaining a healthy weight. Dogs who receive regular veterinary care live significantly longer and healthier lives.' },
    ],
  },
];

// ─── Location Data ──────────────────────────────────────────────────────────────
const locations = [
  {
    slug: 'new-york',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    icon: '🗽',
    airports: ['JFK', 'LaGuardia (LGA)', 'Newark (EWR)'],
    description: 'We deliver Cocker Spaniel puppies to New York City and the surrounding area — Manhattan, Brooklyn, Queens, the Bronx, and Long Island.',
    deliveryNote: 'Our flight nannies fly directly into JFK or LaGuardia. You\'ll receive photos and updates throughout the entire journey.',
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=900&auto=format&fit=crop&q=80',
    imageAlt: 'Cocker Spaniel puppy in New York',
    testimonial: { name: 'Sarah M.', text: 'Golden Ears delivered our puppy right to our Brooklyn apartment. The flight nanny was incredible — she sent photos from the airport!', rating: 5 },
  },
  {
    slug: 'los-angeles',
    city: 'Los Angeles',
    state: 'CA',
    country: 'USA',
    icon: '🌴',
    airports: ['LAX', 'Burbank (BUR)', 'Long Beach (LGB)'],
    description: 'Cocker Spaniel puppies available for delivery across the Los Angeles metro — LA, Pasadena, Long Beach, Santa Monica, and the San Fernando Valley.',
    deliveryNote: 'We fly into LAX with our flight nanny service. Road transport is also available for nearby regions in Southern California.',
    image: 'https://images.unsplash.com/photo-1561567066-1c251fb704d1?w=900&auto=format&fit=crop&q=80',
    imageAlt: 'Cocker Spaniel puppy in Los Angeles',
    testimonial: { name: 'Marcus D.', text: 'Couldn\'t believe how smooth the process was from Georgia to LA. Puppy arrived healthy, happy, and calm. Golden Ears is the real deal.', rating: 5 },
  },
  {
    slug: 'chicago',
    city: 'Chicago',
    state: 'IL',
    country: 'USA',
    icon: '🏙️',
    airports: ["O'Hare (ORD)", 'Midway (MDW)'],
    description: 'Bringing a Golden Ears Cocker Spaniel to Chicago, Naperville, Evanston, Oak Park, or anywhere in the greater Chicagoland area is easy with our delivery options.',
    deliveryNote: 'We fly into O\'Hare (ORD) and Midway (MDW). Door-to-door ground transport is also available across Illinois.',
    image: 'https://images.unsplash.com/photo-1618772466570-19c26ad88094?w=900&auto=format&fit=crop&q=80',
    imageAlt: 'Cocker Spaniel puppy in Chicago',
    testimonial: { name: 'James & Carla T.', text: 'Cooper arrived at O\'Hare calm and happy. The whole process — from inquiry to pickup — was professional and caring.', rating: 5 },
  },
  {
    slug: 'dallas',
    city: 'Dallas',
    state: 'TX',
    country: 'USA',
    icon: '⭐',
    airports: ['Dallas/Fort Worth (DFW)', 'Love Field (DAL)'],
    description: 'We serve Dallas, Fort Worth, Plano, Frisco, Allen, McKinney, and the entire DFW metroplex with safe, reliable Cocker Spaniel puppy delivery.',
    deliveryNote: 'Flight nanny service into DFW and Love Field. Road transport available for families across North Texas.',
    image: 'https://images.unsplash.com/photo-1679519663909-834dbab30563?w=900&auto=format&fit=crop&q=80',
    imageAlt: 'Cocker Spaniel puppy in Dallas Texas',
    testimonial: { name: 'Emily & Tom R.', text: 'Our first Cocker Spaniel and Golden Ears made it so easy. They guided us every step — and she\'s been perfect with our kids.', rating: 5 },
  },
  {
    slug: 'miami',
    city: 'Miami',
    state: 'FL',
    country: 'USA',
    icon: '🌊',
    airports: ['Miami International (MIA)', 'Fort Lauderdale (FLL)'],
    description: 'Delivering Cocker Spaniel puppies to Miami, Fort Lauderdale, Boca Raton, West Palm Beach, and South Florida families who deserve the best.',
    deliveryNote: 'We offer flight nanny service into MIA and FLL. Air cargo is also available as a cost-effective alternative.',
    image: 'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=900&auto=format&fit=crop&q=80',
    imageAlt: 'Cocker Spaniel puppy in Miami Florida',
    testimonial: { name: 'Diana R.', text: 'Received my girl in Miami — she was in perfect health, exactly as described. The team stayed in touch throughout the whole delivery.', rating: 5 },
  },
  {
    slug: 'toronto',
    city: 'Toronto',
    state: 'ON',
    country: 'Canada',
    icon: '🍁',
    airports: ['Pearson International (YYZ)', 'Billy Bishop (YTZ)'],
    description: 'We proudly deliver to families across Toronto, Mississauga, Brampton, Markham, and the Greater Toronto Area. Canadian families love Golden Ears puppies.',
    deliveryNote: 'Our flight nannies fly into Pearson (YYZ). We handle all cross-border documentation and health certificates for Canadian buyers.',
    image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=900&auto=format&fit=crop&q=80',
    imageAlt: 'Cocker Spaniel puppy arriving in Toronto Canada',
    testimonial: { name: 'Priya L.', text: 'The flight nanny sent photos the whole way from Georgia to Toronto Pearson. Our puppy was calm and happy — best experience ever.', rating: 5 },
  },
];

// ─── Mailer ────────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ─── Express Setup ─────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
// Serve the image folder (contains puppy photos)
app.use('/image', express.static(path.join(__dirname, 'image')));

// Rate limiter for contact form
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many requests from this IP, please try again in 15 minutes.',
});

// ─── Routes ────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  const featuredFemales = puppies.females.slice(0, 2);
  const featuredMales = puppies.males.slice(0, 2);
  res.render('index', {
    page: 'home',
    title: 'Golden Ears Spaniels | AKC Cocker Spaniel Puppies for Sale',
    description: 'Premier AKC Cocker Spaniel breeder since 2019. Home-raised, health-tested puppies available across the USA & Canada. 2-year health guarantee.',
    featuredFemales,
    featuredMales,
    deliveryOptions,
    testimonials,
  });
});

app.get('/available-puppies', (req, res) => {
  res.render('puppies', {
    page: 'puppies',
    title: 'Available Cocker Spaniel Puppies | Golden Ears Spaniels',
    description: 'Browse our available AKC Cocker Spaniel puppies. Males and females, multiple colors, all health-tested with a 2-year guarantee.',
    females: puppies.females,
    males: puppies.males,
  });
});

app.get('/puppies/:slug', (req, res) => {
  const all = [...puppies.females, ...puppies.males];
  const puppy = all.find(p => p.slug === req.params.slug);
  if (!puppy) return res.redirect('/available-puppies');
  res.render('puppy-detail', {
    page: 'puppies',
    title: `${puppy.name} – ${puppy.color} Cocker Spaniel Puppy | Golden Ears Spaniels`,
    description: puppy.description,
    puppy,
    deliveryOptions,
  });
});

app.get('/about', (req, res) => {
  res.render('about', {
    page: 'about',
    title: 'About Us | Golden Ears Spaniels – AKC Cocker Spaniel Breeders',
    description: 'Learn about Golden Ears Spaniels — a family-owned AKC breeder dedicated to raising healthy, happy Cocker Spaniel puppies since 2019.',
  });
});

app.get('/contact', (req, res) => {
  const allPuppies = [...puppies.females, ...puppies.males];
  res.render('contact', {
    page: 'contact',
    title: 'Contact Us | Golden Ears Spaniels',
    description: 'Get in touch to reserve a puppy or ask questions. We respond quickly and with care.',
    allPuppies,
    preSelected: req.query.puppy || '',
    success: false,
    error: false,
  });
});

app.post('/contact', contactLimiter, async (req, res) => {
  const allPuppies = [...puppies.females, ...puppies.males];
  const { firstName, lastName, email, phone, city, state, puppyOfInterest, message, howHeard } = req.body;

  // Basic validation
  if (!firstName || !email || !puppyOfInterest || !message) {
    return res.render('contact', {
      page: 'contact',
      title: 'Contact Us | Golden Ears Spaniels',
      description: 'Get in touch to reserve a puppy or ask questions.',
      allPuppies,
      preSelected: puppyOfInterest || '',
      success: false,
      error: 'Please fill in all required fields.',
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@goldenearsspaniels.com';

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #2B2B2B; background: #F7F2E9; margin: 0; padding: 20px; }
    .card { background: #fff; border-radius: 12px; padding: 30px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 16px rgba(90,70,52,0.15); }
    h1 { color: #5A4634; font-size: 22px; margin-bottom: 8px; }
    .badge { display: inline-block; background: #C9A86A; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 13px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; }
    tr:nth-child(even) td { background: #F7F2E9; }
    td { padding: 10px 12px; font-size: 14px; border-bottom: 1px solid #E8DCC3; }
    td:first-child { font-weight: bold; color: #5A4634; width: 35%; }
    .message-box { background: #F7F2E9; border-left: 4px solid #C9A86A; padding: 14px; border-radius: 6px; margin-top: 20px; font-size: 14px; line-height: 1.6; }
    .footer { text-align: center; font-size: 12px; color: #b08d55; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🐾 New Puppy Inquiry</h1>
    <span class="badge">Golden Ears Spaniels</span>
    <table>
      <tr><td>Name</td><td>${firstName} ${lastName || ''}</td></tr>
      <tr><td>Email</td><td><a href="mailto:${email}">${email}</a></td></tr>
      <tr><td>Phone</td><td>${phone || 'Not provided'}</td></tr>
      <tr><td>Location</td><td>${city || ''}${city && state ? ', ' : ''}${state || ''}</td></tr>
      <tr><td>Puppy of Interest</td><td><strong>${puppyOfInterest}</strong></td></tr>
      <tr><td>How They Heard</td><td>${howHeard || 'Not specified'}</td></tr>
    </table>
    <div class="message-box">
      <strong>Message:</strong><br><br>
      ${message.replace(/\n/g, '<br>')}
    </div>
    <div class="footer">Golden Ears Spaniels — goldenearsspaniels.com</div>
  </div>
</body>
</html>
  `;

  try {
    await transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'Golden Ears Spaniels'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to: adminEmail,
      replyTo: email,
      subject: `🐾 New Inquiry: ${puppyOfInterest} — ${firstName} ${lastName || ''}`,
      html: htmlBody,
    });

    // Auto-reply to the sender
    await transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'Golden Ears Spaniels'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to: email,
      subject: `We received your inquiry about ${puppyOfInterest} 🐾`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #2B2B2B; background: #F7F2E9; margin: 0; padding: 20px; }
    .card { background: #fff; border-radius: 12px; padding: 30px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 16px rgba(90,70,52,0.15); }
    h1 { color: #5A4634; }
    p { line-height: 1.7; }
    .highlight { color: #C9A86A; font-weight: bold; }
    .footer { text-align: center; font-size: 12px; color: #b08d55; margin-top: 24px; border-top: 1px solid #E8DCC3; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Thank you, ${firstName}! 🐾</h1>
    <p>We've received your inquiry about <span class="highlight">${puppyOfInterest}</span> and will get back to you within <strong>24 hours</strong>.</p>
    <p>In the meantime, feel free to browse our <a href="https://goldenearsspaniels.com/available-puppies" style="color:#C9A86A;">available puppies</a> or give us a call if you have urgent questions.</p>
    <p>We look forward to helping you find your perfect companion.</p>
    <p>Warmly,<br><strong>The Golden Ears Spaniels Team</strong></p>
    <div class="footer">Golden Ears Spaniels — AKC Cocker Spaniel Breeders Since 2019</div>
  </div>
</body>
</html>
      `,
    });

    res.render('contact', {
      page: 'contact',
      title: 'Contact Us | Golden Ears Spaniels',
      description: 'Get in touch to reserve a puppy or ask questions.',
      allPuppies,
      preSelected: '',
      success: true,
      error: false,
    });
  } catch (err) {
    console.error('Email error:', err);
    res.render('contact', {
      page: 'contact',
      title: 'Contact Us | Golden Ears Spaniels',
      description: 'Get in touch to reserve a puppy or ask questions.',
      allPuppies,
      preSelected: puppyOfInterest || '',
      success: false,
      error: 'Sorry, something went wrong. Please try again or email us directly.',
    });
  }
});

// ─── Blog Routes ───────────────────────────────────────────────────────────────
app.get('/blog', (req, res) => {
  res.render('blog', {
    page: 'blog',
    title: 'Blog | Golden Ears Spaniels — Cocker Spaniel Tips & Guides',
    description: 'Expert advice on Cocker Spaniel care, grooming, training, and health from the breeders at Golden Ears Spaniels.',
    posts: blogPosts,
  });
});

app.get('/blog/:slug', (req, res) => {
  const post = blogPosts.find(p => p.slug === req.params.slug);
  if (!post) return res.redirect('/blog');
  const others = blogPosts.filter(p => p.slug !== post.slug).slice(0, 3);
  res.render('blog-post', {
    page: 'blog',
    title: `${post.title} | Golden Ears Spaniels`,
    description: post.excerpt,
    post,
    others,
  });
});

// ─── Location Routes ────────────────────────────────────────────────────────────
app.get('/locations', (req, res) => {
  res.render('locations', {
    page: 'locations',
    title: 'Cocker Spaniel Puppies by Location | Golden Ears Spaniels',
    description: 'Golden Ears delivers AKC Cocker Spaniel puppies to New York, Los Angeles, Chicago, Dallas, Miami, Toronto, and across the USA & Canada.',
    locations,
  });
});

app.get('/locations/:slug', (req, res) => {
  const loc = locations.find(l => l.slug === req.params.slug);
  if (!loc) return res.redirect('/locations');
  const others = locations.filter(l => l.slug !== loc.slug);
  const allPuppies = [...puppies.females, ...puppies.males];
  res.render('location', {
    page: 'locations',
    title: `Cocker Spaniel Puppies in ${loc.city}, ${loc.state} | Golden Ears Spaniels`,
    description: loc.description,
    loc,
    others,
    allPuppies,
    deliveryOptions,
  });
});

app.get('/faq', (req, res) => {
  res.render('faq', {
    page: 'faq',
    title: 'FAQ – Golden Ears Spaniels | Common Questions Answered',
    description: 'Answers to the most common questions about adopting a Golden Ears Cocker Spaniel puppy — deposits, health guarantees, delivery, and more.',
  });
});

// ─── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🐾 Golden Ears Spaniels running at http://localhost:${PORT}\n`);
});
