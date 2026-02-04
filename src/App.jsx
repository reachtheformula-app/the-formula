import React, { useState, useEffect, useRef } from 'react';
import { Calendar, BookOpen, MessageSquare, TrendingUp, Plus, ChevronRight, ChevronLeft, Clock, Music, Book, Sun, Edit3, Send, Sparkles, Users, Trash2, X, Printer, Copy, AlertCircle, Globe, Star, Lightbulb, Search, Filter, Camera, Loader, ChevronDown, ChevronUp, Settings, LogOut, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

const App = () => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authView, setAuthView] = useState('login'); // login, signup, forgot
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  // App state
  const [view, setView] = useState('dashboard');
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [letter, setLetter] = useState('');
  const [letterTone, setLetterTone] = useState('warm');
  const [customWeeks, setCustomWeeks] = useState([]);
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
  const fileInputRef = useRef(null);
  
  const emptyDay = { focusOfDay: '', questionOfDay: '', circleTime: '', songOfDay: { title: '', link: '' }, morningActivities: [''], lunch: '', afternoonActivities: [''], vocabWord: '' };
  const [newWeek, setNewWeek] = useState({ theme: '', season: '', focus: '', daysToInclude: [1,1,1,1,1,0,0], days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(n => ({ name: n, activities: {...emptyDay} })) });
  
  const c = { cream: '#ecddce', sand: '#d0bfa3', dune: '#c9af97', terra: '#be8a68', bark: '#926f4a', wood: '#774722' };
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // Check for existing session on mount
  useEffect(() => {
    const session = localStorage.getItem('formula_session');
    if (session) {
      try {
        const user = JSON.parse(session);
        setCurrentUser(user);
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem('formula_session');
      }
    }
  }, []);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    if (isAuthenticated) load();
  }, [isAuthenticated]);

  // Auth functions
  const hashPassword = async (password) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    
    try {
      const users = JSON.parse(localStorage.getItem('formula_users') || '[]');
      const hashedPassword = await hashPassword(loginForm.password);
      const user = users.find(u => u.email.toLowerCase() === loginForm.email.toLowerCase() && u.password === hashedPassword);
      
      if (user) {
        const session = { id: user.id, name: user.name, email: user.email };
        localStorage.setItem('formula_session', JSON.stringify(session));
        setCurrentUser(session);
        setIsAuthenticated(true);
        setLoginForm({ email: '', password: '' });
      } else {
        setAuthError('Invalid email or password');
      }
    } catch (error) {
      setAuthError('Login failed. Please try again.');
    }
    setAuthLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    
    if (signupForm.password !== signupForm.confirmPassword) {
      setAuthError('Passwords do not match');
      setAuthLoading(false);
      return;
    }
    
    if (signupForm.password.length < 6) {
      setAuthError('Password must be at least 6 characters');
      setAuthLoading(false);
      return;
    }
    
    try {
      const users = JSON.parse(localStorage.getItem('formula_users') || '[]');
      
      if (users.find(u => u.email.toLowerCase() === signupForm.email.toLowerCase())) {
        setAuthError('An account with this email already exists');
        setAuthLoading(false);
        return;
      }
      
      const hashedPassword = await hashPassword(signupForm.password);
      const newUser = {
        id: Date.now().toString(),
        name: signupForm.name,
        email: signupForm.email,
        password: hashedPassword,
        createdAt: new Date().toISOString()
      };
      
      users.push(newUser);
      localStorage.setItem('formula_users', JSON.stringify(users));
      
      const session = { id: newUser.id, name: newUser.name, email: newUser.email };
      localStorage.setItem('formula_session', JSON.stringify(session));
      setCurrentUser(session);
      setIsAuthenticated(true);
      setSignupForm({ name: '', email: '', password: '', confirmPassword: '' });
    } catch (error) {
      setAuthError('Signup failed. Please try again.');
    }
    setAuthLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('formula_session');
    setCurrentUser(null);
    setIsAuthenticated(false);
    setView('dashboard');
  };

  // Storage functions - use localStorage with user prefix
  const getStorageKey = (key) => currentUser ? `formula_${currentUser.id}_${key}` : key;
  
  const save = (k, v) => { 
    try { 
      localStorage.setItem(getStorageKey(k), JSON.stringify(v)); 
    } catch (e) { 
      console.error('Save error:', e); 
    }
  };
  
  const load = () => {
    try {
      const keys = ['fw', 'fc', 'fl', 'fm', 'fs', 'fls'];
      const data = keys.map(k => {
        const item = localStorage.getItem(getStorageKey(k));
        return item ? JSON.parse(item) : null;
      });
      if (data[0]) setCustomWeeks(data[0]);
      if (data[1]) setChildren(data[1]);
      if (data[2]) setLogs(data[2]);
      if (data[3]) setMilestones(data[3]);
      if (data[4]) { 
        const w = [...weeks, ...(data[0] || [])].find(x => x.id === data[4]); 
        if (w) setSelectedWeek(w); 
      }
      if (data[5]) { 
        setLanguageSetting(data[5].language || 'none'); 
        setCustomLanguageName(data[5].customName || ''); 
      }
    } catch (e) { 
      console.error('Load error:', e); 
    }
  };

  // Rich daily data for weeks
  // ========== BUSY ROADS TEACHING PHILOSOPHY ==========
  const busyRoadsTeachingPhilosophy = "Transportation is one of the most engaging topics for young children - cars, trucks, and buses are part of their daily lives! This week harnesses that natural excitement while weaving in critical safety lessons.\n\nYoung children are impulsive and have limited understanding of danger. They don't yet grasp that cars can't stop quickly or that drivers may not see them. Our job is to teach safety rules through repetition, role-play, and simple language - not fear.\n\nThe key messages this week are: We ALWAYS hold a grown-up's hand near cars. We ALWAYS sit in our car seat. We STOP, LOOK, and LISTEN before crossing. When children internalize these rules through play and practice, they become automatic habits.\n\nRemember: Safety learning happens best when it's fun, consistent, and modeled by the adults around them.";

  const busyRoadsDays = [
    { name: "Monday", focus: "Introduction to Cars", qotd: "Have you been in a car today?", circleTime: "Good morning, friends! This week we're going to learn about something you see every single day - CARS! Can you say 'car' with me? (pause) Car!\n\nCars are machines that help people get from one place to another. They have wheels that go round and round (roll your hands). How many wheels does a car have? Let's count: 1, 2, 3, 4! Four wheels!\n\nCars have other parts too. They have doors - we open the door to get in and close it to stay safe. They have windows so we can see outside. They have seats where we sit, and special car seats for kids like you!\n\nAnd what does a car say? BEEP BEEP! (pretend to honk a horn) That's the horn! Drivers use the horn to say 'Hey, I'm here!'\n\nCars need a driver - a grown-up who sits in the front and uses the steering wheel to tell the car where to go. Kids don't drive cars - only grown-ups do. Our job is to be safe passengers!\n\nThis week we're going to learn all about cars, trucks, buses, and most importantly - how to stay SAFE around them. Are you ready to learn? Let's have a wonderful week!", songTitle: "My Yellow Car", songLink: "https://www.youtube.com/watch?v=ZZiTNJ6QleA", learningStations: ["Build a Car - Use cardboard boxes, paper plates (wheels), and markers to create your own car. Talk about the parts as you build: 'Now let's add the wheels! How many do we need?'", "Car Parts Matching - Match pictures or toy car parts to their names: wheel, door, window, steering wheel, seat. Practice pointing to each part and saying its name.", "Letter C Practice - Trace the letter C on whiteboards or in sand trays. Practice saying '/c/ is for car, /c/ is for careful!'"], teacherTips: ["Many children this age have been in cars but never really examined them. If possible, take the group outside to look at a real parked car (with permission) and point out the parts.", "Use toy cars throughout the day to reinforce vocabulary: 'Can you show me the wheels on your car?'", "Some children may have anxiety about cars or have experienced a car accident. Be sensitive and keep the tone positive and safety-focused.", "Start introducing the phrase 'Cars are big, people are small' - this becomes a theme for the week.", "If children pretend to 'drive' during play, gently reinforce: 'You're practicing for when you're a grown-up! Only grown-ups drive real cars.'", "Connect to their lives: 'Who drives the car in your family? Where do you go in the car?'"] },
    { name: "Tuesday", focus: "Car Seat Safety", qotd: "Do you sit in a car seat?", circleTime: "Good morning, friends! Yesterday we learned about cars and their parts. Today we're learning about something very special that keeps YOU safe - your CAR SEAT!\n\nCar seats are like a cozy hug that keeps you safe while the car is moving. Every time you get in a car, you sit in your car seat and buckle up.\n\nI have a special song to help us remember how to sit in our car seat. It goes to the tune of 'Frère Jacques' - let's learn it together!\n\n(sing together)\nThis is my seat, this is my seat,\nIn the car, in the car,\nBottom down, back is back,\nBottom down, back is back,\nHands in lap, hands in lap!\n\nLet's do it again with our bodies! Pretend you're in your car seat:\nThis is my seat (point to yourself)\nIn the car (pretend steering wheel)\nBottom down (sit down firmly)\nBack is back (press back against chair)\nHands in lap (pat your legs)\n\nWhen we sit like this AND wear our buckles - CLICK! - we're safe and snug!\n\nLet's practice our car seat rules:\n\nRule 1: I ALWAYS sit in my car seat. Not on a grown-up's lap, not on the regular seat - in MY car seat. Say it with me: 'I always sit in my car seat.' (pause)\n\nRule 2: I wear my buckles. The straps go over your shoulders and click together. CLICK! Say it with me: 'I wear my buckles.' (pause)\n\nRule 3: I stay safe in my car seat. We keep our buckles on and find fun things to do! You can look out the window and find colors - 'I see something blue!' You can sing songs. You can read a book or play with a soft toy. You can play I Spy with your grown-up. When we stay buckled and keep ourselves busy, the car ride goes fast! Say it with me: 'I stay safe in my car seat.' (pause)\n\nLet's sing our song one more time!\n\nThis is my seat, this is my seat,\nIn the car, in the car,\nBottom down, back is back,\nBottom down, back is back,\nHands in lap, hands in lap!\n\nYou are all learning to be such safe car riders!", songTitle: "Car Seat Ride Along Song", songLink: "https://www.youtube.com/watch?v=ChDvB6NqeS8", learningStations: ["Car Seat Practice - Set up a pretend car seat (a chair with fabric strips as 'straps'). Children practice climbing in, pulling straps over shoulders, and 'clicking' the buckle. Sing the car seat song while they practice!", "Buckle Matching - Practice fine motor skills with real buckles on a busy board or bag with clips/buckles. Connect to car seat buckling: 'You're practicing your clicking!'", "Safe Passenger Sorting - Sort pictures into 'safe' and 'not safe': child in car seat (safe), child standing in car (not safe), child buckled (safe), child with straps off shoulders (not safe)."], teacherTips: ["The car seat song is a great transition tool - sing it when lining up or getting ready to go outside!", "Repetition is key for safety rules. Have children repeat each rule back to you and revisit throughout the day.", "Some children may resist car seats at home. Encourage them to sing our car seat song with their parents while getting into their seat - it makes buckling up part of the fun!", "Practice the physical motions of buckling - even pretend practice builds muscle memory and cooperation.", "Send home a parent note with the car seat song lyrics so families can sing it too!", "Praise children who share stories about using their car seat: 'You're being such a safe passenger!'"] },
    { name: "Wednesday", focus: "Parking Lot Safety", qotd: "What do we do when we get out of the car?", circleTime: "Good morning, friends! We've learned about cars and car seats. Today we're going on a pretend adventure - to the PARKING LOT!\n\nParking lots are places where lots of cars are parked together, like at the grocery store or at school. Let's pretend we just got to the store with a grown-up. Are you ready?\n\nFirst, we wait in our car seat until our grown-up opens the door. (pretend to wait) The door opens! Now what do we do? We reach UP and find our grown-up's hand! (reach hand up) Can everyone reach up high for a hand to hold?\n\nNow we're holding hands and we start walking. But wait - do we run in parking lots? Nooooo! We WALK. Running is for playgrounds! In parking lots, we use walking feet. Show me your walking feet! (walk in place slowly)\n\nWhy do we hold hands and walk? Because look around - cars are everywhere! (look around) And here's the tricky part - cars can move in ANY direction. They can back up - beep beep beep! They can pull forward. And drivers sitting up high might not see someone small like you walking by.\n\nSo we stick close to our grown-up like glue! Let's practice being glue. Everyone find a partner - one grown-up, one child. Hold hands and walk together. Stay close like glue! (let children practice)\n\nOh no! (make car sound) A car is backing up! What do we do? STOP and WAIT with our grown-up until it passes. (freeze together)\n\nYou did it! You're parking lot experts! Remember - hand UP, hold on tight, walk walk walk, and stick like glue!", songTitle: "Parking Lot Safety Song", songLink: "https://www.youtube.com/watch?v=SlNffBsI6Aw", learningStations: ["Parking Lot Role Play - Create a pretend parking lot with tape on the floor and toy cars. Practice walking through holding a partner's hand, stopping when 'cars' move.", "Hand Holding Practice - Practice different ways to hold hands safely: regular hold, wrist hold, holding onto a pocket or bag strap. Which feels most secure?", "Red Light/Green Light - Play the classic game but frame it as parking lot practice: 'Green light - walk slowly holding hands! Red light - FREEZE! A car is coming!'"], teacherTips: ["This circle time works best as an interactive adventure - keep kids moving and engaged with the pretend scenario.", "The 'reach UP for a hand' motion should be practiced until it's reflexive. Make it a game throughout the day.", "Have children partner up for the 'glue' activity - they love sticking close to each other!", "Talk about WHY drivers might not see them: 'You're shorter than the car! The driver looks out the window but might not see you down low.'", "Practice walking pace - show the difference between walking feet (slow and steady) and running feet (too fast for parking lots).", "Connect to real experiences at pickup time: 'Remember to reach for your grown-up's hand in the parking lot today!'"] },
    { name: "Thursday", focus: "Street Safety", qotd: "How do we cross the street?", circleTime: "Good morning, friends! Today we're learning about staying safe near STREETS - the roads where cars drive.\n\nStreets are for cars. Sidewalks are for people. We never go into the street without a grown-up. But sometimes we need to cross the street to get to the other side. Here's how we do it safely!\n\nWe use three special words: STOP, LOOK, and LISTEN.\n\nFirst, STOP! When we get to the edge of the sidewalk, our feet stop. We don't step into the street. Show me your stopping feet! (demonstrate) Say it: 'STOP!' (pause)\n\nNext, LOOK! We turn our heads and look left (look left), look right (look right), and look left again (look left). We're looking for cars. Are any coming? Say it: 'LOOK!' (pause)\n\nFinally, LISTEN! We use our ears to listen for cars. Sometimes we can hear a car before we see it. Cup your ears and listen. (demonstrate) Say it: 'LISTEN!' (pause)\n\nThen, if no cars are coming, we HOLD a grown-up's hand and WALK across. We don't run - we walk and keep looking!\n\nLet's practice together. Everyone stand up. We're at the edge of the sidewalk. Ready?\nSTOP! (everyone freezes)\nLOOK! (look left, right, left)\nLISTEN! (cup ears)\nNow hold my hand and WALK! (walk together)\n\nYou did it! That's how we stay safe crossing streets.", songTitle: "Street Safety Song", songLink: "https://www.youtube.com/watch?v=konqbVET-PI", learningStations: ["Street Crossing Practice - Use tape to create a 'street' on the floor. Practice the full sequence: walk to edge, STOP, LOOK, LISTEN, hold hands, walk across. Repeat many times!", "Traffic Light Craft - Make a traffic light with red, yellow, and green circles. Talk about what each color tells cars to do (and how red means WE can walk).", "Listening Walk - Take a walk around the room or outside. Practice stopping and using ears to listen. Can you hear any vehicles? What do they sound like?"], teacherTips: ["STOP, LOOK, and LISTEN should be practiced until it's automatic. Do it multiple times throughout the day, even when not at a real street.", "Children this age should NEVER cross a street alone - always emphasize 'with a grown-up.' We're building habits for when they're older.", "Make the looking sequence physical and exaggerated - turn your whole head left, right, left. This helps children actually look rather than just glancing.", "Practice listening for car sounds - show them videos of car sounds or make sounds yourself. Can they identify a car engine, horn, or backup beeping?", "If you go outside, practice at a real sidewalk edge (safely) so they can apply the skills in context.", "Explain crosswalks and crossing signals simply: 'The white lines and the walking person sign show us WHERE to cross.'"] },
    { name: "Friday", focus: "Emergency Vehicles & Review", qotd: "What vehicle helps when there's an emergency?", circleTime: "Good morning, friends! It's the last day of our Busy Roads week! Today we're learning about very special vehicles - EMERGENCY VEHICLES. These are cars that help people!\n\nFirst, FIRE TRUCKS! Fire trucks are big and red. They have loud sirens that go WOO WOO WOO (make siren sound). Firefighters ride in fire trucks to put out fires and help people. When you see or hear a fire truck, cars move out of the way to let it pass.\n\nNext, AMBULANCES! Ambulances help people who are sick or hurt. They have sirens too and flashing lights. Paramedics ride inside and can give people medicine and help them get to the hospital fast.\n\nAnd POLICE CARS! Police officers drive police cars. They help keep people safe, help when there's an accident, and make sure everyone follows the rules.\n\nWhen you hear a siren, what should you do? Stop and watch! You might see the emergency vehicle drive by. We always move out of the way so they can go fast to help someone.\n\nNow let's review everything we learned this week:\n- Cars have wheels, doors, windows, and seats (point to body parts as you list)\n- We ALWAYS sit in our car seat and wear our buckles\n- In parking lots, we HOLD HANDS and stay close\n- At streets, we STOP, LOOK, and LISTEN\n- Emergency vehicles help people!\n\nYou've all become ROAD SAFETY EXPERTS this week! Give yourselves a big round of applause!", songTitle: "Fire Truck Song", songLink: "https://www.youtube.com/watch?v=RI6UT82cB_E", learningStations: ["Emergency Vehicle Match - Match emergency vehicles to their helpers: fire truck → firefighter, ambulance → paramedic, police car → police officer. Talk about how each one helps people.", "Siren Sounds - Listen to recordings of different sirens and identify which vehicle makes each sound. Practice making the sounds yourself!", "Road Safety Review Game - Play a review game: 'Show me what we do in a parking lot' (hold hands), 'Show me STOP, LOOK, LISTEN,' 'Where do we sit in a car?' (car seat). Celebrate correct answers!"], teacherTips: ["Emergency vehicles fascinate children! Use this excitement to reinforce that these vehicles have important jobs helping people.", "Some children may have had scary experiences with emergency vehicles (accident, family emergency). Be sensitive and keep the focus on 'helpers.'", "Practice the 'stop and watch' response to sirens - if you hear a real siren during the day, use it as a learning moment.", "Review the week's safety rules through play and movement, not just recitation. Muscle memory matters!", "Consider sending home a 'Road Safety Certificate' celebrating that children learned important safety rules this week.", "Connect to helpers: 'If you're ever lost or need help, you can look for police officers or firefighters. They're safe helpers!'"] }
  ];

  // ========== SHAPES TEACHING PHILOSOPHY ==========
  const shapesTeachingPhilosophy = "Shapes are one of the first math concepts young children can grasp - and they're everywhere! This week we keep it simple and sensory, focusing on four basic shapes: circle, square, triangle, and rectangle.\n\nFor 1-3 year olds, shape learning happens through touching, tracing, and SEEING shapes in the real world. We don't need flashcards - we need to point at wheels and say 'circle!' and trace the edges of a book and say 'rectangle!'\n\nRepetition is everything at this age. We'll say each shape name dozens of times, trace it with our fingers, make it with our bodies, and find it all around us. By Friday, these shapes will feel like old friends.\n\nRemember: At this age, we're planting seeds. Perfect identification isn't the goal - joyful exposure is.";

  const shapesDays = [
    { name: "Monday", focus: "Circles", qotd: "Can you find something round?", circleTime: "Good morning, friends! This week we're learning about SHAPES! Today's shape is the CIRCLE!\n\nI have something to show you. (hold up a ball or round object) What is this? It's round like a circle! Let's roll it! (roll ball back and forth)\n\nCircles ROLL because they have no corners - they're smooth all the way around. Let's trace one in the air with our fingers. Round and round and round... (trace together)\n\nNow YOU be a circle! Spin around... around... around! You're a spinning circle!\n\nLet's go on a circle hunt! I spy something round... (point to a clock, plate, or button). What circles can YOU find? (walk around finding circles together)\n\nCircles are sneaky - they're hiding everywhere! Wheels, cookies, buttons, the sun! When you find a circle today, point to it and say 'CIRCLE!'", songTitle: "The Shapes Song #1", songLink: "https://www.youtube.com/watch?v=TJhfl5vdxp4", learningStations: ["Circle Rolling - Gather round objects (balls, lids, wheels) and roll them! Compare to square blocks - why won't those roll? Because circles are round with no corners!", "Circle Stamps - Dip cups, toilet paper rolls, and lids in paint and stamp circles. Make a circle caterpillar, a circle flower, or just lots of colorful circles!", "Sensory Circles - Hide circular objects in a sensory bin (rice or beans). Can you find all the circles by feeling? Buttons, coins, lids, and rings!"], teacherTips: ["Rolling is the key concept for circles - let children discover that round things roll and cornered things don't.", "Spinning their bodies helps children FEEL what round means - no stopping points, just continuous motion.", "Don't correct if they call ovals circles - at this age, 'round' is the big concept.", "Point out circles during meals: plates, cup tops, cheerios!", "If a child finds a circle, make a big deal: 'You found a circle! Your eyes are so good at finding shapes!'"] },
    { name: "Tuesday", focus: "Squares", qotd: "Can you find something with corners?", circleTime: "Good morning, friends! Yesterday we found circles everywhere! Today we're meeting a NEW shape - the SQUARE!\n\n(hold up a square block) This is a square. It's different from a circle. Feel this... (let children touch) it has CORNERS! Pointy spots! Let's count them: one, two, three, FOUR corners!\n\nLet's find the corners on this square. Touch each one with me - boop, boop, boop, boop! Four corners!\n\nCan a square roll like a circle? (try to roll it) Noooo! It bumps and stops because of those corners!\n\nNow let's BUILD with squares! (bring out square blocks) Stack them up... up... up... TOWER! Squares are great for building because they stay still.\n\nLook at this window - is it round like a circle or does it have corners like a square? SQUARE! Let's find more things with four corners!", songTitle: "Shapes Song", songLink: "https://www.youtube.com/watch?v=k3P0OnkzgrQ", learningStations: ["Square Towers - Build with square blocks! How high can you stack? Squares are perfect for building because they have flat sides and corners that stay put.", "Corner Hunt - Walk around with dot stickers. Put a sticker on every corner you find! Windows, books, napkins - how many corners does each one have?", "Square Sandwich - Make a real snack! Bread is a square (or rectangle). Count the corners before you eat: one, two, three, four. Yum!"], teacherTips: ["The concept of CORNERS is brand new - spend time letting children touch and feel corners on real objects.", "Comparing to circles helps: 'Can this roll? No! The corners make it stop. Circles roll, squares stop!'", "Building towers is irresistible to toddlers and teaches that squares stack because of their flat sides.", "Use snack time: graham crackers, cheese slices, and bread are great square examples.", "When children find corners, let them count with you - even if they're not accurate yet, the pattern is sinking in."] },
    { name: "Wednesday", focus: "Triangles", qotd: "How many sides does a triangle have?", circleTime: "Good morning, friends! We know circles (round!) and squares (four corners!). Today is TRIANGLE day!\n\n(hold up a triangle shape) This is a triangle. It looks like a roof on a house, or a slice of pizza! Triangles are special because they have THREE sides and THREE corners.\n\nLet's count together. (trace the triangle) One side... two sides... THREE sides! One corner... two corners... THREE corners!\n\nThree is the magic number for triangles. Show me three fingers! One, two, three - just like a triangle!\n\nNow let's make a triangle with our bodies! Put your hands way up high and touch your fingertips together... now your arms make a triangle! (demonstrate)\n\nI know a song about triangles... (sing to 'Twinkle Twinkle')\nTriangle, triangle, look and see,\nOne, two, three sides - count with me!\nPointy corners, one, two, three,\nTriangle, triangle, what a shape to be!\n\nLet's look for things shaped like triangles!", songTitle: "The Shapes Song #2", songLink: "https://www.youtube.com/watch?v=03pyY9C2Pm8", learningStations: ["Triangle Pizzas - Use playdough to make triangle pizza slices! Pat it flat, then help cut triangle shapes. Add 'toppings' (beads, buttons) and count: one, two, three!", "Body Triangles - Make triangles with your body in different ways: arms overhead, lying on the floor with a friend, fingers touching. Take photos of your triangle shapes!", "Triangle Music - If you have a musical triangle, play it! Tap the three sides as you count. No instrument? Make triangles with craft sticks and tap them together."], teacherTips: ["The triangle song (to Twinkle Twinkle) reinforces THREE - sing it throughout the day!", "Pizza and roof shapes are very concrete for young children - use these references often.", "Making triangles with their bodies is engaging and helps them feel the three points.", "Three is easier to count than four - triangles are great for early counting practice.", "If you have a musical triangle instrument, today is the day to bring it out - seeing and hearing the shape!"] },
    { name: "Thursday", focus: "Rectangles", qotd: "Is a rectangle like a square?", circleTime: "Good morning, friends! We've learned SO many shapes! Circle (spin!), square (show four corners with fingers), and triangle (hands overhead). Today we meet the RECTANGLE!\n\n(hold up a book) Is this a square? Hmmmm... let's look. It has corners - one, two, three, four! Just like a square! But wait... this side is LONG and this side is SHORT. It's STRETCHED out!\n\nThis is a rectangle - like a square that got stretched! (stretch your arms) Streeeeetch!\n\nLet's look for rectangles. (look around) The door! Is the door a square or is it stretched out? It's a RECTANGLE! What about this book? RECTANGLE! What about a phone or tablet? RECTANGLE!\n\nLet's make a rectangle with our bodies! Stretch your arms way out to the sides... now you're long like a rectangle! Streeeeetch!\n\nRectangles are everywhere! Let's go find them!", songTitle: "ABCMouse Shapes Song", songLink: "https://www.youtube.com/watch?v=gzS78Wc0O5U", learningStations: ["Rectangle Robots - Build a robot using only rectangles! Use cardboard boxes, cardstock, or blocks. Rectangles make great bodies, arms, and legs!", "Rectangle Hunt - Find rectangles around the house! Doors, books, phones, tables, rugs. Put a sticker on each one you find. Count the corners - one, two, three, four!", "Rectangle Road - Use tape to make a rectangle road on the floor. Drive toy cars around the rectangle. How many sides? How many corners? Count as you drive!"], teacherTips: ["'Stretched out square' is the simplest way to explain rectangles - demonstrate by stretching your body!", "Don't stress about square vs. rectangle distinctions - a square IS technically a rectangle. Focus on 'four corners' for both.", "Doors are the most visible rectangles in any home - reference them often!", "Building robots with rectangles is engaging and helps children see how useful this shape is.", "Let children touch the edges of rectangles - feeling the long and short sides helps them understand the shape."] },
    { name: "Friday", focus: "Shape Party!", qotd: "What's your favorite shape?", circleTime: "Good morning, my friends! I am so happy to see you today. Today is a very special day because it's our Shape Party Day! All week long we've been learning about shapes, and today we get to celebrate everything we know.\n\nBefore we get started, let's wake up our bodies and our brains. When I say a shape, I want you to show me that shape with your body. Are you ready?\n\nLet's try a circle—can you spin your body nice and round? Now a square—stretch your arms and legs out and make those strong corners. Next is a triangle—hands together up high, nice and pointy. And now a rectangle—stretch your body long and tall!\n\nWow! Let's try it again, a little faster this time… and maybe even a little sillier. (repeat, speeding up and laughing together)\n\nYou all look amazing. Now let's keep the fun going with Shape Freeze Dance. When the music is playing, you can dance your heart out. When the music stops, I'll call out a shape, and you'll freeze your body into that shape. Ready to try?\n\nMusic on… dance, dance, dance! Music off—FREEZE… triangle! Let's try again! (repeat several times)\n\nYou are doing such a great job listening and moving. Now it's time for one last adventure—our shape hunt! We're going to walk around together and use our shape-detective eyes to find all the shapes we know. Every time you find one, we'll celebrate it together.\n\nLook around… what do you see? A circle? A square? A rectangle? Wow—you are finding shapes everywhere!\n\nFriends, I am so proud of you. You know circles, squares, triangles, and rectangles. That is some big learning! Give yourself a big hug… you worked so hard this week. You are all shape superstars.", songTitle: "Shapes", songLink: "https://www.youtube.com/watch?v=dsR0h50BiFQ", learningStations: ["Shape Freeze Dance - Play music and dance! When it stops, call out a shape and everyone freezes in that shape. Circle = spin and freeze, Square = arms/legs out, Triangle = hands overhead, Rectangle = stretch out long!", "Shape Collage - Create a picture using ALL FOUR shapes! Cut or tear shapes from paper and glue them down. A circle sun, square windows, triangle roof, rectangle door - make a house!", "Shape Snacks - Have a shape snack! Circle crackers, square cheese, triangle chips (broken corner pieces!), rectangle celery sticks. Name each shape before you eat it!"], teacherTips: ["Friday should feel like a celebration! Play music, be silly, and praise everything.", "Freeze dance is a huge hit at this age and secretly reviews all four shapes through movement.", "The shape collage brings all shapes together - display it proudly!", "Shape snacks make learning delicious - let children identify shapes before eating.", "Send home a quick note to parents about the four shapes so they can continue pointing them out!"] }
  ];

  // ========== DINO TEACHING PHILOSOPHY ==========
  const dinoTeachingPhilosophy = "Dinosaurs capture children's imaginations like nothing else. These incredible creatures spark curiosity about science, history, and the natural world - all through play and wonder.\n\nThis week, we embrace the magic of dinosaurs while introducing real scientific concepts: dinosaurs lived long, long ago; we learn about them from fossils; some ate plants and some ate meat; they came in all sizes. We're planting seeds for future paleontologists!\n\nFor 3-5 year olds, dinosaurs are the perfect gateway to big questions: How do we know about things we've never seen? Why did some animals disappear? How are living things different from each other?\n\nRemember: At this age, enthusiasm matters more than accuracy. If a child insists their dinosaur is purple and eats cookies, celebrate their imagination while gently weaving in real facts.";

  const dinoDays = [
    { name: "Monday", focus: "Welcome to Dinosaur World!", qotd: "What do you know about dinosaurs?", circleTime: "Good morning, my little paleontologists! Do you know what a paleontologist is? A paleontologist is a scientist who learns about dinosaurs! This week, WE get to be paleontologists and learn all about DINOSAURS!\n\nCan you say 'dinosaur' with me? (pause) DINOSAUR! Now let's say it like a dinosaur... DINO-SAUUUUUR! (in a big roaring voice)\n\nDinosaurs lived a long, long, LONG time ago - way before your grandparents, way before YOUR grandparents' grandparents! They lived so long ago that no people were even born yet. Dinosaurs lived millions of years ago.\n\nBut even though dinosaurs aren't here anymore, we know SO much about them. And this week, we're going to learn all their secrets!\n\nLet's meet some dinosaurs! First, the TYRANNOSAURUS REX - or T-REX! (stomp feet) T-Rex was one of the biggest, fiercest dinosaurs. It had a HUGE head, tiny little arms (tuck arms in), and big strong legs for running. Let's ROAR like a T-Rex! ROAR!\n\nNext, TRICERATOPS! (put three fingers on forehead like horns) Triceratops had THREE horns on its head and a big bony frill. Can you show me your three horns?\n\nAnd STEGOSAURUS! (put hands behind back like plates) Stegosaurus had big plates all down its back and spikes on its tail! Can you waddle like a Stegosaurus?\n\nAnd way up high... BRACHIOSAURUS! (stretch arms up tall) Brachiosaurus had the longest neck of all - it could eat leaves from the tippy top of trees! Stretch up high like a Brachiosaurus!\n\nDinosaurs came in all shapes and sizes. Some were HUGE and some were tiny - even smaller than a chicken! This week we're going to learn what they ate, how we know about them, and so much more. Are you ready to be dinosaur experts? ROAR!", songTitle: "Dinosaur Stomp", songLink: "https://www.youtube.com/watch?v=Imhi98dHa5w", learningStations: ["Dinosaur Exploration - Set out toy dinosaurs and let children explore! Can you find the T-Rex? Which one has horns? Which one has the long neck? Practice saying each dinosaur's name.", "Dinosaur Stomp Painting - Dip toy dinosaur feet in paint and stomp them across paper to make footprints! Compare sizes - whose footprints are biggest?", "Dinosaur Fossils Sensory Bin - Hide toy dinosaurs in sand, rice, or beans. Use brushes and spoons to dig them out like real paleontologists!"], teacherTips: ["Don't worry about perfect pronunciation - 'Stegosaurus' is hard! Celebrate all attempts.", "Have pictures of each dinosaur available so children can see what they really looked like.", "Let children lead with what they already know - many kids this age are already dinosaur obsessed!", "The body movements for each dinosaur (tiny arms, three horns, plates, long neck) help children remember which is which.", "If children ask 'where did dinosaurs go?' keep it simple: 'They lived so long ago that they're not here anymore, but we can learn about them!'"] },
    { name: "Tuesday", focus: "What Did Dinosaurs Eat?", qotd: "Do you think dinosaurs ate pizza?", circleTime: "Good morning, dinosaur experts! Yesterday we met some amazing dinosaurs. But I have a question for you... what do you think dinosaurs ate? (let children guess)\n\nDid they eat pizza? (pause) Nooo, there was no pizza back then! Did they eat chicken nuggets? (pause) Nope! So what DID dinosaurs eat?\n\nSome dinosaurs ate PLANTS - leaves, ferns, and trees! Munch, munch, munch! (pretend to munch leaves) These dinosaurs are called HERBIVORES. Can you say 'herbivore'? (pause) Herbivore means plant-eater!\n\nRemember Brachiosaurus with the long neck? (stretch up) Brachiosaurus was a herbivore! It used that loooong neck to reach leaves at the tippy-top of trees. Munch, munch!\n\nAnd Triceratops with the three horns? (fingers on forehead) Triceratops was a herbivore too! It munched on plants close to the ground.\n\nStegosaurus with the plates? (hands on back) Herbivore! Those plates weren't for eating - they might have helped Stegosaurus stay cool!\n\nBut some dinosaurs ate MEAT - other animals! Chomp, chomp! (snap hands like jaws) These dinosaurs are called CARNIVORES. Can you say 'carnivore'? (pause) Carnivore means meat-eater!\n\nRemember T-Rex? (tiny arms, stomp) T-Rex was a CARNIVORE! It had big, sharp teeth for eating meat. Open wide and show me your T-Rex teeth! CHOMP!\n\nSo let's sort! I'll say a dinosaur and you tell me - herbivore (munch munch) or carnivore (chomp chomp)?\n\nBrachiosaurus? (munch munch - herbivore!)\nT-Rex? (chomp chomp - carnivore!)\nTriceratops? (munch munch - herbivore!)\n\nYou're getting so smart about dinosaurs!", songTitle: "Dinosaur Dance", songLink: "https://www.youtube.com/watch?v=MV44GqZ-vZU", learningStations: ["Herbivore vs. Carnivore Sorting - Sort toy dinosaurs or pictures into two groups: plant-eaters and meat-eaters. Make signs with leaves for herbivores and a meat/bone for carnivores.", "Dinosaur Teeth Exploration - Compare different teeth! Flat teeth (like herbivores) are good for grinding plants. Sharp teeth (like carnivores) are good for tearing meat. Use play-dough to make both kinds of teeth.", "Feed the Dinosaur - Cut a hole in two boxes for dinosaur mouths. Label one 'Herbivore' and one 'Carnivore.' Sort play food - do leaves go to the herbivore or carnivore? What about pretend meat?"], teacherTips: ["Herbivore and carnivore are big words, but kids this age LOVE using them. Practice often!", "Use hand motions consistently: 'munch munch' for herbivore, 'chomp chomp' for carnivore.", "Some kids may be uncomfortable with the idea of meat-eating. Focus on 'that's what helped them survive' rather than graphic details.", "Connect to their lives: 'You eat plants like carrots AND meat like chicken - you're an OMNIVORE!'", "Don't worry if children mix up which dinosaurs ate what - the concept of 'different animals eat different foods' is the big idea."] },
    { name: "Wednesday", focus: "Digging for Dinosaurs", qotd: "How do we know about dinosaurs if they lived so long ago?", circleTime: "Good morning, paleontologists! I have a mystery for you today. Dinosaurs lived millions of years ago. No people were alive back then to see them. So HOW do we know what dinosaurs looked like? How do we know what they ate? (let children guess)\n\nWe know because of... FOSSILS! Can you say 'fossil'? (pause) Fossil!\n\nA fossil is like a dinosaur's way of leaving us a message from long, long ago. When dinosaurs died, sometimes their bones got covered up by sand and mud. Over millions and millions of years, those bones turned hard as rock - and that's a fossil!\n\nScientists called paleontologists (remember that word?) dig very, VERY carefully to find fossils hidden in the ground. They use special brushes (pretend to brush) and tiny tools to uncover the bones without breaking them. Let's practice brushing like paleontologists! Brush, brush, brush... very gently!\n\nWhen paleontologists find fossils, they're like puzzle pieces! They put the bones together to see what the whole dinosaur looked like. Sometimes it takes YEARS to put all the pieces together!\n\nFossils tell us so many things:\n- How BIG were dinosaurs? We measure the bones!\n- What did they EAT? We look at their teeth fossils!\n- How did they WALK? We find footprint fossils!\n\nSome fossils are HUGE - bigger than this whole room! And some are tiny - smaller than your fingernail!\n\nToday, WE get to be paleontologists and dig for our own fossils. Are your brushes ready? Let's dig!", songTitle: "We Are the Dinosaurs", songLink: "https://www.youtube.com/watch?v=82ooOpJLzr8", learningStations: ["Dinosaur Dig - Bury toy dinosaurs or plastic bones in sand, dirt, or kinetic sand. Use paintbrushes, spoons, and small tools to carefully excavate like real paleontologists. Brush away the sand slowly and carefully!", "Make Your Own Fossils - Press toy dinosaurs or plastic bones into salt dough or air-dry clay to make fossil imprints. Let them dry and paint them to look like real fossils!", "Fossil Puzzle - Print or draw a dinosaur skeleton and cut it into pieces. Can you put the bones back together like a paleontologist? Where does the head go? Where does the tail go?"], teacherTips: ["The dig station is usually the favorite - make sure everyone gets plenty of time!", "Real paleontologists work SLOWLY and carefully. Encourage patience: 'Gentle brushes so we don't break the fossil!'", "If you have access to real fossils (even small shells or leaf imprints), bring them in! Dollar stores sometimes have fossil kits.", "Connect to the scientific process: 'We're being scientists! Scientists look carefully, dig carefully, and ask questions.'", "Some children may want to dig fast - redirect with 'What would happen if a paleontologist dug too fast? The fossil might break!'"] },
    { name: "Thursday", focus: "Big Dinosaurs and Small Dinosaurs", qotd: "What was the biggest dinosaur ever?", circleTime: "Good morning, dinosaur experts! We've learned so much this week. Today we're going to talk about something amazing - dinosaur SIZES!\n\nSome dinosaurs were SO BIG that if one walked by our house, we'd have to look way, way up to see its head! And some dinosaurs were so small they could fit in your hand!\n\nLet's start with the BIGGEST dinosaurs! BRACHIOSAURUS (stretch up tall) was one of the biggest animals to EVER walk on Earth! It was as tall as a four-story building - taller than a house stacked on top of another house! Stretch up as tall as you can - even taller - TALLER! That's still not as tall as Brachiosaurus!\n\nARGENTINOSAURUS was even BIGGER - it might have been as long as three school buses! Let's walk in a line and see how long that would be... (walk across room) Keep going... keep going... THAT'S how long!\n\nBut guess what? Not all dinosaurs were giants! Some were TINY!\n\nCOMPSOGNATHUS was only about the size of a chicken! (crouch down small) Imagine a dinosaur that small running around!\n\nAnd MICRORAPTOR was about the size of a crow and had FEATHERS! It could glide through the air!\n\nNow let's talk about PTERODACTYL! (spread arms wide like wings) Pterodactyl wasn't actually a dinosaur - it was a flying reptile that lived at the SAME time as dinosaurs! It had big leathery wings and could soar through the sky! Let's flap our pterodactyl wings and fly around! Flap, flap, flap!\n\nSome pterodactyls were small, but QUETZALCOATLUS had wings as wide as a small airplane! Can you imagine seeing THAT fly overhead?\n\nLet's play a game. When I say a dinosaur, show me with your body - BIG or small?\n\nBrachiosaurus! (stretch up BIG!)\nCompsognathus! (crouch down small!)\nT-Rex! (BIG and scary!)\nMicroraptor! (small with little wings!)\nPterodactyl! (flying - flap flap!)", songTitle: "10 Little Dinosaurs", songLink: "https://www.youtube.com/watch?v=TjmGTbNLj6Q", learningStations: ["Size Sorting - Sort toy dinosaurs by size: big, medium, and small. Line them up from smallest to biggest. Which dinosaur is the tallest? Which is the tiniest?", "Pterodactyl Wings - Make pterodactyl wings using paper bags or fabric attached to arms. Decorate with crayons or markers, then fly around like pterodactyls! Flap, soar, and glide!", "How Big Is a Dinosaur? - Use tape or string to mark out the actual length of a small dinosaur (Compsognathus: about 3 feet) and part of a big dinosaur (Brachiosaurus: about 75 feet - you might only fit part of it!). Let children walk the lengths and compare."], teacherTips: ["The size comparisons (tall as a building, long as three buses) make abstract sizes concrete for children.", "Pterodactyl isn't technically a dinosaur, but kids love it! It's fine to include it as a 'flying reptile that lived with dinosaurs.'", "The 'How Big Is a Dinosaur' activity is a showstopper - seeing actual sizes blows their minds!", "Movement is key today - stretch BIG, crouch small, fly like pterodactyls. Keep bodies moving!", "If kids ask why some dinosaurs were so big, explain that being big helped them reach food and protected them from predators."] },
    { name: "Friday", focus: "Dinosaur Celebration Day!", qotd: "What's your favorite dinosaur and why?", circleTime: "Good morning, my amazing paleontologists! It's our last day of dinosaur week, and today is DINOSAUR CELEBRATION DAY!\n\nWe have learned SO much this week. Let's see what you remember!\n\nWhat's this dinosaur with the tiny arms and big teeth? (T-Rex!) Is T-Rex a herbivore or carnivore? (Carnivore - chomp chomp!)\n\nWhat about this dinosaur with three horns? (Triceratops!) Herbivore or carnivore? (Herbivore - munch munch!)\n\nThis dinosaur with the long, long neck? (Brachiosaurus!) Was Brachiosaurus big or small? (SO BIG!)\n\nAnd the one with plates on its back? (Stegosaurus!)\n\nWhat about this flying reptile with big wings? (Pterodactyl!) Remember, pterodactyl lived WITH the dinosaurs but was actually a flying reptile!\n\nHow do we learn about dinosaurs? (Fossils!) Who digs up fossils? (Paleontologists - that's us!)\n\nWow! You are all DINOSAUR EXPERTS now!\n\nNow I want to hear from YOU. What's YOUR favorite dinosaur? Let's go around and everyone share. When it's your turn, tell us your favorite dinosaur and WHY you like it. Then we'll all make that dinosaur sound or movement together!\n\n(Go around the circle, letting each child share. After each child, everyone does the movement/sound together.)\n\nEvery single one of your favorites is amazing because every dinosaur is special and different - just like every one of YOU is special and different!\n\nNow let's have a DINOSAUR PARADE! We're going to stomp around the room like all our favorite dinosaurs! Ready? ROAR! Let's go!\n\n(Parade around, cycling through T-Rex stomps, Triceratops charges, Brachiosaurus stretches, Pterodactyl flying, etc.)\n\nYou have worked SO hard this week. You are all official paleontologists and dinosaur experts! Give yourself a big ROAR! ROAR!", songTitle: "The Dinosaur Dance", songLink: "https://www.youtube.com/watch?v=qSkVgH-4PKw", learningStations: ["Dinosaur Parade - Keep the parade going! March around with toy dinosaurs, making sounds and movements for each one. Play music and stomp, stomp, stomp!", "Draw Your Favorite Dinosaur - Draw or paint your favorite dinosaur. Write (or dictate) why it's your favorite. Display everyone's dinosaurs together for a 'Dinosaur Museum!'", "Frozen Dinosaur Rescue - Freeze small toy dinosaurs in ice (ice cube trays or containers). Use warm water, salt, and tools to rescue the dinosaurs! Which one will you free first?"], teacherTips: ["Friday should feel like a party! Play dinosaur music, let them be loud and stomp around.", "The 'favorite dinosaur' sharing builds confidence and celebrates individual interests.", "Some children may have learned about dinosaurs you haven't covered - celebrate their knowledge!", "The frozen dinosaur rescue is messy but SO engaging. Have towels ready!", "Consider sending home a 'Dinosaur Expert Certificate' to celebrate their learning this week."] }
  ];

  const oceanDays = [
    { name: "Monday", frenchWord: "La mer (lah mair) = The Sea", focus: "The Big Blue", qotd: "What do you think lives in the ocean?", circleTime: "Let's imagine we're on a beach. The ocean covers more than half our planet!", songTitle: "Great Big Sea", songLink: "https://www.youtube.com/watch?v=v9vCtlhwWok", learningStations: ["Fish Fork Painting", "Ocean sensory bin", "Letter O Practice"] },
    { name: "Tuesday", frenchWord: "Le poisson (luh pwah-SOHN) = The Fish", focus: "Ocean Animals", qotd: "What ocean animal would you be?", circleTime: "So many ocean animals - whales, clownfish, crabs, jellyfish, dolphins!", songTitle: "A Sailor Went to Sea", songLink: "https://www.youtube.com/watch?v=nFxAiWkSePk", learningStations: ["Starfish Suncatchers", "Tape Great White Shark", "Ocean animal sorting"] },
    { name: "Wednesday", frenchWord: "Les couleurs (lay koo-LUHR) = The Colors", focus: "Underwater Colors", qotd: "What colors do you see in the ocean?", circleTime: "Coral reefs are full of colors - red, yellow, purple, green, and orange!", songTitle: "Ocean Animal Freeze Dance", songLink: "https://www.youtube.com/watch?v=IEfSt2-zuAE", learningStations: ["Coral reef Painting", "Rainbow fish craft", "Color mixing"] },
    { name: "Thursday", frenchWord: "La vague (lah vahg) = The Wave", focus: "Ocean Motion", qotd: "How does the ocean move?", circleTime: "Waves roll in and out - swish, swoosh! The moon helps make tides.", songTitle: "Down in the Deep Blue Sea", songLink: "https://www.youtube.com/watch?v=7pMEQsk3c5Y", learningStations: ["Ocean in a bottle", "Ocean yoga", "Wave painting"] },
    { name: "Friday", frenchWord: "Propre (proh-pruh) = Clean", focus: "Caring for the Ocean", qotd: "How can we help keep the ocean clean?", circleTime: "The ocean gives us so much - let's help keep it clean and healthy!", songTitle: "Five Little Mermaids", songLink: "https://www.youtube.com/watch?v=MdTVlBlu0gA", learningStations: ["Goldfish counting", "Ocean cleanup sorting", "Recycled art fish"] }
  ];

  // ========== UNIVERSAL DAILY ROUTINE ==========
  const universalDailyRoutine = {
    calendarTime: "Let's look at our calendar! First, what SEASON are we in? (Wait for response). That's right! Now, what MONTH is it? (Point to the month). And what YEAR? Now let's find TODAY's date. Can you help me count? Today is [Day], [Month] [Date], [Year]!",
    countingPractice: "Now let's count to 10 on our fingers! Hold up your hands. Ready? 1... 2... 3... 4... 5... (wiggle one hand) 6... 7... 8... 9... 10! (wiggle both hands) Let's do it again faster!",
    daysOfWeek: "What day is TODAY? That's right! What day was YESTERDAY? And what day will TOMORROW be? Great job! Now let's sing our Days of the Week song!",
    daysOfWeekSong: "https://youtu.be/8GKmCQOy88Y",
    weatherCheck: "Time to check the weather! Let's look outside. What COLOR is the sky? Does it FEEL warm or cold? Is anything MOVING - are trees swaying or leaves blowing? So today is [sunny/cloudy/rainy] and feels [warm/cool/cold]!",
    abcPractice: "Now let's sing our ABC's together! Ready? Let's go!"
  };

  // ========== FEELINGS TEACHING PHILOSOPHY ==========
  const feelingsTeachingPhilosophy = "This week is designed around the understanding that young children learn best through warm relationships, playful repetition, and simple language. Each day builds gently on the last, giving children multiple opportunities to practice naming emotions, showing feelings with their faces and bodies, and expressing themselves with words.\n\nFeelings are the foundation of social-emotional learning. When children can name what they feel, they gain power over big emotions. When they see that ALL feelings are welcome, they learn self-acceptance. When they practice calming strategies, they build lifelong coping skills.\n\nRemember: The goal is not perfection but presence. Meet each child where they are.";

  const feelingsWeekDays = [
    { name: "Monday", focus: "Introducing the Six Core Feelings", qotd: "How do you feel today?", circleTime: "Good morning, friends! Welcome to a very special Monday. This week, we're going to learn about something SO important - our FEELINGS! Can you say 'feelings' with me? (pause) Feelings!\n\nFeelings are like messages from our hearts that tell us what's going on inside. Sometimes our feelings are big, and sometimes they're small. But here's the most important thing I want you to remember all week: ALL feelings are okay. Every. Single. One. There are no bad feelings!\n\nToday we're learning SIX feelings that everyone in the whole world has - kids, grown-ups, even your teachers!\n\nFirst, HAPPY. When I feel happy, my mouth makes a big smile (demonstrate). Can you show me your happy face? (pause) Beautiful! Happy feels warm and bubbly inside, like when you get a hug or play with a friend.\n\nNext, SAD. When I feel sad, my mouth turns down and sometimes tears come (demonstrate). Can you show me sad? (pause) Sad might happen when we miss someone or something doesn't go our way.\n\nNow, ANGRY. When I feel angry, my eyebrows scrunch together and my body feels tight (demonstrate). Show me angry! (pause) Stomp your feet! Stomp, stomp, stomp! Angry happens when things feel unfair.\n\nLet's try SURPRISED! My eyes get big and my mouth makes an 'O' (demonstrate). Show me surprised! (pause) Wow! Surprised is when something unexpected happens!\n\nNow SCARED. When I feel scared, I might want to hide or hold someone's hand (demonstrate). Show me scared. (pause) Scared can help keep us safe and tells us to ask for help.\n\nAnd finally, DISGUSTED. My nose scrunches up and I might say 'ewww!' (demonstrate). Show me disgusted! (pause) Disgusted tells us to stay away from yucky things!\n\nSo our six feelings are: HAPPY, SAD, ANGRY, SURPRISED, SCARED, and DISGUSTED. Let's say them together! (repeat)\n\nRemember: ALL of these feelings are okay to have. Everyone feels ALL of these feelings sometimes. When we can name our feelings, we can share them with others and get help when we need it.\n\nNow let's take a deep breath together. Breathe in... and out... That's something we can do anytime we have big feelings.", songTitle: "If You're Happy and You Know It", songLink: "https://www.youtube.com/watch?v=71hqRT9U0wg", learningStations: ["Make Your Own Feelings Faces Cards - Create emotion cards by drawing faces showing all six feelings: happy, sad, angry, surprised, scared, and disgusted. Use paper plates, crayons, and mirrors to see your own expressions!", "Letter F Practice - Trace the letter F on whiteboards or in sand/salt trays. Practice saying '/f/ is for feelings, /f/ is for friends!'", "Feelings Walk - How does each emotion move? Walk HAPPY (skipping!), SAD (slow, droopy), ANGRY (stomping!), SURPRISED (freeze then jump!), SCARED (tiptoeing), DISGUSTED (stepping back, nose scrunched)."], teacherTips: ["Use a calm, steady voice when modeling emotion words - children absorb your tone as much as your words.", "Don't rush the faces - give each child time to try each expression. Some children need extra processing time.", "If a child seems overwhelmed, simply sit near them quietly. Presence is teaching.", "Watch for real feelings throughout the day - gently name them: 'I see you're feeling frustrated. That's okay.'", "Expect silliness when you ask for 'angry face' - laughter is a feeling too!", "Keep visuals available - post pictures of the six feelings faces for reference."] },
    { name: "Tuesday", focus: "Naming Our Feelings", qotd: "How do you feel today?", circleTime: "Good morning, friends! Welcome to Terrific Tuesday. Yesterday we learned our six feelings. Can anyone remember them? (pause) That's right! Happy, sad, angry, surprised, scared, and disgusted!\n\nToday we're going to practice NAMING our feelings. Here's something amazing: when we can NAME a feeling, we start to understand it. And when we understand it, we can figure out what we need!\n\nWe're going to practice using calm, clear words. Watch me.\n\nWhen I feel happy, I can say in a calm voice: 'I feel happy.' (model calm tone) Now you try. (pause)\n\nWhen I feel sad, I can say: 'I feel sad.' (model calm tone) Your turn. (pause)\n\nWhen I feel angry, I can say: 'I feel angry.' (model calm, steady tone) This is important - even when we feel angry inside, we can use a calm voice to say so. That's what makes our words so powerful! Try it. (pause)\n\nWhen I feel surprised, I can say: 'I feel surprised.' (pause)\n\nWhen I feel scared, I can say: 'I feel scared.' (pause)\n\nWhen I feel disgusted, I can say: 'I feel disgusted.' (pause)\n\nDid you notice? We used calm voices for ALL our feelings - even the big ones like angry and scared. That's because our words work best when we say them clearly and calmly.\n\nWhen we use our words to name how we feel, something magical happens - grown-ups and friends can understand us and help us get what we need. Yelling doesn't help people understand us, but calm words do!\n\nYou are all becoming feelings experts!", songTitle: "Feelings Song by the Singing Walrus", songLink: "https://www.youtube.com/watch?v=KivttwaXQZ4", learningStations: ["Feelings Charades - Using the feelings cards created on Monday, play a silly version of charades! Combine a feeling with an animal or object: 'Can you show me a HAPPY frog?' 'What does a SAD boat look like?' 'Show me a SURPRISED elephant!' Children act it out while others guess the feeling.", "Letter E Practice - Trace letter E on whiteboards. Practice '/e/ is for emotions, /e/ is for excited!'", "Feelings Sorting Activity - Sort magazine pictures of people into piles for each of the six feelings. What clues helped you decide?"], teacherTips: ["Repetition is key - children need to hear feeling words many times. Use them naturally throughout the day.", "Validate ALL emotions equally - say 'I see you're feeling angry. That's okay. Angry is a feeling.'", "Model your own feelings: 'I feel happy when we sing together!'", "Some children may not want to make faces. That's okay - they're learning by watching.", "If a child names a different emotion, celebrate it! 'Excited! That's another feeling word!'", "Keep a feelings check-in visual near your circle area."] },
    { name: "Wednesday", focus: "Using Our Words", qotd: "What makes you smile?", circleTime: "Good morning, everyone! It's Wonderful Word Wednesday! Yesterday we practiced naming our six feelings. Who remembers them? Happy, sad, angry, surprised, scared, and disgusted!\n\nToday we practice using our words to TELL others about our feelings. This is SO important because when we tell people how we feel, they can help us!\n\nThe magic words are: 'I feel ___'\n\nSay with me: 'I feel happy!' (pause) 'I feel sad.' (pause) 'I feel angry!' (pause) 'I feel surprised!' (pause) 'I feel scared.' (pause) 'I feel disgusted!' (pause)\n\nHere's why these words matter:\n\nIf I say 'I feel sad,' maybe a friend can give me a hug.\nIf I say 'I feel angry,' a teacher can help me calm down.\nIf I say 'I feel scared,' someone can hold my hand.\nIf I say 'I feel happy,' friends can celebrate with me!\n\nUsing our words helps friends understand what we need. Every time we say our feelings out loud, we're being brave!", songTitle: "This is a Happy Face by Noodle and Pals", songLink: "https://www.youtube.com/watch?v=lQZX1IIAnLw", learningStations: ["Make a Feelings Face Craft - Using paper plates and craft supplies, create a feelings face showing one of the six emotions. Share: 'I made a ___ face!'", "Feelings Vocabulary Cards - Practice the sentence frame 'I feel ___' with picture cards for each of the six feelings.", "Mirror Emotion Practice - At a mirror station, practice making all six feelings faces while saying the feeling word."], teacherTips: ["The sentence frame 'I feel ___' is powerful. Use it consistently throughout the day.", "When a child is upset, gently offer words: 'Are you feeling angry? You can say I feel angry.'", "Celebrate attempts! If a child says 'I feel bad,' respond: 'Can you tell me more? Do you feel sad or angry or scared?'", "Practice during transitions: 'Before we go outside, let's say how we feel!'", "Connect feelings to stories: 'How do you think this character feels?'", "Some children may parrot without understanding yet - comprehension comes with repetition."] },
    { name: "Thursday", focus: "Managing Big Feelings", qotd: "What helps you feel calm?", circleTime: "Good morning, friends! Happy Thursday! This week we've been learning to NAME our feelings. Can you remember all six? (pause) Happy, sad, angry, surprised, scared, and disgusted!\n\nToday we're going to learn something really important: what to DO when we have big feelings. Because naming our feeling is the first step - but then what?\n\nLet me teach you some tools that can help when feelings get really big.\n\nFirst: BUBBLE BREATHS. When we have a big feeling, we can take a deep breath in through our nose (demonstrate breathing in slowly), and then breathe out through our mouth like we're blowing a big, slow bubble (demonstrate slow exhale). Let's try it together. Breathe in... and blow your bubble out... (repeat 3 times) Did you feel your body get a little calmer?\n\nNext: COUNTING TO TEN. When feelings are big, we can count slowly. Let's practice: 1... 2... 3... 4... 5... 6... 7... 8... 9... 10. (count slowly with pauses) By the time we get to ten, our bodies have had time to calm down a little.\n\nHere are some important words we can use:\n'I need a break.' - Say it with me: 'I need a break.' (pause)\n'I need some space.' - Try it: 'I need some space.' (pause)\n'Can you help me?' - Let's say it: 'Can you help me?' (pause)\n\nThese words tell grown-ups and friends what we need!\n\nLet's also try SQUEEZE AND RELEASE. Make your hands into tight fists - squeeze, squeeze, squeeze! Now let them go soft like cooked noodles. Shake them out. That helps our bodies let go of big feelings.\n\nRemember: ALL feelings are okay, and now you have TOOLS to help when feelings get big. You can take bubble breaths, count to ten, ask for a break or space, or squeeze and release. You are so powerful!", songTitle: "Calm Down Song - Daniel Tiger", songLink: "https://www.youtube.com/watch?v=IKnL6RjjPGo", learningStations: ["Breathing Practice Station - Practice different calming breaths: Bubble Breaths (slow exhale), Smell the Flower/Blow the Candle (in through nose, out through mouth), and Hot Cocoa Breaths (pretend to hold a warm mug and blow to cool it). Use pinwheels or bubbles to practice slow breathing.", "Calm-Down Kit Creation - Children create their own calm-down kit in a small bag or box. Include: a stress ball or playdough to squeeze, a pinwheel for breathing, a card with the words 'I need a break' and 'I need space', and a picture of something that makes them happy.", "Counting Practice - Practice counting to 10 slowly with calming movements. Try counting while doing gentle stretches, or count fingers one at a time touching each to your thumb. Connect numbers to calming down."], teacherTips: ["Practice these techniques when children are CALM so they're available when needed. You can't teach a new skill in the middle of a meltdown.", "Model using these strategies yourself: 'I'm feeling frustrated. I'm going to take three bubble breaths.'", "Create a calm-down corner in your space with visual reminders of these strategies.", "The phrase 'I need a break' is incredibly empowering - honor it when children use it!", "Some children may need physical help with breathing - have them put hands on their belly to feel it rise and fall.", "Remember: the goal isn't to make feelings go away, but to help children feel safe and regulated while experiencing them."] },
    { name: "Friday", focus: "Helping Friends With Feelings", qotd: "How can you help a friend who feels sad?", circleTime: "Good morning, friends! It's Feelings Friday - our last day of Feelings Week! I am SO proud of everything you've learned. Let's remember together.\n\nWe learned SIX feelings that everyone has: happy, sad, angry, surprised, scared, and disgusted. We learned to NAME our feelings using calm voices: 'I feel ___.' And we learned what to DO when feelings get big - bubble breaths, counting to ten, saying 'I need a break' or 'I need space,' and squeeze and release.\n\nToday we're going to learn something new: how to HELP our friends when THEY have big feelings.\n\nWhat if you see a friend who looks sad - maybe their mouth is turned down or they have tears? You could say: 'Are you okay?' or 'Do you want to sit with me?' You could offer to take bubble breaths together!\n\nWhat if a friend looks angry - maybe their face is tight and their fists are squeezed? First, give them a little space. Then you could ask: 'Do you need a break?' or 'Do you want me to get a teacher?' You could even count to ten together!\n\nWhat if a friend looks scared? You could say: 'I'm here with you' or 'Do you want to hold my hand?' You could take bubble breaths together to help them feel calm.\n\nHere's what's important: we DON'T tell friends to stop feeling their feelings. We don't say 'Don't be sad' or 'Don't be scared.' Remember - ALL feelings are okay! Instead, we can be WITH them and help them use their tools.\n\nLet's practice! Everyone find a partner. One person pretend to feel sad. The other person say: 'Are you okay? Do you want to take bubble breaths with me?' (let children practice, then switch)\n\nYou have all become FEELINGS EXPERTS this week! You can name your feelings, you can use tools when feelings get big, AND you can help your friends. That makes you an amazing friend!", songTitle: "The More We Get Together", songLink: "https://www.youtube.com/watch?v=kVkQU4nXYjA", learningStations: ["Helping Friends Role Play - In pairs, children practice scenarios: 'Your friend looks sad. What could you say? What tool could you share?' 'Your friend seems angry. What should you do first? What could you offer?' Practice using kind words and offering coping tools.", "Feelings Week Review Book - Create a simple folded book with one page for each feeling. Children draw the face and one coping tool they can use. The last page says 'I can help my friends!' to take home.", "Friendship & Feelings Cards - Create cards to give to friends or family that say 'I can help you take bubble breaths' or 'I'll count to ten with you' or 'I'll sit with you.' Decorate and share with someone."], teacherTips: ["Role-playing helping scenarios is powerful - it gives children scripts they can use in real situations.", "Emphasize that helping doesn't mean FIXING. We can't make feelings go away, but we can be present and offer tools.", "Watch for children who want to 'boss' others' feelings ('Stop crying!'). Gently redirect: 'Let's ask if they need help instead.'", "Send the review book home with a parent note about the six feelings and coping tools practiced this week.", "Consider keeping Feelings Week rituals going: daily feelings check-ins, calm-down corner, breathing practice during transitions.", "Celebrate the children! They've done hard, important work this week learning emotional intelligence skills."] }
  ];

  const weeks = [
    { id: 1, theme: "Beep Beep Busy Roads", season: "Any", focus: "Transportation", ages: ["2-3", "3-4"], hasRichData: true, days: busyRoadsDays, activities: { circleTime: "Beep beep!", songOfDay: { title: "Driving in My Car", link: "youtube.com" }, morningActivity: "Car painting", lunch: "Road trip snacks", afternoonActivity: "Red Light/Green Light" }},
    { id: 2, theme: "Shapes All Around Us", season: "Any", focus: "Math & Science", ages: ["0-1", "1-2", "2-3"], hasRichData: true, days: shapesDays, activities: { circleTime: "Shape detectives!", songOfDay: { title: "Shape Song", link: "youtube.com" }, morningActivity: "Shape hunt", lunch: "Shape sandwiches", afternoonActivity: "Magnatiles building" }},
    { id: 3, theme: "Digging into Dinosaurs", season: "Any", focus: "Science", ages: ["3-4", "4-5"], hasRichData: true, days: dinoDays, activities: { circleTime: "ROAR!", songOfDay: { title: "Dinosaur Stomp", link: "youtube.com" }, morningActivity: "Stomp Like a Dinosaur", lunch: "Dino nuggets", afternoonActivity: "Fossil dig" }},
    { id: 4, theme: "Teddy Bear Picnic", season: "Spring", focus: "Social-Emotional", activities: { circleTime: "If you go down to the woods today...", songOfDay: { title: "Teddy Bear Picnic", link: "youtube.com" }, morningActivity: "Pack a picnic basket", lunch: "Teddy bear sandwiches", afternoonActivity: "Outdoor picnic" }},
    { id: 5, theme: "Splish Splash Water Fun", season: "Summer", focus: "Science", activities: { circleTime: "Water is amazing!", songOfDay: { title: "Rain Rain Go Away", link: "youtube.com" }, morningActivity: "Water painting", lunch: "Watermelon", afternoonActivity: "Water table play" }},
    { id: 6, theme: "Creepy Crawlies", season: "Spring", focus: "Science", activities: { circleTime: "Bugs are everywhere!", songOfDay: { title: "Itsy Bitsy Spider", link: "youtube.com" }, morningActivity: "Bug hunt", lunch: "Ants on a log", afternoonActivity: "Bug craft" }},
    { id: 7, theme: "Farm Friends", season: "Any", focus: "Animals", activities: { circleTime: "Old MacDonald had a farm!", songOfDay: { title: "Old MacDonald", link: "youtube.com" }, morningActivity: "Farm animal sounds", lunch: "Farm fresh foods", afternoonActivity: "Farm dramatic play" }},
    { id: 8, theme: "Under the Sea", season: "Summer", focus: "Science", activities: { circleTime: "Dive deep!", songOfDay: { title: "Baby Shark", link: "youtube.com" }, morningActivity: "Ocean painting", lunch: "Fish crackers", afternoonActivity: "Ocean sensory bin" }},
    { id: 9, theme: "Garden Magic", season: "Spring", focus: "Science", activities: { circleTime: "How does a garden grow?", songOfDay: { title: "The Garden Song", link: "youtube.com" }, morningActivity: "Plant seeds", lunch: "Garden salad", afternoonActivity: "Water the plants" }},
    { id: 10, theme: "Colors of the Rainbow", season: "Any", focus: "Art", activities: { circleTime: "Red, orange, yellow...", songOfDay: { title: "I Can Sing a Rainbow", link: "youtube.com" }, morningActivity: "Rainbow art", lunch: "Rainbow fruit", afternoonActivity: "Color mixing" }},
    { id: 11, theme: "Animal Safari", season: "Any", focus: "Animals", activities: { circleTime: "On safari we go!", songOfDay: { title: "Walking Through the Jungle", link: "youtube.com" }, morningActivity: "Safari binoculars", lunch: "Safari snacks", afternoonActivity: "Animal movements" }},
    { id: 12, theme: "Fairy Tales", season: "Any", focus: "Literacy", activities: { circleTime: "Let's read a fairy tale!", songOfDay: { title: "Fairy Tale Song", link: "youtube.com" }, morningActivity: "Castle building", lunch: "Royal feast", afternoonActivity: "Dress up dramatic play" }},
    { id: 13, theme: "Transportation Station", season: "Any", focus: "Social Studies", activities: { circleTime: "How do we get there?", songOfDay: { title: "The Wheels on the Bus", link: "youtube.com" }, morningActivity: "Build a train", lunch: "Airplane snacks", afternoonActivity: "Drive the bus" }},
    { id: 14, theme: "Healthy Bodies", season: "Any", focus: "Health", activities: { circleTime: "Our bodies are amazing!", songOfDay: { title: "Head Shoulders Knees Toes", link: "youtube.com" }, morningActivity: "Yoga for kids", lunch: "Healthy foods", afternoonActivity: "Exercise time" }},
    { id: 15, theme: "Community Helpers", season: "Any", focus: "Social Studies", activities: { circleTime: "So many helpers!", songOfDay: { title: "Helpers Song", link: "youtube.com" }, morningActivity: "Dress-up as helpers", lunch: "Helper lunch", afternoonActivity: "Helper dramatic play" }},
    { id: 16, theme: "Fall Harvest", season: "Fall", focus: "Seasons", activities: { circleTime: "Leaves are falling!", songOfDay: { title: "Autumn Leaves", link: "youtube.com" }, morningActivity: "Leaf rubbings", lunch: "Apple slices", afternoonActivity: "Pumpkin exploration" }},
    { id: 17, theme: "Friendship Week", season: "Any", focus: "Social-Emotional", activities: { circleTime: "What makes a good friend?", songOfDay: { title: "Make New Friends", link: "youtube.com" }, morningActivity: "Friendship bracelets", lunch: "Share a snack", afternoonActivity: "Cooperative games" }},
    { id: 18, theme: "Nighttime Wonders", season: "Any", focus: "Science", activities: { circleTime: "What happens at night?", songOfDay: { title: "Twinkle Twinkle", link: "youtube.com" }, morningActivity: "Star craft", lunch: "Moon sandwiches", afternoonActivity: "Stargazing pretend" }},
    { id: 19, theme: "Pets & Pet Care", season: "Any", focus: "Animals", activities: { circleTime: "Pets need love!", songOfDay: { title: "How Much is That Doggy", link: "youtube.com" }, morningActivity: "Pet store play", lunch: "Pet treats (people food!)", afternoonActivity: "Stuffed pet care" }},
    { id: 20, theme: "Music & Movement", season: "Any", focus: "Arts", activities: { circleTime: "Let's make noise!", songOfDay: { title: "Shake Your Sillies", link: "youtube.com" }, morningActivity: "Make instruments", lunch: "Musical chairs snack", afternoonActivity: "Dance party" }},
    { id: 21, theme: "Spring Has Sprung", season: "Spring", focus: "Seasons", activities: { circleTime: "Everything is blooming!", songOfDay: { title: "Spring is Here", link: "youtube.com" }, morningActivity: "Flower planting", lunch: "Spring veggies", afternoonActivity: "Nature walk" }},
    { id: 22, theme: "My Family", season: "Any", focus: "Social-Emotional", activities: { circleTime: "Families are special!", songOfDay: { title: "Family Finger", link: "youtube.com" }, morningActivity: "Family portrait", lunch: "Family recipe", afternoonActivity: "Family dramatic play" }},
    { id: 23, theme: "Art Explosion", season: "Any", focus: "Art", activities: { circleTime: "Everyone is an artist!", songOfDay: { title: "I Am an Artist", link: "youtube.com" }, morningActivity: "Paint freely", lunch: "Edible art", afternoonActivity: "Sculpture time" }},
    { id: 24, theme: "Ocean Week", season: "Summer", focus: "Science", hasRichData: true, days: oceanDays, activities: { circleTime: "Dive into the deep!", songOfDay: { title: "Under the Sea", link: "youtube.com" }, morningActivity: "Ocean art", lunch: "Fish-shaped snacks", afternoonActivity: "Ocean sensory bin" }},
    { id: 25, theme: "Thanksgiving Gratitude", season: "Fall", focus: "Social-Emotional", activities: { circleTime: "What are we thankful for?", songOfDay: { title: "Thank You Song", link: "youtube.com" }, morningActivity: "Thankful tree", lunch: "Thanksgiving feast", afternoonActivity: "Gratitude cards" }},
    { id: 26, theme: "Winter Holidays", season: "Winter", focus: "Holidays", activities: { circleTime: "Celebrate together!", songOfDay: { title: "Jingle Bells", link: "youtube.com" }, morningActivity: "Holiday crafts", lunch: "Holiday treats", afternoonActivity: "Gift wrapping" }},
    { id: 27, theme: "Bears Big and Small", season: "Any", focus: "Animals", activities: { circleTime: "Bears everywhere!", songOfDay: { title: "Going on a Bear Hunt", link: "youtube.com" }, morningActivity: "Bear cave building", lunch: "Bear-shaped snacks", afternoonActivity: "Bear hibernation play" }},
    { id: 28, theme: "Superheroes", season: "Any", focus: "Social-Emotional", activities: { circleTime: "We are all superheroes!", songOfDay: { title: "Superhero Song", link: "youtube.com" }, morningActivity: "Make a cape", lunch: "Super fuel", afternoonActivity: "Hero training" }},
    { id: 29, theme: "Pizza Party", season: "Any", focus: "Life Skills", activities: { circleTime: "Pizza is delicious!", songOfDay: { title: "Pizza Song", link: "youtube.com" }, morningActivity: "Make mini pizzas", lunch: "Pizza party!", afternoonActivity: "Pizza dramatic play" }},
    { id: 30, theme: "Camping Adventure", season: "Summer", focus: "Nature", activities: { circleTime: "Let's go camping!", songOfDay: { title: "Going Camping", link: "youtube.com" }, morningActivity: "Build a tent", lunch: "Trail mix", afternoonActivity: "Campfire songs" }},
    { id: 31, theme: "Doctor Doctor", season: "Any", focus: "Life Skills", activities: { circleTime: "Doctors help us!", songOfDay: { title: "Doctor Song", link: "youtube.com" }, morningActivity: "Doctor kit play", lunch: "Healthy choices", afternoonActivity: "Medical dramatic play" }},
    { id: 32, theme: "Jungle Safari", season: "Any", focus: "Animals", activities: { circleTime: "Into the jungle!", songOfDay: { title: "Jungle Boogie", link: "youtube.com" }, morningActivity: "Make binoculars", lunch: "Jungle fruit", afternoonActivity: "Animal movements" }},
    { id: 33, theme: "Apples & Orchards", season: "Fall", focus: "Nature", activities: { circleTime: "Apples are amazing!", songOfDay: { title: "Way Up High in the Apple Tree", link: "youtube.com" }, morningActivity: "Apple printing", lunch: "Apple taste test", afternoonActivity: "Apple orchard play" }},
    { id: 34, theme: "Outer Space", season: "Any", focus: "STEM", activities: { circleTime: "3, 2, 1, blast off!", songOfDay: { title: "Planet Song", link: "youtube.com" }, morningActivity: "Build a rocket", lunch: "Space food", afternoonActivity: "Moon walk" }},
    { id: 35, theme: "Pirates & Treasure", season: "Any", focus: "Imagination", activities: { circleTime: "Ahoy, mateys!", songOfDay: { title: "Pirate Song", link: "youtube.com" }, morningActivity: "Treasure maps", lunch: "Pirate feast", afternoonActivity: "Treasure hunt" }},
    { id: 36, theme: "Ice Cream Dreams", season: "Summer", focus: "Life Skills", activities: { circleTime: "I scream for ice cream!", songOfDay: { title: "Ice Cream Song", link: "youtube.com" }, morningActivity: "Playdough ice cream", lunch: "Ice cream!", afternoonActivity: "Ice cream shop play" }},
    { id: 37, theme: "Birds & Feathers", season: "Spring", focus: "Science", activities: { circleTime: "Birds are beautiful!", songOfDay: { title: "Two Little Blackbirds", link: "youtube.com" }, morningActivity: "Bird feeder", lunch: "Bird seed crackers", afternoonActivity: "Bird watching" }},
    { id: 38, theme: "Building & Construction", season: "Any", focus: "STEM", activities: { circleTime: "Let's build!", songOfDay: { title: "Bob the Builder", link: "youtube.com" }, morningActivity: "Block building", lunch: "Builder's lunch", afternoonActivity: "Construction zone play" }},
    { id: 39, theme: "Five Senses", season: "Any", focus: "Science", activities: { circleTime: "We have five amazing senses!", songOfDay: { title: "Five Senses", link: "youtube.com" }, morningActivity: "Color Mixing (sight)", lunch: "Taste Test", afternoonActivity: "Slime Time (touch)" }},
    { id: 40, theme: "Ninja Hi-Ya!", season: "Any", focus: "Movement", activities: { circleTime: "Hi-ya! Ninjas are strong!", songOfDay: { title: "Karate Song", link: "youtube.com" }, morningActivity: "Ninja headband", lunch: "Ninja fuel", afternoonActivity: "Dojo training" }},
    { id: 41, theme: "Wacky Weather", season: "Any", focus: "Science", activities: { circleTime: "Weather is amazing!", songOfDay: { title: "How's Weather", link: "youtube.com" }, morningActivity: "Make a Rain Stick", lunch: "Weather foods", afternoonActivity: "Pasta Sun Art" }},
    { id: 42, theme: "Winter Wonderland", season: "Winter", focus: "Seasons", activities: { circleTime: "Winter is magical!", songOfDay: { title: "Snow Song", link: "youtube.com" }, morningActivity: "Fake Snow", lunch: "Warm soup", afternoonActivity: "Arctic Animals painting" }},
    { id: 43, theme: "Space Camp", season: "Any", focus: "STEM", activities: { circleTime: "3, 2, 1, blast off!", songOfDay: { title: "Planet Song", link: "youtube.com" }, morningActivity: "Playdough Planets", lunch: "Astronaut food", afternoonActivity: "Rocket Ship Building" }},
    { id: 44, theme: "Dinosaurs Rawr!", season: "Any", focus: "Science", activities: { circleTime: "RAWR!", songOfDay: { title: "Dinosaur Stomp", link: "youtube.com" }, morningActivity: "Stomp Like a Dinosaur", lunch: "Dino nuggets", afternoonActivity: "Make Fossils" }},
    { id: 45, theme: "Rainbow Week", season: "Any", focus: "Art & Science", activities: { circleTime: "Over the rainbow!", songOfDay: { title: "Sing a Rainbow", link: "youtube.com" }, morningActivity: "Rainbow painting", lunch: "Rainbow fruit", afternoonActivity: "Prism exploration" }},
    { id: 46, theme: "Feelings & Emotions", season: "Any", focus: "Social-Emotional", ages: ["2-3", "3-4", "4-5"], hasRichData: true, days: feelingsWeekDays, activities: { circleTime: "All feelings are okay!", songOfDay: { title: "If You're Happy", link: "youtube.com" }, morningActivity: "Feelings faces craft", lunch: "Comfort foods", afternoonActivity: "Feelings charades" }},
    { id: 47, theme: "All About Me", season: "Fall", focus: "Identity", activities: { circleTime: "You are special!", songOfDay: { title: "I Am Special", link: "youtube.com" }, morningActivity: "All About Me poster", lunch: "My favorite foods", afternoonActivity: "Handprint art" }},
    { id: 48, theme: "Construction Zone", season: "Any", focus: "STEM", activities: { circleTime: "Hard hats on!", songOfDay: { title: "Bob the Builder", link: "youtube.com" }, morningActivity: "Block building", lunch: "Builder's lunch", afternoonActivity: "Cardboard construction" }},
    { id: 49, theme: "Community Helpers", season: "Any", focus: "Social Studies", activities: { circleTime: "So many helpers!", songOfDay: { title: "Helpers Song", link: "youtube.com" }, morningActivity: "Dress-up as helpers", lunch: "Helper lunch", afternoonActivity: "Helper dramatic play" }},
    { id: 50, theme: "Music & Movement", season: "Any", focus: "Arts", activities: { circleTime: "Let's make noise!", songOfDay: { title: "Shake Your Sillies", link: "youtube.com" }, morningActivity: "Make instruments", lunch: "Musical chairs snack", afternoonActivity: "Dance party" }}
  ];

  // Helper functions
  const getChildName = (id) => children.find(x => x.id === parseInt(id))?.name || 'All';
  const getTodayLogs = () => logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString());
  const fmtTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const fmtDate = (ts) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const getLanguageLabel = () => {
    if (languageSetting === 'none') return null;
    if (languageSetting === 'french') return 'French';
    if (languageSetting === 'spanish') return 'Spanish';
    if (languageSetting === 'custom') return customLanguageName || 'Language';
    return 'Language';
  };
  const saveLanguageSettings = (lang, customName = '') => {
    setLanguageSetting(lang);
    setCustomLanguageName(customName);
    save('fls', { language: lang, customName });
  };

  const allSeasons = ['All', ...new Set(weeks.map(w => w.season))];
  const allFocusAreas = ['All', ...new Set(weeks.map(w => w.focus))];

  const filteredWeeks = [...weeks, ...customWeeks].filter(w => {
    const matchesSearch = searchTerm === '' || w.theme.toLowerCase().includes(searchTerm.toLowerCase()) || w.focus.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeason = filterSeason === 'All' || w.season === filterSeason;
    const matchesFocus = filterFocus === 'All' || w.focus === filterFocus;
    const matchesAge = ageFilter === 'all' || (w.ages && w.ages.includes(ageFilter));
    return matchesSearch && matchesSeason && matchesFocus && matchesAge;
  });

  const saveChild = () => {
    if (!childForm.name) return;
    const n = editingChild ? children.map(x => x.id === editingChild.id ? { ...childForm, id: editingChild.id } : x) : [...children, { ...childForm, id: Date.now() }];
    setChildren(n); save('fc', n); setChildForm({ name: '', age: '', birthday: '', allergies: '', parentName: '', parentEmail: '', parentPhone: '', notes: '' }); setEditingChild(null); setShowChildForm(false);
  };
  const delChild = (id) => { const n = children.filter(x => x.id !== id); setChildren(n); save('fc', n); };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setLogForm(prev => ({ ...prev, photos: [...(prev.photos || []), { id: Date.now() + Math.random(), data: reader.result, name: file.name }] }));
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (photoId) => setLogForm(prev => ({ ...prev, photos: prev.photos.filter(p => p.id !== photoId) }));

  const saveLog = () => {
    if (!logForm.activity) return;
    const n = editingLog ? logs.map(l => l.id === editingLog.id ? { ...logForm, id: editingLog.id, timestamp: editingLog.timestamp } : l) : [{ ...logForm, id: Date.now(), timestamp: new Date().toISOString() }, ...logs];
    setLogs(n); save('fl', n); setLogForm({ activity: '', notes: '', childId: '', photos: [] }); setEditingLog(null); setShowLogForm(false);
  };
  const delLog = (id) => { const n = logs.filter(l => l.id !== id); setLogs(n); save('fl', n); };
  
  const saveMilestone = () => {
    if (!milestoneForm.title) return;
    const n = [{ ...milestoneForm, id: Date.now(), date: new Date().toISOString() }, ...milestones];
    setMilestones(n); save('fm', n); setMilestoneForm({ title: '', childId: '', notes: '' }); setShowMilestoneForm(false);
  };
  const delMilestone = (id) => { const n = milestones.filter(m => m.id !== id); setMilestones(n); save('fm', n); };
  
  const selectWeek = (w) => { setSelectedWeek(w); setSelectedDay(0); save('fs', w.id); setView('dailyPlan'); };
  
  const saveCustomWeek = () => {
    if (!newWeek.theme || !newWeek.season || !newWeek.focus) return;
    const dayNameFull = { 'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday', 'Thu': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday', 'Sun': 'Sunday' };
    const richDays = newWeek.days.filter((_, i) => newWeek.daysToInclude[i]).map(d => ({
      name: dayNameFull[d.name] || d.name,
      frenchWord: d.activities.vocabWord || '',
      focus: d.activities.focusOfDay || '',
      qotd: d.activities.questionOfDay || '',
      circleTime: d.activities.circleTime || '',
      songTitle: d.activities.songOfDay?.title || '',
      songLink: d.activities.songOfDay?.link || '',
      learningStations: [...(d.activities.morningActivities || []), ...(d.activities.afternoonActivities || [])].filter(a => a),
      lunch: d.activities.lunch || ''
    }));
    const w = { ...newWeek, id: Date.now(), isCustom: true, hasRichData: richDays.length > 0, days: richDays, activities: { circleTime: newWeek.days[0].activities.circleTime, songOfDay: newWeek.days[0].activities.songOfDay, morningActivity: newWeek.days[0].activities.morningActivities.join(', '), lunch: newWeek.days[0].activities.lunch, afternoonActivity: newWeek.days[0].activities.afternoonActivities.join(', ') }};
    const n = [...customWeeks, w]; setCustomWeeks(n); save('fw', n);
    setNewWeek({ theme: '', season: '', focus: '', daysToInclude: [1,1,1,1,1,0,0], days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(x => ({ name: x, activities: {...emptyDay} })) });
    setDayIdx(0); setView('weeklyThemes');
  };
  const delCustomWeek = (id) => { const n = customWeeks.filter(w => w.id !== id); setCustomWeeks(n); save('fw', n); };

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
    const w = selectedWeek || weeks[0];
    const tl = getTodayLogs();
    const cn = children[0]?.name || 'your little one';
    const dayDataForLetter = w.hasRichData && w.days ? w.days[selectedDay] : null;
    const tones = { warm: { g: 'Dear Parents,', cl: 'Warm regards,', a: 'wonderful' }, professional: { g: 'Hello,', cl: 'Best regards,', a: 'productive' }, fun: { g: 'Hey there! 🌟', cl: 'See you tomorrow! 🎉', a: 'amazing' }};
    const t = tones[letterTone];
    let ls = tl.length > 0 ? `\n**Today's Activities:**\n${tl.map(l => `• ${fmtTime(l.timestamp)} - ${l.activity}${l.notes ? `: ${l.notes}` : ''}`).join('\n')}\n` : '';
    const langLabel = getLanguageLabel();
    const languageNote = langLabel && dayDataForLetter?.frenchWord ? `\n**${langLabel} Word:** ${dayDataForLetter.frenchWord}\n` : '';
    setLetter(`${t.g}\n\nWhat a ${t.a} day exploring "${w.theme}" with ${cn}!${languageNote}${ls}\n\nLooking forward to tomorrow!\n\n${t.cl}\n[Your Name]`);
  };

  const generateAIWeek = async () => {
    if (!weekTopic.trim()) return;
    setIsGeneratingWeek(true);
    const daysToGen = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].filter((_, i) => newWeek.daysToInclude[i]);
    const langLabel = getLanguageLabel();
    const langInstruction = langLabel ? `Include a ${langLabel} vocabulary word with pronunciation guide for each day.` : '';
    const ageDescriptions = {
      '0-1': 'infants (0-1 years) - focus on sensory experiences, tummy time, simple sounds, high-contrast visuals, gentle movement, and caregiver interaction',
      '1-2': 'toddlers (1-2 years) - focus on sensory play, simple songs with movements, basic vocabulary, safe exploration, and short attention spans (5-10 min activities)',
      '2-3': 'toddlers (2-3 years) - focus on hands-on activities, simple crafts, movement songs, basic counting (1-5), color recognition, and parallel play',
      '3-4': 'preschoolers (3-4 years) - focus on interactive stories, creative art, pretend play, letter recognition, counting to 10, and cooperative activities',
      '4-5': 'pre-K children (4-5 years) - focus on early literacy, writing practice, science experiments, math concepts, group projects, and kindergarten readiness'
    };
    const prompt = `Create a curriculum week for ${ageDescriptions[weekAgeGroup]} about "${weekTopic}". ${langInstruction}\n\nNote: Calendar, weather, alphabet, and counting are standard daily routines done every day - do NOT include those. Focus only on theme-specific creative content.\n\nReturn ONLY valid JSON (no markdown, no explanation) in this exact format:\n{\n  "theme": "Creative theme name",\n  "season": "Any|Spring|Summer|Fall|Winter",\n  "focus": "Focus area (e.g., Science, Art, Social-Emotional)",\n  "days": [\n    {\n      "name": "${daysToGen[0] || 'Monday'}",\n      "focusOfDay": "What aspect of the theme we're exploring today",\n      "questionOfDay": "An engaging question to ask the children about today's focus",\n      "circleTime": "3-4 sentence engaging circle time script appropriate for ${weekAgeGroup} year olds introducing today's focus",\n      "songTitle": "Real children's song title related to theme",\n      "songLink": "YouTube URL for the song",\n      "morningActivities": ["Activity 1", "Activity 2", "Activity 3"],\n      "lunch": "Theme-related lunch idea",\n      "afternoonActivities": ["Activity 1", "Activity 2"]${langLabel ? `,\n      "vocabWord": "Word (pronunciation) = English meaning"` : ''}\n    }\n  ]\n}\n\nGenerate exactly ${daysToGen.length} days: ${daysToGen.join(', ')}. Make activities age-appropriate, hands-on, and fun. Use real YouTube songs when possible.`;
    try {
      const response = await fetch("/.netlify/functions/claude", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 3000, messages: [{ role: "user", content: prompt }] }) });
      const data = await response.json();
      const text = data.content?.[0]?.text;
      if (!text) throw new Error('No response from AI');
      const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(jsonStr);
      const dayNameMap = { 'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3, 'Friday': 4, 'Saturday': 5, 'Sunday': 6 };
      const fullDayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const newDays = fullDayNames.map((shortName, idx) => {
        const genDay = parsed.days.find(d => dayNameMap[d.name] === idx);
        if (genDay) {
          return { name: shortName, activities: { focusOfDay: genDay.focusOfDay || '', questionOfDay: genDay.questionOfDay || '', circleTime: genDay.circleTime || '', songOfDay: { title: genDay.songTitle || '', link: genDay.songLink || '' }, morningActivities: genDay.morningActivities || [''], lunch: genDay.lunch || '', afternoonActivities: genDay.afternoonActivities || [''], vocabWord: genDay.vocabWord || '' }};
        }
        return { name: shortName, activities: {...emptyDay} };
      });
      setNewWeek(prev => ({ ...prev, theme: parsed.theme || weekTopic, season: parsed.season || 'Any', focus: parsed.focus || 'General', days: newDays }));
      setWeekTopic('');
    } catch (error) { console.error('AI Week Generation Error:', error); alert('Failed to generate curriculum. Please try again or fill in manually.'); }
    finally { setIsGeneratingWeek(false); }
  };

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
  const currentWeek = selectedWeek || weeks[0];
  const dayData = currentWeek.hasRichData && currentWeek.days ? currentWeek.days[selectedDay] : null;

  // LOGIN SCREEN
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
            {authView === 'login' && (
              <form onSubmit={handleLogin}>
                <h2 className="text-xl font-bold mb-4 text-center" style={{color: c.wood}}>Welcome Back</h2>
                {authError && <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-600">{authError}</div>}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium block mb-1" style={{color: c.wood}}>Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{color: c.bark}} />
                      <input type="email" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} className="w-full pl-10 pr-3 py-3 rounded-lg border" style={{borderColor: c.sand}} placeholder="you@example.com" required />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1" style={{color: c.wood}}>Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{color: c.bark}} />
                      <input type={showPassword ? 'text' : 'password'} value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full pl-10 pr-10 py-3 rounded-lg border" style={{borderColor: c.sand}} placeholder="••••••••" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {showPassword ? <EyeOff className="w-5 h-5" style={{color: c.bark}} /> : <Eye className="w-5 h-5" style={{color: c.bark}} />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={authLoading} className="w-full py-3 rounded-lg font-semibold text-white disabled:opacity-50" style={{backgroundColor: c.terra}}>
                    {authLoading ? 'Signing in...' : 'Sign In'}
                  </button>
                </div>
                <p className="text-center mt-4 text-sm" style={{color: c.bark}}>
                  Don't have an account? <button type="button" onClick={() => { setAuthView('signup'); setAuthError(''); }} className="font-semibold underline" style={{color: c.terra}}>Sign up</button>
                </p>
              </form>
            )}
            
            {authView === 'signup' && (
              <form onSubmit={handleSignup}>
                <h2 className="text-xl font-bold mb-4 text-center" style={{color: c.wood}}>Create Account</h2>
                {authError && <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-600">{authError}</div>}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium block mb-1" style={{color: c.wood}}>Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{color: c.bark}} />
                      <input type="text" value={signupForm.name} onChange={e => setSignupForm({...signupForm, name: e.target.value})} className="w-full pl-10 pr-3 py-3 rounded-lg border" style={{borderColor: c.sand}} placeholder="Jane Smith" required />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1" style={{color: c.wood}}>Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{color: c.bark}} />
                      <input type="email" value={signupForm.email} onChange={e => setSignupForm({...signupForm, email: e.target.value})} className="w-full pl-10 pr-3 py-3 rounded-lg border" style={{borderColor: c.sand}} placeholder="you@example.com" required />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1" style={{color: c.wood}}>Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{color: c.bark}} />
                      <input type={showPassword ? 'text' : 'password'} value={signupForm.password} onChange={e => setSignupForm({...signupForm, password: e.target.value})} className="w-full pl-10 pr-10 py-3 rounded-lg border" style={{borderColor: c.sand}} placeholder="At least 6 characters" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {showPassword ? <EyeOff className="w-5 h-5" style={{color: c.bark}} /> : <Eye className="w-5 h-5" style={{color: c.bark}} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1" style={{color: c.wood}}>Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{color: c.bark}} />
                      <input type={showPassword ? 'text' : 'password'} value={signupForm.confirmPassword} onChange={e => setSignupForm({...signupForm, confirmPassword: e.target.value})} className="w-full pl-10 pr-3 py-3 rounded-lg border" style={{borderColor: c.sand}} placeholder="Confirm password" required />
                    </div>
                  </div>
                  <button type="submit" disabled={authLoading} className="w-full py-3 rounded-lg font-semibold text-white disabled:opacity-50" style={{backgroundColor: c.terra}}>
                    {authLoading ? 'Creating account...' : 'Create Account'}
                  </button>
                </div>
                <p className="text-center mt-4 text-sm" style={{color: c.bark}}>
                  Already have an account? <button type="button" onClick={() => { setAuthView('login'); setAuthError(''); }} className="font-semibold underline" style={{color: c.terra}}>Sign in</button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // MAIN APP RENDER
  return (
    <div className="min-h-screen" style={{backgroundColor: c.cream, fontFamily: 'Quicksand, sans-serif'}}>
      
      {/* DASHBOARD */}
      {view === 'dashboard' && (
        <div className="p-4 space-y-5 pb-24">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{color: c.bark}}>Welcome back,</p>
              <h1 className="text-xl font-bold" style={{color: c.wood}}>{currentUser?.name}</h1>
            </div>
            <button onClick={handleLogout} className="p-2 rounded-full" style={{backgroundColor: c.sand}}>
              <LogOut className="w-5 h-5" style={{color: c.wood}} />
            </button>
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
          <button onClick={() => setView('settings')} className="w-full bg-white rounded-2xl p-4 shadow-md flex items-center justify-between" style={{border: `2px solid ${c.sand}`}}>
            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{backgroundColor: c.bark}}><Settings className="w-5 h-5 text-white" /></div><span className="font-semibold" style={{color: c.bark}}>Settings</span></div>
            <ChevronRight className="w-5 h-5" style={{color: c.bark}} />
          </button>
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
            <div className="flex gap-2">
              <select value={ageFilter} onChange={(e) => setAgeFilter(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border text-sm" style={{borderColor: c.sand, color: c.wood}}>
                <option value="all">All Ages</option>
                <option value="0-1">0-1 years</option>
                <option value="1-2">1-2 years</option>
                <option value="2-3">2-3 years</option>
                <option value="3-4">3-4 years</option>
                <option value="4-5">4-5 years</option>
              </select>
            </div>
            {(searchTerm || filterSeason !== 'All' || filterFocus !== 'All' || ageFilter !== 'all') && (
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{color: c.bark}}>{filteredWeeks.length} themes found</span>
                <button onClick={() => { setSearchTerm(''); setFilterSeason('All'); setFilterFocus('All'); setAgeFilter('all'); }} className="text-xs underline" style={{color: c.terra}}>Clear filters</button>
              </div>
            )}
          </div>
          <button onClick={() => setView('customWeek')} className="w-full bg-white rounded-xl p-4 mb-4 shadow-md flex items-center gap-3" style={{border: `2px dashed ${c.terra}`}}>
            <Plus className="w-5 h-5" style={{color: c.terra}} /><span className="font-semibold" style={{color: c.terra}}>Create Custom Week</span>
          </button>
          <div className="space-y-3">
            {filteredWeeks.map(w => (
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
            <button onClick={() => setView('dashboard')} className="p-2 rounded-full" style={{backgroundColor: c.sand}}><ChevronLeft className="w-5 h-5" style={{color: c.wood}} /></button>
            <div className="flex-1">
              <h2 className="text-xl font-bold" style={{color: c.wood}}>{currentWeek.theme}</h2>
              <p className="text-sm" style={{color: c.bark}}>{currentWeek.focus} • {currentWeek.season}</p>
            </div>
            <button onClick={() => window.print()} className="p-2 rounded-full" style={{backgroundColor: c.sand}}><Printer className="w-5 h-5" style={{color: c.wood}} /></button>
          </div>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {dayNames.map((d, i) => (
              <button key={i} onClick={() => setSelectedDay(i)} className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap" style={{backgroundColor: selectedDay === i ? c.terra : c.sand, color: selectedDay === i ? 'white' : c.wood}}>{d}</button>
            ))}
          </div>
          
          {/* Teaching Philosophy (for enhanced weeks) */}
          {(currentWeek.id === 46 || currentWeek.id === 1 || currentWeek.id === 2 || currentWeek.id === 3) && (
            <div className="rounded-xl p-4 mb-4 shadow-md" style={{backgroundColor: '#ecfdf5', border: `1px solid ${c.sand}`}}>
              <button onClick={() => setExpandedPhilosophy(!expandedPhilosophy)} className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span style={{fontSize: '1.25rem'}}>&#127793;</span>
                  <h3 className="font-semibold" style={{color: c.wood}}>Teaching Philosophy</h3>
                </div>
                {expandedPhilosophy ? <ChevronUp className="w-5 h-5" style={{color: c.bark}} /> : <ChevronDown className="w-5 h-5" style={{color: c.bark}} />}
              </button>
              {expandedPhilosophy && <div className="mt-3 p-3 rounded-lg whitespace-pre-wrap text-sm" style={{backgroundColor: 'rgba(255,255,255,0.7)', color: c.wood}}>{currentWeek.id === 46 ? feelingsTeachingPhilosophy : currentWeek.id === 1 ? busyRoadsTeachingPhilosophy : currentWeek.id === 2 ? shapesTeachingPhilosophy : dinoTeachingPhilosophy}</div>}
            </div>
          )}
          
          {/* Enhanced Daily Routine */}
          <div className="rounded-xl p-4 mb-4 shadow-md" style={{backgroundColor: '#fffbeb', border: `1px solid ${c.sand}`}}>
            <button onClick={() => setExpandedDailyRoutine(!expandedDailyRoutine)} className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" style={{color: c.terra}} />
                <h3 className="font-semibold" style={{color: c.wood}}>Daily Routine</h3>
              </div>
              {expandedDailyRoutine ? <ChevronUp className="w-5 h-5" style={{color: c.bark}} /> : <ChevronDown className="w-5 h-5" style={{color: c.bark}} />}
            </button>
            {expandedDailyRoutine ? (
              <div className="mt-3 space-y-3 text-sm" style={{color: c.wood}}>
                <div className="p-3 rounded-lg" style={{backgroundColor: 'rgba(255,255,255,0.7)'}}>
                  <p className="font-semibold mb-1">1. Calendar Time</p>
                  <p className="italic text-sm">{universalDailyRoutine.calendarTime}</p>
                </div>
                <div className="p-3 rounded-lg" style={{backgroundColor: 'rgba(255,255,255,0.7)'}}>
                  <p className="font-semibold mb-1">2. Counting Practice</p>
                  <p className="italic text-sm">{universalDailyRoutine.countingPractice}</p>
                </div>
                <div className="p-3 rounded-lg" style={{backgroundColor: 'rgba(255,255,255,0.7)'}}>
                  <p className="font-semibold mb-1">3. Days of the Week</p>
                  <p className="italic text-sm">{universalDailyRoutine.daysOfWeek}</p>
                  <a href={universalDailyRoutine.daysOfWeekSong} target="_blank" rel="noopener noreferrer" className="text-xs underline mt-1 inline-block" style={{color: c.terra}}>Days of the Week Song</a>
                </div>
                <div className="p-3 rounded-lg" style={{backgroundColor: 'rgba(255,255,255,0.7)'}}>
                  <p className="font-semibold mb-1">4. Weather Check</p>
                  <p className="italic text-sm">{universalDailyRoutine.weatherCheck}</p>
                </div>
                <div className="p-3 rounded-lg" style={{backgroundColor: 'rgba(255,255,255,0.7)'}}>
                  <p className="font-semibold mb-1">5. ABC Practice</p>
                  <p className="italic text-sm">{universalDailyRoutine.abcPractice}</p>
                </div>
              </div>
            ) : (
              <div className="mt-2 text-sm" style={{color: c.bark}}>
                <p>Calendar - Counting - Days of the Week - Weather - ABCs</p>
                <p className="text-xs mt-1" style={{color: c.terra}}>Tap to view full instructions</p>
              </div>
            )}
          </div>
          
          {dayData ? (
            <div className="space-y-4">
              {languageSetting !== 'none' && dayData.frenchWord && (
                <div className="bg-white rounded-xl p-4 shadow-md" style={{border: `1px solid ${c.sand}`}}>
                  <div className="flex items-center gap-2 mb-2"><Globe className="w-5 h-5" style={{color: c.terra}} /><h3 className="font-semibold" style={{color: c.wood}}>{getLanguageLabel()} Word of the Day</h3></div>
                  <p className="text-lg font-bold" style={{color: c.terra}}>{dayData.frenchWord}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-3 shadow-md" style={{border: `1px solid ${c.sand}`}}>
                  <div className="flex items-center gap-1 mb-1"><Lightbulb className="w-4 h-4" style={{color: c.terra}} /><span className="text-xs font-medium" style={{color: c.bark}}>Today's Focus</span></div>
                  <p className="text-sm font-semibold" style={{color: c.wood}}>{dayData.focus}</p>
                </div>
                <div className="bg-white rounded-xl p-3 shadow-md" style={{border: `1px solid ${c.sand}`}}>
                  <div className="flex items-center gap-1 mb-1"><MessageSquare className="w-4 h-4" style={{color: c.terra}} /><span className="text-xs font-medium" style={{color: c.bark}}>Question of the Day</span></div>
                  <p className="text-sm font-semibold" style={{color: c.wood}}>{dayData.qotd}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md" style={{border: `1px solid ${c.sand}`}}>
                <button onClick={() => setExpandedCircleTime(!expandedCircleTime)} className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-2"><Sun className="w-5 h-5" style={{color: c.terra}} /><h3 className="font-semibold" style={{color: c.wood}}>Circle Time Script</h3></div>
                  {expandedCircleTime ? <ChevronUp className="w-5 h-5" style={{color: c.bark}} /> : <ChevronDown className="w-5 h-5" style={{color: c.bark}} />}
                </button>
                {expandedCircleTime && <div className="mt-3 p-3 rounded-lg whitespace-pre-wrap text-sm" style={{backgroundColor: c.cream, color: c.wood}}>{dayData.circleTime}</div>}
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md" style={{border: `1px solid ${c.sand}`}}>
                <div className="flex items-center gap-2 mb-2"><Music className="w-5 h-5" style={{color: c.terra}} /><h3 className="font-semibold" style={{color: c.wood}}>Song of the Day</h3></div>
                <p className="font-medium" style={{color: c.wood}}>{dayData.songTitle}</p>
                {dayData.songLink && <a href={dayData.songLink} target="_blank" rel="noopener noreferrer" className="text-sm underline" style={{color: c.terra}}>Watch on YouTube →</a>}
              </div>
              {dayData.learningStations && (
                <div className="bg-white rounded-xl p-4 shadow-md" style={{border: `1px solid ${c.sand}`}}>
                  <div className="flex items-center gap-2 mb-2"><Book className="w-5 h-5" style={{color: c.terra}} /><h3 className="font-semibold" style={{color: c.wood}}>Learning Stations</h3></div>
                  <ul className="space-y-1">{dayData.learningStations.map((s, i) => <li key={i} className="text-sm" style={{color: c.wood}}><span className="font-bold" style={{color: c.terra}}>{i + 1}.</span> {s}</li>)}</ul>
                </div>
              )}
              {dayData.teacherTips && dayData.teacherTips.length > 0 && (
                <div className="rounded-xl p-4 shadow-md" style={{backgroundColor: '#faf5ff', border: `1px solid ${c.sand}`}}>
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-5 h-5" style={{color: '#8b5cf6'}} />
                    <h3 className="font-semibold" style={{color: c.wood}}>Teacher Tips</h3>
                  </div>
                  <ul className="space-y-2">{dayData.teacherTips.map((tip, i) => <li key={i} className="text-sm flex items-start gap-2" style={{color: c.wood}}><span style={{color: '#8b5cf6'}}>*</span>{tip}</li>)}</ul>
                </div>
              )}
              {dayData.lunch && (
                <div className="bg-white rounded-xl p-4 shadow-md" style={{border: `1px solid ${c.sand}`}}>
                  <div className="flex items-center gap-2 mb-2"><Sun className="w-5 h-5" style={{color: c.terra}} /><h3 className="font-semibold" style={{color: c.wood}}>Lunch Idea</h3></div>
                  <p className="text-sm" style={{color: c.wood}}>{dayData.lunch}</p>
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
                {expandedCircleTime && <div className="mt-3 p-3 rounded-lg whitespace-pre-wrap text-sm" style={{backgroundColor: c.cream, color: c.wood}}>{currentWeek.activities.circleTime}</div>}
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md" style={{border: `1px solid ${c.sand}`}}>
                <div className="flex items-center gap-2 mb-2"><Music className="w-5 h-5" style={{color: c.terra}} /><h3 className="font-semibold" style={{color: c.wood}}>Song of the Day</h3></div>
                <p style={{color: c.bark}}>{currentWeek.activities.songOfDay.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-3 shadow-md" style={{border: `1px solid ${c.sand}`}}><p className="text-xs font-medium mb-1" style={{color: c.bark}}>Morning</p><p className="text-sm font-semibold" style={{color: c.wood}}>{currentWeek.activities.morningActivity}</p></div>
                <div className="bg-white rounded-xl p-3 shadow-md" style={{border: `1px solid ${c.sand}`}}><p className="text-xs font-medium mb-1" style={{color: c.bark}}>Afternoon</p><p className="text-sm font-semibold" style={{color: c.wood}}>{currentWeek.activities.afternoonActivity}</p></div>
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
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{borderColor: c.sand, color: c.bark}}>
                  <Camera className="w-4 h-4" /><span className="text-sm">Add Photos</span>
                </button>
                {logForm.photos?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {logForm.photos.map(photo => (
                      <div key={photo.id} className="relative">
                        <img src={photo.data} alt="" className="w-16 h-16 object-cover rounded-lg" />
                        <button onClick={() => removePhoto(photo.id)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"><X className="w-3 h-3 text-white" /></button>
                      </div>
                    ))}
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

      {/* CUSTOM WEEK */}
      {view === 'customWeek' && (
        <div className="p-4 pb-24">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setView('weeklyThemes')} className="p-2 rounded-full" style={{backgroundColor: c.sand}}><ChevronLeft className="w-5 h-5" style={{color: c.wood}} /></button>
            <h2 className="text-xl font-bold" style={{color: c.wood}}>Create Custom Week</h2>
          </div>
          
          {/* AI Generation Section */}
          <div className="bg-white rounded-xl p-4 mb-4 shadow-md" style={{border: `2px solid ${c.terra}`}}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5" style={{color: c.terra}} />
              <h3 className="font-semibold" style={{color: c.wood}}>Generate with AI</h3>
            </div>
            <p className="text-sm mb-3" style={{color: c.bark}}>Select an age group, enter a topic, and let AI create a full week's curriculum!</p>
            <div className="flex gap-2 mb-3">
              {['0-1', '1-2', '2-3', '3-4', '4-5'].map(age => (
                <button key={age} onClick={() => setWeekAgeGroup(age)} className="flex-1 py-2 rounded-lg text-sm font-medium" style={{backgroundColor: weekAgeGroup === age ? c.terra : c.sand, color: weekAgeGroup === age ? 'white' : c.wood}}>{age} yrs</button>
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
                {['Any', 'Spring', 'Summer', 'Fall', 'Winter'].map(s => <option key={s} value={s}>{s}</option>)}
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
                <input placeholder="Focus of the Day (e.g., What are dinosaurs?)" value={currentDay.activities.focusOfDay || ''} onChange={e => updDay(currentDayIndex, 'focusOfDay', e.target.value)} className="w-full px-3 py-2 rounded-lg border" style={{borderColor: c.sand}} />
                <input placeholder="Question of the Day (e.g., What do you think dinosaurs ate?)" value={currentDay.activities.questionOfDay || ''} onChange={e => updDay(currentDayIndex, 'questionOfDay', e.target.value)} className="w-full px-3 py-2 rounded-lg border" style={{borderColor: c.sand}} />
                {languageSetting !== 'none' && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 flex-shrink-0" style={{color: c.terra}} />
                    <input placeholder={`${getLanguageLabel()} Word (e.g., Papillon (pah-pee-YON) = Butterfly)`} value={currentDay.activities.vocabWord || ''} onChange={e => updDay(currentDayIndex, 'vocabWord', e.target.value)} className="flex-1 px-3 py-2 rounded-lg border" style={{borderColor: c.sand}} />
                  </div>
                )}
                <textarea placeholder="Circle Time Script" value={currentDay.activities.circleTime || ''} onChange={e => updDay(currentDayIndex, 'circleTime', e.target.value)} className="w-full px-3 py-2 rounded-lg border h-24" style={{borderColor: c.sand}} />
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Song Title" value={currentDay.activities.songOfDay.title} onChange={e => updSong(currentDayIndex, 'title', e.target.value)} className="px-3 py-2 rounded-lg border" style={{borderColor: c.sand}} />
                  <input placeholder="Song Link" value={currentDay.activities.songOfDay.link} onChange={e => updSong(currentDayIndex, 'link', e.target.value)} className="px-3 py-2 rounded-lg border" style={{borderColor: c.sand}} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium" style={{color: c.wood}}>Morning Activities</label>
                    <button onClick={() => addMorn(currentDayIndex)} className="text-sm" style={{color: c.terra}}>+ Add</button>
                  </div>
                  {currentDay.activities.morningActivities.map((a, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input value={a} onChange={e => updMorn(currentDayIndex, i, e.target.value)} className="flex-1 px-3 py-2 rounded-lg border" style={{borderColor: c.sand}} placeholder={`Activity ${i + 1}`} />
                      {currentDay.activities.morningActivities.length > 1 && <button onClick={() => remMorn(currentDayIndex, i)} className="p-2"><X className="w-4 h-4" style={{color: c.terra}} /></button>}
                    </div>
                  ))}
                </div>
                <input placeholder="Lunch" value={currentDay.activities.lunch} onChange={e => updDay(currentDayIndex, 'lunch', e.target.value)} className="w-full px-3 py-2 rounded-lg border" style={{borderColor: c.sand}} />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium" style={{color: c.wood}}>Afternoon Activities</label>
                    <button onClick={() => addAftn(currentDayIndex)} className="text-sm" style={{color: c.terra}}>+ Add</button>
                  </div>
                  {currentDay.activities.afternoonActivities.map((a, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input value={a} onChange={e => updAftn(currentDayIndex, i, e.target.value)} className="flex-1 px-3 py-2 rounded-lg border" style={{borderColor: c.sand}} placeholder={`Activity ${i + 1}`} />
                      {currentDay.activities.afternoonActivities.length > 1 && <button onClick={() => remAftn(currentDayIndex, i)} className="p-2"><X className="w-4 h-4" style={{color: c.terra}} /></button>}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          <button onClick={saveCustomWeek} disabled={!newWeek.theme || !newWeek.season || !newWeek.focus} className="w-full py-3 rounded-xl font-semibold disabled:opacity-50" style={{backgroundColor: c.terra, color: 'white'}}>Save Custom Week</button>
        </div>
      )}

      {/* SETTINGS */}
      {view === 'settings' && (
        <div className="p-4 pb-24">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setView('dashboard')} className="p-2 rounded-full" style={{backgroundColor: c.sand}}><ChevronLeft className="w-5 h-5" style={{color: c.wood}} /></button>
            <h2 className="text-xl font-bold" style={{color: c.wood}}>Settings</h2>
          </div>
          
          <div className="bg-white rounded-xl p-4 mb-4 shadow-md" style={{border: `1px solid ${c.sand}`}}>
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5" style={{color: c.terra}} />
              <h3 className="font-semibold" style={{color: c.wood}}>Language Learning</h3>
            </div>
            <p className="text-sm mb-4" style={{color: c.bark}}>Choose which language vocabulary to display in daily lesson plans, or turn off to hide this section.</p>
            <div className="space-y-2">
              {[
                { value: 'none', label: 'None', desc: 'Hide language section' },
                { value: 'french', label: 'French', desc: 'Display French vocabulary' },
                { value: 'spanish', label: 'Spanish', desc: 'Display Spanish vocabulary' },
                { value: 'custom', label: 'Custom', desc: 'Use your own language name' }
              ].map(opt => (
                <button key={opt.value} onClick={() => saveLanguageSettings(opt.value, opt.value === 'custom' ? customLanguageName : '')} className="w-full p-3 rounded-lg text-left flex items-center justify-between" style={{backgroundColor: languageSetting === opt.value ? c.terra : c.cream, color: languageSetting === opt.value ? 'white' : c.wood}}>
                  <div>
                    <p className="font-medium">{opt.label}</p>
                    <p className="text-xs opacity-80">{opt.desc}</p>
                  </div>
                  {languageSetting === opt.value && <Star className="w-5 h-5" />}
                </button>
              ))}
            </div>
            {languageSetting === 'custom' && (
              <div className="mt-4">
                <label className="text-sm font-medium block mb-2" style={{color: c.wood}}>Custom Language Name</label>
                <input placeholder="e.g., ASL, Mandarin, German..." value={customLanguageName} onChange={e => saveLanguageSettings('custom', e.target.value)} className="w-full px-3 py-2 rounded-lg border" style={{borderColor: c.sand}} />
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-md" style={{border: `1px solid ${c.sand}`}}>
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5" style={{color: c.terra}} />
              <h3 className="font-semibold" style={{color: c.wood}}>Account</h3>
            </div>
            <div className="space-y-2">
              <p className="text-sm" style={{color: c.bark}}>Signed in as: <strong style={{color: c.wood}}>{currentUser?.email}</strong></p>
              <button onClick={handleLogout} className="w-full py-2 rounded-lg font-semibold flex items-center justify-center gap-2" style={{backgroundColor: c.sand, color: c.wood}}>
                <LogOut className="w-4 h-4" />Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
