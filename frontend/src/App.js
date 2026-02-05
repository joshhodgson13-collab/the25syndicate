import { useState, useEffect, createContext, useContext, useCallback } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { Home, Star, FileText, Mail, User, Crown, Lock, LogOut, Plus, Trash2, Check, X, Clock, Trophy, Target, Bell, BellOff, Send, Users, Download, RefreshCw, Play, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// AdSense Publisher ID
const ADSENSE_CLIENT = "ca-pub-6120249761604995";

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await axios.get(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(response.data);
        } catch (e) {
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const register = async (email, password, name) => {
    const response = await axios.post(`${API}/auth/register`, { email, password, name });
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token) {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Crown SVG Component
const CrownIcon = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
  </svg>
);

// Header Component
const Header = ({ onLogoClick, onNotificationClick }) => {
  const [clickCount, setClickCount] = useState(0);
  const clickTimerRef = useState(null);
  const { user, token } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);

  useEffect(() => {
    const checkSubscription = async () => {
      if (user && token) {
        try {
          const response = await axios.get(`${API}/notifications/status`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setIsSubscribed(response.data.subscribed);
        } catch (e) {
          console.error("Error checking notification status:", e);
        }
      }
    };
    checkSubscription();
  }, [user, token]);

  // Check for new notifications
  useEffect(() => {
    const checkNewNotifications = async () => {
      try {
        const response = await axios.get(`${API}/notifications/latest`);
        const lastSeen = localStorage.getItem("lastSeenNotification");
        if (response.data.length > 0 && response.data[0].id !== lastSeen) {
          setHasNewNotification(true);
        }
      } catch (e) {
        console.error("Error checking notifications:", e);
      }
    };
    checkNewNotifications();
    const interval = setInterval(checkNewNotifications, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleLogoClick = () => {
    setClickCount(prev => {
      const newCount = prev + 1;
      
      // Clear existing timer
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
      
      // Reset count after 3 seconds of no clicks
      clickTimerRef.current = setTimeout(() => setClickCount(0), 3000);
      
      if (newCount >= 5) {
        onLogoClick();
        return 0;
      }
      
      return newCount;
    });
  };

  const handleBellClick = () => {
    setHasNewNotification(false);
    onNotificationClick();
  };

  return (
    <header className="sticky top-0 z-50 glass border-b border-[rgba(212,175,55,0.2)]">
      <div className="flex items-center justify-between py-4 px-4 max-w-lg mx-auto">
        <div className="w-10"></div>
        <button 
          onClick={handleLogoClick}
          className="flex items-center gap-2 select-none"
          data-testid="header-logo"
        >
          <CrownIcon className="w-6 h-6 text-[var(--gold)] crown-icon" />
          <h1 className="font-display text-xl font-semibold tracking-wide text-white">
            THE 2.5 SYNDICATE
          </h1>
          <CrownIcon className="w-6 h-6 text-[var(--gold)] crown-icon" />
        </button>
        <button
          onClick={handleBellClick}
          className="relative p-2 hover:bg-[var(--charcoal-lighter)] rounded-full transition-colors"
          data-testid="notification-bell"
        >
          <Bell className={`w-5 h-5 ${isSubscribed ? 'text-[var(--gold)]' : 'text-[var(--text-secondary)]'}`} />
          {hasNewNotification && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--error)] rounded-full animate-pulse"></span>
          )}
        </button>
      </div>
    </header>
  );
};

// Bottom Navigation
const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { path: "/results", icon: FileText, label: "Results" },
    { path: "/vip", icon: Star, label: "Tips VIP" },
    { path: "/", icon: Home, label: "Home" },
    { path: "/about", icon: Mail, label: "About" },
    { path: "/account", icon: User, label: "My Account" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bottom-nav z-50" data-testid="bottom-navigation">
      <div className="flex justify-around items-center py-3 px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 nav-item ${isActive ? "active" : ""}`}
              data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-[var(--gold)]" : "text-[var(--text-secondary)]"}`} />
              <span className={`text-xs ${isActive ? "text-[var(--gold)]" : "text-[var(--text-secondary)]"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// Bet Card Component
const BetCard = ({ bet, showResult = false }) => {
  const kickOffTime = new Date(bet.kick_off).toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  // Calculate profit/loss
  const calculateProfitLoss = () => {
    if (bet.status === "won") {
      return (bet.stake * (bet.odds - 1)).toFixed(2);
    } else if (bet.status === "lost") {
      return (-bet.stake).toFixed(2);
    }
    return null;
  };

  const profitLoss = showResult ? calculateProfitLoss() : null;

  return (
    <div className="bet-card p-4 animate-fade-in" data-testid={`bet-card-${bet.id}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <p className="text-[var(--text-secondary)] text-xs uppercase tracking-wider mb-1">
            {bet.league}
          </p>
          <h3 className="font-semibold text-white text-lg">
            {bet.home_team} vs {bet.away_team}
          </h3>
        </div>
        <div className="text-right">
          {showResult ? (
            <div className="flex flex-col items-end gap-1">
              <span className={bet.status === "won" ? "badge-won" : "badge-lost"}>
                {bet.status}
              </span>
              {profitLoss && (
                <span className={`font-bold text-sm ${parseFloat(profitLoss) >= 0 ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
                  {parseFloat(profitLoss) >= 0 ? '+' : ''}{profitLoss} pts
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[var(--text-secondary)]">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{kickOffTime}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-between items-end">
        <div>
          <p className="text-[var(--gold)] font-semibold text-lg mb-2">{bet.bet_type}</p>
          <p className="text-[var(--text-secondary)] text-sm">
            Points: <span className="text-white font-medium">{bet.stake}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[var(--text-muted)] text-xs">Odds</p>
          <p className="text-[var(--gold)] font-bold text-xl">{bet.odds.toFixed(2)}</p>
          {showResult && bet.home_score !== null && (
            <p className="text-white text-sm mt-1">
              {bet.home_score} - {bet.away_score}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Ad Locked Bet Component
const AdLockedBet = ({ bet, index }) => {
  const [isLocked, setIsLocked] = useState(true);
  const [showingAd, setShowingAd] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [adLoaded, setAdLoaded] = useState(false);
  
  // Check localStorage for previously unlocked bets
  useEffect(() => {
    const unlockedBets = JSON.parse(localStorage.getItem('unlockedBets') || '[]');
    if (unlockedBets.includes(bet.id)) {
      setIsLocked(false);
    }
  }, [bet.id]);
  
  // Countdown timer when showing ad
  useEffect(() => {
    let timer;
    if (showingAd && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (showingAd && countdown === 0) {
      // Ad finished - unlock the bet
      setShowingAd(false);
      setIsLocked(false);
      // Save to localStorage
      const unlockedBets = JSON.parse(localStorage.getItem('unlockedBets') || '[]');
      if (!unlockedBets.includes(bet.id)) {
        unlockedBets.push(bet.id);
        localStorage.setItem('unlockedBets', JSON.stringify(unlockedBets));
      }
    }
    return () => clearTimeout(timer);
  }, [showingAd, countdown, bet.id]);
  
  // Load AdSense ad
  useEffect(() => {
    if (showingAd && !adLoaded) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setAdLoaded(true);
      } catch (e) {
        console.log('AdSense error:', e);
      }
    }
  }, [showingAd, adLoaded]);
  
  const startWatchingAd = () => {
    setShowingAd(true);
    setCountdown(15);
    setAdLoaded(false);
  };
  
  // Show unlocked bet
  if (!isLocked) {
    return <BetCard bet={bet} />;
  }
  
  // Show ad overlay
  if (showingAd) {
    return (
      <div className="bet-card p-4 animate-fade-in" data-testid={`ad-overlay-${bet.id}`}>
        <div className="text-center mb-4">
          <p className="text-[var(--gold)] font-semibold mb-2">Watch Ad to Reveal Tip</p>
          <div className="flex items-center justify-center gap-2 text-white">
            <Clock className="w-4 h-4" />
            <span className="font-mono text-xl">{countdown}s</span>
          </div>
        </div>
        
        {/* AdSense Ad Unit */}
        <div className="bg-[var(--charcoal-lighter)] rounded-lg p-2 min-h-[250px] flex items-center justify-center">
          <ins 
            className="adsbygoogle"
            style={{ display: 'block', width: '100%', height: '250px' }}
            data-ad-client={ADSENSE_CLIENT}
            data-ad-slot="auto"
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
        
        <p className="text-[var(--text-muted)] text-xs text-center mt-3">
          Tip will be revealed when the timer ends
        </p>
      </div>
    );
  }
  
  // Show locked state
  return (
    <div className="bet-card p-4 animate-fade-in relative overflow-hidden" data-testid={`locked-bet-${bet.id}`}>
      {/* Blurred preview */}
      <div className="filter blur-sm pointer-events-none">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <p className="text-[var(--text-secondary)] text-xs uppercase tracking-wider mb-1">
              {bet.league}
            </p>
            <h3 className="font-semibold text-white text-lg">
              {bet.home_team} vs {bet.away_team}
            </h3>
          </div>
        </div>
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[var(--gold)] font-semibold text-lg mb-2">????????</p>
            <p className="text-[var(--text-secondary)] text-sm">Points: ?</p>
          </div>
          <div className="text-right">
            <p className="text-[var(--text-muted)] text-xs">Odds</p>
            <p className="text-[var(--gold)] font-bold text-xl">?.??</p>
          </div>
        </div>
      </div>
      
      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--obsidian)]/80">
        <Lock className="w-8 h-8 text-[var(--gold)] mb-3" />
        <p className="text-white font-medium mb-3">Tip #{index + 1} Locked</p>
        <Button 
          onClick={startWatchingAd}
          className="btn-gold"
          data-testid={`watch-ad-btn-${bet.id}`}
        >
          <Play className="w-4 h-4 mr-2" />
          Watch Ad to Reveal
        </Button>
      </div>
    </div>
  );
};

// Home Page
const HomePage = () => {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [betsRes, statsRes] = await Promise.all([
          axios.get(`${API}/bets/today`),
          axios.get(`${API}/stats`)
        ]);
        setBets(betsRes.data);
        setStats(statsRes.data);
      } catch (e) {
        console.error("Error fetching bets:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="pb-24 px-4" data-testid="home-page">
      {/* CTA Banner */}
      {!user && (
        <div className="vip-card p-6 my-4 text-center animate-slide-up" data-testid="signup-banner">
          <h2 className="font-display text-2xl text-[var(--gold)] mb-2">
            JOIN HERE FOR FREE BETS
          </h2>
          <p className="text-[var(--text-secondary)] mb-4">
            Sign up now to access our daily betting tips
          </p>
          <Button 
            onClick={() => navigate("/account")} 
            className="btn-gold"
            data-testid="signup-banner-btn"
          >
            Sign Up Now
          </Button>
        </div>
      )}

      {/* Stats */}
      {stats && stats.total_bets > 0 && (
        <div className="grid grid-cols-3 gap-3 my-4">
          <div className="bet-card p-3 text-center">
            <Trophy className="w-5 h-5 text-[var(--gold)] mx-auto mb-1" />
            <p className="text-[var(--gold)] font-bold text-xl">{stats.win_rate}%</p>
            <p className="text-[var(--text-muted)] text-xs">Win Rate</p>
          </div>
          <div className="bet-card p-3 text-center">
            <Check className="w-5 h-5 text-[var(--success)] mx-auto mb-1" />
            <p className="text-[var(--success)] font-bold text-xl">{stats.won_bets}</p>
            <p className="text-[var(--text-muted)] text-xs">Won</p>
          </div>
          <div className="bet-card p-3 text-center">
            <Target className="w-5 h-5 text-[var(--text-secondary)] mx-auto mb-1" />
            <p className="text-white font-bold text-xl">{stats.total_bets}</p>
            <p className="text-[var(--text-muted)] text-xs">Total Tips</p>
          </div>
        </div>
      )}

      {/* Today's Selections */}
      <div className="my-4">
        <div className="flex items-center gap-2 mb-4">
          <Check className="w-5 h-5 text-[var(--gold)]" />
          <h2 className="font-display text-lg text-white uppercase tracking-wider">
            Today&apos;s Selections
          </h2>
        </div>
        
        {loading ? (
          <div className="text-center py-8 text-[var(--text-secondary)]">Loading...</div>
        ) : bets.length > 0 ? (
          <div className="space-y-3">
            {bets.map((bet, index) => (
              <div key={bet.id} style={{ animationDelay: `${index * 0.1}s` }}>
                <BetCard bet={bet} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bet-card p-8 text-center">
            <p className="text-[var(--text-secondary)]">No tips available today</p>
            <p className="text-[var(--text-muted)] text-sm mt-2">Check back later for new selections</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Results Page
const ResultsPage = () => {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await axios.get(`${API}/bets/results`);
        setBets(response.data);
      } catch (e) {
        console.error("Error fetching results:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  // Calculate all-time profit/loss
  const calculateTotalProfitLoss = () => {
    let total = 0;
    for (const bet of bets) {
      if (bet.status === "won") {
        total += bet.stake * (bet.odds - 1);
      } else if (bet.status === "lost") {
        total -= bet.stake;
      }
    }
    return total.toFixed(2);
  };

  const totalProfitLoss = bets.length > 0 ? calculateTotalProfitLoss() : "0.00";
  const isProfit = parseFloat(totalProfitLoss) >= 0;

  return (
    <div className="pb-24 px-4" data-testid="results-page">
      <div className="my-4">
        <h2 className="font-display text-2xl text-[var(--gold)] text-center mb-4">RESULTS</h2>
        
        {/* All-time Profit/Loss Banner */}
        {bets.length > 0 && (
          <div className={`vip-card p-4 mb-6 text-center ${isProfit ? 'border-[var(--success)]' : 'border-[var(--error)]'}`} style={{ borderColor: isProfit ? 'var(--success)' : 'var(--error)' }}>
            <p className="text-[var(--text-secondary)] text-sm mb-1">All-Time Profit/Loss</p>
            <p className={`font-display text-3xl font-bold ${isProfit ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
              {isProfit ? '+' : ''}{totalProfitLoss} pts
            </p>
            <p className="text-[var(--text-muted)] text-xs mt-2">
              {bets.filter(b => b.status === "won").length} wins / {bets.filter(b => b.status === "lost").length} losses
            </p>
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-8 text-[var(--text-secondary)]">Loading...</div>
        ) : bets.length > 0 ? (
          <div className="space-y-3">
            {bets.map((bet, index) => (
              <div key={bet.id} style={{ animationDelay: `${index * 0.1}s` }}>
                <BetCard bet={bet} showResult />
              </div>
            ))}
          </div>
        ) : (
          <div className="bet-card p-8 text-center">
            <p className="text-[var(--text-secondary)]">No results yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

// VIP Page
const VIPPage = () => {
  const { user, token, refreshUser } = useAuth();
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVIPBets = async () => {
      if (user?.is_vip && token) {
        try {
          const response = await axios.get(`${API}/bets/vip/today`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setBets(response.data);
        } catch (e) {
          console.error("Error fetching VIP bets:", e);
        }
      }
      setLoading(false);
    };
    fetchVIPBets();
  }, [user, token]);

  const handleSubscribe = async () => {
    if (!user) {
      toast.error("Please sign in first");
      navigate("/account");
      return;
    }

    setCheckingOut(true);
    try {
      const response = await axios.post(
        `${API}/checkout/create`,
        { origin_url: window.location.origin },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.location.href = response.data.url;
    } catch (e) {
      toast.error("Failed to start checkout");
      console.error(e);
    } finally {
      setCheckingOut(false);
    }
  };

  if (!user?.is_vip) {
    return (
      <div className="pb-24 px-4" data-testid="vip-page-locked">
        <div className="my-4">
          <h2 className="font-display text-2xl text-[var(--gold)] text-center mb-6">VIP SECTION</h2>
          
          <div className="vip-card p-8 text-center">
            <Lock className="w-16 h-16 text-[var(--gold)] mx-auto mb-4" />
            <h3 className="font-display text-xl text-white mb-2">Unlock Premium Tips</h3>
            <p className="text-[var(--text-secondary)] mb-6">
              Get access to our exclusive VIP selections with higher success rates
            </p>
            
            <div className="bet-card p-4 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white font-semibold">Monthly VIP Access</p>
                  <p className="text-[var(--text-muted)] text-sm">Cancel anytime</p>
                </div>
                <div className="text-right">
                  <p className="text-[var(--gold)] font-bold text-2xl">£9.99</p>
                  <p className="text-[var(--text-muted)] text-xs">/month</p>
                </div>
              </div>
            </div>
            
            <ul className="text-left text-[var(--text-secondary)] mb-6 space-y-2">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--gold)]" />
                Exclusive daily VIP tips
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--gold)]" />
                Higher confidence selections
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--gold)]" />
                Full results history
              </li>
            </ul>
            
            <Button 
              onClick={handleSubscribe} 
              className="btn-gold w-full"
              disabled={checkingOut}
              data-testid="subscribe-btn"
            >
              {checkingOut ? "Processing..." : "Subscribe Now"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 px-4" data-testid="vip-page">
      <div className="my-4">
        <div className="flex items-center justify-center gap-2 mb-6">
          <CrownIcon className="w-6 h-6 text-[var(--gold)]" />
          <h2 className="font-display text-2xl text-[var(--gold)]">VIP SECTION</h2>
          <CrownIcon className="w-6 h-6 text-[var(--gold)]" />
        </div>
        
        {loading ? (
          <div className="text-center py-8 text-[var(--text-secondary)]">Loading...</div>
        ) : bets.length > 0 ? (
          <div className="space-y-3">
            {bets.map((bet, index) => (
              <div key={bet.id} className="vip-card p-4" style={{ animationDelay: `${index * 0.1}s` }}>
                <BetCard bet={bet} />
              </div>
            ))}
          </div>
        ) : (
          <div className="vip-card p-8 text-center">
            <p className="text-[var(--text-secondary)]">No VIP tips available today</p>
            <p className="text-[var(--text-muted)] text-sm mt-2">Check back later for exclusive selections</p>
          </div>
        )}
      </div>
    </div>
  );
};

// About Page
const AboutPage = () => {
  return (
    <div className="pb-24 px-4" data-testid="about-page">
      <div className="my-4">
        <h2 className="font-display text-2xl text-[var(--gold)] text-center mb-6">ABOUT US</h2>
        
        <div className="space-y-4">
          <div className="bet-card p-6">
            <h3 className="font-display text-lg text-[var(--gold)] mb-3">What is The 2.5 Syndicate?</h3>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              We are a team of experienced football analysts providing daily betting tips focused on the Over/Under 2.5 goals market. Our selections are based on extensive research, statistical analysis, and years of experience in football betting.
            </p>
          </div>
          
          <div className="bet-card p-6">
            <h3 className="font-display text-lg text-[var(--gold)] mb-3">How It Works</h3>
            <ul className="text-[var(--text-secondary)] space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-[var(--gold)] font-bold">1.</span>
                <span>We publish daily free tips available to all members</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[var(--gold)] font-bold">2.</span>
                <span>VIP members get access to our premium high-confidence selections</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[var(--gold)] font-bold">3.</span>
                <span>Each tip includes recommended stake level (1-10) and odds</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[var(--gold)] font-bold">4.</span>
                <span>Results are updated daily so you can track our performance</span>
              </li>
            </ul>
          </div>
          
          <div className="bet-card p-6">
            <h3 className="font-display text-lg text-[var(--gold)] mb-3">Disclaimer</h3>
            <p className="text-[var(--text-secondary)] leading-relaxed text-sm">
              The 2.5 Syndicate is not a gambling platform. We provide information, tips, and entertainment purposes only. Please gamble responsibly. Only bet what you can afford to lose. If you or someone you know has a gambling problem, please seek help.
            </p>
          </div>
          
          <div className="bet-card p-6">
            <h3 className="font-display text-lg text-[var(--gold)] mb-3">Contact</h3>
            <p className="text-[var(--text-secondary)]">
              For support or inquiries, contact us at:
            </p>
            <p className="text-[var(--gold)] mt-2">support@the25syndicate.com</p>
          </div>
        </div>
        
        <p className="text-[var(--text-muted)] text-center text-sm mt-8">
          © 2024 The 2.5 Syndicate. All rights reserved.
        </p>
      </div>
    </div>
  );
};

// Account Page
const AccountPage = () => {
  const { user, token, login, register, logout, refreshUser } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId && token) {
      // Check payment status
      const checkPayment = async () => {
        try {
          const response = await axios.get(`${API}/checkout/status/${sessionId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.data.payment_status === "paid") {
            toast.success("VIP subscription activated!");
            refreshUser();
          }
        } catch (e) {
          console.error("Error checking payment:", e);
        }
      };
      checkPayment();
    }
  }, [searchParams, token, refreshUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        toast.success("Welcome back!");
      } else {
        await register(email, password, name);
        toast.success("Account created successfully!");
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="pb-24 px-4" data-testid="account-page-logged-in">
        <div className="my-4">
          <h2 className="font-display text-2xl text-[var(--gold)] text-center mb-6">MY ACCOUNT</h2>
          
          <div className="bet-card p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)] mx-auto mb-4 flex items-center justify-center">
              <CrownIcon className="w-10 h-10 text-black" />
            </div>
            
            <h3 className="font-display text-xl text-white mb-1">{user.name}</h3>
            <p className="text-[var(--text-secondary)] text-sm mb-6">{user.email}</p>
            
            <div className="space-y-3 text-left mb-6">
              <div className="flex justify-between py-2 border-b border-[var(--charcoal-lighter)]">
                <span className="text-[var(--text-secondary)]">Subscription:</span>
                <span className={user.is_vip ? "text-[var(--gold)] font-semibold" : "text-[var(--text-muted)]"}>
                  {user.is_vip ? "VIP Plan" : "Free"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--charcoal-lighter)]">
                <span className="text-[var(--text-secondary)]">Joined:</span>
                <span className="text-white">
                  {new Date(user.created_at).toLocaleDateString('en-GB', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>
            
            <Button 
              onClick={logout} 
              variant="outline" 
              className="w-full border-[var(--charcoal-lighter)] text-white hover:bg-[var(--charcoal-lighter)]"
              data-testid="logout-btn"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 px-4" data-testid="account-page-login">
      <div className="my-4">
        <h2 className="font-display text-2xl text-[var(--gold)] text-center mb-6">
          {isLogin ? "SIGN IN" : "CREATE ACCOUNT"}
        </h2>
        
        <div className="bet-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="name" className="text-[var(--text-secondary)]">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required={!isLogin}
                  className="mt-1"
                  data-testid="name-input"
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="email" className="text-[var(--text-secondary)]">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="mt-1"
                data-testid="email-input"
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="text-[var(--text-secondary)]">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="mt-1"
                data-testid="password-input"
              />
            </div>
            
            <Button 
              type="submit" 
              className="btn-gold w-full" 
              disabled={loading}
              data-testid="auth-submit-btn"
            >
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>
          
          <p className="text-center text-[var(--text-secondary)] mt-4">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[var(--gold)] ml-2 hover:underline"
              data-testid="toggle-auth-mode"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// Admin Panel
const AdminPanel = ({ onClose }) => {
  const { user, token } = useAuth();
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [adminVerified, setAdminVerified] = useState(user?.is_admin || false);
  const [adminCode, setAdminCode] = useState("");
  const [importing, setImporting] = useState(false);
  const [telegramMessages, setTelegramMessages] = useState([]);
  const [showTelegramPreview, setShowTelegramPreview] = useState(false);
  
  // New bet form
  const [newBet, setNewBet] = useState({
    home_team: "",
    away_team: "",
    league: "",
    bet_type: "Over 2.5",
    odds: 1.85,
    stake: 5,
    kick_off: "",
    is_vip: false
  });

  useEffect(() => {
    if (adminVerified) {
      fetchBets();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminVerified]);

  const fetchBets = async () => {
    try {
      const response = await axios.get(`${API}/admin/bets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBets(response.data);
    } catch (e) {
      console.error("Error fetching bets:", e);
    } finally {
      setLoading(false);
    }
  };

  const verifyAdmin = async () => {
    try {
      await axios.post(
        `${API}/admin/verify`,
        { code: adminCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAdminVerified(true);
      toast.success("Admin access granted");
    } catch (e) {
      toast.error("Invalid admin code");
    }
  };

  const fetchTelegramUpdates = async () => {
    setImporting(true);
    try {
      const response = await axios.get(`${API}/admin/telegram/updates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTelegramMessages(response.data.messages);
      setShowTelegramPreview(true);
      if (response.data.count === 0) {
        toast.info("No new messages found in Telegram channel");
      } else {
        toast.success(`Found ${response.data.count} messages to import`);
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to fetch Telegram updates");
      console.error(e);
    } finally {
      setImporting(false);
    }
  };

  const importFromTelegram = async () => {
    setImporting(true);
    try {
      const response = await axios.post(`${API}/admin/telegram/import`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(response.data.message);
      setShowTelegramPreview(false);
      fetchBets();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to import from Telegram");
      console.error(e);
    } finally {
      setImporting(false);
    }
  };

  const [pasteText, setPasteText] = useState("");
  const [showPasteImport, setShowPasteImport] = useState(false);
  const [pastePreview, setPastePreview] = useState([]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickResult, setQuickResult] = useState({
    home_team: "",
    away_team: "",
    bet_type: "",
    stake: 5,
    odds: 1.80,
    status: "won"
  });

  const parsePastedText = () => {
    if (!pasteText.trim()) {
      toast.error("Please paste your Telegram messages first");
      return;
    }
    
    // Split by double newlines or bet result patterns to separate messages
    const blocks = pasteText.split(/\n\n+/);
    const parsed = [];
    
    let currentMatch = { home_team: "", away_team: "" };
    
    for (const block of blocks) {
      if (block.trim().length < 5) continue;
      
      const lines = block.trim().split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        // Match line - look for " v " with team names (strip emojis)
        if (trimmed.includes(' v ') && !trimmed.toLowerCase().includes('goals') && !trimmed.toLowerCase().includes('win') && !trimmed.includes('Points') && !trimmed.includes('Odds')) {
          // Remove emojis and clean up team names
          const cleanLine = trimmed.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|🔴|⚪️|🔵|⚫|🟡|🟢|🟣|🟠|⚪|🏴|🏳/gu, '').trim();
          const teams = cleanLine.split(' v ');
          if (teams.length === 2 && teams[0].trim() && teams[1].trim()) {
            currentMatch = {
              home_team: teams[0].trim(),
              away_team: teams[1].trim()
            };
          }
        }
        
        // Check if this line has a bet with result (contains bet type + ✅ or ❌)
        const hasBetResult = (trimmed.includes('✅') || trimmed.includes('❌'));
        const hasBetType = trimmed.toLowerCase().includes('goals') || 
                          trimmed.toLowerCase().includes('over') || 
                          trimmed.toLowerCase().includes('under') ||
                          trimmed.toLowerCase().includes('btts') ||
                          trimmed.toLowerCase().includes('home win') ||
                          trimmed.toLowerCase().includes('away win') ||
                          trimmed.toLowerCase().includes('draw') ||
                          trimmed.toLowerCase().includes('clean sheet') ||
                          trimmed.toLowerCase().includes('both teams');
        
        if (hasBetResult && hasBetType) {
          let bet_type = "";
          let is_won = trimmed.includes('✅');
          
          // Extract bet type - goals
          if (trimmed.toLowerCase().includes('over 2.5')) bet_type = "Over 2.5";
          else if (trimmed.toLowerCase().includes('under 2.5')) bet_type = "Under 2.5";
          else if (trimmed.toLowerCase().includes('over 1.5')) bet_type = "Over 1.5";
          else if (trimmed.toLowerCase().includes('under 1.5')) bet_type = "Under 1.5";
          else if (trimmed.toLowerCase().includes('over 3.5')) bet_type = "Over 3.5";
          else if (trimmed.toLowerCase().includes('under 3.5')) bet_type = "Under 3.5";
          else if (trimmed.toLowerCase().includes('over 0.5')) bet_type = "Over 0.5";
          // Match results
          else if (trimmed.toLowerCase().includes('home win')) bet_type = "Home Win";
          else if (trimmed.toLowerCase().includes('away win')) bet_type = "Away Win";
          else if (trimmed.toLowerCase().includes('draw')) bet_type = "Draw";
          // BTTS
          else if (trimmed.toLowerCase().includes('btts yes') || (trimmed.toLowerCase().includes('btts') && !trimmed.toLowerCase().includes('no'))) bet_type = "BTTS Yes";
          else if (trimmed.toLowerCase().includes('btts no')) bet_type = "BTTS No";
          else if (trimmed.toLowerCase().includes('both teams to score')) bet_type = "BTTS Yes";
          // Clean sheet
          else if (trimmed.toLowerCase().includes('clean sheet')) bet_type = "Clean Sheet";
          
          if (bet_type && currentMatch.home_team && currentMatch.away_team) {
            // Look for stake and odds in following lines
            let stake = 5;
            let odds = 1.80;
            
            // Search in the current block for Points and Odds
            for (const searchLine of lines) {
              if (searchLine.includes('Points') || searchLine.includes('📈')) {
                const match = searchLine.match(/(\d+)/);
                if (match) stake = Math.min(parseInt(match[1]), 10);
              }
              if (searchLine.includes('Odds') || searchLine.includes('📦')) {
                const match = searchLine.match(/(\d+\.?\d*)/);
                if (match) odds = parseFloat(match[1]);
              }
            }
            
            parsed.push({
              home_team: currentMatch.home_team,
              away_team: currentMatch.away_team,
              bet_type,
              stake,
              odds,
              is_won
            });
          }
        }
      }
    }
    
    // Also try parsing as individual bet blocks (alternative format)
    if (parsed.length === 0) {
      let home_team = "", away_team = "";
      
      const allLines = pasteText.split('\n');
      for (let i = 0; i < allLines.length; i++) {
        const line = allLines[i].trim();
        
        // Match line
        if (line.includes(' v ') && !line.toLowerCase().includes('goals') && !line.toLowerCase().includes('win') && !line.includes('Points') && !line.includes('Odds')) {
          const cleanLine = line.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|🔴|⚪️|🔵|⚫|🟡|🟢|🟣|🟠|⚪|🏴|🏳/gu, '').trim();
          const teams = cleanLine.split(' v ');
          if (teams.length === 2) {
            home_team = teams[0].trim();
            away_team = teams[1].trim();
          }
        }
        
        // Bet line with result
        const hasBetResult = (line.includes('✅') || line.includes('❌'));
        const hasBetType = line.toLowerCase().includes('goals') || 
                          line.toLowerCase().includes('over') || 
                          line.toLowerCase().includes('under') ||
                          line.toLowerCase().includes('btts') ||
                          line.toLowerCase().includes('home win') ||
                          line.toLowerCase().includes('away win') ||
                          line.toLowerCase().includes('draw') ||
                          line.toLowerCase().includes('clean sheet') ||
                          line.toLowerCase().includes('both teams');
        
        if (hasBetResult && hasBetType) {
          let bet_type = "";
          if (line.toLowerCase().includes('over 2.5')) bet_type = "Over 2.5";
          else if (line.toLowerCase().includes('under 2.5')) bet_type = "Under 2.5";
          else if (line.toLowerCase().includes('over 1.5')) bet_type = "Over 1.5";
          else if (line.toLowerCase().includes('under 1.5')) bet_type = "Under 1.5";
          else if (line.toLowerCase().includes('over 3.5')) bet_type = "Over 3.5";
          else if (line.toLowerCase().includes('over 0.5')) bet_type = "Over 0.5";
          else if (line.toLowerCase().includes('home win')) bet_type = "Home Win";
          else if (line.toLowerCase().includes('away win')) bet_type = "Away Win";
          else if (line.toLowerCase().includes('draw')) bet_type = "Draw";
          else if (line.toLowerCase().includes('btts yes') || (line.toLowerCase().includes('btts') && !line.toLowerCase().includes('no'))) bet_type = "BTTS Yes";
          else if (line.toLowerCase().includes('btts no')) bet_type = "BTTS No";
          else if (line.toLowerCase().includes('both teams to score')) bet_type = "BTTS Yes";
          else if (line.toLowerCase().includes('clean sheet')) bet_type = "Clean Sheet";
          
          if (bet_type && home_team && away_team) {
            let stake = 5, odds = 1.80;
            
            // Look ahead for stake and odds
            for (let j = i + 1; j < Math.min(i + 4, allLines.length); j++) {
              const nextLine = allLines[j];
              if (nextLine.includes('Points') || nextLine.includes('📈')) {
                const match = nextLine.match(/(\d+)/);
                if (match) stake = Math.min(parseInt(match[1]), 10);
              }
              if (nextLine.includes('Odds') || nextLine.includes('📦')) {
                const match = nextLine.match(/(\d+\.?\d*)/);
                if (match) odds = parseFloat(match[1]);
              }
            }
            
            parsed.push({
              home_team,
              away_team,
              bet_type,
              stake,
              odds,
              is_won: line.includes('✅')
            });
          }
        }
      }
    }
    
    if (parsed.length === 0) {
      toast.error("Could not parse any results. Check the format.");
    } else {
      setPastePreview(parsed);
      toast.success(`Found ${parsed.length} results to import`);
    }
  };

  const importPastedResults = async () => {
    if (pastePreview.length === 0) {
      toast.error("No results to import");
      return;
    }
    
    setImporting(true);
    let imported = 0;
    
    try {
      for (const bet of pastePreview) {
        const now = new Date();
        const betData = {
          home_team: bet.home_team,
          away_team: bet.away_team,
          league: "Imported",
          bet_type: bet.bet_type,
          odds: bet.odds,
          stake: bet.stake,
          kick_off: now.toISOString(),
          is_vip: false
        };
        
        // Create bet then update status
        const response = await axios.post(`${API}/admin/bets`, betData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Update to won/lost
        await axios.put(`${API}/admin/bets/${response.data.id}`, {
          status: bet.is_won ? "won" : "lost",
          home_score: null,
          away_score: null
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        imported++;
      }
      
      toast.success(`Successfully imported ${imported} results!`);
      setPasteText("");
      setPastePreview([]);
      setShowPasteImport(false);
      fetchBets();
    } catch (e) {
      toast.error(`Imported ${imported} results, then error: ${e.message}`);
      console.error(e);
    } finally {
      setImporting(false);
    }
  };

  const addQuickResult = async () => {
    if (!quickResult.home_team || !quickResult.away_team || !quickResult.bet_type) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setImporting(true);
    try {
      const now = new Date();
      const betData = {
        home_team: quickResult.home_team,
        away_team: quickResult.away_team,
        league: "Manual",
        bet_type: quickResult.bet_type,
        odds: quickResult.odds,
        stake: quickResult.stake,
        kick_off: now.toISOString(),
        is_vip: false
      };
      
      // Create bet
      const response = await axios.post(`${API}/admin/bets`, betData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update to won/lost
      await axios.put(`${API}/admin/bets/${response.data.id}`, {
        status: quickResult.status,
        home_score: null,
        away_score: null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`Result added: ${quickResult.home_team} v ${quickResult.away_team} - ${quickResult.status.toUpperCase()}`);
      setQuickResult({
        home_team: "",
        away_team: "",
        bet_type: "",
        stake: 5,
        odds: 1.80,
        status: "won"
      });
      fetchBets();
    } catch (e) {
      toast.error("Failed to add result");
      console.error(e);
    } finally {
      setImporting(false);
    }
  };

  const handleAddBet = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/admin/bets`, newBet, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Bet added successfully");
      setShowAddForm(false);
      setNewBet({
        home_team: "",
        away_team: "",
        league: "",
        bet_type: "Over 2.5",
        odds: 1.85,
        stake: 5,
        kick_off: "",
        is_vip: false
      });
      fetchBets();
    } catch (e) {
      toast.error("Failed to add bet");
    }
  };

  const updateBetStatus = async (betId, status, homeScore, awayScore) => {
    try {
      await axios.put(
        `${API}/admin/bets/${betId}`,
        { status, home_score: homeScore, away_score: awayScore },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Bet marked as ${status}`);
      fetchBets();
    } catch (e) {
      toast.error("Failed to update bet");
    }
  };

  const deleteBet = async (betId) => {
    if (!window.confirm("Are you sure you want to delete this bet?")) return;
    try {
      await axios.delete(`${API}/admin/bets/${betId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Bet deleted");
      fetchBets();
    } catch (e) {
      toast.error("Failed to delete bet");
    }
  };

  if (!user) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="bg-[var(--charcoal)] border-[var(--charcoal-lighter)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--gold)]">Admin Access</DialogTitle>
            <DialogDescription className="text-[var(--text-secondary)]">
              Please sign in to access admin panel
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  if (!adminVerified) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="bg-[var(--charcoal)] border-[var(--charcoal-lighter)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--gold)]">Admin Verification</DialogTitle>
            <DialogDescription className="text-[var(--text-secondary)]">
              Enter the admin code to access the panel
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Admin code"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              data-testid="admin-code-input"
            />
            <div className="flex gap-2">
              <Button onClick={verifyAdmin} className="btn-gold flex-1" data-testid="verify-admin-btn">
                Verify
              </Button>
              <Button onClick={onClose} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-[var(--charcoal)] border-[var(--charcoal-lighter)] max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-[var(--gold)] flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Admin Panel
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-4">
            {/* Paste Import Section - QUICK BULK IMPORT */}
            <div className="vip-card p-4">
              <button
                onClick={() => setShowPasteImport(!showPasteImport)}
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-[var(--gold)]" />
                  <span className="text-white font-medium">Quick Bulk Import (Paste)</span>
                </div>
                <span className="text-[var(--gold)]">{showPasteImport ? '▼' : '▶'}</span>
              </button>
              
              {showPasteImport && (
                <div className="mt-4 space-y-3">
                  <p className="text-[var(--text-secondary)] text-sm">
                    Copy all your Telegram messages and paste below. Works with your format:
                  </p>
                  <pre className="text-xs text-[var(--text-muted)] bg-[var(--charcoal-lighter)] p-2 rounded">
{`Marseille v Rennes
⚽ Over 1.5 Goals ✅✅✅
📈 Points - 5
📦 Odds - 1.11`}
                  </pre>
                  <Textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder="Paste all your Telegram messages here..."
                    className="bg-[var(--charcoal-light)] border-[var(--charcoal-lighter)] text-white min-h-[150px] text-sm"
                    data-testid="paste-import-textarea"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={parsePastedText}
                      disabled={importing || !pasteText.trim()}
                      className="btn-gold flex-1"
                      data-testid="parse-paste-btn"
                    >
                      Parse Results
                    </Button>
                    {pastePreview.length > 0 && (
                      <Button
                        onClick={() => { setPastePreview([]); setPasteText(""); }}
                        variant="outline"
                        className="border-[var(--error)] text-[var(--error)]"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  
                  {pastePreview.length > 0 && (
                    <div className="space-y-2 mt-3">
                      <p className="text-[var(--success)] text-sm font-medium">✅ Found {pastePreview.length} results:</p>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {pastePreview.map((bet, i) => (
                          <div key={i} className="bg-[var(--charcoal-lighter)] p-2 rounded text-sm flex items-center justify-between">
                            <span className="text-white">{bet.home_team} v {bet.away_team}</span>
                            <div>
                              <span className="text-[var(--gold)] mr-2">{bet.bet_type}</span>
                              <span className={bet.is_won ? 'text-[var(--success)]' : 'text-[var(--error)]'}>
                                {bet.is_won ? '✅' : '❌'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button
                        onClick={importPastedResults}
                        disabled={importing}
                        className="btn-gold w-full"
                        data-testid="import-paste-btn"
                      >
                        {importing ? (
                          <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Importing...</>
                        ) : (
                          <><Download className="w-4 h-4 mr-2" /> Import {pastePreview.length} Results</>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Auto Telegram Import Section */}
            <div className="bet-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-[var(--text-secondary)]" />
                  <span className="text-[var(--text-secondary)] font-medium">Auto Import (New Messages)</span>
                </div>
                <Button
                  onClick={fetchTelegramUpdates}
                  disabled={importing}
                  size="sm"
                  variant="outline"
                  className="border-[var(--charcoal-lighter)]"
                  data-testid="fetch-telegram-btn"
                >
                  {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  <span className="ml-2">Fetch</span>
                </Button>
              </div>
              
              {showTelegramPreview && telegramMessages.length > 0 && (
                <div className="space-y-2 mt-3">
                  <p className="text-[var(--text-secondary)] text-sm">Found {telegramMessages.length} results:</p>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {telegramMessages.map((msg, i) => (
                      <div key={i} className="bg-[var(--charcoal-lighter)] p-2 rounded text-sm">
                        <span className="text-white">{msg.parsed.home_team} vs {msg.parsed.away_team}</span>
                        <span className="text-[var(--gold)] ml-2">{msg.parsed.bet_type}</span>
                        <span className={`ml-2 ${msg.parsed.is_won ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
                          {msg.parsed.is_won ? '✅' : '❌'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={importFromTelegram}
                    disabled={importing}
                    className="btn-gold w-full mt-2"
                    data-testid="import-telegram-btn"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Import All Results
                  </Button>
                </div>
              )}
            </div>

            {/* Quick Manual Add Result */}
            <div className="vip-card p-4">
              <button
                onClick={() => setShowQuickAdd(!showQuickAdd)}
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[var(--gold)]" />
                  <span className="text-white font-medium">Quick Add Result (Manual)</span>
                </div>
                <span className="text-[var(--gold)]">{showQuickAdd ? '▼' : '▶'}</span>
              </button>
              
              {showQuickAdd && (
                <div className="mt-4 space-y-3">
                  <p className="text-[var(--text-secondary)] text-sm">
                    Manually add any result - accumulators, HT/FT, custom bets
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[var(--text-secondary)] text-xs">Home Team</Label>
                      <Input
                        value={quickResult.home_team}
                        onChange={(e) => setQuickResult({...quickResult, home_team: e.target.value})}
                        placeholder="e.g., Arsenal"
                        className="text-sm"
                        data-testid="quick-home-team"
                      />
                    </div>
                    <div>
                      <Label className="text-[var(--text-secondary)] text-xs">Away Team</Label>
                      <Input
                        value={quickResult.away_team}
                        onChange={(e) => setQuickResult({...quickResult, away_team: e.target.value})}
                        placeholder="e.g., Chelsea"
                        className="text-sm"
                        data-testid="quick-away-team"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-[var(--text-secondary)] text-xs">Bet Type (type anything)</Label>
                    <Input
                      value={quickResult.bet_type}
                      onChange={(e) => setQuickResult({...quickResult, bet_type: e.target.value})}
                      placeholder="e.g., Accumulator, HT Result, Arsenal to Win"
                      className="text-sm"
                      data-testid="quick-bet-type"
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-[var(--text-secondary)] text-xs">Points</Label>
                      <Input
                        type="text"
                        value={quickResult.stake}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || /^[0-9]*$/.test(val)) {
                            setQuickResult({...quickResult, stake: val});
                          }
                        }}
                        onBlur={(e) => {
                          const num = parseInt(e.target.value);
                          setQuickResult({...quickResult, stake: isNaN(num) ? 5 : Math.min(Math.max(num, 1), 10)});
                        }}
                        placeholder="5"
                        className="text-sm"
                        data-testid="quick-stake"
                      />
                    </div>
                    <div>
                      <Label className="text-[var(--text-secondary)] text-xs">Odds</Label>
                      <Input
                        type="text"
                        value={quickResult.odds}
                        onChange={(e) => {
                          const val = e.target.value;
                          // Allow empty, numbers, and decimal point
                          if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
                            setQuickResult({...quickResult, odds: val});
                          }
                        }}
                        onBlur={(e) => {
                          // Convert to number on blur, default to 1.80 if invalid
                          const num = parseFloat(e.target.value);
                          setQuickResult({...quickResult, odds: isNaN(num) ? 1.80 : num});
                        }}
                        placeholder="2.34"
                        className="text-sm"
                        data-testid="quick-odds"
                      />
                    </div>
                    <div>
                      <Label className="text-[var(--text-secondary)] text-xs">Result</Label>
                      <Select
                        value={quickResult.status}
                        onValueChange={(value) => setQuickResult({...quickResult, status: value})}
                      >
                        <SelectTrigger className="text-sm" data-testid="quick-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="won">✅ Won</SelectItem>
                          <SelectItem value="lost">❌ Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button
                    onClick={addQuickResult}
                    disabled={importing || !quickResult.home_team || !quickResult.away_team || !quickResult.bet_type}
                    className="btn-gold w-full"
                    data-testid="quick-add-btn"
                  >
                    {importing ? (
                      <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Adding...</>
                    ) : (
                      <><Plus className="w-4 h-4 mr-2" /> Add Result</>
                    )}
                  </Button>
                </div>
              )}
            </div>

            <Button 
              onClick={() => setShowAddForm(!showAddForm)} 
              className="btn-gold w-full"
              data-testid="add-bet-toggle"
            >
              <Plus className="w-4 h-4 mr-2" />
              {showAddForm ? "Cancel" : "Add New Bet (Future)"}
            </Button>
            
            {showAddForm && (
              <form onSubmit={handleAddBet} className="bet-card p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[var(--text-secondary)]">Home Team</Label>
                    <Input
                      value={newBet.home_team}
                      onChange={(e) => setNewBet({...newBet, home_team: e.target.value})}
                      required
                      data-testid="home-team-input"
                    />
                  </div>
                  <div>
                    <Label className="text-[var(--text-secondary)]">Away Team</Label>
                    <Input
                      value={newBet.away_team}
                      onChange={(e) => setNewBet({...newBet, away_team: e.target.value})}
                      required
                      data-testid="away-team-input"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[var(--text-secondary)]">League</Label>
                    <Input
                      value={newBet.league}
                      onChange={(e) => setNewBet({...newBet, league: e.target.value})}
                      placeholder="e.g., Premier League"
                      required
                      data-testid="league-input"
                    />
                  </div>
                  <div>
                    <Label className="text-[var(--text-secondary)]">Bet Type</Label>
                    <Select
                      value={newBet.bet_type}
                      onValueChange={(value) => setNewBet({...newBet, bet_type: value})}
                    >
                      <SelectTrigger data-testid="bet-type-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Over 2.5">Over 2.5</SelectItem>
                        <SelectItem value="Under 2.5">Under 2.5</SelectItem>
                        <SelectItem value="BTTS Yes">BTTS Yes</SelectItem>
                        <SelectItem value="BTTS No">BTTS No</SelectItem>
                        <SelectItem value="Over 1.5">Over 1.5</SelectItem>
                        <SelectItem value="Under 1.5">Under 1.5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-[var(--text-secondary)]">Odds</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newBet.odds}
                      onChange={(e) => setNewBet({...newBet, odds: parseFloat(e.target.value)})}
                      required
                      data-testid="odds-input"
                    />
                  </div>
                  <div>
                    <Label className="text-[var(--text-secondary)]">Stake (1-10)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={newBet.stake}
                      onChange={(e) => setNewBet({...newBet, stake: parseInt(e.target.value)})}
                      required
                      data-testid="stake-input"
                    />
                  </div>
                  <div>
                    <Label className="text-[var(--text-secondary)]">Kick Off</Label>
                    <Input
                      type="datetime-local"
                      value={newBet.kick_off}
                      onChange={(e) => setNewBet({...newBet, kick_off: e.target.value})}
                      required
                      data-testid="kickoff-input"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newBet.is_vip}
                    onCheckedChange={(checked) => setNewBet({...newBet, is_vip: checked})}
                    data-testid="vip-switch"
                  />
                  <Label className="text-[var(--text-secondary)]">VIP Only</Label>
                </div>
                
                <Button type="submit" className="btn-gold w-full" data-testid="submit-bet-btn">
                  Add Bet
                </Button>
              </form>
            )}
            
            {loading ? (
              <div className="text-center py-8 text-[var(--text-secondary)]">Loading...</div>
            ) : (
              <div className="space-y-3">
                {bets.map((bet) => (
                  <div key={bet.id} className="bet-card p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-[var(--text-muted)] text-xs">{bet.league}</p>
                        <p className="text-white font-semibold">
                          {bet.home_team} vs {bet.away_team}
                        </p>
                        <p className="text-[var(--gold)] text-sm">{bet.bet_type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {bet.is_vip && (
                          <span className="text-[var(--gold)] text-xs bg-[var(--gold)]/10 px-2 py-1 rounded">
                            VIP
                          </span>
                        )}
                        <span className={
                          bet.status === "won" ? "badge-won" : 
                          bet.status === "lost" ? "badge-lost" : 
                          "badge-pending"
                        }>
                          {bet.status}
                        </span>
                      </div>
                    </div>
                    
                    {bet.status === "pending" && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          onClick={() => {
                            const homeScore = prompt("Home team score:");
                            const awayScore = prompt("Away team score:");
                            if (homeScore !== null && awayScore !== null) {
                              updateBetStatus(bet.id, "won", parseInt(homeScore), parseInt(awayScore));
                            }
                          }}
                          className="bg-[var(--success)] hover:bg-[var(--success)]/80 flex-1"
                          data-testid={`mark-won-${bet.id}`}
                        >
                          <Check className="w-4 h-4 mr-1" /> Won
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            const homeScore = prompt("Home team score:");
                            const awayScore = prompt("Away team score:");
                            if (homeScore !== null && awayScore !== null) {
                              updateBetStatus(bet.id, "lost", parseInt(homeScore), parseInt(awayScore));
                            }
                          }}
                          className="bg-[var(--error)] hover:bg-[var(--error)]/80 flex-1"
                          data-testid={`mark-lost-${bet.id}`}
                        >
                          <X className="w-4 h-4 mr-1" /> Lost
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteBet(bet.id)}
                          className="border-[var(--error)] text-[var(--error)]"
                          data-testid={`delete-bet-${bet.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

// Notification Panel
const NotificationPanel = ({ onClose }) => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: "",
    body: "",
    notification_type: "bets_live"
  });

  useEffect(() => {
    fetchNotifications();
    if (user && token) {
      checkSubscriptionStatus();
      if (user.is_admin) {
        fetchSubscriberCount();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API}/notifications/latest`);
      setNotifications(response.data);
      if (response.data.length > 0) {
        localStorage.setItem("lastSeenNotification", response.data[0].id);
      }
    } catch (e) {
      console.error("Error fetching notifications:", e);
    } finally {
      setLoading(false);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const response = await axios.get(`${API}/notifications/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsSubscribed(response.data.subscribed);
    } catch (e) {
      console.error("Error checking subscription:", e);
    }
  };

  const fetchSubscriberCount = async () => {
    try {
      const response = await axios.get(`${API}/admin/notifications/subscribers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubscriberCount(response.data.subscriber_count);
    } catch (e) {
      console.error("Error fetching subscriber count:", e);
    }
  };

  const toggleSubscription = async () => {
    if (!user) {
      toast.error("Please sign in to enable notifications");
      return;
    }

    try {
      if (isSubscribed) {
        await axios.delete(`${API}/notifications/unsubscribe`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsSubscribed(false);
        toast.success("Unsubscribed from notifications");
      } else {
        // For web push, we'd need service worker. For now, we just store subscription intent
        await axios.post(
          `${API}/notifications/subscribe`,
          { endpoint: "web-" + user.id, keys: { auth: "web", p256dh: "web" } },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsSubscribed(true);
        toast.success("Subscribed to notifications!");
      }
      if (user.is_admin) {
        fetchSubscriberCount();
      }
    } catch (e) {
      toast.error("Failed to update subscription");
      console.error(e);
    }
  };

  const sendNotification = async (e) => {
    e.preventDefault();
    if (!newNotification.title || !newNotification.body) {
      toast.error("Please fill in all fields");
      return;
    }

    setSendingNotification(true);
    try {
      await axios.post(
        `${API}/admin/notifications/send`,
        newNotification,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Notification sent to ${subscriberCount} subscribers!`);
      setNewNotification({ title: "", body: "", notification_type: "bets_live" });
      fetchNotifications();
    } catch (e) {
      toast.error("Failed to send notification");
      console.error(e);
    } finally {
      setSendingNotification(false);
    }
  };

  const getNotificationTypeLabel = (type) => {
    switch (type) {
      case "bets_live": return "🎯 Bets Live";
      case "results": return "📊 Results";
      case "custom": return "📢 Announcement";
      default: return type;
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-[var(--charcoal)] border-[var(--charcoal-lighter)] max-w-md max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-[var(--gold)] flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-4">
            {/* Subscription Toggle */}
            <div className="bet-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Push Notifications</p>
                  <p className="text-[var(--text-muted)] text-sm">
                    {isSubscribed ? "You're subscribed" : "Get notified about new tips"}
                  </p>
                </div>
                <Button
                  onClick={toggleSubscription}
                  variant={isSubscribed ? "outline" : "default"}
                  size="sm"
                  className={isSubscribed ? "border-[var(--gold)] text-[var(--gold)]" : "btn-gold"}
                  data-testid="toggle-notifications-btn"
                >
                  {isSubscribed ? <BellOff className="w-4 h-4 mr-1" /> : <Bell className="w-4 h-4 mr-1" />}
                  {isSubscribed ? "Unsubscribe" : "Subscribe"}
                </Button>
              </div>
            </div>

            {/* Admin Section */}
            {user?.is_admin && (
              <div className="vip-card p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-[var(--gold)]" />
                  <span className="text-white font-medium">Admin: Send Notification</span>
                  <span className="ml-auto text-[var(--gold)] text-sm">{subscriberCount} subscribers</span>
                </div>
                
                <form onSubmit={sendNotification} className="space-y-3">
                  <div>
                    <Label className="text-[var(--text-secondary)]">Type</Label>
                    <Select
                      value={newNotification.notification_type}
                      onValueChange={(value) => setNewNotification({...newNotification, notification_type: value})}
                    >
                      <SelectTrigger data-testid="notification-type-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bets_live">Bets Live</SelectItem>
                        <SelectItem value="results">Results Update</SelectItem>
                        <SelectItem value="custom">Custom Announcement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-[var(--text-secondary)]">Title</Label>
                    <Input
                      value={newNotification.title}
                      onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                      placeholder="e.g., Today's Tips Are Live!"
                      data-testid="notification-title-input"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-[var(--text-secondary)]">Message</Label>
                    <Textarea
                      value={newNotification.body}
                      onChange={(e) => setNewNotification({...newNotification, body: e.target.value})}
                      placeholder="e.g., 3 new selections available for today..."
                      className="bg-[var(--charcoal-light)] border-[var(--charcoal-lighter)] text-white min-h-[80px]"
                      data-testid="notification-body-input"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="btn-gold w-full" 
                    disabled={sendingNotification}
                    data-testid="send-notification-btn"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {sendingNotification ? "Sending..." : "Send to All Subscribers"}
                  </Button>
                </form>
              </div>
            )}

            {/* Recent Notifications */}
            <div>
              <h3 className="text-white font-medium mb-3">Recent Notifications</h3>
              {loading ? (
                <div className="text-center py-4 text-[var(--text-secondary)]">Loading...</div>
              ) : notifications.length > 0 ? (
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="bet-card p-3">
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-xs text-[var(--gold)]">
                          {getNotificationTypeLabel(notification.notification_type)}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">
                          {new Date(notification.sent_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-white font-medium text-sm">{notification.title}</p>
                      <p className="text-[var(--text-secondary)] text-sm">{notification.body}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bet-card p-4 text-center">
                  <p className="text-[var(--text-secondary)]">No notifications yet</p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

// Main App Layout
const AppLayout = () => {
  const [showAdmin, setShowAdmin] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--obsidian)]">
      <Header 
        onLogoClick={() => setShowAdmin(true)} 
        onNotificationClick={() => setShowNotifications(true)}
      />
      
      <main className="max-w-lg mx-auto">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/vip" element={<VIPPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/account" element={<AccountPage />} />
        </Routes>
      </main>
      
      <BottomNav />
      
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
      {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout />
        <Toaster 
          position="top-center" 
          toastOptions={{
            style: {
              background: 'var(--charcoal)',
              color: 'white',
              border: '1px solid var(--charcoal-lighter)'
            }
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
