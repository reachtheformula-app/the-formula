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
  const [searchTerm, setSearchTerm] = useState('');
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
  const busyRoadsDays = [
    { name: "Monday", frenchWord: "Voiture (voh-tewr) = Car", focus: "Intro to Cars & Basic Parts", qotd: "What is a car?", circleTime: "Good morning, my friends! This week we are learning about cars and things that go. Can you say car? Let's spin our hands like wheels!", songTitle: "Driving in My Car by Super Simple Songs", songLink: "https://www.youtube.com/watch?v=Uj7mFmqCKh0", learningStations: ["Car Drive Pretend Play", "Paint our own cars", "Letter R Practice"] },
    { name: "Tuesday", frenchWord: "Siège (see-ezh) = Seat", focus: "Being Safe Inside the Car", qotd: "How do we stay safe in a car?", circleTime: "Friends, today we're talking about how we stay safe in the car with our car seats!", songTitle: "Buckle Up and Be Safe", songLink: "https://www.youtube.com/watch?v=1rkgqxqEYvE", learningStations: ["Car park Activity", "Letter R Practice", "Puzzle Practice"] },
    { name: "Wednesday", frenchWord: "Arrêt (ah-reh) = Stop", focus: "Staying Safe Near Cars", qotd: "How do we stay safe near cars?", circleTime: "When we are near cars, our bodies stop. FREEZE! Cars are big. People are small.", songTitle: "Drive Drive by Danny Go", songLink: "https://www.youtube.com/watch?v=YiIzWQBQ3VQ", learningStations: ["Car Wash Sensory", "Painting with Cars", "Red Light/Green Light"] },
    { name: "Thursday", frenchWord: "Camion (kah-mee-ohn) = Truck", focus: "Comparing Vehicles", qotd: "What kinds of vehicles do we see?", circleTime: "Today our roads are BUSY! Car, truck, bus - let's learn about them all!", songTitle: "Cars on the Road", songLink: "https://www.youtube.com/watch?v=eLx4qJQHyTY", learningStations: ["Make a ramp", "Race our cars", "Letter R playdoh"] },
    { name: "Friday", frenchWord: "Aide (ed) = Help", focus: "Emergency Vehicles & Review", qotd: "What car helps people?", circleTime: "Some cars don't just drive—they help. Fire trucks, ambulances - they give aide!", songTitle: "Here Comes the Fire Truck", songLink: "https://www.youtube.com/watch?v=LlB5_E4I8BI", learningStations: ["Play Ispy car edition", "Ramp Play", "Masking tape road"] }
  ];

  const shapesDays = [
    { name: "Monday", frenchWord: "Cercle (SEHR-kluh) = Circle", focus: "Circles", qotd: "Is it round?", circleTime: "Today we learn about circles! They go round and around with no corners.", songTitle: "The Shape Song #1", songLink: "https://www.youtube.com/watch?v=OEbRDtCAFdU", learningStations: ["Circle Search & Find", "Tracing Craft", "Letter Q Practice"] },
    { name: "Tuesday", frenchWord: "Carré (kah-RAY) = Square", focus: "Squares", qotd: "Does it have corners?", circleTime: "Squares have four sides and four corners. Tap your fingers - one, two, three, four!", songTitle: "Shapes Song by Mooseclumps", songLink: "https://www.youtube.com/watch?v=c6MK2bcGa4Q", learningStations: ["Square Search & Find", "Magnatiles building", "Puzzle Practice"] },
    { name: "Wednesday", frenchWord: "Triangle (tree-AHN-gluh) = Triangle", focus: "Triangles", qotd: "How many sides?", circleTime: "Triangles have three sides. Let's count - one, two, three!", songTitle: "The Shapes Song #2", songLink: "https://www.youtube.com/watch?v=6hFTUk8XqEc", learningStations: ["Make a ramp", "Triangle Search & Find", "Letter Q Practice"] },
    { name: "Thursday", frenchWord: "Rectangle (rehk-TAHNG-gluh) = Rectangle", focus: "Rectangles", qotd: "Is it long?", circleTime: "Rectangles are like stretched squares - long and strong!", songTitle: "The Shapes Song by ABCmouse", songLink: "https://www.youtube.com/watch?v=UjcKLxTYhUs", learningStations: ["Train Car craft", "Shape tracing", "Letter Q playdoh"] },
    { name: "Friday", frenchWord: "Forme (FORM) = Shape", focus: "Shape Review", qotd: "What shape is it?", circleTime: "Happy Shape Parade Day! Let's remember all our shapes.", songTitle: "Shapes by Pancake Manor", songLink: "https://www.youtube.com/watch?v=6H5kVHR_m3M", learningStations: ["Shape game", "Shape Collage", "Letter Q practice"] }
  ];

  const dinoDays = [
    { name: "Monday", frenchWord: "Dinosaure (dee-no-ZOR) = Dinosaur", focus: "What are Dinosaurs?", qotd: "What do you know about dinosaurs?", circleTime: "ROAR! This week we learn about DINOSAURS! They lived long, long ago.", songTitle: "Dinosaur Stomp", songLink: "https://www.youtube.com/watch?v=Imhi98dHa5w", learningStations: ["Stomp like dinosaurs", "Dinosaur toys exploration", "Letter D practice"] },
    { name: "Tuesday", frenchWord: "Manger (mahn-ZHAY) = To Eat", focus: "What Did Dinosaurs Eat?", qotd: "What do you think dinosaurs ate?", circleTime: "Some dinosaurs ate plants (herbivores), some ate meat (carnivores)!", songTitle: "Dinosaurs Have Teeth", songLink: "https://www.youtube.com/watch?v=N1PkwwCJP6I", learningStations: ["Herbivore vs Carnivore sorting", "Dinosaur teeth", "Food sorting"] },
    { name: "Wednesday", frenchWord: "Fossile (foh-SEEL) = Fossil", focus: "Fossils and Discovery", qotd: "How do we know about dinosaurs?", circleTime: "Fossils are like dinosaur pictures left in rocks. Let's be paleontologists!", songTitle: "Dig It Up", songLink: "https://www.youtube.com/watch?v=fn2F4ULoLr0", learningStations: ["Make fossils with salt dough", "Dinosaur dig sensory bin", "Fossil matching"] },
    { name: "Thursday", frenchWord: "Oiseau (wa-ZO) = Bird", focus: "Dinosaurs Became Birds!", qotd: "Did all dinosaurs disappear?", circleTime: "Guess what? Birds today are related to dinosaurs!", songTitle: "Birds Are Dinosaurs", songLink: "https://www.youtube.com/watch?v=HLgaH4xGjTk", learningStations: ["Bird watching", "Feather painting", "Bird vs dinosaur comparison"] },
    { name: "Friday", frenchWord: "Préféré (pray-fay-RAY) = Favorite", focus: "My Favorite Dinosaur", qotd: "What's your favorite dinosaur?", circleTime: "Today is about YOUR favorite dinosaur! T-Rex? Stegosaurus? Let's share!", songTitle: "Dinosaur A to Z", songLink: "https://www.youtube.com/watch?v=dqVP6KPKNq8", learningStations: ["Draw your favorite dinosaur", "Dinosaur parade", "Frozen dinosaur rescue"] }
  ];

  const oceanDays = [
    { name: "Monday", frenchWord: "La mer (lah mair) = The Sea", focus: "The Big Blue", qotd: "What do you think lives in the ocean?", circleTime: "Let's imagine we're on a beach. The ocean covers more than half our planet!", songTitle: "Great Big Sea", songLink: "https://www.youtube.com/watch?v=v9vCtlhwWok", learningStations: ["Fish Fork Painting", "Ocean sensory bin", "Letter O Practice"] },
    { name: "Tuesday", frenchWord: "Le poisson (luh pwah-SOHN) = The Fish", focus: "Ocean Animals", qotd: "What ocean animal would you be?", circleTime: "So many ocean animals - whales, clownfish, crabs, jellyfish, dolphins!", songTitle: "A Sailor Went to Sea", songLink: "https://www.youtube.com/watch?v=nFxAiWkSePk", learningStations: ["Starfish Suncatchers", "Tape Great White Shark", "Ocean animal sorting"] },
    { name: "Wednesday", frenchWord: "Les couleurs (lay koo-LUHR) = The Colors", focus: "Underwater Colors", qotd: "What colors do you see in the ocean?", circleTime: "Coral reefs are full of colors - red, yellow, purple, green, and orange!", songTitle: "Ocean Animal Freeze Dance", songLink: "https://www.youtube.com/watch?v=IEfSt2-zuAE", learningStations: ["Coral reef Painting", "Rainbow fish craft", "Color mixing"] },
    { name: "Thursday", frenchWord: "La vague (lah vahg) = The Wave", focus: "Ocean Motion", qotd: "How does the ocean move?", circleTime: "Waves roll in and out - swish, swoosh! The moon helps make tides.", songTitle: "Down in the Deep Blue Sea", songLink: "https://www.youtube.com/watch?v=7pMEQsk3c5Y", learningStations: ["Ocean in a bottle", "Ocean yoga", "Wave painting"] },
    { name: "Friday", frenchWord: "Propre (proh-pruh) = Clean", focus: "Caring for the Ocean", qotd: "How can we help keep the ocean clean?", circleTime: "The ocean gives us so much - let's help keep it clean and healthy!", songTitle: "Five Little Mermaids", songLink: "https://www.youtube.com/watch?v=MdTVlBlu0gA", learningStations: ["Goldfish counting", "Ocean cleanup sorting", "Recycled art fish"] }
  ];

  const feelingsWeekDays = [
    { name: "Monday", frenchWord: "Content (kohn-TAHN) = Happy", focus: "Feelings (A Transition)", qotd: "What makes you happy?", circleTime: "This week we talk about feelings! When I smile, I feel happy. Can you show me your happy face?", songTitle: "If You're Happy and You Know It", songLink: "https://www.youtube.com/watch?v=l4WNrvVjiTw", learningStations: ["Happy face craft", "Letter F Practice", "Feelings sorting game"] },
    { name: "Tuesday", frenchWord: "Sentiment (sahn-tee-MAHN) = Feeling", focus: "Feelings (An Introduction)", qotd: "How do you feel today?", circleTime: "Happy, sad, mad, surprised, love - feelings are the ways our hearts tell us what's going on inside.", songTitle: "Feelings Song", songLink: "https://www.youtube.com/watch?v=KivttwaXQZ4", learningStations: ["Five universal emotions", "Letter A Practice", "Puzzle Practice"] },
    { name: "Wednesday", frenchWord: "Émotion (ay-mo-SYON) = Emotion", focus: "Talk About It", qotd: "What makes you smile?", circleTime: "When I feel happy, I can say 'I feel happy!' Talking helps friends understand what we need.", songTitle: "This is a Happy Face", songLink: "https://www.youtube.com/watch?v=lQZX1IIAnLw", learningStations: ["Let's Make a face - Craft", "Feelings vocabulary cards", "Mirror emotion practice"] },
    { name: "Thursday", frenchWord: "Fâché (fah-SHAY) = Angry", focus: "How Bodies Show Emotions", qotd: "What makes you mad?", circleTime: "When happy - jump, clap, dance! When sad - move slowly. When mad - stomp and squeeze!", songTitle: "Kids Feelings and Emotions Song", songLink: "https://www.youtube.com/watch?v=0076ZF4jg3o", learningStations: ["Feelings Vocab", "Friendship Bracelets", "Feelings Charades"] },
    { name: "Friday", frenchWord: "Ami (ah-MEE) = Friend", focus: "Feelings Friday Review", qotd: "How can we help a friend who feels sad?", circleTime: "When we see a friend who looks sad, we can ask 'Are you okay?' Friends help each other!", songTitle: "The More We Get Together", songLink: "https://www.youtube.com/watch?v=kVkQU4nXYjA", learningStations: ["Kindness cards", "Feelings review game", "Group friendship circle"] }
  ];

  const weeks = [
    { id: 1, theme: "Beep Beep Busy Roads", season: "Any", focus: "Transportation", hasRichData: true, days: busyRoadsDays, activities: { circleTime: "Beep beep!", songOfDay: { title: "Driving in My Car", link: "youtube.com" }, morningActivity: "Car painting", lunch: "Road trip snacks", afternoonActivity: "Red Light/Green Light" }},
    { id: 2, theme: "Shapes All Around Us", season: "Any", focus: "Math & Science", hasRichData: true, days: shapesDays, activities: { circleTime: "Shape detectives!", songOfDay: { title: "Shape Song", link: "youtube.com" }, morningActivity: "Shape hunt", lunch: "Shape sandwiches", afternoonActivity: "Magnatiles building" }},
    { id: 3, theme: "Clever Girls - Dino Week", season: "Any", focus: "Science", hasRichData: true, days: dinoDays, activities: { circleTime: "ROAR!", songOfDay: { title: "Dinosaur Stomp", link: "youtube.com" }, morningActivity: "Stomp Like a Dinosaur", lunch: "Dino nuggets", afternoonActivity: "Fossil dig" }},
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
    { id: 46, theme: "Feelings & Emotions", season: "Any", focus: "Social-Emotional", hasRichData: true, days: feelingsWeekDays, activities: { circleTime: "All feelings are okay!", songOfDay: { title: "If You're Happy", link: "youtube.com" }, morningActivity: "Feelings faces craft", lunch: "Comfort foods", afternoonActivity: "Feelings charades" }},
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
    return matchesSearch && matchesSeason && matchesFocus;
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
      const response = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }) });
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
      const response = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 3000, messages: [{ role: "user", content: prompt }] }) });
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
            {(searchTerm || filterSeason !== 'All' || filterFocus !== 'All') && (
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{color: c.bark}}>{filteredWeeks.length} themes found</span>
                <button onClick={() => { setSearchTerm(''); setFilterSeason('All'); setFilterFocus('All'); }} className="text-xs underline" style={{color: c.terra}}>Clear filters</button>
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
          
          {/* Daily Routine */}
          <div className="bg-white rounded-xl p-4 mb-4 shadow-md" style={{border: `1px solid ${c.sand}`}}>
            <h3 className="font-semibold mb-3" style={{color: c.wood}}>Daily Routine</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 rounded-lg" style={{backgroundColor: c.cream}}><p className="text-xs font-medium" style={{color: c.bark}}>Calendar</p><p className="text-sm" style={{color: c.wood}}>Date, day, month, year</p></div>
              <div className="p-2 rounded-lg" style={{backgroundColor: c.cream}}><p className="text-xs font-medium" style={{color: c.bark}}>Weather</p><p className="text-sm" style={{color: c.wood}}>What's it like outside?</p></div>
              <div className="p-2 rounded-lg" style={{backgroundColor: c.cream}}><p className="text-xs font-medium" style={{color: c.bark}}>Alphabet</p><p className="text-sm" style={{color: c.wood}}>Letter of the week</p></div>
              <div className="p-2 rounded-lg" style={{backgroundColor: c.cream}}><p className="text-xs font-medium" style={{color: c.bark}}>Counting</p><p className="text-sm" style={{color: c.wood}}>Numbers practice</p></div>
            </div>
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
