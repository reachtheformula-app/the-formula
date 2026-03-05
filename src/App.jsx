import React, { useState, useEffect, useRef } from 'react';
import { Calendar, BookOpen, MessageSquare, TrendingUp, Plus, ChevronRight, ChevronLeft, Clock, Music, Book, Sun, Edit3, Send, Sparkles, Users, Trash2, X, Printer, Copy, AlertCircle, Globe, Star, Lightbulb, Search, Filter, Camera, Loader, ChevronDown, ChevronUp, Settings, LogOut, User, Home, Puzzle, CreditCard, Crown, Shield, Check, Lock } from 'lucide-react';

const App = () => {
  // Auth state — Netlify Identity
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  // Subscription state
  const [subscription, setSubscription] = useState({ tier: 'none', status: 'inactive', isAgency: false, loading: true });
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState(null);

  // Onboarding state
  const [onboardingComplete, setOnboardingComplete] = useState(null);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingChildren, setOnboardingChildren] = useState([{ name: '', birthday: '', ageRange: '', inputType: 'range' }]);
  const [onboardingGoals, setOnboardingGoals] = useState([]);
  const [onboardingSaving, setOnboardingSaving] = useState(false);

  // App state
  const [view, setView] = useState('dashboard');
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [letter, setLetter] = useState('');
  const [letterNotes, setLetterNotes] = useState('');
  const [customWeeks, setCustomWeeks] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [loadingWeeks, setLoadingWeeks] = useState(true);
  const [pendingWeekId, setPendingWeekId] = useState(null);
  const [children, setChildren] = useState([]);
  const [logs, setLogs] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [showChildForm, setShowChildForm] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [editingChild, setEditingChild] = useState(null);
  const [editingLog, setEditingLog] = useState(null);
  const [childForm, setChildForm] = useState({ name: '', age: '', birthday: '', allergies: '', parentName: '', parentEmail: '', parentPhone: '', notes: '', gender: '' });
  const [logForm, setLogForm] = useState({ activity: '', notes: '', childId: '', photos: [] });
  const [logViewMode, setLogViewMode] = useState('today');
  const [milestoneForm, setMilestoneForm] = useState({ title: '', childId: '', notes: '' });
  const [dayIdx, setDayIdx] = useState(0);
  const [expandedCircleTime, setExpandedCircleTime] = useState(false);
  const [expandedDailyRoutine, setExpandedDailyRoutine] = useState(false);
  const [expandedPhilosophy, setExpandedPhilosophy] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [ageFilter, setAgeFilter] = useState('all');
  const [filterSeason, setFilterSeason] = useState('All');
  const [filterFocus, setFilterFocus] = useState('All');
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [languageSetting, setLanguageSetting] = useState('none');
  const [customLanguageName, setCustomLanguageName] = useState('');
  const [isGeneratingWeek, setIsGeneratingWeek] = useState(false);
  const [weekTopic, setWeekTopic] = useState('');
  const [viewOpacity, setViewOpacity] = useState(1);

  // Smooth view transition helper
  const navigateTo = (newView) => {
    if (newView === view) return;
    setViewOpacity(0);
    setTimeout(() => {
      setView(newView);
      setViewOpacity(1);
      window.scrollTo(0, 0);
    }, 150);
  };
  const [weekAgeGroup, setWeekAgeGroup] = useState(['2-3']);
  const toggleAgeGroup = (age) => {
    setWeekAgeGroup(prev => {
      if (prev.includes(age)) {
        // Don't allow deselecting all — keep at least one
        if (prev.length === 1) return prev;
        return prev.filter(a => a !== age);
      }
      return [...prev, age];
    });
  };
  const [billingCycle, setBillingCycle] = useState('monthly');
  const fileInputRef = useRef(null);
  
  const emptyDay = { focusOfDay: '', questionOfDay: '', circleTime: '', songOfDay: { title: '', link: '' }, morningActivities: [''], lunch: '', afternoonActivities: [''], vocabWord: '', teacherTips: [], outsideTime: '', indoorMovement: '' };
  const [newWeek, setNewWeek] = useState({ theme: '', season: '', focus: '', aiGenerated: false, daysToInclude: [1,1,1,1,1,0,0], days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(n => ({ name: n, activities: {...emptyDay} })) });
  
  const c = { cream: '#ecddce', sand: '#d0bfa3', dune: '#c9af97', terra: '#be8a68', bark: '#926f4a', wood: '#774722' };
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // Subscription helpers
  const hasTier = (minTier) => {
    const tiers = { none: 0, gold: 1, agency_gold: 1, platinum: 2, agency_platinum: 2 };
    return (tiers[subscription.tier] || 0) >= (tiers[minTier] || 0);
  };
  const isActive = () => subscription.status === 'active' || subscription.status === 'trialing';
  const hasGold = () => isActive() && hasTier('gold');
  const hasPlatinum = () => isActive() && hasTier('platinum');

  const checkSubscription = async (userId) => {
    setSubscription(prev => ({ ...prev, loading: true }));
    try {
      const resp = await fetch(`/.netlify/functions/check-subscription?userId=${userId}`);
      const data = await resp.json();
      setSubscription({ tier: data.tier || 'none', status: data.status || 'inactive', isAgency: data.isAgency || false, loading: false });
      setSubscriptionChecked(true);
      return data;
    } catch (err) {
      console.error('Failed to check subscription:', err);
      setSubscription(prev => ({ ...prev, loading: false }));
      setSubscriptionChecked(true);
      return null;
    }
  };

  const startCheckout = async (plan) => {
    try {
      // If user already has an active subscription, upgrade instead of new checkout
      if (isActive() && subscription.tier !== 'none') {
        const resp = await fetch('/.netlify/functions/upgrade-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id, newPlan: plan }),
        });
        const data = await resp.json();
        if (data.success) {
          setCheckoutMessage({ type: 'success', text: data.message });
          setSubscription(prev => ({ ...prev, tier: data.tier }));
          setView('dashboard');
        } else {
          alert('Upgrade failed: ' + (data.error || 'Unknown error'));
        }
        return;
      }
      // Otherwise, create a new checkout session
      const resp = await fetch('/.netlify/functions/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, userId: currentUser.id, userEmail: currentUser.email }),
      });
      const data = await resp.json();
      if (data.url) window.location.href = data.url;
      else alert('Failed to create checkout session: ' + (data.error || 'Unknown error'));
    } catch (err) {
      alert('Failed to start checkout: ' + err.message);
    }
  };

  const openCustomerPortal = async () => {
    try {
      const resp = await fetch('/.netlify/functions/manage-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      const data = await resp.json();
      if (data.url) window.location.href = data.url;
      else alert('Could not open billing portal: ' + (data.error || 'Unknown error'));
    } catch (err) {
      alert('Failed to open billing portal: ' + err.message);
    }
  };

  // Handle checkout success/cancel URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get('checkout');
    const tier = params.get('tier');
    if (checkout === 'success') {
      setCheckoutMessage({ type: 'success', text: `Welcome to The Formula ${tier === 'platinum' ? 'Platinum' : 'Gold'}! Your subscription is now active.` });
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      // Re-check subscription after a brief delay (webhook may still be processing)
      if (currentUser) {
        setTimeout(() => checkSubscription(currentUser.id), 2000);
      }
    } else if (checkout === 'canceled') {
      setCheckoutMessage({ type: 'info', text: 'Checkout was canceled. You can try again anytime.' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [currentUser]);

  // Netlify Identity setup
  useEffect(() => {
    const netlifyIdentity = window.netlifyIdentity;
    if (!netlifyIdentity) return;

    const mapUser = (netlifyUser) => {
      if (!netlifyUser) return null;
      
      // Try direct properties first (works on hard refresh / init with stored session)
      if (netlifyUser.id) {
        return {
          id: netlifyUser.id,
          name: netlifyUser.user_metadata?.full_name || netlifyUser.user_metadata?.name || netlifyUser.user_metadata?.preferred_username || netlifyUser.email?.split('@')[0] || 'User',
          email: netlifyUser.email
        };
      }
      
      // Fall back to decoding JWT token (needed after Google OAuth login/redirect)
      const accessToken = netlifyUser.token?.access_token;
      if (accessToken) {
        try {
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          return {
            id: payload.sub,
            name: payload.user_metadata?.full_name || payload.user_metadata?.name || payload.email?.split('@')[0] || 'User',
            email: payload.email
          };
        } catch (e) {
          console.error('Failed to decode JWT:', e);
        }
      }
      
      // Last resort: try netlifyIdentity.currentUser()
      const current = window.netlifyIdentity?.currentUser();
      if (current?.id) {
        return {
          id: current.id,
          name: current.user_metadata?.full_name || current.user_metadata?.name || current.email?.split('@')[0] || 'User',
          email: current.email
        };
      }
      
      return null;
    };

    netlifyIdentity.on('init', (user) => {
      if (user) {
        const mapped = mapUser(user);
        if (mapped) {
          setCurrentUser(mapped);
          setIsAuthenticated(true);
          checkSubscription(mapped.id);
          load(mapped);
        }
      } else {
        setSubscription({ tier: 'none', status: 'inactive', isAgency: false, loading: false });
        setSubscriptionChecked(true);
      }
      setAuthReady(true);
    });

    netlifyIdentity.on('login', (user) => {
      const mapped = mapUser(user);
      if (mapped) {
        setCurrentUser(mapped);
        setSubscription({ tier: 'none', status: 'inactive', isAgency: false, loading: true });
        setSubscriptionChecked(false);
        setIsAuthenticated(true);
        checkSubscription(mapped.id);
        load(mapped);
      }
      netlifyIdentity.close();
    });

    netlifyIdentity.on('logout', () => {
      setCurrentUser(null);
      setIsAuthenticated(false);
      setSubscriptionChecked(false);
      setCustomWeeks([]);
      setChildren([]);
      setLogs([]);
      setMilestones([]);
      setSelectedWeek(null);
      setView('dashboard');
      setCheckoutMessage(null);
      setOnboardingComplete(null);
      setOnboardingStep(1);
      setOnboardingChildren([{ name: '', birthday: '', ageRange: '', inputType: 'range' }]);
      setOnboardingGoals([]);
    });

    netlifyIdentity.init();
  }, []);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  // Fetch curriculum from database
  useEffect(() => {
    fetch('/.netlify/functions/curriculum')
      .then(res => res.json())
      .then(data => { setWeeks(data); setLoadingWeeks(false); })
      .catch(err => { console.error('Failed to load curriculum:', err); setLoadingWeeks(false); });
  }, []);

  // Apply saved week selection once all weeks are loaded
  useEffect(() => {
    if (!pendingWeekId) return;
    const allWeeks = [...weeks, ...customWeeks];
    if (allWeeks.length === 0) return;
    const wId = isNaN(pendingWeekId) ? pendingWeekId : parseInt(pendingWeekId);
    const w = allWeeks.find(x => x.id === wId);
    if (w) { setSelectedWeek(w); setPendingWeekId(null); }
  }, [weeks, customWeeks, pendingWeekId]);

  const handleLogout = () => {
    const netlifyIdentity = window.netlifyIdentity;
    if (netlifyIdentity) {
      netlifyIdentity.logout();
      // Reload to give the identity widget a clean state for next login
      setTimeout(() => window.location.reload(), 300);
    }
  };

  const openLogin = () => {
    const netlifyIdentity = window.netlifyIdentity;
    if (netlifyIdentity) netlifyIdentity.open();
  };

  // Storage functions
  const getStorageKey = (key, user) => {
    const u = user || currentUser;
    return u ? `formula_${u.id}_${key}` : key;
  };
  
  const save = (k, v) => { 
    try { localStorage.setItem(getStorageKey(k), JSON.stringify(v)); } catch (e) { console.error('Save error:', e); }
  };
  
  const load = (user) => {
    const u = user || currentUser;
    if (!u) return;
    // Load custom weeks from DB
    fetch(`/.netlify/functions/user-weeks?userId=${u.id}`)
      .then(res => res.json())
      .then(rows => {
        if (Array.isArray(rows) && rows.length > 0) {
          const dbWeeks = rows.map(r => ({
            id: r.id, theme: r.theme, season: r.season, focus: r.focus, ages: r.age_group,
            isCustom: true, hasRichData: true, teachingPhilosophy: r.teaching_philosophy || '',
            createdAt: r.created_at, aiGenerated: r.ai_generated || false,
            days: typeof r.days === 'string' ? JSON.parse(r.days) : r.days,
            activities: (() => {
              const days = typeof r.days === 'string' ? JSON.parse(r.days) : r.days;
              const d1 = days[0] || {};
              return { circleTime: d1.circleTime || '', songOfDay: { title: d1.songTitle || '', link: (d1.songLink && d1.songLink.startsWith('http')) ? d1.songLink : '' }, morningActivity: (d1.learningStations || [])[0] || '', lunch: d1.lunch || '', afternoonActivity: (d1.learningStations || [])[1] || '' };
            })()
          }));
          setCustomWeeks(dbWeeks);
        }
      })
      .catch(err => console.error('Failed to load custom weeks:', err));

    // Load children from DB
    fetch(`/.netlify/functions/user-data?type=children&userId=${u.id}`)
      .then(res => res.json())
      .then(rows => {
        if (Array.isArray(rows)) {
          setChildren(rows.map(r => ({
            id: r.id, name: r.name, age: r.age || '', birthday: r.birthday || '',
            allergies: r.allergies || '', parentName: r.parent_name || '',
            parentEmail: r.parent_email || '', parentPhone: r.parent_phone || '', notes: r.notes || '',
            gender: r.gender || ''
          })));
        }
      })
      .catch(err => console.error('Failed to load children:', err));

    // Load milestones from DB
    fetch(`/.netlify/functions/user-data?type=milestones&userId=${u.id}`)
      .then(res => res.json())
      .then(rows => {
        if (Array.isArray(rows)) {
          setMilestones(rows.map(r => ({
            id: r.id, title: r.title, childId: r.child_id ? String(r.child_id) : '',
            notes: r.notes || '', date: r.date
          })));
        }
      })
      .catch(err => console.error('Failed to load milestones:', err));

    // Load activity logs from DB
    fetch(`/.netlify/functions/user-data?type=logs&userId=${u.id}`)
      .then(res => res.json())
      .then(rows => {
        if (Array.isArray(rows)) {
          setLogs(rows.map(r => ({
            id: r.id, activity: r.activity, notes: r.notes || '',
            childId: r.child_id || '', timestamp: r.timestamp,
            photos: typeof r.photos === 'string' ? JSON.parse(r.photos) : (r.photos || [])
          })));
        }
      })
      .catch(err => console.error('Failed to load activity logs:', err));

    // Load settings from DB
    fetch(`/.netlify/functions/user-data?type=settings&userId=${u.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.selected_week_id) {
          setPendingWeekId(data.selected_week_id);
        }
        setLanguageSetting(data.language || 'none');
        setCustomLanguageName(data.custom_language_name || '');
        setOnboardingComplete(data.onboarding_complete || false);
      })
      .catch(err => { console.error('Failed to load settings:', err); setOnboardingComplete(false); });
  };

  // ========== INFANT ROUTINES ==========
  const infantRoutine0to6 = {
    label: "Daily Rhythm",
    items: [
      { title: "Eat, Play, Sleep Cycle", description: "Follow the natural rhythm: feed when baby wakes, enjoy a brief play session while they're alert, then put them down for a nap at the first signs of tiredness (yawning, eye rubbing, looking away). This cycle repeats throughout the day and helps prevent overtiredness. At this age, awake windows are short — typically 45 minutes to 1.5 hours — so keep play sessions brief and watch for those sleepy cues." },
      { title: "Daily Tummy Time", description: "Tummy time builds the neck, shoulder, and core strength that powers every future motor milestone. Aim for 3–5 minutes at a time, 2–3 times a day, gradually building to longer sessions as baby tolerates it. Get down on the floor face-to-face — your face is the best motivation. If baby resists, try tummy time on your chest or with a small towel roll under their arms for support. Every second counts, even if it's just 30 seconds at first." },
      { title: "Active Playtime", description: "During alert, happy awake windows, engage baby with simple play: hold a high-contrast toy for them to track with their eyes, sing a song while making eye contact, offer an unbreakable mirror for them to gaze at, or let them explore a safe fabric with different textures. For 0–3 months, focus on skin-to-skin, gentle talking, and singing during diaper changes. By 3–6 months, baby is more alert and ready for rattles, reaching games, and looking at board books together." },
      { title: "Floor Time & Free Movement", description: "Give baby time on a clean, safe surface — a play mat or blanket on the floor — to move freely without being held, bounced, or contained. This is where kicking, reaching, rolling, and body discovery happen naturally. Place a few safe objects within reach and let baby lead. Narrate what you see: \"Your legs are kicking! Your hand found the ring!\" Free movement on a flat surface is one of the most valuable things you can offer a developing body." },
      { title: "Naptime Routine", description: "A consistent naptime routine helps baby's body recognize that sleep is coming. If you are not the parent, ask the family what their naptime routine looks like and replicate it as closely as possible — babies thrive on consistency, and following the established routine helps them feel safe with any caregiver. If the parent defers to you or there isn't an established routine yet, keep it simple: change diaper, dim the lights, a quiet song or a few pages of a board book, then into their sleep space. Watch for sleepy cues (yawning, eye rubbing, fussiness) and start the routine before baby becomes overtired. What matters most is that the same sequence happens each time — baby's brain learns the pattern: \"These things happen, and then I rest.\"" }
    ]
  };

  const infantRoutine6to12 = {
    label: "Daily Rhythm",
    items: [
      { title: "Active Floor Time", description: "The floor is where the big motor milestones happen — sitting, crawling, pulling to stand, and cruising along furniture. Create a safe, baby-proofed open space and let baby move freely. Place interesting objects just out of reach to encourage movement. Resist the urge to always carry or contain baby — they need time on the ground to figure out how their body works. Narrate their efforts: \"You're reaching for it! You scooted forward! Look how far you went!\"" },
      { title: "Sensory Exploration", description: "Babies this age learn through touching, mouthing, banging, and dumping. Offer safe household items — plastic containers, wooden spoons, whisks, stacking cups, fabric scraps — and let baby explore freely. Fill a small container with large objects and let them practice taking things out and putting them back in. Blow bubbles for baby to track and reach for. Every texture, sound, and weight they encounter is building their understanding of how the world works." },
      { title: "Language & Communication", description: "Talk to your baby constantly — narrate diaper changes, describe what you're making for lunch, name objects as baby reaches for them. Read board books daily, pointing at pictures and pausing to let baby babble back. Sing nursery rhymes with hand motions. Most importantly, practice serve-and-return: when baby babbles, coos, or gestures, respond back. \"You said 'ba ba!' Are you telling me something? I'm listening!\" This back-and-forth is the foundation of language development." },
      { title: "Self-Feeding Practice", description: "As baby begins solid foods (around 6 months, based on pediatric guidance), encourage independence at mealtimes. Offer soft finger foods baby can pick up and bring to their own mouth — this builds fine motor skills, hand-eye coordination, and confidence. It will be messy. That's expected and valuable. Let baby explore food with their hands, practice the pincer grasp with small soft pieces, and experiment with a beginner spoon. Narrate: \"You picked up the banana! It went right to your mouth!\"" },
      { title: "Outings & New Experiences", description: "Take baby out into the world regularly — a walk around the block in the stroller, a trip to the park to feel grass and watch other children, a visit to the library for board books, or even a slow stroll through a grocery store. New sights, sounds, and environments provide rich sensory input that supports brain development. Narrate what you see together: \"Look at that dog! Hear the birds? Feel the breeze!\" These everyday outings are learning experiences in disguise." }
    ]
  };

  const universalDailyRoutine = {
    calendarTime: "Start each day by reviewing the date together. Use a simple wall calendar or draw one on paper. Point to today's date, say the day of the week, the month, and the number. \"Today is Monday, February 18th!\" For younger children, simply point and name. For older preschoolers, ask them to find today's number or count the days so far this month.",
    countingPractice: "Count something real every day — fingers, toes, snack crackers, blocks, steps to the door. Start with counting to 5 for younger toddlers and build up to 10, then 20 for older preschoolers. Use your fingers, touch each object as you count, and make it physical. \"Let's count our jumps! 1... 2... 3...\" The goal is daily exposure, not mastery.",
    daysOfWeek: "Sing or chant the days of the week together. Clap along, stomp along, or make up hand motions. Over time, children will memorize the sequence through repetition and rhythm. Ask: \"What day is it today? What day was yesterday? What day comes tomorrow?\"",
    daysOfWeekSong: "https://www.youtube.com/watch?v=36n93jvjkDs",
    weatherCheck: "Look out the window together and describe what you see. \"Is it sunny or cloudy? Can you see rain? Is it windy — are the trees moving?\" For older children, introduce a simple weather chart where they can mark today's weather with a sticker or drawing. Connect weather to choices: \"It's cold today — what should we wear?\"",
    abcPractice: "Sing the ABC song together, point to letters on a poster or in a book, or play a simple letter recognition game. For younger toddlers, focus on just a few familiar letters (like the first letter of their name). For older preschoolers, practice letter sounds: \"B says buh! What else starts with buh? Ball! Banana! Bear!\""
  };

  // Helper functions
  const getChildName = (id) => children.find(x => x.id === parseInt(id))?.name || 'All';
  const getTodayLogs = () => logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString());
  const getPastLogs = () => {
    const past = logs.filter(l => new Date(l.timestamp).toDateString() !== new Date().toDateString());
    const grouped = {};
    past.forEach(l => {
      const dateKey = new Date(l.timestamp).toDateString();
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(l);
    });
    return Object.entries(grouped).sort((a, b) => new Date(b[0]) - new Date(a[0])).map(([date, items]) => ({
      date,
      label: new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      logs: items.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    }));
  };
  const fmtTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const fmtDate = (ts) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const getLanguageLabel = () => { if (languageSetting === 'none') return null; if (languageSetting === 'french') return 'French'; if (languageSetting === 'spanish') return 'Spanish'; if (languageSetting === 'custom') return customLanguageName || 'Language'; return 'Language'; };
  
  const saveSettings = (partial) => {
    if (!currentUser) return;
    const body = { language: languageSetting, customLanguageName, selectedWeekId: selectedWeek ? String(selectedWeek.id) : null, ...partial };
    fetch(`/.netlify/functions/user-data?type=settings&userId=${currentUser.id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    }).catch(err => console.error('Failed to save settings:', err));
  };

  const saveLanguageSettings = (lang, customName = '') => { setLanguageSetting(lang); setCustomLanguageName(customName); saveSettings({ language: lang, customLanguageName: customName }); };
  // Onboarding helpers
  const addOnboardingChild = () => {
    setOnboardingChildren(prev => [...prev, { name: '', birthday: '', ageRange: '', inputType: 'range' }]);
  };
  const updateOnboardingChild = (index, field, value) => {
    setOnboardingChildren(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };
  const removeOnboardingChild = (index) => {
    if (onboardingChildren.length <= 1) return;
    setOnboardingChildren(prev => prev.filter((_, i) => i !== index));
  };
  const toggleOnboardingGoal = (goal) => {
    setOnboardingGoals(prev => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]);
  };
  const completeOnboarding = async () => {
    setOnboardingSaving(true);
    try {
      const savedChildren = [];
      for (const child of onboardingChildren) {
        if (!child.name.trim()) continue;
        const age = child.inputType === 'range' ? child.ageRange : '';
        const birthday = child.inputType === 'birthday' ? child.birthday : '';
        const resp = await fetch(`/.netlify/functions/user-data?type=children&userId=${currentUser.id}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: child.name, age, birthday })
        });
        const newChild = await resp.json();
        savedChildren.push({ name: child.name, age, birthday, id: newChild.id, allergies: '', parentName: '', parentEmail: '', parentPhone: '', notes: '' });
      }
      setChildren(savedChildren);
      await fetch(`/.netlify/functions/user-data?type=settings&userId=${currentUser.id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboardingComplete: true, goals: onboardingGoals })
      });
      setOnboardingComplete(true);
    } catch (err) {
      console.error('Onboarding save error:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setOnboardingSaving(false);
    }
  };
  const allSeasons = ['All', ...new Set(weeks.map(w => w.season))];
  const allFocusAreas = ['All', ...new Set(weeks.map(w => w.focus))];

  const filteredWeeks = [...weeks, ...customWeeks].filter(w => {
    const matchesSearch = searchTerm === '' || w.theme.toLowerCase().includes(searchTerm.toLowerCase()) || w.focus.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeason = filterSeason === 'All' || w.season === filterSeason || (w.season && w.season.includes(filterSeason));
    const matchesFocus = filterFocus === 'All' || w.focus === filterFocus;
    const matchesAge = ageFilter === 'all' || (w.ages && w.ages.includes(ageFilter));
    return matchesSearch && matchesSeason && matchesFocus && matchesAge;
  });

  const saveChild = async () => {
    if (!childForm.name) return;
    try {
      if (editingChild) {
        // Update existing child
        await fetch(`/.netlify/functions/user-data?type=children&userId=${currentUser.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingChild.id, ...childForm })
        });
        setChildren(prev => prev.map(x => x.id === editingChild.id ? { ...childForm, id: editingChild.id } : x));
      } else {
        // Create new child
        const resp = await fetch(`/.netlify/functions/user-data?type=children&userId=${currentUser.id}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(childForm)
        });
        const newChild = await resp.json();
        setChildren(prev => [...prev, { ...childForm, id: newChild.id }]);
      }
    } catch (err) { console.error('Failed to save child:', err); }
    setChildForm({ name: '', age: '', birthday: '', allergies: '', parentName: '', parentEmail: '', parentPhone: '', notes: '', gender: '' });
    setEditingChild(null); setShowChildForm(false);
  };

  const delChild = async (id) => {
    if (!window.confirm('Are you sure you want to remove this child? This cannot be undone.')) return;
    setChildren(prev => prev.filter(x => x.id !== id));
    try { await fetch(`/.netlify/functions/user-data?type=children&userId=${currentUser.id}&id=${id}`, { method: 'DELETE' }); }
    catch (err) { console.error('Failed to delete child:', err); }
  };

  const handlePhotoUpload = (e) => { const files = Array.from(e.target.files); files.forEach(file => { const reader = new FileReader(); reader.onloadend = () => setLogForm(prev => ({ ...prev, photos: [...(prev.photos || []), { id: Date.now() + Math.random(), data: reader.result, name: file.name }] })); reader.readAsDataURL(file); }); };
  const removePhoto = (photoId) => setLogForm(prev => ({ ...prev, photos: prev.photos.filter(p => p.id !== photoId) }));

  const saveLog = async () => {
    if (!logForm.activity) return;
    try {
      if (editingLog) {
        // Update existing log
        await fetch(`/.netlify/functions/user-data?type=logs&userId=${currentUser.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingLog.id, activity: logForm.activity, notes: logForm.notes, childId: logForm.childId, photos: logForm.photos })
        });
        setLogs(prev => prev.map(l => l.id === editingLog.id ? { ...logForm, id: editingLog.id, timestamp: editingLog.timestamp } : l));
      } else {
        // Create new log
        const timestamp = new Date().toISOString();
        const resp = await fetch(`/.netlify/functions/user-data?type=logs&userId=${currentUser.id}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ activity: logForm.activity, notes: logForm.notes, childId: logForm.childId, photos: logForm.photos, timestamp })
        });
        const newLog = await resp.json();
        setLogs(prev => [{ ...logForm, id: newLog.id, timestamp: newLog.timestamp || timestamp }, ...prev]);
      }
    } catch (err) { console.error('Failed to save log:', err); }
    setLogForm({ activity: '', notes: '', childId: '', photos: [] }); setEditingLog(null); setShowLogForm(false);
  };

  const delLog = async (id) => {
    if (!window.confirm('Delete this activity log?')) return;
    setLogs(prev => prev.filter(l => l.id !== id));
    try { await fetch(`/.netlify/functions/user-data?type=logs&userId=${currentUser.id}&id=${id}`, { method: 'DELETE' }); }
    catch (err) { console.error('Failed to delete log:', err); }
  };

  const saveMilestone = async () => {
    if (!milestoneForm.title) return;
    try {
      const date = new Date().toISOString();
      const resp = await fetch(`/.netlify/functions/user-data?type=milestones&userId=${currentUser.id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: milestoneForm.title, childId: milestoneForm.childId, notes: milestoneForm.notes, date })
      });
      const newMilestone = await resp.json();
      setMilestones(prev => [{ ...milestoneForm, id: newMilestone.id, date: newMilestone.date || date }, ...prev]);
    } catch (err) { console.error('Failed to save milestone:', err); }
    setMilestoneForm({ title: '', childId: '', notes: '' }); setShowMilestoneForm(false);
  };

  const delMilestone = async (id) => {
    if (!window.confirm('Delete this milestone?')) return;
    setMilestones(prev => prev.filter(m => m.id !== id));
    try { await fetch(`/.netlify/functions/user-data?type=milestones&userId=${currentUser.id}&id=${id}`, { method: 'DELETE' }); }
    catch (err) { console.error('Failed to delete milestone:', err); }
  };
  const selectWeek = (w) => { setSelectedWeek(w); setSelectedDay(0); setIsEditMode(false); navigateTo('dailyPlan'); saveSettings({ selectedWeekId: String(w.id) }); };
  const navigateToLetter = () => { const todayIndex = new Date().getDay() - 1; if (todayIndex >= 0 && todayIndex <= 4) setSelectedDay(todayIndex); navigateTo('writeLetter'); };
  const saveCustomWeek = async () => {
    if (!newWeek.theme || !newWeek.season || !newWeek.focus) return;
    const dayNameFull = { 'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday', 'Thu': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday', 'Sun': 'Sunday' };
    const richDays = newWeek.days.filter((_, i) => newWeek.daysToInclude[i]).map(d => ({ name: dayNameFull[d.name] || d.name, frenchWord: d.activities.vocabWord || '', focus: d.activities.focusOfDay || '', qotd: d.activities.questionOfDay || '', circleTime: d.activities.circleTime || '', songTitle: d.activities.songOfDay?.title || '', songLink: d.activities.songOfDay?.link || '', learningStations: [...(d.activities.morningActivities || []), ...(d.activities.afternoonActivities || [])].filter(a => a), teacherTips: d.activities.teacherTips || [], outsideTime: d.activities.outsideTime || '', indoorMovement: d.activities.indoorMovement || '', lunch: d.activities.lunch || '' }));
    try {
      const resp = await fetch('/.netlify/functions/user-weeks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser.id, userEmail: currentUser.email, userName: currentUser.name, theme: newWeek.theme, season: newWeek.season, focus: newWeek.focus, ageGroup: weekAgeGroup.join(','), teachingPhilosophy: newWeek.teachingPhilosophy || '', aiGenerated: newWeek.aiGenerated || false, days: richDays }) });
      const saved = await resp.json();
      const w = { id: saved.id, theme: newWeek.theme, season: newWeek.season, focus: newWeek.focus, ages: weekAgeGroup, isCustom: true, hasRichData: richDays.length > 0, teachingPhilosophy: newWeek.teachingPhilosophy || '', aiGenerated: true, createdAt: saved.created_at || new Date().toISOString(), days: richDays, activities: { circleTime: newWeek.days[0].activities.circleTime, songOfDay: newWeek.days[0].activities.songOfDay, morningActivity: newWeek.days[0].activities.morningActivities.join(', '), lunch: newWeek.days[0].activities.lunch, afternoonActivity: newWeek.days[0].activities.afternoonActivities.join(', ') }};
      setCustomWeeks(prev => [...prev, w]);
    } catch (err) {
      console.error('Failed to save week to database:', err);
      const w = { id: Date.now(), theme: newWeek.theme, season: newWeek.season, focus: newWeek.focus, ages: weekAgeGroup.join(','), isCustom: true, hasRichData: true, teachingPhilosophy: newWeek.teachingPhilosophy || '', aiGenerated: newWeek.aiGenerated || false, createdAt: new Date().toISOString(), days: richDays, activities: { circleTime: newWeek.days[0].activities.circleTime, songOfDay: newWeek.days[0].activities.songOfDay, morningActivity: newWeek.days[0].activities.morningActivities.join(', '), lunch: newWeek.days[0].activities.lunch, afternoonActivity: newWeek.days[0].activities.afternoonActivities.join(', ') }};
      const n = [...customWeeks, w]; setCustomWeeks(n); save('fw', n);
    }
    setNewWeek({ theme: '', season: '', focus: '', aiGenerated: false, daysToInclude: [1,1,1,1,1,0,0], days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(x => ({ name: x, activities: {...emptyDay} })) });
    setDayIdx(0); navigateTo('weeklyThemes');
  };
  const delCustomWeek = async (id) => { if (!window.confirm('Delete this custom week? This cannot be undone.')) return; setCustomWeeks(prev => prev.filter(w => w.id !== id)); try { await fetch(`/.netlify/functions/user-weeks?id=${id}&userId=${currentUser.id}`, { method: 'DELETE' }); } catch (err) { console.error('Failed to delete week from database:', err); } };

  // Inline editing
  const editDayField = (dayIndex, field, value) => { const updated = { ...selectedWeek, days: selectedWeek.days.map((d, i) => i === dayIndex ? { ...d, [field]: value } : d) }; setSelectedWeek(updated); setCustomWeeks(prev => prev.map(w => w.id === updated.id ? updated : w)); };
  const editDayStation = (dayIndex, stationIndex, value) => { const updated = { ...selectedWeek, days: selectedWeek.days.map((d, i) => i === dayIndex ? { ...d, learningStations: d.learningStations.map((s, si) => si === stationIndex ? value : s) } : d) }; setSelectedWeek(updated); setCustomWeeks(prev => prev.map(w => w.id === updated.id ? updated : w)); };
  const editDayTip = (dayIndex, tipIndex, value) => { const updated = { ...selectedWeek, days: selectedWeek.days.map((d, i) => i === dayIndex ? { ...d, teacherTips: d.teacherTips.map((t, ti) => ti === tipIndex ? value : t) } : d) }; setSelectedWeek(updated); setCustomWeeks(prev => prev.map(w => w.id === updated.id ? updated : w)); };
  const editWeekField = (field, value) => { const updated = { ...selectedWeek, [field]: value }; setSelectedWeek(updated); setCustomWeeks(prev => prev.map(w => w.id === updated.id ? updated : w)); };
  const saveEdits = async () => { setEditSaving(true); try { await fetch('/.netlify/functions/user-weeks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selectedWeek.id, userId: currentUser.id, theme: selectedWeek.theme, season: selectedWeek.season, focus: selectedWeek.focus, teachingPhilosophy: selectedWeek.teachingPhilosophy || '', days: selectedWeek.days }) }); } catch (err) { console.error('Failed to save edits:', err); } setEditSaving(false); setIsEditMode(false); };

  const generateAILetter = async () => {
    setIsGeneratingLetter(true); setAiError(null);
    const w = selectedWeek || weeks[0];
    const tl = getTodayLogs();
    const pronounMap = { he: 'he/him', she: 'she/her', they: 'they/them' };
    const childNames = children.length > 0 ? children.map(ch => `${ch.name}${ch.age ? ` (${ch.age})` : ''}${ch.gender ? ` [${pronounMap[ch.gender]}]` : ' [use name or they/them]'}`).join(', ') : 'your little one';
    const childNamesOnly = children.length > 0 ? children.map(ch => ch.name).join(', ') : 'your little one';
    const dayDataForLetter = w.hasRichData && w.days ? w.days[selectedDay] : null;
    const todaysActivities = tl.length > 0 ? tl.map(l => `${fmtTime(l.timestamp)} - ${l.activity}${l.notes ? `: ${l.notes}` : ''}`).join('\\n') : '';
    const photosDescription = tl.filter(l => l.photos?.length > 0).length > 0 ? `\\nPhotos captured: ${tl.filter(l => l.photos?.length > 0).reduce((acc, l) => acc + (l.photos?.length || 0), 0)}` : '';
    const langLabel = getLanguageLabel();
    const languageNote = langLabel && dayDataForLetter?.frenchWord ? `${langLabel} word of the day: ${dayDataForLetter.frenchWord}.` : '';
    const extraNotes = letterNotes.trim() ? `\\n\\nADDITIONAL CONTEXT FROM CAREGIVER (use this heavily — it contains the real details, moments, and flow of the day):\\n${letterNotes.trim()}` : '';
    let weeklyArc = '';
    if (w.hasRichData && w.days) {
      const dayFocuses = w.days.map((d, i) => {
        if (!d.focus) return null;
        const isToday = i === selectedDay;
        return `${dayNames[i]}: "${d.focus}"${isToday ? ' ← TODAY' : ''}`;
      }).filter(Boolean);
      if (dayFocuses.length > 1) {
        weeklyArc = `\\n\\nWEEKLY ARC (reference where today fits in the bigger picture — mention what came before if it enriches the narrative):\\nTheme: "${w.theme}"\\n${dayFocuses.join('\\n')}`;
      }
    }
    let lessonPlanSection = '';
    if (dayDataForLetter) {
      const parts = [];
      if (dayDataForLetter.focus) parts.push(`Focus: ${dayDataForLetter.focus}`);
      if (dayDataForLetter.qotd) parts.push(`Question of the Day: ${dayDataForLetter.qotd}`);
      if (dayDataForLetter.circleTime) parts.push(`Circle Time: ${dayDataForLetter.circleTime.substring(0, 500)}`);
      if (dayDataForLetter.songTitle) parts.push(`Song: ${dayDataForLetter.songTitle}`);
      if (dayDataForLetter.learningStations?.length > 0) parts.push(`Learning Stations:\\n${dayDataForLetter.learningStations.map((s, i) => `${i + 1}. ${s}`).join('\\n')}`);
      if (dayDataForLetter.outsideTime) parts.push(`Outside Time: ${dayDataForLetter.outsideTime}`);
      if (dayDataForLetter.indoorMovement) parts.push(`Indoor Movement: ${dayDataForLetter.indoorMovement}`);
      if (parts.length > 0) lessonPlanSection = `\\n\\nTODAY'S LESSON PLAN (reference these activities in the letter — the caregiver followed this plan):\\n${parts.join('\\n')}`;
    }
    const selectedDayName = dayNames[selectedDay] || 'today';
    const prompt = `You are writing a daily parent letter in The Formula's signature voice. Study these style rules carefully:

VOICE & STYLE:
- Write in first person as the caregiver alongside the children ("${childNamesOnly} and I dove into...")
- Name each child specifically and capture what THEY did — never generic "the children enjoyed"
- Narrate the day as a flowing story with natural transitions
- Use playful but smart vocabulary — never talk down
- Weave in warmth naturally
- Frame challenges positively
- Open with energy about the group and the day's theme
- End with a "Learning & Development Note:" section (2-4 sentences) connecting activities to real developmental skills

WEEKLY CONTEXT:
- Naturally weave in where today fits in the week's learning journey
- You can reference what was explored earlier in the week to show progression ("Building on our exploration of X earlier this week, today we...")
- Do NOT list every day's topic — just use the arc naturally when it enriches the story

CRITICAL RULE — DO NOT FABRICATE:
- ONLY describe activities, moments, and details that are explicitly mentioned in the logged activities or caregiver notes below.
- NEVER invent specific scenes, dialogue, facial expressions, or events that were not reported.
- NEVER add made-up quotes from children.
- If the caregiver says "child counted to 10," you can say that warmly — but do NOT invent a whole scenario about HOW they counted, what props they used, or what their face looked like unless that was provided.
- It is better to write a shorter, honest letter than a longer one full of invented details.
- Keep the letter grounded in what actually happened. Warmth and personality come from HOW you describe real moments, not from making up new ones.

STRUCTURE:
- Opening line with kids' names and energy about the day
- 1-3 paragraphs narrating ONLY what was reported
- Closing tease about tomorrow or a warm sign-off
- "Learning & Development Note:" section at the end
PRONOUNS:
- Each child's pronouns are listed in brackets after their name. Use ONLY those pronouns.
- If a child has no pronouns listed, use their name or they/them only.
- NEVER assume gender from a child's name.
WRITING QUALITY:
- Vary your sentence structure — mix short and long, different openings
- NEVER use the same descriptive phrase twice in one letter. If you mention "cause and effect" once, find a different way to describe it the next time (discovery, curiosity, figuring out how things work, etc.)
- Don't narrate station by station in order. Blend moments together, jump between highlights, create a real narrative flow
- Each child should appear naturally throughout — not in a predictable "Boone did X, then Doc did Y" pattern every paragraph

WHAT TO AVOID:
- Bullet points or lists in the narrative
- Generic phrases like "had a great time" or "everyone enjoyed"
- Overly formal or stiff language
- Starting every sentence with a child's name
- Repetitive paragraph structure (don't describe each activity the same way)
- Inventing ANY details not provided by the caregiver
- School language: never say "classroom," "students," "teacher," "lesson" — this is home learning. Use "our morning," "our space," "caregiver," etc.

PRIORITY: If the caregiver provided additional context below, treat it as the primary source of truth for what happened today. Use their details, phrasing, and moments as the backbone of the letter — reshape and polish it into The Formula voice, but keep their specific observations and the real flow of the day.

NOW WRITE THE LETTER:
Children: ${childNames}
Day: ${selectedDayName}${weeklyArc}${lessonPlanSection}
${languageNote}
${todaysActivities ? `\\nActivity logs: ${todaysActivities}${photosDescription}` : ''}${extraNotes}

Write in The Formula voice.

DETAIL LEVEL — match the input:
- If ONLY a lesson plan is provided (no activity logs, no caregiver notes): Write a BRIEF letter (100-150 words max). Describe the day's theme and planned activities in general terms ("we explored weather through sensory play and outdoor observation"). Do NOT narrate specific child reactions, discoveries, or moments — you don't know what actually happened. Keep it warm but honest.
- If activity logs OR caregiver notes are provided: Use those real details as the backbone. Write 200-400 words depending on how much detail was given. Only describe moments that were actually reported.`;
    try {
      const response = await fetch("/.netlify/functions/claude", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1200, messages: [{ role: "user", content: prompt }] }) });
      const data = await response.json();
      if (data.content?.[0]?.text) setLetter(data.content[0].text);
      else throw new Error(data.error?.message || 'API error');
    } catch (error) { setAiError(error.message); genTemplateLetter(); }
    finally { setIsGeneratingLetter(false); }
  };

  const genTemplateLetter = () => {
    const w = selectedWeek || weeks[0]; const tl = getTodayLogs();
    const childNames = children.length > 0 ? children.map(ch => ch.name).join(', ') : 'your little one';
    const dayDataForLetter = w.hasRichData && w.days ? w.days[selectedDay] : null;
    const langLabel = getLanguageLabel(); const languageNote = langLabel && dayDataForLetter?.frenchWord ? `\nWe also practiced our ${langLabel} word of the day: "${dayDataForLetter.frenchWord}"!\n` : '';
    let activities = tl.length > 0 ? tl.map(l => `${l.activity}${l.notes ? ` — ${l.notes}` : ''}`).join(', then ') : 'our curriculum activities';
    const extra = letterNotes.trim() ? `\n\n${letterNotes.trim()}\n` : '';
    setLetter(`${childNames} had such a wonderful morning today as we continued exploring "${w.theme}"! We started the day with ${activities}.${languageNote}${extra}\n\nIt was great to see everyone so engaged and having fun while learning. Stay tuned for what's in store tomorrow!\n\nLearning & Development Note:\nToday's activities supported a range of developmental areas including creativity, social skills, and early learning concepts — all through the power of play.\n\n[Your Name]`);
  };

  const MONTHLY_WEEK_LIMIT = 20;
  const isAdmin = currentUser?.id === '694851cf-da84-4f15-bbd8-597cd00f16e5';
  const getMonthlyWeekCount = () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return customWeeks.filter(w => w.aiGenerated && w.createdAt && new Date(w.createdAt) >= monthStart).length;
  };
  const monthlyWeeksRemaining = isAdmin ? Infinity : MONTHLY_WEEK_LIMIT - getMonthlyWeekCount();

  const generateAIWeek = async () => {
    if (!weekTopic.trim()) return;
    if (monthlyWeeksRemaining <= 0) {
      alert(`You've reached your limit of ${MONTHLY_WEEK_LIMIT} custom weeks this month. Your limit resets at the start of next month.`);
      return;
    }
    setIsGeneratingWeek(true);
    const daysToGen = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].filter((_, i) => newWeek.daysToInclude[i]);
    const langLabel = getLanguageLabel();
    const langInstruction = langLabel ? `Include a ${langLabel} vocabulary word with pronunciation guide.` : '';
    const ageDescriptions = { '0-6m': 'infants (0-6 months)', '6m-1': 'infants (6-12 months)', '1-2': 'toddlers (1-2 years)', '2-3': 'toddlers (2-3 years)', '3-4': 'preschoolers (3-4 years)', '4-5': 'pre-K children (4-5 years)' };
    const isMixedAge = weekAgeGroup.length > 1;
    const ageGroupLabel = isMixedAge
      ? `a mixed-age group including ${weekAgeGroup.map(a => ageDescriptions[a]).join(' and ')}`
      : ageDescriptions[weekAgeGroup[0]];
    const mixedAgeInstruction = isMixedAge
      ? `\n\nThis is a MIXED-AGE GROUP. When an activity works differently for different ages, include a brief note like "(For younger children: [adaptation])" within the station description. Keep adaptations concise — one sentence each. Teacher tips should include 1-2 mixed-age management strategies.`
      : '';
    try {
      const firstPrompt = `Generate a curriculum week about "${weekTopic}" for ${ageGroupLabel}.${mixedAgeInstruction} ${langInstruction}\n\nReturn ONLY JSON for the theme overview AND ${daysToGen[0]} only:\n{"theme":"Creative name","season":"Any|Spring|Summer|Fall|Winter","focus":"Focus area","teachingPhilosophy":"150-250 word philosophy for this topic and age group","days":[{"name":"${daysToGen[0]}","focus":"Sub-topic","qotd":"Question","circleTime":"Full 300-500 word circle time script with interactive prompts","songTitle":"2-5 word phrase related to ${weekTopic} (app appends 'kids song' for YouTube search)","learningStations":["Station 1 with materials and guiding question","Station 2","Station 3"],"teacherTips":["Tip 1","Tip 2","Tip 3","Tip 4","Tip 5","Tip 6"],"outsideTime":"Outdoor suggestion","indoorMovement":"Indoor movement alternative"}]}`;
      const firstResp = await fetch("/api/generate-curriculum", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 4000, messages: [{ role: "user", content: firstPrompt }] }) });
      if (!firstResp.ok) throw new Error('Server error ' + firstResp.status);
      const firstData = await firstResp.json();
      const firstText = firstData.content?.[0]?.text;
      if (!firstText) throw new Error('No response from AI');
      const firstParsed = parseAIJson(firstText);
      if (firstParsed.error) { alert(firstParsed.message); return; }
      let allDays = [...firstParsed.days];
      for (let i = 1; i < daysToGen.length; i++) {
        const prevDaySummaries = allDays.map(d => `${d.name}: Focus="${d.focus}", Song="${d.songTitle}", Stations=[${(d.learningStations||[]).map(s => s.split(' - ')[0]).join(', ')}], Outside="${d.outsideTime}", Indoor="${d.indoorMovement}"`).join('\n');
        const dayPrompt = `Continue the "${firstParsed.theme}" curriculum for ${ageGroupLabel}.${mixedAgeInstruction}\n\nPREVIOUS DAYS (do NOT repeat any songs, stations, activities, or outside/indoor ideas from these):\n${prevDaySummaries}\n\nNow generate ${daysToGen[i]} ONLY. Every field must be DIFFERENT from previous days.${i === daysToGen.length - 1 ? ' This is the FINAL day of the week. Focus on revisiting favorite activities and key concepts from earlier in the week. Introduce one new element that ties the whole week together. Do NOT frame this as a party, celebration, or special event — treat it as a regular learning day with a reflective, connecting thread.' : ''} ${langInstruction}\n\nReturn ONLY JSON for this single day:\n{"name":"${daysToGen[i]}","focus":"Sub-topic","qotd":"Question","circleTime":"Full 300-500 word circle time script with interactive prompts","songTitle":"2-5 word phrase related to ${firstParsed.theme} (app appends 'kids song' for YouTube search)","learningStations":["Station 1 with materials and guiding question","Station 2","Station 3"],"teacherTips":["Tip 1","Tip 2","Tip 3","Tip 4","Tip 5","Tip 6"],"outsideTime":"Outdoor suggestion","indoorMovement":"Indoor movement alternative"}`;
        const dayResp = await fetch("/api/generate-curriculum", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 3000, messages: [{ role: "user", content: dayPrompt }] }) });
        if (!dayResp.ok) throw new Error('Server error on day ' + daysToGen[i]);
        const dayData = await dayResp.json();
        const dayText = dayData.content?.[0]?.text;
        if (dayText) { const dayParsed = parseAIJson(dayText); if (dayParsed && !dayParsed.error && dayParsed.name) allDays.push(dayParsed); }
      }
      const dayNameMap = { 'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3, 'Friday': 4, 'Saturday': 5, 'Sunday': 6 };
      const fullDayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const newDays = fullDayNames.map((shortName, idx) => {
        const genDay = allDays.find(d => dayNameMap[d.name] === idx);
        if (genDay) { const rawSongTitle = genDay.songTitle || ''; const songTitle = (rawSongTitle === 'SEARCH' || rawSongTitle === 'Real song') ? '' : rawSongTitle; const songSearchLink = songTitle ? 'https://www.youtube.com/results?search_query=' + encodeURIComponent(songTitle + ' kids song') : ''; return { name: shortName, activities: { focusOfDay: genDay.focusOfDay || genDay.focus || '', questionOfDay: genDay.questionOfDay || genDay.qotd || '', circleTime: genDay.circleTime || '', songOfDay: { title: songTitle, link: songSearchLink }, morningActivities: genDay.morningActivities || genDay.learningStations || [''], lunch: genDay.lunch || '', afternoonActivities: genDay.afternoonActivities || [''], vocabWord: genDay.vocabWord || '', teacherTips: genDay.teacherTips || [], outsideTime: genDay.outsideTime || '', indoorMovement: genDay.indoorMovement || '' }}; }
        return { name: shortName, activities: {...emptyDay} };
      });
      setNewWeek(prev => ({ ...prev, theme: firstParsed.theme || weekTopic, season: firstParsed.season || 'Any', focus: firstParsed.focus || 'General', teachingPhilosophy: firstParsed.teachingPhilosophy || '', aiGenerated: true, days: newDays }));
      setWeekTopic('');
    } catch (error) { console.error('AI Week Generation Error:', error); alert('Failed to generate curriculum. Please try again or fill in manually.'); }
    finally { setIsGeneratingWeek(false); }
  };

  const parseAIJson = (text) => { const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim(); let cleanJson = ''; let inStr = false; let esc = false; for (let i = 0; i < jsonStr.length; i++) { const ch = jsonStr[i]; if (esc) { cleanJson += ch; esc = false; continue; } if (ch === '\\' && inStr) { cleanJson += ch; esc = true; continue; } if (ch === '"') { inStr = !inStr; cleanJson += ch; continue; } if (inStr && (ch === '\n' || ch === '\r')) { cleanJson += '\\n'; continue; } cleanJson += ch; } return JSON.parse(cleanJson); };

  const updWeek = (f, v) => setNewWeek(p => ({ ...p, [f]: v }));
  const togDay = (i) => setNewWeek(p => ({ ...p, daysToInclude: p.daysToInclude.map((d, j) => j === i ? (d ? 0 : 1) : d) }));
  const updDay = (i, f, v) => setNewWeek(p => ({ ...p, days: p.days.map((d, j) => j === i ? { ...d, activities: { ...d.activities, [f]: v }} : d) }));
  const updSong = (i, f, v) => setNewWeek(p => ({ ...p, days: p.days.map((d, j) => j === i ? { ...d, activities: { ...d.activities, songOfDay: { ...d.activities.songOfDay, [f]: v }}} : d) }));
  const addMorn = (i) => setNewWeek(p => ({ ...p, days: p.days.map((d, j) => j === i ? { ...d, activities: { ...d.activities, morningActivities: [...d.activities.morningActivities, ''] }} : d) }));
  const updMorn = (i, k, v) => setNewWeek(p => ({ ...p, days: p.days.map((d, j) => j === i ? { ...d, activities: { ...d.activities, morningActivities: d.activities.morningActivities.map((a, n) => n === k ? v : a) }} : d) }));
  const remMorn = (i, k) => setNewWeek(p => ({ ...p, days: p.days.map((d, j) => j === i ? { ...d, activities: { ...d.activities, morningActivities: d.activities.morningActivities.filter((_, n) => n !== k) }} : d) }));
  const addAftn = (i) => setNewWeek(p => ({ ...p, days: p.days.map((d, j) => j === i ? { ...d, activities: { ...d.activities, afternoonActivities: [...d.activities.afternoonActivities, ''] }} : d) }));
  const updAftn = (i, k, v) => setNewWeek(p => ({ ...p, days: p.days.map((d, j) => j === i ? { ...d, activities: { ...d.activities, afternoonActivities: d.activities.afternoonActivities.map((a, n) => n === k ? v : a) }} : d) }));
  const remAftn = (i, k) => setNewWeek(p => ({ ...p, days: p.days.map((d, j) => j === i ? { ...d, activities: { ...d.activities, afternoonActivities: d.activities.afternoonActivities.filter((_, n) => n !== k) }} : d) }));

  const activeDays = newWeek.days.filter((_, i) => newWeek.daysToInclude[i]);
  const currentDay = activeDays[dayIdx] || activeDays[0] || newWeek.days[0];
  const currentDayIndex = newWeek.days.findIndex(d => d.name === currentDay?.name);
  const currentWeek = selectedWeek || weeks[0] || {};
  const dayData = currentWeek.hasRichData && currentWeek.days ? currentWeek.days[selectedDay] : null;

  // ============ RENDER ============

  // Loading screen
  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: c.cream, fontFamily: 'Quicksand, sans-serif'}}>
        <div className="text-center">
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{backgroundColor: c.terra}}>
            <span className="text-4xl font-bold text-white">F</span>
          </div>
          <Loader className="w-6 h-6 animate-spin mx-auto" style={{color: c.terra}} />
        </div>
      </div>
    );
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{backgroundColor: c.cream, fontFamily: 'Quicksand, sans-serif'}}>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{backgroundColor: c.terra}}>
              <span className="text-4xl font-bold text-white">F</span>
            </div>
            <h1 className="text-3xl font-bold" style={{color: c.wood}}>The Formula</h1>
            <p className="text-sm mt-2" style={{color: c.bark}}>Prepared Nannies. Informed Parents. Better Care.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg" style={{border: `2px solid ${c.sand}`}}>
            <h2 className="text-xl font-bold mb-2 text-center" style={{color: c.wood}}>Welcome</h2>
            <p className="text-sm text-center mb-6" style={{color: c.bark}}>Sign in or create an account to access your curriculum.</p>
            <button onClick={openLogin} className="w-full py-3 rounded-lg font-semibold text-white" style={{backgroundColor: c.terra}}>Sign In / Sign Up</button>
          </div>
        </div>
      </div>
    );
  }

  // Subscription loading — show while checking subscription after login
  if (subscription.loading || !subscriptionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: c.cream, fontFamily: 'Quicksand, sans-serif'}}>
        <div className="text-center">
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{backgroundColor: c.terra}}>
            <span className="text-4xl font-bold text-white">F</span>
          </div>
          <Loader className="w-6 h-6 animate-spin mx-auto mb-2" style={{color: c.terra}} />
          <p className="text-sm" style={{color: c.bark}}>Loading your account...</p>
        </div>
      </div>
    );
  }

  // ============ PRICING PAGE ============
  const PricingPage = () => (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm" style={{color: c.bark}}>Welcome, {currentUser?.name}</p>
          <h1 className="text-xl font-bold" style={{color: c.wood}}>Choose Your Plan</h1>
        </div>
        <button onClick={handleLogout} className="p-2 rounded-full" style={{backgroundColor: c.sand}}>
          <LogOut className="w-5 h-5" style={{color: c.wood}} />
        </button>
      </div>

      {checkoutMessage && (
        <div className={`rounded-xl p-4 mb-4 flex items-start gap-3 ${checkoutMessage.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
          {checkoutMessage.type === 'success' ? <Check className="w-5 h-5 text-green-600 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />}
          <p className={`text-sm ${checkoutMessage.type === 'success' ? 'text-green-800' : 'text-yellow-800'}`}>{checkoutMessage.text}</p>
          <button onClick={() => setCheckoutMessage(null)}><X className="w-4 h-4 text-gray-400" /></button>
        </div>
      )}

      <div className="text-center mb-6">
        <p className="text-sm mb-3" style={{color: c.bark}}>Professional early childhood curriculum for nannies and families</p>
        <div className="inline-flex rounded-full p-1" style={{backgroundColor: c.sand}}>
          <button onClick={() => setBillingCycle('monthly')} className="px-4 py-2 rounded-full text-sm font-medium transition-all" style={{backgroundColor: billingCycle === 'monthly' ? c.terra : 'transparent', color: billingCycle === 'monthly' ? 'white' : c.wood}}>Monthly</button>
          <button onClick={() => setBillingCycle('yearly')} className="px-4 py-2 rounded-full text-sm font-medium transition-all" style={{backgroundColor: billingCycle === 'yearly' ? c.terra : 'transparent', color: billingCycle === 'yearly' ? 'white' : c.wood}}>Yearly <span className="text-xs opacity-80">(Save 2 months)</span></button>
        </div>
      </div>

      <div className="space-y-4">
        {/* GOLD */}
        <div className="bg-white rounded-2xl p-5 shadow-lg" style={{border: `2px solid ${c.sand}`}}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: '#fbbf24'}}><Star className="w-5 h-5 text-white" /></div>
            <div>
              <h3 className="font-bold text-lg" style={{color: c.wood}}>Gold</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold" style={{color: c.wood}}>${billingCycle === 'monthly' ? '24.99' : '249.90'}</span>
                <span className="text-sm" style={{color: c.bark}}>/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
              </div>
            </div>
          </div>
          <ul className="space-y-2 mb-4">
            {['14+ gold standard curriculum weeks', 'Full circle time scripts & learning stations', 'AI-powered parent letter generator', 'Activity logging & milestone tracking', 'Child profiles with parent info', 'All age groups: 0-5 years'].map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{color: c.wood}}><Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{color: '#059669'}} />{f}</li>
            ))}
          </ul>
          <button onClick={() => !hasGold() && startCheckout(billingCycle === 'monthly' ? 'gold_monthly' : 'gold_yearly')} disabled={hasGold()} className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-60" style={{backgroundColor: '#fbbf24'}}>
            {hasGold() ? '✓ Current Plan' : 'Get Gold'}
          </button>
        </div>

        {/* PLATINUM */}
        <div className="bg-white rounded-2xl p-5 shadow-lg relative" style={{border: `2px solid ${c.terra}`}}>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white" style={{backgroundColor: c.terra}}>MOST POPULAR</div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: c.terra}}><Crown className="w-5 h-5 text-white" /></div>
            <div>
              <h3 className="font-bold text-lg" style={{color: c.wood}}>Platinum</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold" style={{color: c.wood}}>${billingCycle === 'monthly' ? '44.99' : '449.90'}</span>
                <span className="text-sm" style={{color: c.bark}}>/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
              </div>
            </div>
          </div>
          <ul className="space-y-2 mb-4">
            {['Everything in Gold, plus:', 'AI curriculum generator — unlimited custom weeks', 'Custom week creation & inline editing', 'Full creative control over your curriculum', 'Priority support'].map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{color: c.wood}}><Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{color: c.terra}} />{f}</li>
            ))}
          </ul>
          <button onClick={() => !hasPlatinum() && startCheckout(billingCycle === 'monthly' ? 'platinum_monthly' : 'platinum_yearly')} disabled={hasPlatinum()} className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-60" style={{backgroundColor: c.terra}}>
            {hasPlatinum() ? '✓ Current Plan' : hasGold() ? 'Upgrade to Platinum (prorated)' : 'Get Platinum'}
          </button>
          {hasGold() && !hasPlatinum() && (
            <p className="text-xs text-center mt-2" style={{color: c.bark}}>You'll only pay the difference for the rest of this billing period</p>
          )}
        </div>

        {/* Agency note */}
        <div className="rounded-xl p-4" style={{backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0'}}>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5" style={{color: '#059669'}} />
            <h4 className="font-semibold text-sm" style={{color: '#065f46'}}>Agency-Placed Nannies</h4>
          </div>
          <p className="text-xs" style={{color: '#065f46'}}>Nannies placed through our agency receive free Gold access while active, and 30% off Platinum. Contact your agency administrator for access.</p>
        </div>
      </div>
    </div>
  );
// Onboarding — show if subscription active but onboarding not complete
  if (hasGold() && subscriptionChecked && !subscription.loading && onboardingComplete === false) {
    const goalOptions = [
      { id: 'daily_activities', label: 'Daily activity ideas', icon: '🎨', desc: 'Age-appropriate activities ready to go' },
      { id: 'structured_curriculum', label: 'Structured curriculum', icon: '📚', desc: 'Week-by-week learning themes' },
      { id: 'milestones', label: 'Milestone tracking', icon: '📈', desc: 'Track developmental progress' },
      { id: 'parent_letters', label: 'Parent communication', icon: '✉️', desc: 'Daily letters home to families' },
      { id: 'language_learning', label: 'Language learning', icon: '🌍', desc: 'Introduce a second language' },
      { id: 'new_caregiver', label: 'New caregiver support', icon: '🤝', desc: "I'm new to childcare and want guidance" },
    ];
    const hasValidChild = onboardingChildren.some(c => c.name.trim());

    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{backgroundColor: c.cream, fontFamily: 'Quicksand, sans-serif'}}>
        <div className="w-full max-w-md">

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3].map(step => (
              <div key={step} className="w-2.5 h-2.5 rounded-full transition-all" style={{
                backgroundColor: onboardingStep === step ? c.terra : onboardingStep > step ? c.bark : c.sand,
                transform: onboardingStep === step ? 'scale(1.3)' : 'scale(1)'
              }} />
            ))}
          </div>

          {/* STEP 1: Welcome */}
          {onboardingStep === 1 && (
            <div className="text-center">
              <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{backgroundColor: c.terra}}>
                <span className="text-4xl font-bold text-white">F</span>
              </div>
              <h1 className="text-2xl font-bold mb-2" style={{color: c.wood}}>Welcome to The Formula!</h1>
              <p className="text-sm mb-8" style={{color: c.bark}}>
                Let's get your experience set up so we can tailor everything to the children in your care. This takes about a minute.
              </p>
              <button onClick={() => setOnboardingStep(2)} className="w-full py-3 rounded-xl font-semibold text-white" style={{backgroundColor: c.terra}}>
                Let's Go
              </button>
            </div>
          )}

          {/* STEP 2: Children */}
          {onboardingStep === 2 && (
            <div>
              <h2 className="text-xl font-bold mb-1 text-center" style={{color: c.wood}}>Who are the little ones?</h2>
              <p className="text-sm mb-5 text-center" style={{color: c.bark}}>
                Tell us about the children you'll be working with.
              </p>

              <div className="space-y-4 mb-4">
                {onboardingChildren.map((child, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-4 shadow-md" style={{border: `1px solid ${c.sand}`}}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold" style={{color: c.wood}}>Child {idx + 1}</span>
                      {onboardingChildren.length > 1 && (
                        <button onClick={() => removeOnboardingChild(idx)}><X className="w-4 h-4" style={{color: c.terra}} /></button>
                      )}
                    </div>

                    <input
                      placeholder="Child's first name"
                      value={child.name}
                      onChange={e => updateOnboardingChild(idx, 'name', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border mb-3 text-sm"
                      style={{borderColor: c.sand}}
                    />

                    {/* Toggle: DOB or Age Range */}
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => updateOnboardingChild(idx, 'inputType', 'range')}
                        className="flex-1 py-1.5 rounded-lg text-xs font-medium"
                        style={{backgroundColor: child.inputType === 'range' ? c.terra : c.sand, color: child.inputType === 'range' ? 'white' : c.wood}}
                      >Age Range</button>
                      <button
                        onClick={() => updateOnboardingChild(idx, 'inputType', 'birthday')}
                        className="flex-1 py-1.5 rounded-lg text-xs font-medium"
                        style={{backgroundColor: child.inputType === 'birthday' ? c.terra : c.sand, color: child.inputType === 'birthday' ? 'white' : c.wood}}
                      >Date of Birth</button>
                    </div>

                    {child.inputType === 'range' ? (
                      <select
                        value={child.ageRange}
                        onChange={e => updateOnboardingChild(idx, 'ageRange', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border text-sm"
                        style={{borderColor: c.sand, color: child.ageRange ? c.wood : c.bark}}
                      >
                        <option value="">Select age range</option>
                        <option value="0-6 months">0–6 months</option>
                        <option value="6-12 months">6–12 months</option>
                        <option value="1-2 years">1–2 years</option>
                        <option value="2-3 years">2–3 years</option>
                        <option value="3-4 years">3–4 years</option>
                        <option value="4-5 years">4–5 years</option>
                      </select>
                    ) : (
                      <input
                        type="date"
                        value={child.birthday}
                        onChange={e => updateOnboardingChild(idx, 'birthday', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border text-sm"
                        style={{borderColor: c.sand, color: c.wood}}
                      />
                    )}
                  </div>
                ))}
              </div>

              <button onClick={addOnboardingChild} className="w-full py-2.5 rounded-xl mb-5 flex items-center justify-center gap-2 font-medium" style={{border: `2px dashed ${c.sand}`, color: c.bark}}>
                <Plus className="w-4 h-4" /> Add another child
              </button>

              <div className="flex gap-3">
                <button onClick={() => setOnboardingStep(1)} className="px-5 py-3 rounded-xl font-semibold" style={{backgroundColor: c.sand, color: c.wood}}>Back</button>
                <button onClick={() => setOnboardingStep(3)} disabled={!hasValidChild} className="flex-1 py-3 rounded-xl font-semibold text-white disabled:opacity-40" style={{backgroundColor: c.terra}}>
                  Continue
                </button>
              </div>

              <button onClick={() => { setOnboardingChildren([{ name: '', birthday: '', ageRange: '', inputType: 'range' }]); setOnboardingStep(3); }} className="w-full mt-3 text-sm underline" style={{color: c.bark}}>
                Skip for now
              </button>
            </div>
          )}

          {/* STEP 3: Goals */}
          {onboardingStep === 3 && (
            <div>
              <h2 className="text-xl font-bold mb-1 text-center" style={{color: c.wood}}>What are you hoping for?</h2>
              <p className="text-sm mb-5 text-center" style={{color: c.bark}}>
                Select everything that sounds useful. This helps us tailor your experience.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {goalOptions.map(goal => {
                  const selected = onboardingGoals.includes(goal.id);
                  return (
                    <button
                      key={goal.id}
                      onClick={() => toggleOnboardingGoal(goal.id)}
                      className="rounded-xl p-3 text-left transition-all"
                      style={{
                        backgroundColor: selected ? c.terra : 'white',
                        border: `2px solid ${selected ? c.terra : c.sand}`,
                        color: selected ? 'white' : c.wood
                      }}
                    >
                      <span className="text-xl block mb-1">{goal.icon}</span>
                      <span className="text-sm font-semibold block">{goal.label}</span>
                      <span className="text-xs block mt-0.5" style={{opacity: 0.8}}>{goal.desc}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setOnboardingStep(2)} className="px-5 py-3 rounded-xl font-semibold" style={{backgroundColor: c.sand, color: c.wood}}>Back</button>
                <button
                  onClick={completeOnboarding}
                  disabled={onboardingSaving}
                  className="flex-1 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{backgroundColor: c.terra}}
                >
                  {onboardingSaving ? <><Loader className="w-5 h-5 animate-spin" />Setting up...</> : "Let's get started!"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  // Show pricing page if no active subscription (and subscription check is complete)
  if (!hasGold() && subscriptionChecked && !subscription.loading && view !== 'pricing' && view !== 'settings') {
    return (
      <div className="min-h-screen" style={{backgroundColor: c.cream, fontFamily: 'Quicksand, sans-serif'}}>
        <PricingPage />
      </div>
    );
  }

  // Bottom nav tab mapping
  const getActiveTab = () => {
    if (['dashboard', 'children', 'milestones'].includes(view)) return 'home';
    if (['weeklyThemes', 'dailyPlan', 'customWeek'].includes(view)) return 'curriculum';
    if (view === 'activityLog') return 'log';
    if (view === 'writeLetter') return 'letter';
    if (view === 'settings') return 'settings';
    return 'home';
  };

  // MAIN APP RENDER
  return (
    <div className="min-h-screen" style={{backgroundColor: c.cream, fontFamily: 'Quicksand, sans-serif'}}>
      
      {/* Checkout success message */}
      {checkoutMessage && (
        <div className={`mx-4 mt-4 rounded-xl p-4 flex items-start gap-3 ${checkoutMessage.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
          {checkoutMessage.type === 'success' ? <Check className="w-5 h-5 text-green-600 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />}
          <p className={`text-sm flex-1 ${checkoutMessage.type === 'success' ? 'text-green-800' : 'text-yellow-800'}`}>{checkoutMessage.text}</p>
          <button onClick={() => setCheckoutMessage(null)}><X className="w-4 h-4 text-gray-400" /></button>
        </div>
      )}

      {/* Transition wrapper */}
      <div style={{opacity: viewOpacity, transition: 'opacity 0.15s ease-in-out'}}>

      {/* DASHBOARD */}
      {view === 'dashboard' && (
        <div className="p-4 space-y-5 pb-24">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{color: c.bark}}>Welcome,</p>
              <h1 className="text-xl font-bold" style={{color: c.wood}}>{currentUser?.name}</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded-full text-xs font-medium" style={{
                backgroundColor: hasPlatinum() ? c.terra : '#fbbf24',
                color: 'white'
              }}>{hasPlatinum() ? '✦ Platinum' : '★ Gold'}{subscription.isAgency ? ' (Agency)' : ''}</span>
              <button onClick={handleLogout} className="p-2 rounded-full" style={{backgroundColor: c.sand}}>
                <LogOut className="w-5 h-5" style={{color: c.wood}} />
              </button>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg" style={{border: `2px solid ${c.sand}`}}>
            <h2 className="text-2xl font-bold mb-2" style={{color: c.wood}}>This Week's Theme</h2>
            <p className="text-3xl font-bold" style={{color: c.wood}}>{currentWeek.theme}</p>
            <p className="text-sm mt-2" style={{color: c.wood}}>Week of {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            {currentWeek.hasRichData && <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full text-xs" style={{backgroundColor: c.terra, color: 'white'}}><Star className="w-3 h-3" /> Full curriculum</span>}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[[children.length, 'Children'], [getTodayLogs().length, "Today's Logs"], [milestones.length, 'Milestones']].map(([n, l], i) => (
              <div key={i} className="bg-white rounded-xl p-3 text-center shadow-md" style={{border: `1px solid ${c.sand}`}}><p className="text-2xl font-bold" style={{color: c.terra}}>{n}</p><p className="text-xs" style={{color: c.bark}}>{l}</p></div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[['weeklyThemes', c.sand, BookOpen, 'Weekly Themes'], ['dailyPlan', c.terra, Calendar, "Today's Plan"], ['activityLog', c.dune, Edit3, 'Activity Log'], ['writeLetter', c.bark, MessageSquare, 'Write Letter']].map(([v, bg, Icon, label]) => (
              <button key={v} onClick={() => v === 'writeLetter' ? navigateToLetter() : navigateTo(v)} className="bg-white rounded-2xl p-5 shadow-md hover:shadow-lg transition-all" style={{border: `2px solid ${c.sand}`}}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 mx-auto" style={{backgroundColor: bg}}><Icon className="w-6 h-6" style={{color: bg === c.terra || bg === c.bark ? 'white' : c.wood}} /></div>
                <p className="font-semibold text-sm" style={{color: c.bark}}>{label}</p>
              </button>
            ))}
          </div>
          <button onClick={() => navigateTo('children')} className="w-full bg-white rounded-2xl p-4 shadow-md flex items-center justify-between" style={{border: `2px solid ${c.sand}`}}>
            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{backgroundColor: c.dune}}><Users className="w-5 h-5" style={{color: c.wood}} /></div><span className="font-semibold" style={{color: c.bark}}>Manage Children</span></div>
            <ChevronRight className="w-5 h-5" style={{color: c.bark}} />
          </button>
          <button onClick={() => navigateTo('milestones')} className="w-full bg-white rounded-2xl p-4 shadow-md flex items-center justify-between" style={{border: `2px solid ${c.sand}`}}>
            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{backgroundColor: c.terra}}><TrendingUp className="w-5 h-5 text-white" /></div><span className="font-semibold" style={{color: c.bark}}>Milestones</span></div>
            <ChevronRight className="w-5 h-5" style={{color: c.bark}} />
          </button>
          {/* Upgrade banner for Gold users */}
          {hasGold() && !hasPlatinum() && (
            <button onClick={() => navigateTo('pricing')} className="w-full rounded-2xl p-4 shadow-md flex items-center justify-between" style={{backgroundColor: c.terra, border: `2px solid ${c.wood}`}}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white bg-opacity-20"><Crown className="w-5 h-5 text-white" /></div>
                <div className="text-left">
                  <span className="font-semibold text-white">Upgrade to Platinum</span>
                  <p className="text-xs text-white opacity-80">Unlock AI curriculum generator</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          )}
          <button onClick={() => navigateTo('settings')} className="w-full bg-white rounded-2xl p-4 shadow-md flex items-center justify-between" style={{border: `2px solid ${c.sand}`}}>
            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{backgroundColor: c.bark}}><Settings className="w-5 h-5 text-white" /></div><span className="font-semibold" style={{color: c.bark}}>Settings</span></div>
            <ChevronRight className="w-5 h-5" style={{color: c.bark}} />
          </button>
        </div>
      )}

      {/* PRICING (upgrade page for Gold users) */}
      {view === 'pricing' && (
        <div>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => navigateTo(hasGold() ? 'dashboard' : 'dashboard')} className="p-2 rounded-full" style={{backgroundColor: c.sand}}><ChevronLeft className="w-5 h-5" style={{color: c.wood}} /></button>
              <h2 className="text-xl font-bold" style={{color: c.wood}}>{hasGold() ? 'Upgrade Your Plan' : 'Choose Your Plan'}</h2>
            </div>
          </div>
          <PricingPage />
        </div>
      )}

      {/* WEEKLY THEMES */}
      {view === 'weeklyThemes' && (
        <div className="p-4 pb-24">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigateTo('dashboard')} className="p-2 rounded-full" style={{backgroundColor: c.sand}}><ChevronLeft className="w-5 h-5" style={{color: c.wood}} /></button>
            <h2 className="text-xl font-bold" style={{color: c.wood}}>Weekly Themes</h2>
          </div>
          <div className="bg-white rounded-xl p-3 mb-4 shadow-md space-y-2" style={{border: `1px solid ${c.sand}`}}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{color: c.bark}} />
              <input placeholder="Search themes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-3 py-2 rounded-lg border" style={{borderColor: c.sand}} />
            </div>
            <div className="flex gap-2">
              <select value={filterSeason} onChange={(e) => setFilterSeason(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border text-sm" style={{borderColor: c.sand, color: c.wood}}>
                {allSeasons.map(s => <option key={s} value={s}>{s === 'All' ? 'All Seasons' : s}</option>)}
              </select>
              <select value={filterFocus} onChange={(e) => setFilterFocus(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border text-sm" style={{borderColor: c.sand, color: c.wood}}>
                {allFocusAreas.map(f => <option key={f} value={f}>{f === 'All' ? 'All Focus Areas' : f}</option>)}
              </select>
            </div>
            <select value={ageFilter} onChange={(e) => setAgeFilter(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm" style={{borderColor: c.sand, color: c.wood}}>
              <option value="all">All Ages</option>
              <option value="0-6m">0–6 months</option>
              <option value="6m-1">6 months–1 year</option>
              <option value="1-2">1-2 years</option>
              <option value="2-3">2-3 years</option>
              <option value="3-4">3-4 years</option>
              <option value="4-5">4-5 years</option>
            </select>
            {(searchTerm || filterSeason !== 'All' || filterFocus !== 'All' || ageFilter !== 'all') && (
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{color: c.bark}}>{filteredWeeks.length} themes found</span>
                <button onClick={() => { setSearchTerm(''); setFilterSeason('All'); setFilterFocus('All'); setAgeFilter('all'); }} className="text-xs underline" style={{color: c.terra}}>Clear filters</button>
              </div>
            )}
          </div>
          
          {/* Create Custom Week — Platinum only */}
          {hasPlatinum() ? (
            <button onClick={() => navigateTo('customWeek')} className="w-full bg-white rounded-xl p-4 mb-4 shadow-md flex items-center gap-3" style={{border: `2px dashed ${c.terra}`}}>
              <Plus className="w-5 h-5" style={{color: c.terra}} /><span className="font-semibold" style={{color: c.terra}}>Create Custom Week</span>
            </button>
          ) : (
            <div className="w-full rounded-xl p-4 mb-4 flex items-center gap-3 opacity-75" style={{backgroundColor: '#f5f0eb', border: `2px dashed ${c.sand}`}}>
              <Lock className="w-5 h-5" style={{color: c.bark}} />
              <div className="flex-1">
                <span className="font-semibold text-sm" style={{color: c.bark}}>Create Custom Week</span>
                <p className="text-xs" style={{color: c.bark}}>Upgrade to Platinum to create custom curricula</p>
              </div>
              <button onClick={() => navigateTo('pricing')} className="px-3 py-1 rounded-full text-xs font-medium text-white" style={{backgroundColor: c.terra}}>Upgrade</button>
            </div>
          )}

          <div className="space-y-3">
            {loadingWeeks ? (
              <div className="text-center py-8"><Loader className="w-6 h-6 animate-spin mx-auto mb-2" style={{color: c.terra}} /><p className="text-sm" style={{color: c.bark}}>Loading curriculum...</p></div>
            ) : filteredWeeks.map(w => (
              <div key={w.id} className="bg-white rounded-xl p-4 shadow-md cursor-pointer" style={{border: `1px solid ${c.sand}`}} onClick={() => selectWeek(w)}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold" style={{color: c.wood}}>{w.theme}</h3>
                      {w.hasRichData && <Star className="w-4 h-4" style={{color: c.terra}} />}
                      {w.isCustom && <span className="text-xs px-2 py-0.5 rounded-full" style={{backgroundColor: c.dune, color: c.wood}}>Custom</span>}
                    </div>
                    <p className="text-sm" style={{color: c.bark}}>{w.season} • {w.focus}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {w.isCustom && <button onClick={(e) => { e.stopPropagation(); delCustomWeek(w.id); }}><Trash2 className="w-4 h-4" style={{color: c.terra}} /></button>}
                    <ChevronRight className="w-5 h-5" style={{color: c.bark}} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DAILY PLAN */}
      {view === 'dailyPlan' && (
        <div className="p-4 pb-24">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => { navigateTo('dashboard'); setIsEditMode(false); }} className="p-2 rounded-full" style={{backgroundColor: c.sand}}><ChevronLeft className="w-5 h-5" style={{color: c.wood}} /></button>
            <div className="flex-1">
              {isEditMode ? (
                <input value={currentWeek.theme} onChange={e => editWeekField('theme', e.target.value)} className="text-xl font-bold w-full px-2 py-1 rounded-lg border" style={{color: c.wood, borderColor: c.terra}} />
              ) : (
                <h2 className="text-xl font-bold" style={{color: c.wood}}>{currentWeek.theme}</h2>
              )}
              <p className="text-sm" style={{color: c.bark}}>{currentWeek.focus} • {currentWeek.season}</p>
            </div>
            {/* Edit button — Platinum only for custom weeks */}
            {currentWeek.isCustom && hasPlatinum() && (
              isEditMode ? (
                <button onClick={saveEdits} disabled={editSaving} className="px-3 py-2 rounded-full text-sm font-medium" style={{backgroundColor: c.terra, color: 'white'}}>
                  {editSaving ? <Loader className="w-4 h-4 animate-spin" /> : 'Save'}
                </button>
              ) : (
                <button onClick={() => setIsEditMode(true)} className="p-2 rounded-full" style={{backgroundColor: c.sand}}><Edit3 className="w-5 h-5" style={{color: c.wood}} /></button>
              )
            )}
            <button onClick={() => window.print()} className="p-2 rounded-full" style={{backgroundColor: c.sand}}><Printer className="w-5 h-5" style={{color: c.wood}} /></button>
          </div>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {dayNames.map((d, i) => (
              <button key={i} onClick={() => setSelectedDay(i)} className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap" style={{backgroundColor: selectedDay === i ? c.terra : c.sand, color: selectedDay === i ? 'white' : c.wood}}>{d}</button>
            ))}
          </div>
          
          {currentWeek.teachingPhilosophy && (
            <div className="rounded-xl p-4 mb-4 shadow-md" style={{backgroundColor: '#ecfdf5', border: `1px solid ${c.sand}`}}>
              <button onClick={() => setExpandedPhilosophy(!expandedPhilosophy)} className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2"><span style={{fontSize: '1.25rem'}}>&#127793;</span><h3 className="font-semibold" style={{color: c.wood}}>Teaching Philosophy</h3></div>
                {expandedPhilosophy ? <ChevronUp className="w-5 h-5" style={{color: c.bark}} /> : <ChevronDown className="w-5 h-5" style={{color: c.bark}} />}
              </button>
              {expandedPhilosophy && (isEditMode ? (
                <textarea value={currentWeek.teachingPhilosophy || ''} onChange={e => editWeekField('teachingPhilosophy', e.target.value)} rows={6} className="mt-3 w-full p-3 rounded-lg text-sm border" style={{borderColor: c.terra, color: c.wood}} />
              ) : (
                <div className="mt-3 p-3 rounded-lg whitespace-pre-wrap text-sm" style={{backgroundColor: 'rgba(255,255,255,0.7)', color: c.wood}}>{currentWeek.teachingPhilosophy}</div>
              ))}
            </div>
          )}
          
          {/* Daily Routine */}
          {(() => {
            const weekAges = Array.isArray(currentWeek.ages) ? currentWeek.ages : (currentWeek.ages ? [currentWeek.ages] : []);
            const isInfantOnly = weekAges.length > 0 && weekAges.every(a => a === "0-6m" || a === "6m-1");
            const routineGroup = currentWeek.routineGroup || (isInfantOnly && weekAges.includes("0-6m") ? "0-6" : isInfantOnly ? "6-12" : null);
            const infantRoutine = routineGroup === "0-6" ? infantRoutine0to6 : (routineGroup === "6-12" ? infantRoutine6to12 : null);
            
            if (infantRoutine) {
              return (
                <div className="rounded-xl p-4 mb-4 shadow-md" style={{backgroundColor: '#fffbeb', border: `1px solid ${c.sand}`}}>
                  <button onClick={() => setExpandedDailyRoutine(!expandedDailyRoutine)} className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-2"><Calendar className="w-5 h-5" style={{color: c.terra}} /><h3 className="font-semibold" style={{color: c.wood}}>{infantRoutine.label}</h3></div>
                    {expandedDailyRoutine ? <ChevronUp className="w-5 h-5" style={{color: c.bark}} /> : <ChevronDown className="w-5 h-5" style={{color: c.bark}} />}
                  </button>
                  {expandedDailyRoutine ? (
                    <div className="mt-3 space-y-3 text-sm" style={{color: c.wood}}>
                      {infantRoutine.items.map((item, i) => (<div key={i} className="p-3 rounded-lg" style={{backgroundColor: 'rgba(255,255,255,0.7)'}}><p className="font-semibold mb-1">{i + 1}. {item.title}</p><p className="italic text-sm">{item.description}</p></div>))}
                    </div>
                  ) : (
                    <div className="mt-2 text-sm" style={{color: c.bark}}><p>{infantRoutine.items.map(item => item.title).join(' - ')}</p><p className="text-xs mt-1" style={{color: c.terra}}>Tap to view full instructions</p></div>
                  )}
                </div>
              );
            }
            
            return (
              <div className="rounded-xl p-4 mb-4 shadow-md" style={{backgroundColor: '#fffbeb', border: `1px solid ${c.sand}`}}>
                <button onClick={() => setExpandedDailyRoutine(!expandedDailyRoutine)} className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-2"><Calendar className="w-5 h-5" style={{color: c.terra}} /><h3 className="font-semibold" style={{color: c.wood}}>Daily Routine</h3></div>
                  {expandedDailyRoutine ? <ChevronUp className="w-5 h-5" style={{color: c.bark}} /> : <ChevronDown className="w-5 h-5" style={{color: c.bark}} />}
                </button>
                {expandedDailyRoutine ? (
                  <div className="mt-3 space-y-3 text-sm" style={{color: c.wood}}>
                    <div className="p-3 rounded-lg" style={{backgroundColor: 'rgba(255,255,255,0.7)'}}><p className="font-semibold mb-1">1. Calendar Time</p><p className="italic text-sm">{universalDailyRoutine.calendarTime}</p></div>
                    <div className="p-3 rounded-lg" style={{backgroundColor: 'rgba(255,255,255,0.7)'}}><p className="font-semibold mb-1">2. Counting Practice</p><p className="italic text-sm">{universalDailyRoutine.countingPractice}</p></div>
                    <div className="p-3 rounded-lg" style={{backgroundColor: 'rgba(255,255,255,0.7)'}}><p className="font-semibold mb-1">3. Days of the Week</p><p className="italic text-sm">{universalDailyRoutine.daysOfWeek}</p><a href={universalDailyRoutine.daysOfWeekSong} target="_blank" rel="noopener noreferrer" className="text-xs underline mt-1 inline-block" style={{color: c.terra}}>Days of the Week Song</a></div>
                    <div className="p-3 rounded-lg" style={{backgroundColor: 'rgba(255,255,255,0.7)'}}><p className="font-semibold mb-1">4. Weather Check</p><p className="italic text-sm">{universalDailyRoutine.weatherCheck}</p></div>
                    <div className="p-3 rounded-lg" style={{backgroundColor: 'rgba(255,255,255,0.7)'}}><p className="font-semibold mb-1">5. ABC Practice</p><p className="italic text-sm">{universalDailyRoutine.abcPractice}</p></div>
                  </div>
                ) : (
                  <div className="mt-2 text-sm" style={{color: c.bark}}><p>Calendar - Counting - Days of the Week - Weather - ABCs</p><p className="text-xs mt-1" style={{color: c.terra}}>Tap to view full instructions</p></div>
                )}
              </div>
            );
          })()}
          
          {dayData ? (
            <div className="space-y-4">
              {languageSetting !== 'none' && dayData.frenchWord && (
                <div className="bg-white rounded-xl p-4 shadow-md" style={{border: `1px solid ${c.sand}`}}>
                  <div className="flex items-center gap-2 mb-2"><Globe className="w-5 h-5" style={{color: c.terra}} /><h3 className="font-semibold" style={{color: c.wood}}>{getLanguageLabel()} Word of the Day</h3></div>
                  {isEditMode ? <input value={dayData.frenchWord} onChange={e => editDayField(selectedDay, 'frenchWord', e.target.value)} className="w-full px-2 py-1 rounded-lg border text-lg font-bold" style={{borderColor: c.terra, color: c.terra}} /> : <p className="text-lg font-bold" style={{color: c.terra}}>{dayData.frenchWord}</p>}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-3 shadow-md" style={{border: `1px solid ${c.sand}`}}>
                  <div className="flex items-center gap-1 mb-1"><Lightbulb className="w-4 h-4" style={{color: c.terra}} /><span className="text-xs font-medium" style={{color: c.bark}}>Today's Focus</span></div>
                  {isEditMode ? <input value={dayData.focus} onChange={e => editDayField(selectedDay, 'focus', e.target.value)} className="w-full px-2 py-1 rounded-lg border text-sm" style={{borderColor: c.terra, color: c.wood}} /> : <p className="text-sm font-semibold" style={{color: c.wood}}>{dayData.focus}</p>}
                </div>
                <div className="bg-white rounded-xl p-3 shadow-md" style={{border: `1px solid ${c.sand}`}}>
                  <div className="flex items-center gap-1 mb-1"><MessageSquare className="w-4 h-4" style={{color: c.terra}} /><span className="text-xs font-medium" style={{color: c.bark}}>Question of the Day</span></div>
                  {isEditMode ? <input value={dayData.qotd} onChange={e => editDayField(selectedDay, 'qotd', e.target.value)} className="w-full px-2 py-1 rounded-lg border text-sm" style={{borderColor: c.terra, color: c.wood}} /> : <p className="text-sm font-semibold" style={{color: c.wood}}>{dayData.qotd}</p>}
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md" style={{border: `1px solid ${c.sand}`}}>
                <button onClick={() => setExpandedCircleTime(!expandedCircleTime)} className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-2"><Star className="w-5 h-5" style={{color: c.terra}} /><h3 className="font-semibold" style={{color: c.wood}}>Circle Time Script</h3></div>
                  {expandedCircleTime ? <ChevronUp className="w-5 h-5" style={{color: c.bark}} /> : <ChevronDown className="w-5 h-5" style={{color: c.bark}} />}
                </button>
                {expandedCircleTime && (isEditMode ? (
                  <textarea value={dayData.circleTime} onChange={e => editDayField(selectedDay, 'circleTime', e.target.value)} rows={12} className="mt-3 w-full p-3 rounded-lg border text-sm" style={{borderColor: c.terra, color: c.wood}} />
                ) : (
                  <div className="mt-3 p-3 rounded-lg whitespace-pre-wrap text-sm" style={{backgroundColor: c.cream, color: c.wood}}>{dayData.circleTime}</div>
                ))}
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md" style={{border: `1px solid ${c.sand}`}}>
                <div className="flex items-center gap-2 mb-2"><Music className="w-5 h-5" style={{color: c.terra}} /><h3 className="font-semibold" style={{color: c.wood}}>Song of the Day</h3></div>
                {isEditMode ? (
                  <div className="space-y-2">
                    <input value={dayData.songTitle} onChange={e => editDayField(selectedDay, 'songTitle', e.target.value)} placeholder="Song title" className="w-full px-2 py-1 rounded-lg border text-sm" style={{borderColor: c.terra, color: c.wood}} />
                    <input value={dayData.songLink || ''} onChange={e => editDayField(selectedDay, 'songLink', e.target.value)} placeholder="YouTube link" className="w-full px-2 py-1 rounded-lg border text-sm" style={{borderColor: c.terra, color: c.wood}} />
                  </div>
                ) : (
                  <><p className="font-medium" style={{color: c.wood}}>{dayData.songTitle}</p>{dayData.songLink && dayData.songLink.startsWith('http') && <a href={dayData.songLink} target="_blank" rel="noopener noreferrer" className="text-sm underline" style={{color: c.terra}}>{dayData.songLink.includes('search_query') ? 'Find on YouTube →' : 'Watch on YouTube →'}</a>}</>
                )}
              </div>
              {dayData.learningStations && (
                <div className="bg-white rounded-xl p-4 shadow-md" style={{border: `1px solid ${c.sand}`}}>
                  <div className="flex items-center gap-2 mb-2"><Puzzle className="w-5 h-5" style={{color: c.terra}} /><h3 className="font-semibold" style={{color: c.wood}}>Learning Stations</h3></div>
                  {isEditMode ? (
                    <div className="space-y-2">{dayData.learningStations.map((s, i) => <textarea key={i} value={s} onChange={e => editDayStation(selectedDay, i, e.target.value)} rows={3} className="w-full px-2 py-1 rounded-lg border text-sm" style={{borderColor: c.terra, color: c.wood}} />)}</div>
                  ) : (
                    <ul className="space-y-1">{dayData.learningStations.map((s, i) => <li key={i} className="text-sm" style={{color: c.wood}}><span className="font-bold" style={{color: c.terra}}>{i + 1}.</span> {s}</li>)}</ul>
                  )}
                </div>
              )}
              {dayData.teacherTips && dayData.teacherTips.length > 0 && (
                <div className="rounded-xl p-4 shadow-md" style={{backgroundColor: '#faf5ff', border: `1px solid ${c.sand}`}}>
                  <div className="flex items-center gap-2 mb-2"><Lightbulb className="w-5 h-5" style={{color: '#8b5cf6'}} /><h3 className="font-semibold" style={{color: c.wood}}>Teacher Tips</h3></div>
                  {isEditMode ? (
                    <div className="space-y-2">{dayData.teacherTips.map((tip, i) => <input key={i} value={tip} onChange={e => editDayTip(selectedDay, i, e.target.value)} className="w-full px-2 py-1 rounded-lg border text-sm" style={{borderColor: '#8b5cf6', color: c.wood}} />)}</div>
                  ) : (
                    <ul className="space-y-2">{dayData.teacherTips.map((tip, i) => <li key={i} className="text-sm flex items-start gap-2" style={{color: c.wood}}><span style={{color: '#8b5cf6'}}>*</span>{tip}</li>)}</ul>
                  )}
                </div>
              )}
              {(dayData.outsideTime || isEditMode) && (
                <div className="rounded-xl p-4 shadow-md" style={{backgroundColor: '#ecfdf5', border: `1px solid ${c.sand}`}}>
                  <div className="flex items-center gap-2 mb-2"><Sun className="w-5 h-5" style={{color: '#059669'}} /><h3 className="font-semibold" style={{color: c.wood}}>Outside Time</h3></div>
                  {isEditMode ? <textarea value={dayData.outsideTime || ''} onChange={e => editDayField(selectedDay, 'outsideTime', e.target.value)} rows={3} className="w-full px-2 py-1 rounded-lg border text-sm" style={{borderColor: '#059669', color: c.wood}} /> : <p className="text-sm" style={{color: c.wood}}>{dayData.outsideTime}</p>}
                </div>
              )}
              {(dayData.indoorMovement || isEditMode) && (
                <div className="rounded-xl p-4 shadow-md" style={{backgroundColor: '#fef3c7', border: `1px solid ${c.sand}`}}>
                  <div className="flex items-center gap-2 mb-2"><Home className="w-5 h-5" style={{color: '#d97706'}} /><h3 className="font-semibold" style={{color: c.wood}}>Indoor Movement Alternative</h3></div>
                  {isEditMode ? <textarea value={dayData.indoorMovement || ''} onChange={e => editDayField(selectedDay, 'indoorMovement', e.target.value)} rows={3} className="w-full px-2 py-1 rounded-lg border text-sm" style={{borderColor: '#d97706', color: c.wood}} /> : <p className="text-sm" style={{color: c.wood}}>{dayData.indoorMovement}</p>}
                </div>
              )}
              {dayData.lunch && (
                <div className="bg-white rounded-xl p-4 shadow-md" style={{border: `1px solid ${c.sand}`}}>
                  <div className="flex items-center gap-2 mb-2"><Sun className="w-5 h-5" style={{color: c.terra}} /><h3 className="font-semibold" style={{color: c.wood}}>Lunch Idea</h3></div>
                  {isEditMode ? <input value={dayData.lunch} onChange={e => editDayField(selectedDay, 'lunch', e.target.value)} className="w-full px-2 py-1 rounded-lg border text-sm" style={{borderColor: c.terra, color: c.wood}} /> : <p className="text-sm" style={{color: c.wood}}>{dayData.lunch}</p>}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 shadow-md" style={{border: `1px solid ${c.sand}`}}>
                <button onClick={() => setExpandedCircleTime(!expandedCircleTime)} className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-2"><Sun className="w-5 h-5" style={{color: c.terra}} /><h3 className="font-semibold" style={{color: c.wood}}>Circle Time</h3></div>
                  {expandedCircleTime ? <ChevronUp className="w-5 h-5" style={{color: c.bark}} /> : <ChevronDown className="w-5 h-5" style={{color: c.bark}} />}
                </button>
                {expandedCircleTime && <div className="mt-3 p-3 rounded-lg whitespace-pre-wrap text-sm" style={{backgroundColor: c.cream, color: c.wood}}>{currentWeek.activities?.circleTime}</div>}
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md" style={{border: `1px solid ${c.sand}`}}>
                <div className="flex items-center gap-2 mb-2"><Music className="w-5 h-5" style={{color: c.terra}} /><h3 className="font-semibold" style={{color: c.wood}}>Song of the Day</h3></div>
                <p style={{color: c.bark}}>{currentWeek.activities?.songOfDay?.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-3 shadow-md" style={{border: `1px solid ${c.sand}`}}><p className="text-xs font-medium mb-1" style={{color: c.bark}}>Morning</p><p className="text-sm font-semibold" style={{color: c.wood}}>{currentWeek.activities?.morningActivity}</p></div>
                <div className="bg-white rounded-xl p-3 shadow-md" style={{border: `1px solid ${c.sand}`}}><p className="text-xs font-medium mb-1" style={{color: c.bark}}>Afternoon</p><p className="text-sm font-semibold" style={{color: c.wood}}>{currentWeek.activities?.afternoonActivity}</p></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ACTIVITY LOG */}
      {view === 'activityLog' && (
        <div className="p-4 pb-24">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => navigateTo('dashboard')} className="p-2 rounded-full" style={{backgroundColor: c.sand}}><ChevronLeft className="w-5 h-5" style={{color: c.wood}} /></button>
              <h2 className="text-xl font-bold" style={{color: c.wood}}>Activity Log</h2>
            </div>
            {logViewMode === 'today' && (
              <button onClick={() => { setEditingLog(null); setLogForm({ activity: '', notes: '', childId: '', photos: [] }); setShowLogForm(true); }} className="p-2 rounded-full" style={{backgroundColor: c.terra}}><Plus className="w-5 h-5 text-white" /></button>
            )}
          </div>

          {/* Today / History toggle */}
          <div className="flex gap-2 mb-4">
            {['today', 'history'].map(mode => (
              <button key={mode} onClick={() => setLogViewMode(mode)} className="flex-1 py-2 rounded-lg text-sm font-semibold capitalize" style={{backgroundColor: logViewMode === mode ? c.terra : c.sand, color: logViewMode === mode ? 'white' : c.wood}}>
                {mode === 'today' ? `Today (${getTodayLogs().length})` : `History (${getPastLogs().reduce((sum, g) => sum + g.logs.length, 0)})`}
              </button>
            ))}
          </div>

          {/* TODAY view */}
          {logViewMode === 'today' && (
            <>
              {showLogForm && (
                <div className="bg-white rounded-xl p-4 mb-4 shadow-md" style={{border: `1px solid ${c.sand}`}}>
                  <h3 className="font-semibold mb-3" style={{color: c.wood}}>{editingLog ? 'Edit' : 'Log'} Activity</h3>
                  <div className="space-y-3">
                    <div><label className="text-xs font-medium block mb-1" style={{color: c.bark}}>Activity *</label><input placeholder="e.g., Sensory play, Story time, Outdoor walk" value={logForm.activity} onChange={e => setLogForm({...logForm, activity: e.target.value})} className="w-full px-3 py-2 rounded-lg border" style={{borderColor: c.sand}} /></div>
                    <div><label className="text-xs font-medium block mb-1" style={{color: c.bark}}>Notes</label><textarea placeholder="What happened? How did the child respond?" value={logForm.notes} onChange={e => setLogForm({...logForm, notes: e.target.value})} className="w-full px-3 py-2 rounded-lg border h-20" style={{borderColor: c.sand}} /></div>
                    <div><label className="text-xs font-medium block mb-1" style={{color: c.bark}}>Child</label><select value={logForm.childId} onChange={e => setLogForm({...logForm, childId: e.target.value})} className="w-full px-3 py-2 rounded-lg border" style={{borderColor: c.sand}}>
                    <option value="">All Children</option>
                    {children.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
                  </select></div>
                  </div>
                  <div className="mt-3">
                    <label className="text-xs font-medium block mb-1" style={{color: c.bark}}>Photos</label>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{borderColor: c.sand, color: c.bark}}><Camera className="w-4 h-4" /><span className="text-sm">Add Photos</span></button>
                    {logForm.photos?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {logForm.photos.map(photo => (<div key={photo.id} className="relative"><img src={photo.data} alt="" className="w-16 h-16 object-cover rounded-lg" /><button onClick={() => removePhoto(photo.id)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"><X className="w-3 h-3 text-white" /></button></div>))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={saveLog} className="flex-1 py-2 rounded-lg font-semibold" style={{backgroundColor: c.terra, color: 'white'}}>Save</button>
                    <button onClick={() => { setShowLogForm(false); setEditingLog(null); }} className="px-4 py-2 rounded-lg" style={{backgroundColor: c.sand, color: c.wood}}>Cancel</button>
                  </div>
                </div>
              )}
              <div className="space-y-3">
                {getTodayLogs().length === 0 ? (
                  <div className="text-center py-8"><Edit3 className="w-12 h-12 mx-auto mb-2" style={{color: c.sand}} /><p style={{color: c.bark}}>No activities logged today</p><p className="text-sm mt-1" style={{color: c.bark}}>Tap + to log your first activity</p></div>
                ) : getTodayLogs().map(log => (
                  <div key={log.id} className="bg-white rounded-xl p-4 shadow-md" style={{border: `1px solid ${c.sand}`}}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold" style={{color: c.wood}}>{log.activity}</h3>
                        {log.notes && <p className="text-sm mt-1" style={{color: c.bark}}>{log.notes}</p>}
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="w-3 h-3" style={{color: c.bark}} />
                          <span className="text-xs" style={{color: c.bark}}>{fmtTime(log.timestamp)}</span>
                          {log.childId && <span className="text-xs px-2 py-0.5 rounded-full" style={{backgroundColor: c.sand, color: c.wood}}>{getChildName(log.childId)}</span>}
                        </div>
                        {log.photos?.length > 0 && <div className="flex gap-1 mt-2">{log.photos.map(p => <img key={p.id} src={p.data} alt="" className="w-12 h-12 object-cover rounded" />)}</div>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingLog(log); setLogForm(log); setShowLogForm(true); }}><Edit3 className="w-4 h-4" style={{color: c.bark}} /></button>
                        <button onClick={() => delLog(log.id)}><Trash2 className="w-4 h-4" style={{color: c.terra}} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* HISTORY view */}
          {logViewMode === 'history' && (
            <div className="space-y-5">
              {getPastLogs().length === 0 ? (
                <div className="text-center py-8"><Calendar className="w-12 h-12 mx-auto mb-2" style={{color: c.sand}} /><p style={{color: c.bark}}>No past logs yet</p><p className="text-sm mt-1" style={{color: c.bark}}>Yesterday's logs will appear here automatically</p></div>
              ) : getPastLogs().map(group => (
                <div key={group.date}>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4" style={{color: c.terra}} />
                    <h3 className="font-semibold text-sm" style={{color: c.wood}}>{group.label}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{backgroundColor: c.sand, color: c.bark}}>{group.logs.length} {group.logs.length === 1 ? 'entry' : 'entries'}</span>
                  </div>
                  <div className="space-y-2">
                    {group.logs.map(log => (
                      <div key={log.id} className="bg-white rounded-xl p-3 shadow-sm" style={{border: `1px solid ${c.sand}`}}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm" style={{color: c.wood}}>{log.activity}</h4>
                            {log.notes && <p className="text-xs mt-1" style={{color: c.bark}}>{log.notes}</p>}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs" style={{color: c.bark}}>{fmtTime(log.timestamp)}</span>
                              {log.childId && <span className="text-xs px-2 py-0.5 rounded-full" style={{backgroundColor: c.sand, color: c.wood}}>{getChildName(log.childId)}</span>}
                            </div>
                            {log.photos?.length > 0 && <div className="flex gap-1 mt-2">{log.photos.map(p => <img key={p.id} src={p.data} alt="" className="w-10 h-10 object-cover rounded" />)}</div>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* WRITE LETTER */}
      {view === 'writeLetter' && (
        <div className="p-4 pb-24">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigateTo('dashboard')} className="p-2 rounded-full" style={{backgroundColor: c.sand}}><ChevronLeft className="w-5 h-5" style={{color: c.wood}} /></button>
            <h2 className="text-xl font-bold" style={{color: c.wood}}>Daily Letter</h2>
          </div>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {dayNames.map((d, i) => (
              <button key={i} onClick={() => setSelectedDay(i)} className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap" style={{backgroundColor: selectedDay === i ? c.terra : c.sand, color: selectedDay === i ? 'white' : c.wood}}>{d}</button>
            ))}
          </div>
          <div className="rounded-xl p-3 mb-4" style={{backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0'}}>
            <p className="text-xs font-semibold mb-1" style={{color: '#065f46'}}>What the AI will reference:</p>
            <div className="text-xs space-y-1" style={{color: '#065f46'}}>
              {selectedWeek && <p>📚 Theme: {selectedWeek.theme} — {dayData?.focus || dayNames[selectedDay]}</p>}
              {dayData?.learningStations && <p>🧩 {dayData.learningStations.length} learning stations from today's plan</p>}
              <p>📝 {getTodayLogs().length} activity log{getTodayLogs().length !== 1 ? 's' : ''} from today {getTodayLogs().length > 0 ? '(auto-included)' : ''}</p>
              {selectedWeek?.days && <p>🗓️ Full week context ({selectedWeek.days.filter(d => d.focus).length} days of curriculum)</p>}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 mb-4 shadow-md" style={{border: `1px solid ${c.sand}`}}>
            <label className="text-sm font-medium block mb-2" style={{color: c.wood}}>How was the day?</label>
            <div className="space-y-1 mb-3">
              <p className="text-xs" style={{color: c.bark}}>✏️ Walk us through the day — what did you do first, next, and so on?</p>
              <p className="text-xs" style={{color: c.bark}}>⭐ Any highlights? Funny moments, new skills, something a child said?</p>
              <p className="text-xs" style={{color: c.bark}}>🔀 Anything off-script? Schedule changes, a boo-boo, a mood shift?</p>
              <p className="text-xs" style={{color: c.bark}}>📋 Quick parent updates: meals, naps, bathroom, etc.</p>
            </div>
            <textarea value={letterNotes} onChange={e => setLetterNotes(e.target.value)} placeholder='e.g., We started with circle time and talked about healthy foods. "Child" tried broccoli for the first time and made the funniest face! Then we did a sorting activity with plastic fruits...' className="w-full px-3 py-2 rounded-lg border h-28 text-sm" style={{borderColor: c.sand}} />
          </div>
          {getTodayLogs().length === 0 && !letterNotes.trim() && (
            <div className="rounded-xl p-3 mb-4 flex items-start gap-2" style={{backgroundColor: '#fef3c7', border: '1px solid #fcd34d'}}>
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{color: '#d97706'}} />
              <p className="text-xs" style={{color: '#92400e'}}>No activity logs or notes yet. The letter will be based only on the lesson plan. Add a few notes above about how the day actually went for a more personal, accurate letter.</p>
            </div>
          )}
          <div className="flex gap-2 mb-4">
            <button onClick={generateAILetter} disabled={isGeneratingLetter} className="flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50" style={{backgroundColor: c.terra, color: 'white'}}>
              {isGeneratingLetter ? <><Loader className="w-5 h-5 animate-spin" />Generating...</> : <><Sparkles className="w-5 h-5" />Generate Letter</>}
            </button>
            <button onClick={genTemplateLetter} className="px-4 py-3 rounded-xl font-semibold" style={{backgroundColor: c.sand, color: c.wood}}>Template</button>
          </div>
          {aiError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div><p className="text-sm font-medium text-red-800">AI generation failed</p><p className="text-xs text-red-600">{aiError}</p></div>
            </div>
          )}
          <div className="bg-white rounded-xl p-4 shadow-md" style={{border: `1px solid ${c.sand}`}}>
            <textarea value={letter} onChange={e => setLetter(e.target.value)} className="w-full h-96 p-3 rounded-lg border resize-none" style={{borderColor: c.sand, color: c.wood}} placeholder="Click 'Generate with AI' or 'Template' to create your letter..." />
            <div className="flex gap-2 mt-3">
              <button onClick={() => navigator.clipboard.writeText(letter)} className="flex-1 py-2 rounded-lg font-semibold flex items-center justify-center gap-2" style={{backgroundColor: c.dune, color: c.wood}}><Copy className="w-4 h-4" />Copy</button>
              <button className="flex-1 py-2 rounded-lg font-semibold flex items-center justify-center gap-2" style={{backgroundColor: c.terra, color: 'white'}}><Send className="w-4 h-4" />Send</button>
            </div>
          </div>
        </div>
      )}

      {/* CHILDREN */}
      {view === 'children' && (
        <div className="p-4 pb-24">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => navigateTo('dashboard')} className="p-2 rounded-full" style={{backgroundColor: c.sand}}><ChevronLeft className="w-5 h-5" style={{color: c.wood}} /></button>
              <h2 className="text-xl font-bold" style={{color: c.wood}}>Children</h2>
            </div>
            <button onClick={() => { setEditingChild(null); setChildForm({ name: '', age: '', birthday: '', allergies: '', parentName: '', parentEmail: '', parentPhone: '', notes: '', gender: '' }); setShowChildForm(true); }} className="p-2 rounded-full" style={{backgroundColor: c.terra}}><Plus className="w-5 h-5 text-white" /></button>
          </div>
          {showChildForm && (
            <div className="bg-white rounded-xl p-4 mb-4 shadow-md" style={{border: `1px solid ${c.sand}`}}>
              <h3 className="font-semibold mb-3" style={{color: c.wood}}>{editingChild ? 'Edit' : 'Add'} Child</h3>
              <div className="space-y-3">
                <div><label className="text-xs font-medium block mb-1" style={{color: c.bark}}>Name *</label><input placeholder="Child's name" value={childForm.name} onChange={e => setChildForm({...childForm, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border" style={{borderColor: c.sand}} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-xs font-medium block mb-1" style={{color: c.bark}}>Age</label><input placeholder="e.g., 2 years" value={childForm.age} onChange={e => setChildForm({...childForm, age: e.target.value})} className="w-full px-3 py-2 rounded-lg border" style={{borderColor: c.sand}} /></div>
                  <div><label className="text-xs font-medium block mb-1" style={{color: c.bark}}>Birthday</label><input placeholder="MM/DD/YYYY" value={childForm.birthday} onChange={e => setChildForm({...childForm, birthday: e.target.value})} className="w-full px-3 py-2 rounded-lg border" style={{borderColor: c.sand}} /></div>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{color: c.bark}}>Gender</label>
                  <div className="flex gap-2">
                    {[{value: '', label: 'Not set'}, {value: 'he', label: 'Boy'}, {value: 'she', label: 'Girl'}, {value: 'they', label: 'Other'}].map(opt => (
                      <button key={opt.value} type="button" onClick={() => setChildForm({...childForm, gender: opt.value})} className="flex-1 py-2 rounded-lg text-xs font-medium" style={{backgroundColor: childForm.gender === opt.value ? c.terra : c.sand, color: childForm.gender === opt.value ? 'white' : c.wood}}>{opt.label}</button>
                    ))}
                  </div>
                </div>
                <div><label className="text-xs font-medium block mb-1" style={{color: c.bark}}>Allergies</label><input placeholder="Any food or environmental allergies" value={childForm.allergies} onChange={e => setChildForm({...childForm, allergies: e.target.value})} className="w-full px-3 py-2 rounded-lg border" style={{borderColor: c.sand}} /></div>
                <div><label className="text-xs font-medium block mb-1" style={{color: c.bark}}>Parent/Guardian Name</label><input placeholder="Parent's full name" value={childForm.parentName} onChange={e => setChildForm({...childForm, parentName: e.target.value})} className="w-full px-3 py-2 rounded-lg border" style={{borderColor: c.sand}} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-xs font-medium block mb-1" style={{color: c.bark}}>Parent Email</label><input placeholder="email@example.com" value={childForm.parentEmail} onChange={e => setChildForm({...childForm, parentEmail: e.target.value})} className="w-full px-3 py-2 rounded-lg border" style={{borderColor: c.sand}} /></div>
                  <div><label className="text-xs font-medium block mb-1" style={{color: c.bark}}>Parent Phone</label><input placeholder="(555) 555-5555" value={childForm.parentPhone} onChange={e => setChildForm({...childForm, parentPhone: e.target.value})} className="w-full px-3 py-2 rounded-lg border" style={{borderColor: c.sand}} /></div>
                </div>
                <div><label className="text-xs font-medium block mb-1" style={{color: c.bark}}>Notes</label><textarea placeholder="Nap schedule, routines, preferences, etc." value={childForm.notes} onChange={e => setChildForm({...childForm, notes: e.target.value})} className="w-full px-3 py-2 rounded-lg border h-20" style={{borderColor: c.sand}} /></div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={saveChild} className="flex-1 py-2 rounded-lg font-semibold" style={{backgroundColor: c.terra, color: 'white'}}>Save</button>
                <button onClick={() => { setShowChildForm(false); setEditingChild(null); }} className="px-4 py-2 rounded-lg" style={{backgroundColor: c.sand, color: c.wood}}>Cancel</button>
              </div>
            </div>
          )}
          <div className="space-y-3">
            {children.length === 0 ? (
              <div className="text-center py-8"><Users className="w-12 h-12 mx-auto mb-2" style={{color: c.sand}} /><p style={{color: c.bark}}>No children added yet</p></div>
            ) : children.map(ch => (
              <div key={ch.id} className="bg-white rounded-xl p-4 shadow-md" style={{border: `1px solid ${c.sand}`}}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold" style={{color: c.wood}}>{ch.name}</h3>
                    {ch.age && <p className="text-sm" style={{color: c.bark}}>Age: {ch.age}</p>}
                    {ch.allergies && <p className="text-sm text-red-600">⚠️ {ch.allergies}</p>}
                    {ch.parentName && <p className="text-xs mt-2" style={{color: c.bark}}>Parent: {ch.parentName}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingChild(ch); setChildForm(ch); setShowChildForm(true); }}><Edit3 className="w-4 h-4" style={{color: c.bark}} /></button>
                    <button onClick={() => delChild(ch.id)}><Trash2 className="w-4 h-4" style={{color: c.terra}} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MILESTONES */}
      {view === 'milestones' && (
        <div className="p-4 pb-24">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => navigateTo('dashboard')} className="p-2 rounded-full" style={{backgroundColor: c.sand}}><ChevronLeft className="w-5 h-5" style={{color: c.wood}} /></button>
              <h2 className="text-xl font-bold" style={{color: c.wood}}>Milestones</h2>
            </div>
            <button onClick={() => setShowMilestoneForm(true)} className="p-2 rounded-full" style={{backgroundColor: c.terra}}><Plus className="w-5 h-5 text-white" /></button>
          </div>
          {showMilestoneForm && (
            <div className="bg-white rounded-xl p-4 mb-4 shadow-md" style={{border: `1px solid ${c.sand}`}}>
              <h3 className="font-semibold mb-3" style={{color: c.wood}}>Record Milestone</h3>
              <div className="space-y-3">
                <div><label className="text-xs font-medium block mb-1" style={{color: c.bark}}>Milestone *</label><input placeholder="e.g., First steps, Said 'mama', Stacked 3 blocks" value={milestoneForm.title} onChange={e => setMilestoneForm({...milestoneForm, title: e.target.value})} className="w-full px-3 py-2 rounded-lg border" style={{borderColor: c.sand}} /></div>
                <div><label className="text-xs font-medium block mb-1" style={{color: c.bark}}>Child</label><select value={milestoneForm.childId} onChange={e => setMilestoneForm({...milestoneForm, childId: e.target.value})} className="w-full px-3 py-2 rounded-lg border" style={{borderColor: c.sand}}>
                <option value="">Select Child</option>
                {children.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
              </select></div>
                <div><label className="text-xs font-medium block mb-1" style={{color: c.bark}}>Notes</label><textarea placeholder="Context, observations, how it happened" value={milestoneForm.notes} onChange={e => setMilestoneForm({...milestoneForm, notes: e.target.value})} className="w-full px-3 py-2 rounded-lg border h-20" style={{borderColor: c.sand}} /></div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={saveMilestone} className="flex-1 py-2 rounded-lg font-semibold" style={{backgroundColor: c.terra, color: 'white'}}>Save</button>
                <button onClick={() => setShowMilestoneForm(false)} className="px-4 py-2 rounded-lg" style={{backgroundColor: c.sand, color: c.wood}}>Cancel</button>
              </div>
            </div>
          )}
          <div className="space-y-3">
            {milestones.length === 0 ? (
              <div className="text-center py-8"><TrendingUp className="w-12 h-12 mx-auto mb-2" style={{color: c.sand}} /><p style={{color: c.bark}}>No milestones recorded yet</p></div>
            ) : milestones.map(m => (
              <div key={m.id} className="bg-white rounded-xl p-4 shadow-md" style={{border: `1px solid ${c.sand}`}}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold" style={{color: c.wood}}>{m.title}</h3>
                    {m.notes && <p className="text-sm mt-1" style={{color: c.bark}}>{m.notes}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs" style={{color: c.bark}}>{fmtDate(m.date)}</span>
                      {m.childId && <span className="text-xs px-2 py-0.5 rounded-full" style={{backgroundColor: c.sand, color: c.wood}}>{getChildName(m.childId)}</span>}
                    </div>
                  </div>
                  <button onClick={() => delMilestone(m.id)}><Trash2 className="w-4 h-4" style={{color: c.terra}} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CUSTOM WEEK — Platinum only */}
      {view === 'customWeek' && (
        hasPlatinum() ? (
          <div className="p-4 pb-24">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => navigateTo('weeklyThemes')} className="p-2 rounded-full" style={{backgroundColor: c.sand}}><ChevronLeft className="w-5 h-5" style={{color: c.wood}} /></button>
              <h2 className="text-xl font-bold" style={{color: c.wood}}>Create Custom Week</h2>
            </div>
            <div className="bg-white rounded-xl p-4 mb-4 shadow-md" style={{border: `2px solid ${c.terra}`}}>
              <div className="flex items-center gap-2 mb-3"><Sparkles className="w-5 h-5" style={{color: c.terra}} /><h3 className="font-semibold" style={{color: c.wood}}>Generate with AI</h3></div>
              <p className="text-sm mb-2" style={{color: c.bark}}>Select an age group, enter a topic, and let AI create a full week's curriculum!</p>
              {!isAdmin && <p className="text-xs mb-3 font-medium" style={{color: monthlyWeeksRemaining <= 3 ? '#ef4444' : c.bark}}>{monthlyWeeksRemaining} of {MONTHLY_WEEK_LIMIT} custom weeks remaining this month</p>}
              <div className="flex gap-2 mb-3">
                {['0-6m', '6m-1', '1-2', '2-3', '3-4', '4-5'].map(age => (
                  <button key={age} onClick={() => toggleAgeGroup(age)} className="flex-1 py-2 rounded-lg text-sm font-medium" style={{backgroundColor: weekAgeGroup.includes(age) ? c.terra : c.sand, color: weekAgeGroup.includes(age) ? 'white' : c.wood}}>{age === '0-6m' ? '0–6m' : age === '6m-1' ? '6m–1yr' : age + ' yrs'}</button>
                ))}
              {weekAgeGroup.length > 1 && (
                <p className="text-xs mt-2 font-medium" style={{color: c.terra}}>
                  ✶ Multi-age: Activities will include adaptations for each age group
                </p>
              )}
              </div>
              <div className="flex gap-2">
                <input placeholder="e.g., Butterflies, Space, Cooking, Kindness..." value={weekTopic} onChange={e => setWeekTopic(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border" style={{borderColor: c.sand}} onKeyDown={e => e.key === 'Enter' && !isGeneratingWeek && weekTopic.trim() && generateAIWeek()} />
                <button onClick={generateAIWeek} disabled={isGeneratingWeek || !weekTopic.trim() || monthlyWeeksRemaining <= 0} className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50" style={{backgroundColor: c.terra, color: 'white'}}>
                  {isGeneratingWeek ? <><Loader className="w-4 h-4 animate-spin" />...</> : <><Sparkles className="w-4 h-4" />Generate</>}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{backgroundColor: c.sand}}></div>
              <span className="text-sm" style={{color: c.bark}}>or build manually</span>
              <div className="flex-1 h-px" style={{backgroundColor: c.sand}}></div>
            </div>
            <div className="bg-white rounded-xl p-4 mb-4 shadow-md space-y-3" style={{border: `1px solid ${c.sand}`}}>
              <input placeholder="Theme Name" value={newWeek.theme} onChange={e => updWeek('theme', e.target.value)} className="w-full px-3 py-2 rounded-lg border" style={{borderColor: c.sand}} />
              <div className="grid grid-cols-2 gap-2">
                <select value={newWeek.season} onChange={e => updWeek('season', e.target.value)} className="px-3 py-2 rounded-lg border" style={{borderColor: c.sand}}>
                  <option value="">Season</option>
                  {['Any', 'Spring', 'Summer', 'Fall', 'Winter', 'Spring/Summer', 'Fall/Winter'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input placeholder="Focus Area" value={newWeek.focus} onChange={e => updWeek('focus', e.target.value)} className="px-3 py-2 rounded-lg border" style={{borderColor: c.sand}} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2" style={{color: c.wood}}>Days to Include</label>
                <div className="flex gap-1">
                  {['M','T','W','T','F','S','S'].map((d, i) => (
                    <button key={i} onClick={() => togDay(i)} className="w-9 h-9 rounded-full text-sm font-medium" style={{backgroundColor: newWeek.daysToInclude[i] ? c.terra : c.sand, color: newWeek.daysToInclude[i] ? 'white' : c.wood}}>{d}</button>
                  ))}
                </div>
              </div>
            </div>
            {activeDays.length > 0 && (
              <>
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  {activeDays.map((d, i) => (
                    <button key={i} onClick={() => setDayIdx(i)} className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap" style={{backgroundColor: dayIdx === i ? c.terra : c.sand, color: dayIdx === i ? 'white' : c.wood}}>{d.name}</button>
                  ))}
                </div>
                <div className="bg-white rounded-xl p-4 mb-4 shadow-md space-y-3" style={{border: `1px solid ${c.sand}`}}>
                  <h3 className="font-semibold" style={{color: c.wood}}>{currentDay.name} Activities</h3>
                  <input placeholder="Focus of the Day" value={currentDay.activities.focusOfDay || ''} onChange={e => updDay(currentDayIndex, 'focusOfDay', e.target.value)} className="w-full px-3 py-2 rounded-lg border" style={{borderColor: c.sand}} />
                  <input placeholder="Question of the Day" value={currentDay.activities.questionOfDay || ''} onChange={e => updDay(currentDayIndex, 'questionOfDay', e.target.value)} className="w-full px-3 py-2 rounded-lg border" style={{borderColor: c.sand}} />
                  {languageSetting !== 'none' && (
                    <div className="flex items-center gap-2"><Globe className="w-4 h-4 flex-shrink-0" style={{color: c.terra}} /><input placeholder={`${getLanguageLabel()} Word`} value={currentDay.activities.vocabWord || ''} onChange={e => updDay(currentDayIndex, 'vocabWord', e.target.value)} className="flex-1 px-3 py-2 rounded-lg border" style={{borderColor: c.sand}} /></div>
                  )}
                  <textarea placeholder="Circle Time Script" value={currentDay.activities.circleTime || ''} onChange={e => updDay(currentDayIndex, 'circleTime', e.target.value)} className="w-full px-3 py-2 rounded-lg border h-24" style={{borderColor: c.sand}} />
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Song Title" value={currentDay.activities.songOfDay.title} onChange={e => updSong(currentDayIndex, 'title', e.target.value)} className="px-3 py-2 rounded-lg border" style={{borderColor: c.sand}} />
                    <input placeholder="Song Link" value={currentDay.activities.songOfDay.link} onChange={e => updSong(currentDayIndex, 'link', e.target.value)} className="px-3 py-2 rounded-lg border" style={{borderColor: c.sand}} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2"><label className="text-sm font-medium" style={{color: c.wood}}>Morning Activities</label><button onClick={() => addMorn(currentDayIndex)} className="text-sm" style={{color: c.terra}}>+ Add</button></div>
                    {currentDay.activities.morningActivities.map((a, i) => (<div key={i} className="flex gap-2 mb-2"><input value={a} onChange={e => updMorn(currentDayIndex, i, e.target.value)} className="flex-1 px-3 py-2 rounded-lg border" style={{borderColor: c.sand}} placeholder={`Activity ${i + 1}`} />{currentDay.activities.morningActivities.length > 1 && <button onClick={() => remMorn(currentDayIndex, i)} className="p-2"><X className="w-4 h-4" style={{color: c.terra}} /></button>}</div>))}
                  </div>
                  <input placeholder="Lunch" value={currentDay.activities.lunch} onChange={e => updDay(currentDayIndex, 'lunch', e.target.value)} className="w-full px-3 py-2 rounded-lg border" style={{borderColor: c.sand}} />
                  <div>
                    <div className="flex items-center justify-between mb-2"><label className="text-sm font-medium" style={{color: c.wood}}>Afternoon Activities</label><button onClick={() => addAftn(currentDayIndex)} className="text-sm" style={{color: c.terra}}>+ Add</button></div>
                    {currentDay.activities.afternoonActivities.map((a, i) => (<div key={i} className="flex gap-2 mb-2"><input value={a} onChange={e => updAftn(currentDayIndex, i, e.target.value)} className="flex-1 px-3 py-2 rounded-lg border" style={{borderColor: c.sand}} placeholder={`Activity ${i + 1}`} />{currentDay.activities.afternoonActivities.length > 1 && <button onClick={() => remAftn(currentDayIndex, i)} className="p-2"><X className="w-4 h-4" style={{color: c.terra}} /></button>}</div>))}
                  </div>
                </div>
              </>
            )}
            <button onClick={saveCustomWeek} disabled={!newWeek.theme || !newWeek.season || !newWeek.focus} className="w-full py-3 rounded-xl font-semibold disabled:opacity-50" style={{backgroundColor: c.terra, color: 'white'}}>Save Custom Week</button>
          </div>
        ) : (
          <div className="p-4 pb-24">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => navigateTo('weeklyThemes')} className="p-2 rounded-full" style={{backgroundColor: c.sand}}><ChevronLeft className="w-5 h-5" style={{color: c.wood}} /></button>
              <h2 className="text-xl font-bold" style={{color: c.wood}}>Create Custom Week</h2>
            </div>
            <div className="text-center py-12">
              <Lock className="w-16 h-16 mx-auto mb-4" style={{color: c.sand}} />
              <h3 className="text-lg font-bold mb-2" style={{color: c.wood}}>Platinum Feature</h3>
              <p className="text-sm mb-6" style={{color: c.bark}}>The AI curriculum generator and custom week creator are available with a Platinum subscription.</p>
              <button onClick={() => navigateTo('pricing')} className="px-6 py-3 rounded-xl font-semibold text-white" style={{backgroundColor: c.terra}}>Upgrade to Platinum</button>
            </div>
          </div>
        )
      )}

      {/* SETTINGS */}
      {view === 'settings' && (
        <div className="p-4 pb-24">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigateTo('dashboard')} className="p-2 rounded-full" style={{backgroundColor: c.sand}}><ChevronLeft className="w-5 h-5" style={{color: c.wood}} /></button>
            <h2 className="text-xl font-bold" style={{color: c.wood}}>Settings</h2>
          </div>
          
          {/* Subscription Info */}
          <div className="bg-white rounded-xl p-4 mb-4 shadow-md" style={{border: `1px solid ${c.sand}`}}>
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5" style={{color: c.terra}} />
              <h3 className="font-semibold" style={{color: c.wood}}>Subscription</h3>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: hasPlatinum() ? c.terra : hasGold() ? '#fbbf24' : c.sand}}>
                {hasPlatinum() ? <Crown className="w-5 h-5 text-white" /> : hasGold() ? <Star className="w-5 h-5 text-white" /> : <Lock className="w-5 h-5" style={{color: c.wood}} />}
              </div>
              <div>
                <p className="font-semibold" style={{color: c.wood}}>
                  {hasPlatinum() ? 'Platinum' : hasGold() ? 'Gold' : 'No Active Plan'}
                  {subscription.isAgency ? ' (Agency)' : ''}
                </p>
                <p className="text-xs" style={{color: c.bark}}>
                  {subscription.status === 'active' ? 'Active' : subscription.status === 'past_due' ? 'Payment past due' : subscription.status === 'trialing' ? 'Trial' : 'Inactive'}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {hasGold() && !subscription.isAgency && (
                <button onClick={openCustomerPortal} className="w-full py-2 rounded-lg font-semibold flex items-center justify-center gap-2" style={{backgroundColor: c.sand, color: c.wood}}>
                  <CreditCard className="w-4 h-4" />Manage Billing
                </button>
              )}
              {hasGold() && !hasPlatinum() && (
                <button onClick={() => navigateTo('pricing')} className="w-full py-2 rounded-lg font-semibold flex items-center justify-center gap-2" style={{backgroundColor: c.terra, color: 'white'}}>
                  <Crown className="w-4 h-4" />Upgrade to Platinum
                </button>
              )}
              {!hasGold() && (
                <button onClick={() => navigateTo('pricing')} className="w-full py-2 rounded-lg font-semibold" style={{backgroundColor: c.terra, color: 'white'}}>Choose a Plan</button>
              )}
            </div>
          </div>

          {/* Language Settings */}
          <div className="bg-white rounded-xl p-4 mb-4 shadow-md" style={{border: `1px solid ${c.sand}`}}>
            <div className="flex items-center gap-2 mb-4"><Globe className="w-5 h-5" style={{color: c.terra}} /><h3 className="font-semibold" style={{color: c.wood}}>Language Learning</h3></div>
            <p className="text-sm mb-4" style={{color: c.bark}}>Choose which language vocabulary to display in daily lesson plans.</p>
            <div className="space-y-2">
              {[{ value: 'none', label: 'None', desc: 'Hide language section' }, { value: 'french', label: 'French', desc: 'Display French vocabulary' }, { value: 'spanish', label: 'Spanish', desc: 'Display Spanish vocabulary' }, { value: 'custom', label: 'Custom', desc: 'Use your own language name' }].map(opt => (
                <button key={opt.value} onClick={() => saveLanguageSettings(opt.value, opt.value === 'custom' ? customLanguageName : '')} className="w-full p-3 rounded-lg text-left flex items-center justify-between" style={{backgroundColor: languageSetting === opt.value ? c.terra : c.cream, color: languageSetting === opt.value ? 'white' : c.wood}}>
                  <div><p className="font-medium">{opt.label}</p><p className="text-xs opacity-80">{opt.desc}</p></div>
                  {languageSetting === opt.value && <Star className="w-5 h-5" />}
                </button>
              ))}
            </div>
            {languageSetting === 'custom' && (
              <div className="mt-4"><label className="text-sm font-medium block mb-2" style={{color: c.wood}}>Custom Language Name</label><input placeholder="e.g., ASL, Mandarin, German..." value={customLanguageName} onChange={e => saveLanguageSettings('custom', e.target.value)} className="w-full px-3 py-2 rounded-lg border" style={{borderColor: c.sand}} /></div>
            )}
          </div>
          
          {/* Account */}
          <div className="bg-white rounded-xl p-4 shadow-md" style={{border: `1px solid ${c.sand}`}}>
            <div className="flex items-center gap-2 mb-4"><User className="w-5 h-5" style={{color: c.terra}} /><h3 className="font-semibold" style={{color: c.wood}}>Account</h3></div>
            <div className="space-y-2">
              <p className="text-sm" style={{color: c.bark}}>Signed in as: <strong style={{color: c.wood}}>{currentUser?.email}</strong></p>
              <button onClick={handleLogout} className="w-full py-2 rounded-lg font-semibold flex items-center justify-center gap-2" style={{backgroundColor: c.sand, color: c.wood}}><LogOut className="w-4 h-4" />Sign Out</button>
            </div>
          </div>
        </div>
      )}

      </div>{/* end transition wrapper */}

      {/* Bottom Navigation Bar */}
      {view !== 'pricing' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg" style={{borderTop: `1px solid ${c.sand}`, zIndex: 50}}>
          <div className="max-w-lg mx-auto flex justify-around items-center py-2 px-1">
            {[
              { tab: 'home', view: 'dashboard', icon: Home, label: 'Home' },
              { tab: 'curriculum', view: 'dailyPlan', icon: BookOpen, label: 'Curriculum' },
              { tab: 'log', view: 'activityLog', icon: Edit3, label: 'Log' },
              { tab: 'letter', view: 'writeLetter', icon: MessageSquare, label: 'Letter' },
              { tab: 'settings', view: 'settings', icon: Settings, label: 'Settings' },
            ].map(({ tab, view: targetView, icon: Icon, label }) => {
              const isActive = getActiveTab() === tab;
              return (
                <button key={tab} onClick={() => targetView === 'writeLetter' ? navigateToLetter() : navigateTo(targetView)} className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all" style={{minWidth: '56px'}}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={{backgroundColor: isActive ? c.terra : 'transparent'}}>
                    <Icon className="w-4 h-4" style={{color: isActive ? 'white' : c.bark}} />
                  </div>
                  <span className="text-xs font-medium" style={{color: isActive ? c.terra : c.bark}}>{label}</span>
                </button>
              );
            })}
          </div>
          {/* Safe area for devices with home indicators */}
          <div className="h-safe-area" style={{paddingBottom: 'env(safe-area-inset-bottom, 0px)'}} />
        </div>
      )}
    </div>
  );
};

export default App;
