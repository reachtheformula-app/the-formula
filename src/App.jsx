import React, { useState, useEffect, useRef } from 'react';
import { Calendar, BookOpen, MessageSquare, TrendingUp, Plus, ChevronRight, ChevronLeft, Clock, Music, Book, Sun, Edit3, Send, Sparkles, Users, Trash2, X, Printer, Copy, AlertCircle, Globe, Star, Lightbulb, Search, Filter, Camera, Loader, ChevronDown, ChevronUp, Settings, LogOut, User, Home, Puzzle, CreditCard, Crown, Shield, Check, Lock } from 'lucide-react';

const App = () => {
  // Auth state — Netlify Identity
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  // Subscription state
  const [subscription, setSubscription] = useState({ tier: 'none', status: 'inactive', isAgency: false, loading: true });
  const [checkoutMessage, setCheckoutMessage] = useState(null);

  // App state
  const [view, setView] = useState('dashboard');
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [letter, setLetter] = useState('');
  const [letterTone, setLetterTone] = useState('warm');
  const [customWeeks, setCustomWeeks] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [loadingWeeks, setLoadingWeeks] = useState(true);
  const [children, setChildren] = useState([]);
  const [logs, setLogs] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [showChildForm, setShowChildForm] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [editingChild, setEditingChild] = useState(null);
  const [editingLog, setEditingLog] = useState(null);
  const [childForm, setChildForm] = useState({ name: '', age: '', birthday: '', allergies: '', parentName: '', parentEmail: '', parentPhone: '', notes: '' });
  const [logForm, setLogForm] = useState({ activity: '', notes: '', childId: '', photos: [] });
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
  const [weekAgeGroup, setWeekAgeGroup] = useState('2-3');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const fileInputRef = useRef(null);
  
  const emptyDay = { focusOfDay: '', questionOfDay: '', circleTime: '', songOfDay: { title: '', link: '' }, morningActivities: [''], lunch: '', afternoonActivities: [''], vocabWord: '', teacherTips: [], outsideTime: '', indoorMovement: '' };
  const [newWeek, setNewWeek] = useState({ theme: '', season: '', focus: '', daysToInclude: [1,1,1,1,1,0,0], days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(n => ({ name: n, activities: {...emptyDay} })) });
  
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
    try {
      const resp = await fetch(`/.netlify/functions/check-subscription?userId=${userId}`);
      const data = await resp.json();
      setSubscription({ tier: data.tier || 'none', status: data.status || 'inactive', isAgency: data.isAgency || false, loading: false });
    } catch (err) {
      console.error('Failed to check subscription:', err);
      setSubscription(prev => ({ ...prev, loading: false }));
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
      return {
        id: netlifyUser.id,
        name: netlifyUser.user_metadata?.full_name || netlifyUser.user_metadata?.name || netlifyUser.user_metadata?.preferred_username || netlifyUser.email?.split('@')[0] || 'User',
        email: netlifyUser.email
      };
    };

    netlifyIdentity.on('init', (user) => {
      if (user) {
        const mapped = mapUser(user);
        setCurrentUser(mapped);
        setIsAuthenticated(true);
        checkSubscription(mapped.id);
        load(mapped);
      } else {
        setSubscription(prev => ({ ...prev, loading: false }));
      }
      setAuthReady(true);
    });

    netlifyIdentity.on('login', (user) => {
      const mapped = mapUser(user);
      setCurrentUser(mapped);
      setIsAuthenticated(true);
      checkSubscription(mapped.id);
      load(mapped);
      netlifyIdentity.close();
    });

    netlifyIdentity.on('logout', () => {
      setCurrentUser(null);
      setIsAuthenticated(false);
      setSubscription({ tier: 'none', status: 'inactive', isAgency: false, loading: false });
      setCustomWeeks([]);
      setChildren([]);
      setLogs([]);
      setMilestones([]);
      setSelectedWeek(null);
      setView('dashboard');
      setCheckoutMessage(null);
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

  const handleLogout = () => {
    const netlifyIdentity = window.netlifyIdentity;
    if (netlifyIdentity) netlifyIdentity.logout();
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
    fetch(`/.netlify/functions/user-weeks?userId=${u.id}`)
      .then(res => res.json())
      .then(rows => {
        if (Array.isArray(rows) && rows.length > 0) {
          const dbWeeks = rows.map(r => ({
            id: r.id, theme: r.theme, season: r.season, focus: r.focus, ages: r.age_group,
            isCustom: true, hasRichData: true, teachingPhilosophy: r.teaching_philosophy || '',
            days: typeof r.days === 'string' ? JSON.parse(r.days) : r.days,
            activities: (() => {
              const days = typeof r.days === 'string' ? JSON.parse(r.days) : r.days;
              const d1 = days[0] || {};
              return { circleTime: d1.circleTime || '', songOfDay: { title: d1.songTitle || '', link: d1.songLink || '' }, morningActivity: (d1.learningStations || [])[0] || '', lunch: d1.lunch || '', afternoonActivity: (d1.learningStations || [])[1] || '' };
            })()
          }));
          setCustomWeeks(dbWeeks);
        }
      })
      .catch(err => console.error('Failed to load custom weeks:', err));
    try {
      const settingsKeys = ['fc', 'fl', 'fm', 'fs', 'fls'];
      const data = settingsKeys.map(k => { const item = localStorage.getItem(getStorageKey(k, u)); return item ? JSON.parse(item) : null; });
      if (data[0]) setChildren(data[0]);
      if (data[1]) setLogs(data[1]);
      if (data[2]) setMilestones(data[2]);
      if (data[3]) { const w = [...weeks].find(x => x.id === data[3]); if (w) setSelectedWeek(w); }
      if (data[4]) { setLanguageSetting(data[4].language || 'none'); setCustomLanguageName(data[4].customName || ''); }
    } catch (e) { console.error('Load error:', e); }
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
  const fmtTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const fmtDate = (ts) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const getLanguageLabel = () => { if (languageSetting === 'none') return null; if (languageSetting === 'french') return 'French'; if (languageSetting === 'spanish') return 'Spanish'; if (languageSetting === 'custom') return customLanguageName || 'Language'; return 'Language'; };
  const saveLanguageSettings = (lang, customName = '') => { setLanguageSetting(lang); setCustomLanguageName(customName); save('fls', { language: lang, customName }); };
  const allSeasons = ['All', ...new Set(weeks.map(w => w.season))];
  const allFocusAreas = ['All', ...new Set(weeks.map(w => w.focus))];

  const filteredWeeks = [...weeks, ...customWeeks].filter(w => {
    const matchesSearch = searchTerm === '' || w.theme.toLowerCase().includes(searchTerm.toLowerCase()) || w.focus.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeason = filterSeason === 'All' || w.season === filterSeason || (w.season && w.season.includes(filterSeason));
    const matchesFocus = filterFocus === 'All' || w.focus === filterFocus;
    const matchesAge = ageFilter === 'all' || (w.ages && w.ages.includes(ageFilter));
    return matchesSearch && matchesSeason && matchesFocus && matchesAge;
  });

  const saveChild = () => { if (!childForm.name) return; const n = editingChild ? children.map(x => x.id === editingChild.id ? { ...childForm, id: editingChild.id } : x) : [...children, { ...childForm, id: Date.now() }]; setChildren(n); save('fc', n); setChildForm({ name: '', age: '', birthday: '', allergies: '', parentName: '', parentEmail: '', parentPhone: '', notes: '' }); setEditingChild(null); setShowChildForm(false); };
  const delChild = (id) => { const n = children.filter(x => x.id !== id); setChildren(n); save('fc', n); };
  const handlePhotoUpload = (e) => { const files = Array.from(e.target.files); files.forEach(file => { const reader = new FileReader(); reader.onloadend = () => setLogForm(prev => ({ ...prev, photos: [...(prev.photos || []), { id: Date.now() + Math.random(), data: reader.result, name: file.name }] })); reader.readAsDataURL(file); }); };
  const removePhoto = (photoId) => setLogForm(prev => ({ ...prev, photos: prev.photos.filter(p => p.id !== photoId) }));
  const saveLog = () => { if (!logForm.activity) return; const n = editingLog ? logs.map(l => l.id === editingLog.id ? { ...logForm, id: editingLog.id, timestamp: editingLog.timestamp } : l) : [{ ...logForm, id: Date.now(), timestamp: new Date().toISOString() }, ...logs]; setLogs(n); save('fl', n); setLogForm({ activity: '', notes: '', childId: '', photos: [] }); setEditingLog(null); setShowLogForm(false); };
  const delLog = (id) => { const n = logs.filter(l => l.id !== id); setLogs(n); save('fl', n); };
  const saveMilestone = () => { if (!milestoneForm.title) return; const n = [{ ...milestoneForm, id: Date.now(), date: new Date().toISOString() }, ...milestones]; setMilestones(n); save('fm', n); setMilestoneForm({ title: '', childId: '', notes: '' }); setShowMilestoneForm(false); };
  const delMilestone = (id) => { const n = milestones.filter(m => m.id !== id); setMilestones(n); save('fm', n); };
  const selectWeek = (w) => { setSelectedWeek(w); setSelectedDay(0); setIsEditMode(false); save('fs', w.id); setView('dailyPlan'); };
  
  const saveCustomWeek = async () => {
    if (!newWeek.theme || !newWeek.season || !newWeek.focus) return;
    const dayNameFull = { 'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday', 'Thu': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday', 'Sun': 'Sunday' };
    const richDays = newWeek.days.filter((_, i) => newWeek.daysToInclude[i]).map(d => ({ name: dayNameFull[d.name] || d.name, frenchWord: d.activities.vocabWord || '', focus: d.activities.focusOfDay || '', qotd: d.activities.questionOfDay || '', circleTime: d.activities.circleTime || '', songTitle: d.activities.songOfDay?.title || '', songLink: d.activities.songOfDay?.link || '', learningStations: [...(d.activities.morningActivities || []), ...(d.activities.afternoonActivities || [])].filter(a => a), teacherTips: d.activities.teacherTips || [], outsideTime: d.activities.outsideTime || '', indoorMovement: d.activities.indoorMovement || '', lunch: d.activities.lunch || '' }));
    try {
      const resp = await fetch('/.netlify/functions/user-weeks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser.id, userEmail: currentUser.email, userName: currentUser.name, theme: newWeek.theme, season: newWeek.season, focus: newWeek.focus, ageGroup: weekAgeGroup, teachingPhilosophy: newWeek.teachingPhilosophy || '', days: richDays }) });
      const saved = await resp.json();
      const w = { id: saved.id, theme: newWeek.theme, season: newWeek.season, focus: newWeek.focus, ages: weekAgeGroup, isCustom: true, hasRichData: richDays.length > 0, teachingPhilosophy: newWeek.teachingPhilosophy || '', days: richDays, activities: { circleTime: newWeek.days[0].activities.circleTime, songOfDay: newWeek.days[0].activities.songOfDay, morningActivity: newWeek.days[0].activities.morningActivities.join(', '), lunch: newWeek.days[0].activities.lunch, afternoonActivity: newWeek.days[0].activities.afternoonActivities.join(', ') }};
      setCustomWeeks(prev => [...prev, w]);
    } catch (err) {
      console.error('Failed to save week to database:', err);
      const w = { id: Date.now(), theme: newWeek.theme, season: newWeek.season, focus: newWeek.focus, ages: weekAgeGroup, isCustom: true, hasRichData: true, teachingPhilosophy: newWeek.teachingPhilosophy || '', days: richDays, activities: { circleTime: newWeek.days[0].activities.circleTime, songOfDay: newWeek.days[0].activities.songOfDay, morningActivity: newWeek.days[0].activities.morningActivities.join(', '), lunch: newWeek.days[0].activities.lunch, afternoonActivity: newWeek.days[0].activities.afternoonActivities.join(', ') }};
      const n = [...customWeeks, w]; setCustomWeeks(n); save('fw', n);
    }
    setNewWeek({ theme: '', season: '', focus: '', daysToInclude: [1,1,1,1,1,0,0], days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(x => ({ name: x, activities: {...emptyDay} })) });
    setDayIdx(0); setView('weeklyThemes');
  };
  const delCustomWeek = async (id) => { setCustomWeeks(prev => prev.filter(w => w.id !== id)); try { await fetch(`/.netlify/functions/user-weeks?id=${id}&userId=${currentUser.id}`, { method: 'DELETE' }); } catch (err) { console.error('Failed to delete week from database:', err); } };

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
    const cn = children[0]?.name || 'your little one';
    const dayDataForLetter = w.hasRichData && w.days ? w.days[selectedDay] : null;
    const todaysActivities = tl.length > 0 ? tl.map(l => `${fmtTime(l.timestamp)} - ${l.activity}${l.notes ? `: ${l.notes}` : ''}`).join('\n') : 'Standard curriculum activities';
    const photosDescription = tl.filter(l => l.photos?.length > 0).length > 0 ? `\n\nNote: ${tl.filter(l => l.photos?.length > 0).reduce((acc, l) => acc + (l.photos?.length || 0), 0)} photos were captured today.` : '';
    const langLabel = getLanguageLabel();
    const languageNote = langLabel && dayDataForLetter?.frenchWord ? `${langLabel} word: ${dayDataForLetter.frenchWord}.` : '';
    const prompt = `You are a warm, professional nanny writing a daily letter to parents. Child: ${cn}. Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}. Theme: "${w.theme}". ${dayDataForLetter ? `Focus: ${dayDataForLetter.focus}. ${languageNote}` : ''} Activities: ${todaysActivities}${photosDescription} Tone: ${letterTone}. Write 200-300 words.`;
    try {
      const response = await fetch("/.netlify/functions/claude", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }) });
      const data = await response.json();
      if (data.content?.[0]?.text) setLetter(data.content[0].text);
      else throw new Error(data.error?.message || 'API error');
    } catch (error) { setAiError(error.message); genTemplateLetter(); }
    finally { setIsGeneratingLetter(false); }
  };

  const genTemplateLetter = () => {
    const w = selectedWeek || weeks[0]; const tl = getTodayLogs(); const cn = children[0]?.name || 'your little one';
    const dayDataForLetter = w.hasRichData && w.days ? w.days[selectedDay] : null;
    const tones = { warm: { g: 'Dear Parents,', cl: 'Warm regards,', a: 'wonderful' }, professional: { g: 'Hello,', cl: 'Best regards,', a: 'productive' }, fun: { g: 'Hey there! 🌟', cl: 'See you tomorrow! 🎉', a: 'amazing' }};
    const t = tones[letterTone]; let ls = tl.length > 0 ? `\n**Today's Activities:**\n${tl.map(l => `• ${fmtTime(l.timestamp)} - ${l.activity}${l.notes ? `: ${l.notes}` : ''}`).join('\n')}\n` : '';
    const langLabel = getLanguageLabel(); const languageNote = langLabel && dayDataForLetter?.frenchWord ? `\n**${langLabel} Word:** ${dayDataForLetter.frenchWord}\n` : '';
    setLetter(`${t.g}\n\nWhat a ${t.a} day exploring "${w.theme}" with ${cn}!${languageNote}${ls}\n\nLooking forward to tomorrow!\n\n${t.cl}\n[Your Name]`);
  };

  const generateAIWeek = async () => {
    if (!weekTopic.trim()) return;
    setIsGeneratingWeek(true);
    const daysToGen = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].filter((_, i) => newWeek.daysToInclude[i]);
    const langLabel = getLanguageLabel();
    const langInstruction = langLabel ? `Include a ${langLabel} vocabulary word with pronunciation guide.` : '';
    const ageDescriptions = { '0-6m': 'infants (0-6 months)', '6m-1': 'infants (6-12 months)', '1-2': 'toddlers (1-2 years)', '2-3': 'toddlers (2-3 years)', '3-4': 'preschoolers (3-4 years)', '4-5': 'pre-K children (4-5 years)' };
    try {
      const firstPrompt = `Generate a curriculum week about "${weekTopic}" for ${ageDescriptions[weekAgeGroup]}. ${langInstruction}\n\nReturn ONLY JSON for the theme overview AND ${daysToGen[0]} only:\n{"theme":"Creative name","season":"Any|Spring|Summer|Fall|Winter","focus":"Focus area","teachingPhilosophy":"150-250 word philosophy for this topic and age group","days":[{"name":"${daysToGen[0]}","focus":"Sub-topic","qotd":"Question","circleTime":"Full 300-500 word circle time script with interactive prompts","songTitle":"Real song","learningStations":["Station 1 with materials and guiding question","Station 2","Station 3"],"teacherTips":["Tip 1","Tip 2","Tip 3","Tip 4","Tip 5","Tip 6"],"outsideTime":"Outdoor suggestion","indoorMovement":"Indoor movement alternative"}]}`;
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
        const dayPrompt = `Continue the "${firstParsed.theme}" curriculum for ${ageDescriptions[weekAgeGroup]}.\n\nPREVIOUS DAYS (do NOT repeat any songs, stations, activities, or outside/indoor ideas from these):\n${prevDaySummaries}\n\nNow generate ${daysToGen[i]} ONLY. Every field must be DIFFERENT from previous days.${i === daysToGen.length - 1 ? ' This is the FINAL day — include review and closure.' : ''} ${langInstruction}\n\nReturn ONLY JSON for this single day:\n{"name":"${daysToGen[i]}","focus":"Sub-topic","qotd":"Question","circleTime":"Full 300-500 word circle time script with interactive prompts","songTitle":"Real song","learningStations":["Station 1 with materials and guiding question","Station 2","Station 3"],"teacherTips":["Tip 1","Tip 2","Tip 3","Tip 4","Tip 5","Tip 6"],"outsideTime":"Outdoor suggestion","indoorMovement":"Indoor movement alternative"}`;
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
        if (genDay) { const songTitle = genDay.songTitle || ''; const songSearchLink = songTitle ? 'https://www.youtube.com/results?search_query=' + encodeURIComponent(songTitle + ' kids song') : ''; return { name: shortName, activities: { focusOfDay: genDay.focusOfDay || genDay.focus || '', questionOfDay: genDay.questionOfDay || genDay.qotd || '', circleTime: genDay.circleTime || '', songOfDay: { title: songTitle, link: songSearchLink }, morningActivities: genDay.morningActivities || genDay.learningStations || [''], lunch: genDay.lunch || '', afternoonActivities: genDay.afternoonActivities || [''], vocabWord: genDay.vocabWord || '', teacherTips: genDay.teacherTips || [], outsideTime: genDay.outsideTime || '', indoorMovement: genDay.indoorMovement || '' }}; }
        return { name: shortName, activities: {...emptyDay} };
      });
      setNewWeek(prev => ({ ...prev, theme: firstParsed.theme || weekTopic, season: firstParsed.season || 'Any', focus: firstParsed.focus || 'General', teachingPhilosophy: firstParsed.teachingPhilosophy || '', days: newDays }));
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

  // Subscription loading
  if (subscription.loading) {
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

  // Show pricing page if no active subscription
  if (!hasGold() && view !== 'pricing' && view !== 'settings') {
    return (
      <div className="min-h-screen" style={{backgroundColor: c.cream, fontFamily: 'Quicksand, sans-serif'}}>
        <PricingPage />
      </div>
    );
  }

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
              <button key={v} onClick={() => setView(v)} className="bg-white rounded-2xl p-5 shadow-md hover:shadow-lg transition-all" style={{border: `2px solid ${c.sand}`}}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 mx-auto" style={{backgroundColor: bg}}><Icon className="w-6 h-6" style={{color: bg === c.terra || bg === c.bark ? 'white' : c.wood}} /></div>
                <p className="font-semibold text-sm" style={{color: c.bark}}>{label}</p>
              </button>
            ))}
          </div>
          <button onClick={() => setView('children')} className="w-full bg-white rounded-2xl p-4 shadow-md flex items-center justify-between" style={{border: `2px solid ${c.sand}`}}>
            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{backgroundColor: c.dune}}><Users className="w-5 h-5" style={{color: c.wood}} /></div><span className="font-semibold" style={{color: c.bark}}>Manage Children</span></div>
            <ChevronRight className="w-5 h-5" style={{color: c.bark}} />
          </button>
          <button onClick={() => setView('milestones')} className="w-full bg-white rounded-2xl p-4 shadow-md flex items-center justify-between" style={{border: `2px solid ${c.sand}`}}>
            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{backgroundColor: c.terra}}><TrendingUp className="w-5 h-5 text-white" /></div><span className="font-semibold" style={{color: c.bark}}>Milestones</span></div>
            <ChevronRight className="w-5 h-5" style={{color: c.bark}} />
          </button>
          {/* Upgrade banner for Gold users */}
          {hasGold() && !hasPlatinum() && (
            <button onClick={() => setView('pricing')} className="w-full rounded-2xl p-4 shadow-md flex items-center justify-between" style={{backgroundColor: c.terra, border: `2px solid ${c.wood}`}}>
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
          <button onClick={() => setView('settings')} className="w-full bg-white rounded-2xl p-4 shadow-md flex items-center justify-between" style={{border: `2px solid ${c.sand}`}}>
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
              <button onClick={() => setView(hasGold() ? 'dashboard' : 'dashboard')} className="p-2 rounded-full" style={{backgroundColor: c.sand}}><ChevronLeft className="w-5 h-5" style={{color: c.wood}} /></button>
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
            <button onClick={() => setView('dashboard')} className="p-2 rounded-full" style={{backgroundColor: c.sand}}><ChevronLeft className="w-5 h-5" style={{color: c.wood}} /></button>
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
            <button onClick={() => setView('customWeek')} className="w-full bg-white rounded-xl p-4 mb-4 shadow-md flex items-center gap-3" style={{border: `2px dashed ${c.terra}`}}>
              <Plus className="w-5 h-5" style={{color: c.terra}} /><span className="font-semibold" style={{color: c.terra}}>Create Custom Week</span>
            </button>
          ) : (
            <div className="w-full rounded-xl p-4 mb-4 flex items-center gap-3 opacity-75" style={{backgroundColor: '#f5f0eb', border: `2px dashed ${c.sand}`}}>
              <Lock className="w-5 h-5" style={{color: c.bark}} />
              <div className="flex-1">
                <span className="font-semibold text-sm" style={{color: c.bark}}>Create Custom Week</span>
                <p className="text-xs" style={{color: c.bark}}>Upgrade to Platinum to create custom curricula</p>
              </div>
              <button onClick={() => setView('pricing')} className="px-3 py-1 rounded-full text-xs font-medium text-white" style={{backgroundColor: c.terra}}>Upgrade</button>
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
            <button onClick={() => { setView('dashboard'); setIsEditMode(false); }} className="p-2 rounded-full" style={{backgroundColor: c.sand}}><ChevronLeft className="w-5 h-5" style={{color: c.wood}} /></button>
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
                  <><p className="font-medium" style={{color: c.wood}}>{dayData.songTitle}</p>{dayData.songLink && <a href={dayData.songLink} target="_blank" rel="noopener noreferrer" className="text-sm underline" style={{color: c.terra}}>{dayData.songLink.includes('search_query') ? 'Find on YouTube →' : 'Watch on YouTube →'}</a>}</>
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
              <button onClick={() => setView('dashboard')} className="p-2 rounded-full" style={{backgroundColor: c.sand}}><ChevronLeft className="w-5 h-5" style={{color: c.wood}} /></button>
              <h2 className="text-xl font-bold" style={{color: c.wood}}>Activity Log</h2>
            </div>
            <button onClick={() => { setEditingLog(null); setLogForm({ activity: '', notes: '', childId: '', photos: [] }); setShowLogForm(true); }} className="p-2 rounded-full" style={{backgroundColor: c.terra}}><Plus className="w-5 h-5 text-white" /></button>
          </div>
          {showLogForm && (
            <div className="bg-white rounded-xl p-4 mb-4 shadow-md" style={{border: `1px solid ${c.sand}`}}>
              <h3 className="font-semibold mb-3" style={{color: c.wood}}>{editingLog ? 'Edit' : 'Log'} Activity</h3>
              <input placeholder="Activity name" value={logForm.activity} onChange={e => setLogForm({...logForm, activity: e.target.value})} className="w-full px-3 py-2 rounded-lg border mb-2" style={{borderColor: c.sand}} />
              <textarea placeholder="Notes (optional)" value={logForm.notes} onChange={e => setLogForm({...logForm, notes: e.target.value})} className="w-full px-3 py-2 rounded-lg border mb-2 h-20" style={{borderColor: c.sand}} />
              <select value={logForm.childId} onChange={e => setLogForm({...logForm, childId: e.target.value})} className="w-full px-3 py-2 rounded-lg border mb-3" style={{borderColor: c.sand}}>
                <option value="">All Children</option>
                {children.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
              </select>
              <div className="mb-3">
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{borderColor: c.sand, color: c.bark}}><Camera className="w-4 h-4" /><span className="text-sm">Add Photos</span></button>
                {logForm.photos?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {logForm.photos.map(photo => (<div key={photo.id} className="relative"><img src={photo.data} alt="" className="w-16 h-16 object-cover rounded-lg" /><button onClick={() => removePhoto(photo.id)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"><X className="w-3 h-3 text-white" /></button></div>))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={saveLog} className="flex-1 py-2 rounded-lg font-semibold" style={{backgroundColor: c.terra, color: 'white'}}>Save</button>
                <button onClick={() => { setShowLogForm(false); setEditingLog(null); }} className="px-4 py-2 rounded-lg" style={{backgroundColor: c.sand, color: c.wood}}>Cancel</button>
              </div>
            </div>
          )}
          <div className="space-y-3">
            {logs.length === 0 ? (
              <div className="text-center py-8"><Edit3 className="w-12 h-12 mx-auto mb-2" style={{color: c.sand}} /><p style={{color: c.bark}}>No activities logged yet</p></div>
            ) : logs.map(log => (
              <div key={log.id} className="bg-white rounded-xl p-4 shadow-md" style={{border: `1px solid ${c.sand}`}}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold" style={{color: c.wood}}>{log.activity}</h3>
                    {log.notes && <p className="text-sm mt-1" style={{color: c.bark}}>{log.notes}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="w-3 h-3" style={{color: c.bark}} />
                      <span className="text-xs" style={{color: c.bark}}>{fmtTime(log.timestamp)} • {fmtDate(log.timestamp)}</span>
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
        </div>
      )}

      {/* WRITE LETTER */}
      {view === 'writeLetter' && (
        <div className="p-4 pb-24">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setView('dashboard')} className="p-2 rounded-full" style={{backgroundColor: c.sand}}><ChevronLeft className="w-5 h-5" style={{color: c.wood}} /></button>
            <h2 className="text-xl font-bold" style={{color: c.wood}}>Daily Letter</h2>
          </div>
          <div className="bg-white rounded-xl p-4 mb-4 shadow-md" style={{border: `1px solid ${c.sand}`}}>
            <label className="text-sm font-medium block mb-2" style={{color: c.wood}}>Letter Tone</label>
            <div className="flex gap-2">
              {['warm', 'professional', 'fun'].map(tone => (
                <button key={tone} onClick={() => setLetterTone(tone)} className="flex-1 py-2 rounded-lg text-sm font-medium capitalize" style={{backgroundColor: letterTone === tone ? c.terra : c.sand, color: letterTone === tone ? 'white' : c.wood}}>{tone}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 mb-4">
            <button onClick={generateAILetter} disabled={isGeneratingLetter} className="flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50" style={{backgroundColor: c.terra, color: 'white'}}>
              {isGeneratingLetter ? <><Loader className="w-5 h-5 animate-spin" />Generating...</> : <><Sparkles className="w-5 h-5" />Generate with AI</>}
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
              <button onClick={() => setView('dashboard')} className="p-2 rounded-full" style={{backgroundColor: c.sand}}><ChevronLeft className="w-5 h-5" style={{color: c.wood}} /></button>
              <h2 className="text-xl font-bold" style={{color: c.wood}}>Children</h2>
            </div>
            <button onClick={() => { setEditingChild(null); setChildForm({ name: '', age: '', birthday: '', allergies: '', parentName: '', parentEmail: '', parentPhone: '', notes: '' }); setShowChildForm(true); }} className="p-2 rounded-full" style={{backgroundColor: c.terra}}><Plus className="w-5 h-5 text-white" /></button>
          </div>
          {showChildForm && (
            <div className="bg-white rounded-xl p-4 mb-4 shadow-md" style={{border: `1px solid ${c.sand}`}}>
              <h3 className="font-semibold mb-3" style={{color: c.wood}}>{editingChild ? 'Edit' : 'Add'} Child</h3>
              <input placeholder="Name" value={childForm.name} onChange={e => setChildForm({...childForm, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border mb-2" style={{borderColor: c.sand}} />
              <input placeholder="Age" value={childForm.age} onChange={e => setChildForm({...childForm, age: e.target.value})} className="w-full px-3 py-2 rounded-lg border mb-2" style={{borderColor: c.sand}} />
              <input placeholder="Birthday" value={childForm.birthday} onChange={e => setChildForm({...childForm, birthday: e.target.value})} className="w-full px-3 py-2 rounded-lg border mb-2" style={{borderColor: c.sand}} />
              <input placeholder="Allergies" value={childForm.allergies} onChange={e => setChildForm({...childForm, allergies: e.target.value})} className="w-full px-3 py-2 rounded-lg border mb-2" style={{borderColor: c.sand}} />
              <input placeholder="Parent Name" value={childForm.parentName} onChange={e => setChildForm({...childForm, parentName: e.target.value})} className="w-full px-3 py-2 rounded-lg border mb-2" style={{borderColor: c.sand}} />
              <input placeholder="Parent Email" value={childForm.parentEmail} onChange={e => setChildForm({...childForm, parentEmail: e.target.value})} className="w-full px-3 py-2 rounded-lg border mb-2" style={{borderColor: c.sand}} />
              <input placeholder="Parent Phone" value={childForm.parentPhone} onChange={e => setChildForm({...childForm, parentPhone: e.target.value})} className="w-full px-3 py-2 rounded-lg border mb-2" style={{borderColor: c.sand}} />
              <textarea placeholder="Notes" value={childForm.notes} onChange={e => setChildForm({...childForm, notes: e.target.value})} className="w-full px-3 py-2 rounded-lg border mb-3 h-20" style={{borderColor: c.sand}} />
              <div className="flex gap-2">
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
              <button onClick={() => setView('dashboard')} className="p-2 rounded-full" style={{backgroundColor: c.sand}}><ChevronLeft className="w-5 h-5" style={{color: c.wood}} /></button>
              <h2 className="text-xl font-bold" style={{color: c.wood}}>Milestones</h2>
            </div>
            <button onClick={() => setShowMilestoneForm(true)} className="p-2 rounded-full" style={{backgroundColor: c.terra}}><Plus className="w-5 h-5 text-white" /></button>
          </div>
          {showMilestoneForm && (
            <div className="bg-white rounded-xl p-4 mb-4 shadow-md" style={{border: `1px solid ${c.sand}`}}>
              <h3 className="font-semibold mb-3" style={{color: c.wood}}>Record Milestone</h3>
              <input placeholder="Milestone (e.g., First steps, Said 'mama')" value={milestoneForm.title} onChange={e => setMilestoneForm({...milestoneForm, title: e.target.value})} className="w-full px-3 py-2 rounded-lg border mb-2" style={{borderColor: c.sand}} />
              <select value={milestoneForm.childId} onChange={e => setMilestoneForm({...milestoneForm, childId: e.target.value})} className="w-full px-3 py-2 rounded-lg border mb-2" style={{borderColor: c.sand}}>
                <option value="">Select Child</option>
                {children.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
              </select>
              <textarea placeholder="Notes (optional)" value={milestoneForm.notes} onChange={e => setMilestoneForm({...milestoneForm, notes: e.target.value})} className="w-full px-3 py-2 rounded-lg border mb-3 h-20" style={{borderColor: c.sand}} />
              <div className="flex gap-2">
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
              <button onClick={() => setView('weeklyThemes')} className="p-2 rounded-full" style={{backgroundColor: c.sand}}><ChevronLeft className="w-5 h-5" style={{color: c.wood}} /></button>
              <h2 className="text-xl font-bold" style={{color: c.wood}}>Create Custom Week</h2>
            </div>
            <div className="bg-white rounded-xl p-4 mb-4 shadow-md" style={{border: `2px solid ${c.terra}`}}>
              <div className="flex items-center gap-2 mb-3"><Sparkles className="w-5 h-5" style={{color: c.terra}} /><h3 className="font-semibold" style={{color: c.wood}}>Generate with AI</h3></div>
              <p className="text-sm mb-3" style={{color: c.bark}}>Select an age group, enter a topic, and let AI create a full week's curriculum!</p>
              <div className="flex gap-2 mb-3">
                {['0-6m', '6m-1', '1-2', '2-3', '3-4', '4-5'].map(age => (
                  <button key={age} onClick={() => setWeekAgeGroup(age)} className="flex-1 py-2 rounded-lg text-sm font-medium" style={{backgroundColor: weekAgeGroup === age ? c.terra : c.sand, color: weekAgeGroup === age ? 'white' : c.wood}}>{age === '0-6m' ? '0–6m' : age === '6m-1' ? '6m–1yr' : age + ' yrs'}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <input placeholder="e.g., Butterflies, Space, Cooking, Kindness..." value={weekTopic} onChange={e => setWeekTopic(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border" style={{borderColor: c.sand}} onKeyDown={e => e.key === 'Enter' && !isGeneratingWeek && weekTopic.trim() && generateAIWeek()} />
                <button onClick={generateAIWeek} disabled={isGeneratingWeek || !weekTopic.trim()} className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50" style={{backgroundColor: c.terra, color: 'white'}}>
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
              <button onClick={() => setView('weeklyThemes')} className="p-2 rounded-full" style={{backgroundColor: c.sand}}><ChevronLeft className="w-5 h-5" style={{color: c.wood}} /></button>
              <h2 className="text-xl font-bold" style={{color: c.wood}}>Create Custom Week</h2>
            </div>
            <div className="text-center py-12">
              <Lock className="w-16 h-16 mx-auto mb-4" style={{color: c.sand}} />
              <h3 className="text-lg font-bold mb-2" style={{color: c.wood}}>Platinum Feature</h3>
              <p className="text-sm mb-6" style={{color: c.bark}}>The AI curriculum generator and custom week creator are available with a Platinum subscription.</p>
              <button onClick={() => setView('pricing')} className="px-6 py-3 rounded-xl font-semibold text-white" style={{backgroundColor: c.terra}}>Upgrade to Platinum</button>
            </div>
          </div>
        )
      )}

      {/* SETTINGS */}
      {view === 'settings' && (
        <div className="p-4 pb-24">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setView('dashboard')} className="p-2 rounded-full" style={{backgroundColor: c.sand}}><ChevronLeft className="w-5 h-5" style={{color: c.wood}} /></button>
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
                <button onClick={() => setView('pricing')} className="w-full py-2 rounded-lg font-semibold flex items-center justify-center gap-2" style={{backgroundColor: c.terra, color: 'white'}}>
                  <Crown className="w-4 h-4" />Upgrade to Platinum
                </button>
              )}
              {!hasGold() && (
                <button onClick={() => setView('pricing')} className="w-full py-2 rounded-lg font-semibold" style={{backgroundColor: c.terra, color: 'white'}}>Choose a Plan</button>
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
    </div>
  );
};

export default App;
