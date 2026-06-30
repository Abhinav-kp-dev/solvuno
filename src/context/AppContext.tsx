import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { distanceKm } from '../hooks/useGeolocation';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, browserPopupRedirectResolver } from 'firebase/auth';

export function useRealTime(intervalMs = 30000) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return tick;
}

export type IssueType = 'pothole' | 'streetlight' | 'water' | 'public_works' | 'other';

export type ViewState = 'community' | 'map' | 'report' | 'profile' | 'public-profile' | 'dashboard' | 'settings' | 'inbox' | 'shop';

export interface Comment {
  id: string;
  userId: string;
  text: string;
  timestamp: Date;
}

export interface Issue {
  id: string;
  type: IssueType;
  lat: number;
  lng: number;
  description: string;
  image?: string;
  timestamp: Date;
  status: 'active' | 'resolved' | 'moderated_fake';
  reporterId: string;
  verificationUpvotes: number;
  spamDownvotes: number;
  upvotedBy?: string[];
  downvotedBy?: string[];
  fixVerificationsCount?: number;
  fixWitnesses?: string[];
  comments: Comment[];
  severityScore: number;
  assignedDepartment: string;
  confidenceScore: number;
  communityVerified: boolean;
  bountyTier?: string;
  bountyPoints?: number;
  district?: string;
}

export interface User {
  id: string;
  name: string;
  handle: string;
  badge: string;
  capturedBP: number;
  pendingBP: number;
  avatar: string;
  civic_trust_score: number;
  requiresDoubleUpvotes: boolean;
  district?: string;
  achievedBadges?: string[];
  unlockedAssets?: string[];
  unlockedTitles?: string[];
  activeCosmetics?: {
    glowColor: string | null;
    avatarBorder: string | null;
    currentTitle: string | null;
  };
  manualLocation?: { lat: number; lng: number };
  lastKnownLocation?: { lat: number; lng: number };
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: Date;
  read: boolean;
}

export interface Conversation {
  otherUserId: string;
  lastMessage: Message;
  unreadCount: number;
}

interface AppState {
  isLoggedIn: boolean;
  currentUser: User | null;
  login: () => void;
  loginEmailPassword: (email: string, password: string) => Promise<void>;
  signUpEmailPassword: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  issues: Issue[];
  nearbyIssues: Issue[];
  addIssue: (issue: Omit<Issue, 'id' | 'timestamp' | 'status' | 'reporterId' | 'verificationUpvotes' | 'spamDownvotes' | 'upvotedBy' | 'downvotedBy' | 'comments' | 'communityVerified'>) => void;
  upvoteToVerify: (issueId: string) => void;
  downvoteAsSpam: (issueId: string) => void;
  addComment: (issueId: string, text: string) => void;
  resolveIssue: (issueId: string) => void;
  submitProofOfFix: (issueId: string, witnessUserId: string) => Promise<{success: boolean, message?: string}>;
  verifyIssueResolution: (issueId: string, witnessUserId: string) => Promise<{success: boolean, message?: string}>;
  editIssue: (issueId: string, description: string) => void;
  deleteIssue: (issueId: string) => void;
  users: User[];
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  activeProfileId: string | null;
  setActiveProfileId: (id: string | null) => void;
  updateTrustScore: (userId: string, delta: number) => void;
  runCityPlannerAnalysis: () => Promise<string>;
  aiGeneratedDailyBrief: string;
  syncAutonomousDailyBrief: () => Promise<void>;
  userLocation: { lat: number; lng: number } | null;
  setUserLocation: (loc: { lat: number; lng: number } | null) => void;
  setManualLocation: (lat: number | null, lng: number | null) => Promise<void>;
  mapFocusLocation: { lat: number; lng: number } | null;
  setMapFocusLocation: (loc: { lat: number; lng: number } | null) => void;
  
  // DM State
  sendMessage: (receiverId: string, text: string) => Promise<void>;
  fetchMessages: (otherUserId: string) => Promise<Message[]>;
  fetchInbox: () => Promise<Conversation[]>;
  globalUnreadDMs: number;
  
  // Theme State
  isDarkMode: boolean;
  toggleTheme: () => void;

  // Shop State
  purchaseShopItem: (itemId: string, itemPrice: number) => Promise<{success: boolean, message?: string}>;
}

