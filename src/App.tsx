import React, { useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ActionHub from './components/ActionHub';
import MapDashboard from './components/MapDashboard';
import UserSection from './components/UserSection';
import AuthScreen from './components/AuthScreen';
import CommunityFeed from './components/CommunityFeed';
import InsightsDashboard from './components/InsightsDashboard';
import Settings from './components/Settings';
import Messages from './components/Messages';
import CivicShop from './components/CivicShop';
import { useAppContext } from './context/AppContext';
import { useGeolocation } from './hooks/useGeolocation';
import { motion, AnimatePresence } from 'motion/react';
import { Shield } from 'lucide-react';

function PremiumLoader() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-civic-bg"
    >
      <div className="relative flex flex-col items-center">
        {/* Logo Image */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8 relative"
        >
          <img src="/logo1.png" alt="Solvuno Logo" className="w-72 h-auto object-contain" />
        </motion.div>

        {/* Loading text/bar */}
        <div className="flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-civic-muted mb-4"
          >
            Securing Connection
          </motion.div>

          <div className="w-48 h-1 bg-civic-border rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="h-full bg-civic-accent rounded-full"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function App() {
  const { currentView, isLoggedIn, currentUser, setCurrentView, setUserLocation, setActiveProfileId } = useAppContext();
  const { location } = useGeolocation(currentUser?.manualLocation, currentUser?.lastKnownLocation);

  const [activeChatUserId, setActiveChatUserId] = React.useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = React.useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (location?.lat !== undefined && location?.lng !== undefined) {
      setUserLocation({ lat: location.lat, lng: location.lng });
    }
  }, [location?.lat, location?.lng]);

  useEffect(() => {
    const handleOpenDm = (e: any) => {
      setActiveChatUserId(e.detail);
      setCurrentView('inbox');
    };
    const handleOpenProfile = (e: any) => {
      setActiveProfileId(e.detail);
      setCurrentView('public-profile');
    };
    window.addEventListener('open-dm', handleOpenDm);
    window.addEventListener('open-profile', handleOpenProfile);
    return () => {
      window.removeEventListener('open-dm', handleOpenDm);
      window.removeEventListener('open-profile', handleOpenProfile);
    };
  }, []);

  if (!isLoggedIn) return (
    <>
      <AnimatePresence>{isInitialLoading && <PremiumLoader />}</AnimatePresence>
      <AuthScreen />
    </>
  );

  return (
    <>
      <AnimatePresence>{isInitialLoading && <PremiumLoader />}</AnimatePresence>
      <div className="flex h-screen w-full bg-civic-bg dark:bg-[#0a0a0a] text-civic-ink dark:text-white font-sans overflow-hidden p-4 md:p-6 relative pl-20 md:pl-72 transition-colors duration-200">
      <div className="w-full h-full flex gap-6 relative pb-20 md:pb-0">
        {currentView === 'community'  && <CommunityFeed />}
        {currentView === 'map'        && (
          <div className="w-full h-full rounded-2xl overflow-hidden border border-civic-border shadow-lg">
            <MapDashboard />
          </div>
        )}
        {currentView === 'report'     && <ActionHub />}
          {currentView === 'profile'    && <UserSection />}
          {currentView === 'public-profile' && <UserSection />}
          {currentView === 'settings'   && <Settings />}
          {currentView === 'dashboard'  && <InsightsDashboard />}
          {currentView === 'shop'       && <CivicShop />}
          {currentView === 'inbox'      && <Messages initialChatUserId={activeChatUserId} onClose={() => { setActiveChatUserId(null); setCurrentView('community'); }} />}
        </div>
        <Sidebar />
      </div>
    </>
  );
}
