import { useState, useEffect, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { Home, Star, FileText, Mail, User, Crown, Lock, LogOut, Plus, Trash2, Check, X, Clock, Trophy, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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
const Header = ({ onLogoClick }) => {
  const [clickCount, setClickCount] = useState(0);

  const handleLogoClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    if (newCount >= 5) {
      onLogoClick();
      setClickCount(0);
    }
    
    // Reset count after 2 seconds
    setTimeout(() => setClickCount(0), 2000);
  };

  return (
    <header className="sticky top-0 z-50 glass border-b border-[rgba(212,175,55,0.2)]">
      <div className="flex items-center justify-center py-4 px-4">
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

// Stake Indicator Component
const StakeIndicator = ({ stake }) => {
  return (
    <div className="stake-bar">
      {[...Array(10)].map((_, i) => (
        <div key={i} className={`stake-dot ${i < stake ? "filled" : ""}`} />
      ))}
    </div>
  );
};

// Bet Card Component
const BetCard = ({ bet, showResult = false }) => {
  const kickOffTime = new Date(bet.kick_off).toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

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
            <span className={bet.status === "won" ? "badge-won" : "badge-lost"}>
              {bet.status}
            </span>
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
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-secondary)] text-sm">Stake:</span>
            <StakeIndicator stake={bet.stake} />
          </div>
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
            Today's Selections
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

  return (
    <div className="pb-24 px-4" data-testid="results-page">
      <div className="my-4">
        <h2 className="font-display text-2xl text-[var(--gold)] text-center mb-6">RESULTS</h2>
        
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
            <Button 
              onClick={() => setShowAddForm(!showAddForm)} 
              className="btn-gold w-full"
              data-testid="add-bet-toggle"
            >
              <Plus className="w-4 h-4 mr-2" />
              {showAddForm ? "Cancel" : "Add New Bet"}
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

// Main App Layout
const AppLayout = () => {
  const [showAdmin, setShowAdmin] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--obsidian)]">
      <Header onLogoClick={() => setShowAdmin(true)} />
      
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