const defaultUsers: User[] = [
  { id: '1', name: 'Elena R.', handle: '@elena_reports', badge: 'Champion', capturedBP: 1250, pendingBP: 0, avatar: 'https://i.pravatar.cc/150?u=elena', civic_trust_score: 100, requiresDoubleUpvotes: false, district: 'District 4', achievedBadges: ['Founding Member'], unlockedTitles: [], activeCosmetics: { glowColor: null, avatarBorder: null, currentTitle: null } },
  { id: '2', name: 'Marcus T.', handle: '@marcust', badge: 'Advocate', capturedBP: 980, pendingBP: 0, avatar: 'https://i.pravatar.cc/150?u=marcus', civic_trust_score: 100, requiresDoubleUpvotes: false, district: 'District 4', achievedBadges: [], unlockedTitles: [], activeCosmetics: { glowColor: null, avatarBorder: null, currentTitle: null } },
  { id: '3', name: 'Sarah J.', handle: '@sarahj_civic', badge: 'Defender', capturedBP: 845, pendingBP: 0, avatar: 'https://i.pravatar.cc/150?u=sarah', civic_trust_score: 100, requiresDoubleUpvotes: false, district: 'Sector 7', achievedBadges: [], unlockedTitles: [], activeCosmetics: { glowColor: null, avatarBorder: null, currentTitle: null } },
  { id: '4', name: 'David W.', handle: '@david_walker', badge: 'Scout', capturedBP: 620, pendingBP: 0, avatar: 'https://i.pravatar.cc/150?u=david', civic_trust_score: 100, requiresDoubleUpvotes: false, district: 'District 4', achievedBadges: [], unlockedTitles: [], activeCosmetics: { glowColor: null, avatarBorder: null, currentTitle: null } },
];
const initialIssues: Issue[] = [
  {
    id: '1',
    type: 'pothole',
    lat: 34.0650,
    lng: -118.2750,
    description: 'Massive pothole on main street. Almost blew out my tire! City needs to fix this ASAP.',
    image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=800',
    timestamp: new Date(Date.now() - 3600000),
    status: 'active',
    reporterId: '2',
    comments: [
      { id: 'c1', userId: '3', text: 'I hit that yesterday! It is so dangerous.', timestamp: new Date(Date.now() - 1800000) }
    ],
    severityScore: 3,
    assignedDepartment: 'Public Works Roads Div',
    confidenceScore: 0.92,
    communityVerified: true,
    bountyTier: 'Common Bounty',
    bountyPoints: 50,
    district: 'District 4',
    verificationUpvotes: 0,
    spamDownvotes: 0
  },
  {
    id: '2',
    type: 'water',
    lat: 34.0400,
    lng: -118.2350,
    description: 'Major water leak from a broken hydrant near the park. It is flooding the sidewalk.',
    image: 'https://images.unsplash.com/photo-1541888062561-396349603f90?auto=format&fit=crop&q=80&w=800',
    timestamp: new Date(Date.now() - 7200000),
    status: 'active',
    reporterId: '3',
    comments: [],
    severityScore: 8,
    assignedDepartment: 'Water Supply & Sewage Board',
    confidenceScore: 0.55,
    communityVerified: false,
    bountyTier: 'Epic/Mythic Bounty',
    bountyPoints: 200,
    district: 'Sector 7',
    verificationUpvotes: 0,
    spamDownvotes: 0
  },
  {
    id: '3',
    type: 'streetlight',
    lat: 34.0800,
    lng: -118.2300,
    description: 'Streetlight out at the intersection of 5th and Grand. Very dark and unsafe for pedestrians.',
    timestamp: new Date(Date.now() - 86400000),
    status: 'active',
    reporterId: '1',
    comments: [],
    severityScore: 4,
    assignedDepartment: 'Electrical Grid & Maintenance',
    confidenceScore: 0.88,
    communityVerified: true,
    bountyTier: 'Rare Bounty',
    bountyPoints: 100,
    district: 'District 4',
    verificationUpvotes: 0,
    spamDownvotes: 0
  }
];

const sanitizeUser = (user: User | null): User | null => {
  return user;
};

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentView, setCurrentView] = useState<ViewState>('community');
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [aiGeneratedDailyBrief, setAiGeneratedDailyBrief] = useState<string>('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapFocusLocation, setMapFocusLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [globalUnreadDMs, setGlobalUnreadDMs] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Theme effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  const nearbyIssues = useMemo(() => {
    if (!userLocation) return issues;
    return [...issues]
      .map(issue => ({ issue, dist: distanceKm(userLocation.lat, userLocation.lng, issue.lat, issue.lng) }))
      .filter(({ dist }) => dist <= 10)
      .sort((a, b) => a.dist - b.dist)
      .map(({ issue }) => issue);
  }, [issues, userLocation]);

  // Fetch initial data
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, issuesRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/issues')
        ]);
        if (usersRes.ok && issuesRes.ok) {
          const usersContentType = usersRes.headers.get('content-type');
          const issuesContentType = issuesRes.headers.get('content-type');
          
          if (usersContentType?.includes('application/json') && issuesContentType?.includes('application/json')) {
            const usersData = await usersRes.json();
            const issuesData = await issuesRes.json();
            setUsers(usersData);
            setIssues(issuesData);
          } else {
            console.warn("API returned non-JSON response, using fallback data");
            setUsers(defaultUsers);
            setIssues(initialIssues);
          }
        } else {
          console.warn("API returned error, using fallback data");
          setUsers(defaultUsers);
          setIssues(initialIssues);
        }
      } catch (err) {
        console.error('Failed to fetch initial data:', err);
        setUsers(defaultUsers);
        setIssues(initialIssues);
      }
    };
    fetchData();
  }, []);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setIsLoggedIn(true);
        try {
          const res = await fetch('/api/users/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: firebaseUser.uid,
              name: firebaseUser.displayName,
              avatar: firebaseUser.photoURL,
              email: firebaseUser.email
            })
          });
          if (res.ok) {
            const syncedUser = await res.json();
            setCurrentUser(sanitizeUser(syncedUser));
            // Refresh users to ensure they are up to date
            const usersRes = await fetch('/api/users');
            if (usersRes.ok && usersRes.headers.get('content-type')?.includes('application/json')) {
              setUsers(await usersRes.json());
            }
          }
        } catch (err) {
          console.error("Failed to sync user:", err);
        }
      } else {
        setIsLoggedIn(false);
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Poll for global unread DMs
  React.useEffect(() => {
    let interval: any;
    if (isLoggedIn && currentUser) {
      const checkInbox = async () => {
        try {
          const res = await fetch('/api/inbox', {
            headers: { 'user-id': currentUser.id }
          });
          if (res.ok) {
            const data: Conversation[] = await res.json();
            const unread = data.reduce((acc, convo) => acc + convo.unreadCount, 0);
            setGlobalUnreadDMs(unread);
          }
        } catch (e) {
          // silent error
        }
      };
      checkInbox();
      interval = setInterval(checkInbox, 5000);
    }
    return () => clearInterval(interval);
  }, [isLoggedIn, currentUser]);

  const loginEmailPassword = async (email: string, password: string) => {
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      await signInWithEmailAndPassword(auth, email, password);
      setCurrentView('community');
    } catch (error: any) {
      console.error('Error signing in with email', error);
      throw error;
    }
  };

  const signUpEmailPassword = async (email: string, password: string, name: string) => {
    try {
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      
      // Sync initial user
      await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userCredential.user.uid,
          name: name,
          email: email
        })
      });
      setCurrentView('community');
    } catch (error: any) {
      console.error('Error signing up with email', error);
      throw error;
    }
  };

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
      setCurrentView('community');
    } catch (error: any) {
      console.error('Error signing in with Google', error);
      if (error.code === 'auth/popup-blocked') {
        alert('Popup blocked by browser. Please allow popups or open this app in a new tab to sign in with Google.');
      } else if (error.code === 'auth/cancelled-popup-request' || error.message?.includes('INTERNAL ASSERTION FAILED')) {
        // User closed the popup, or popup failed to open properly.
        console.warn('Popup closed or failed to initialize.');
      } else {
        alert('Failed to sign in: ' + error.message);
      }
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setCurrentView('community');
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  const setManualLocation = async (lat: number | null, lng: number | null) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/users/${currentUser.id}/location`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      });
      if (res.ok) {
        const updated = await res.json();
        setCurrentUser(sanitizeUser(updated));
        setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
        if (lat !== null && lng !== null) {
          setUserLocation({ lat, lng });
        } else {
          if (updated.lastKnownLocation && typeof updated.lastKnownLocation.lat === 'number' && typeof updated.lastKnownLocation.lng === 'number' && !isNaN(updated.lastKnownLocation.lat) && !isNaN(updated.lastKnownLocation.lng)) {
            setUserLocation(updated.lastKnownLocation);
          } else {
            setUserLocation(null);
          }
        }
      }
    } catch (err) {
      console.error('Failed to set manual location', err);
    }
  };

  const updateLastKnownLocation = async (lat: number, lng: number) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/users/${currentUser.id}/lastKnownLocation`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      });
      if (res.ok) {
        const updated = await res.json();
        setCurrentUser(sanitizeUser(updated));
        setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      }
    } catch (err) {
      console.error('Failed to sync last known location', err);
    }
  };

  const handleSetUserLocation = (loc: { lat: number; lng: number } | null) => {
    setUserLocation(loc);
    if (loc && currentUser) {
      const last = currentUser.lastKnownLocation;
      if (!last || distanceKm(last.lat, last.lng, loc.lat, loc.lng) > 0.05) { // 50 meters
        updateLastKnownLocation(loc.lat, loc.lng);
      }
    }
  };

  const addIssue = async (issueData: Omit<Issue, 'id' | 'timestamp' | 'status' | 'reporterId' | 'verificationUpvotes' | 'spamDownvotes' | 'upvotedBy' | 'downvotedBy' | 'comments' | 'communityVerified'>) => {
    if (!currentUser) return;
    try {
      const payload = {
        ...issueData,
        reporterId: currentUser.id
      };
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const updatedIssue = await res.json();
        setIssues(prev => [updatedIssue, ...prev]);
        
        // Re-fetch user data from server to get updated BP and badge
        if (currentUser) {
          try {
            const usersRes = await fetch('/api/users');
            if (usersRes.ok && usersRes.headers.get('content-type')?.includes('application/json')) {
              const usersData = await usersRes.json();
              setUsers(usersData);
              const updatedCurrentUser = usersData.find((u: User) => u.id === currentUser.id);
              if (updatedCurrentUser) {
                setCurrentUser(sanitizeUser(updatedCurrentUser));
              }
            }
          } catch (err) {
            console.error('Failed to refresh user data after issue creation:', err);
          }
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error('Failed to create issue:', errData);
        throw new Error(errData.error || 'Failed to create issue on server.');
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const purchaseShopItem = async (itemId: string, itemPrice: number): Promise<{success: boolean, message?: string}> => {
    if (!currentUser) return { success: false, message: 'Not authenticated' };
    if (currentUser.capturedBP < itemPrice) {
      return { success: false, message: 'Insufficient Bounty Points' };
    }
    
    try {
      const res = await fetch(`/api/users/${currentUser.id}/purchase`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, price: itemPrice })
      });
      
      if (!res.ok) {
        const data = await res.json();
        return { success: false, message: data.error || 'Failed to complete purchase' };
      }
      
      const updatedUser = await res.json();
      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      return { success: true };
    } catch (err: any) {
      console.error('Failed to purchase shop item', err);
      return { success: false, message: err.message };
    }
  };

  const sendMessage = async (receiverId: string, text: string) => {
    if (!currentUser) return;
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'user-id': currentUser.id },
        body: JSON.stringify({ receiverId, text })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (otherUserId: string) => {
    if (!currentUser) return [];
    try {
      const res = await fetch(`/api/messages/${otherUserId}`, {
        headers: { 'user-id': currentUser.id }
      });
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const fetchInbox = async () => {
    if (!currentUser) return [];
    try {
      const res = await fetch('/api/inbox', {
        headers: { 'user-id': currentUser.id }
      });
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const upvoteToVerify = async (issueId: string) => {
    if (!currentUser) return;
    const issue = issues.find(i => i.id === issueId);
    if (!issue || issue.upvotedBy?.includes(currentUser.id) || issue.downvotedBy?.includes(currentUser.id)) return;
    
    // Optimistic update
    setIssues(prev => prev.map(i => {
      if (i.id === issueId) {
        const newUpvotes = (i.verificationUpvotes || 0) + 1;
        return {
          ...i,
          verificationUpvotes: newUpvotes,
          upvotedBy: [...(i.upvotedBy || []), currentUser.id],
          communityVerified: newUpvotes >= 5 ? true : i.communityVerified
        };
      }
      return i;
    }));

    try {
      await fetch(`/api/issues/${issueId}/upvote`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      // Sync users to update BP
      const usersRes = await fetch('/api/users');
      if (usersRes.ok) setUsers(await usersRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const downvoteAsSpam = async (issueId: string) => {
    if (!currentUser) return;
    const issue = issues.find(i => i.id === issueId);
    if (!issue || issue.downvotedBy?.includes(currentUser.id) || issue.upvotedBy?.includes(currentUser.id)) return;
    
    // Optimistic update
    setIssues(prev => prev.map(i => {
      if (i.id === issueId) {
        const newDownvotes = (i.spamDownvotes || 0) + 1;
        return {
          ...i,
          spamDownvotes: newDownvotes,
          downvotedBy: [...(i.downvotedBy || []), currentUser.id],
          status: newDownvotes >= 5 ? 'moderated_fake' : i.status
        };
      }
      return i;
    }));

    try {
      await fetch(`/api/issues/${issueId}/downvote`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      // Optionally trigger user sync if threshold was hit, to reflect trust score reduction locally
      if (issue.spamDownvotes + 1 === 5) {
        const usersRes = await fetch('/api/users');
        if (usersRes.ok) setUsers(await usersRes.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addComment = async (issueId: string, text: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/issues/${issueId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, text })
      });
      if (res.ok) {
        const updatedIssue = await res.json();
        setIssues(prev => prev.map(issue => issue.id === issueId ? updatedIssue : issue));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateTrustScore = async (userId: string, delta: number) => {
    try {
      const res = await fetch(`/api/users/${userId}/trust`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUsers(prev => {
          const newUsers = [...prev];
          const userIndex = newUsers.findIndex(u => u.id === userId);
          if (userIndex !== -1) {
            newUsers[userIndex] = updatedUser;
            if (currentUser && currentUser.id === userId) {
               setCurrentUser(sanitizeUser(updatedUser));
            }
          }
          return newUsers;
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const runCityPlannerAnalysis = async () => {
    const response = await fetch('/api/city-planner-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ issues })
    });
    if (!response.ok) {
      throw new Error('Failed to run analysis');
    }
    const data = await response.json();
    return data.analysis;
  };

  const syncAutonomousDailyBrief = async () => {
    try {
      const issuesLog = issues.map(i => ({
        type: i.type,
        description: i.description,
        status: i.status,
        timestamp: i.timestamp
      }));
      const response = await fetch('/api/daily-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issues: issuesLog })
      });
      if (!response.ok) throw new Error('Failed to fetch daily brief');
      const data = await response.json();
      if (data.brief) setAiGeneratedDailyBrief(data.brief);
    } catch (err) {
      console.error(err);
      setAiGeneratedDailyBrief("Unable to generate the daily brief at this time.");
    }
  };

  // ── Proof-of-Fix Verification Pipeline ──────────────────────────────────
  const verifyIssueResolution = async (
    issueId: string,
    witnessUserId: string
  ): Promise<{success: boolean, message?: string}> => {
    if (!currentUser) return { success: false, message: 'Not authenticated' };

    const issue = issues.find(i => i.id === issueId);
    if (!issue) return { success: false, message: 'Issue not found' };

    // Anti-collusion: reporter cannot self-verify
    if (witnessUserId === issue.reporterId || currentUser.id === issue.reporterId) {
      return { success: false, message: 'You cannot verify resolution of your own reported issue.' };
    }

    if (issue.fixWitnesses?.includes(witnessUserId)) {
      return { success: false, message: 'You have already submitted a verification for this issue.' };
    }

    try {
      const res = await fetch(`/api/issues/${issueId}/verify-fix`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: witnessUserId })
      });

      if (res.ok) {
        const updatedIssue = await res.json();

        // Sync issues state
        setIssues(prev => prev.map(i => i.id === issueId ? updatedIssue : i));

        // Sync users from server and re-sort leaderboard
        const usersRes = await fetch('/api/users');
        if (usersRes.ok) {
          const freshUsers: User[] = await usersRes.json();
          // Re-sort by capturedBP descending for real-time leaderboard update
          const sortedUsers = [...freshUsers].sort((a, b) => (b.capturedBP || 0) - (a.capturedBP || 0));
          setUsers(sortedUsers);
          const updatedMe = sortedUsers.find(u => u.id === currentUser.id);
          if (updatedMe) setCurrentUser(sanitizeUser(updatedMe));
        } else {
          // Fallback: optimistic client-side mutation if server users endpoint is down
          const isResolved = (issue.fixWitnesses?.length || 0) + 1 >= 5;
          if (isResolved) {
            setUsers(prev => {
              const updated = prev.map(u => {
                if (u.id === issue.reporterId) {
                  const escrow = issue.bountyPoints || 100;
                  const newCaptured = (u.capturedBP || 0) + escrow;
                  return {
                    ...u,
                    pendingBP: Math.max(0, (u.pendingBP || 0) - escrow),
                    capturedBP: newCaptured,
                    badge: newCaptured >= 2000 ? 'Champion' : newCaptured >= 1000 ? 'Advocate' : newCaptured >= 500 ? 'Defender' : u.badge,
                  };
                }
                // Reward all witnesses plus the new one
                if (issue.fixWitnesses?.includes(u.id) || u.id === witnessUserId) {
                  const newCaptured = (u.capturedBP || 0) + 20;
                  return {
                    ...u,
                    capturedBP: newCaptured,
                    badge: newCaptured >= 2000 ? 'Champion' : newCaptured >= 1000 ? 'Advocate' : newCaptured >= 500 ? 'Defender' : u.badge,
                  };
                }
                return u;
              });
              // Re-sort leaderboard
              return [...updated].sort((a, b) => (b.capturedBP || 0) - (a.capturedBP || 0));
            });
          }
        }

        return { success: true };
      } else {
        const rawText = await res.text();
        try {
          const data = JSON.parse(rawText);
          return { success: false, message: data.error || 'Verification failed' };
        } catch {
          console.error('Server returned non-JSON:', rawText);
          return { success: false, message: `Server Error: ${rawText.slice(0, 120)}` };
        }
      }
    } catch (err: any) {
      console.error('verifyIssueResolution error:', err);
      return { success: false, message: err.message };
    }
  };

  // Alias — submitProofOfFix delegates to the canonical pipeline
  const submitProofOfFix = async (issueId: string, witnessUserId: string): Promise<{success: boolean, message?: string}> => {
    return verifyIssueResolution(issueId, witnessUserId);
  };

  const resolveIssue = async (issueId: string) => {
    try {
      const res = await fetch(`/api/issues/${issueId}/resolve`, { method: 'PUT' });
      if (res.ok) {
        setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status: 'resolved' } : i));
        // Sync users to update BP
        const usersRes = await fetch('/api/users');
        if (usersRes.ok) setUsers(await usersRes.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const editIssue = async (issueId: string, description: string) => {
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      });
      if (res.ok) {
        const updatedIssue = await res.json();
        setIssues(prev => prev.map(i => i.id === issueId ? updatedIssue : i));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteIssue = async (issueId: string) => {
    try {
      const res = await fetch(`/api/issues/${issueId}`, { method: 'DELETE' });
      if (res.ok) {
        setIssues(prev => prev.filter(i => i.id !== issueId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppContext.Provider value={{ 
      isLoggedIn, currentUser, login, loginEmailPassword, signUpEmailPassword, logout, 
      issues, nearbyIssues, addIssue, upvoteToVerify, downvoteAsSpam, addComment, resolveIssue, submitProofOfFix, verifyIssueResolution, editIssue, deleteIssue, 
      users, currentView, setCurrentView, activeProfileId, setActiveProfileId, updateTrustScore, 
      runCityPlannerAnalysis, aiGeneratedDailyBrief, syncAutonomousDailyBrief, 
      userLocation, setUserLocation: handleSetUserLocation, setManualLocation,
      mapFocusLocation, setMapFocusLocation,
      sendMessage, fetchMessages, fetchInbox, globalUnreadDMs,
      isDarkMode, toggleTheme, purchaseShopItem
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
