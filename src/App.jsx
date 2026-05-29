import React, { useState, useEffect, useMemo, useRef } from 'react';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithPopup } from 'firebase/auth';
import { db, auth, googleProvider } from './firebase';
import './App.css';
import confetti from 'canvas-confetti';
import {
  ShoppingBag, Menu as MenuIcon, X, Plus, Minus, Clock, MapPin, Phone, Calendar,
  CalendarCheck,
  Users, CheckCircle, ArrowRight, Sparkles, Search, Loader2, PartyPopper,
  Heart, Check, User, LogOut, Mail, Lock, FileText, CheckCircle2, Award
} from 'lucide-react';

const COLORS = {
  bg: '#FAF6F0',
  card: '#FAF1E6',
  textMain: '#2B1F1D',
  textMuted: '#6B5650',
  primary: '#B87D4B',
  accent: '#E8D5C4',
  sage: '#8A9A86',
};

const MOCK_PRODUCTS = [
  {
    id: "prod-1",
    name: "Classic Crimson Banarasi Silk Sari",
    price: 8499,
    desc: "A timeless masterpiece handwoven in Banaras. This crimson red silk sari features intricate floral jaal zari work in gold and silver, finished with a heavy gold brocade border. Perfect for weddings and grand festive celebrations.",
    category: "Saris",
    tag: "Handloom Silk",
    stock: 5,
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1610030470352-70df5c68b75e?auto=format&fit=crop&w=800&q=80"
    ],
    sizeConfig: null
  },
  {
    id: "prod-2",
    name: "Olive Sage Hand-Embroidered Kurti",
    price: 1899,
    desc: "Lightweight and breathable organic linen kurti in an elegant olive sage shade. Features delicate white thread hand-embroidery around the split neckline and bell sleeves. An ideal choice for daytime events and office comfort.",
    category: "Short Kurtis",
    tag: "Linen-Cotton",
    stock: 8,
    images: [
      "https://images.unsplash.com/photo-1608748010899-18f300247112?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80"
    ],
    sizeConfig: [
      { name: "Kurti Size", type: "options", values: ["XS", "S", "M", "L", "XL", "XXL"] }
    ]
  },
  {
    id: "prod-3",
    name: "Ivory & Gold Georgette Anarkali Set",
    price: 4299,
    desc: "A floor-length ivory Anarkali suit set crafted from premium georgette. Adorned with delicate sequin work and gold Gota Patti borders. Comes with matching slim trousers and a sheer floral organza dupatta.",
    category: "Designer Sets",
    tag: "Festive Wear",
    stock: 4,
    images: [
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1561414927-6d86591d0c4f?auto=format&fit=crop&w=800&q=80"
    ],
    sizeConfig: [
      { name: "Anarkali Kurta Size", type: "options", values: ["S", "M", "L", "XL"] },
      { name: "Pant Size", type: "options", values: ["S", "M", "L", "XL"] },
      { name: "Custom Tailoring Details (e.g. Bust/Waist in inches)", type: "custom", placeholder: "e.g., Bust: 36\", Waist: 30\"" }
    ]
  },
  {
    id: "prod-4",
    name: "Royal Mustard Chanderi Long Kurti",
    price: 2499,
    desc: "A straight-cut long kurti in royal mustard Chanderi silk. Designed with elegant pintuck details on the yoke, pockets, and 3/4th sleeves. Fully lined with soft mulmul cotton for premium comfort.",
    category: "Long Kurtis",
    tag: "Chanderi Silk",
    stock: 7,
    images: [
      "https://images.unsplash.com/photo-1609357518652-6cf0416f0cbe?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80"
    ],
    sizeConfig: [
      { name: "Kurti Size", type: "options", values: ["XS", "S", "M", "L", "XL", "XXL"] }
    ]
  },
  {
    id: "prod-5",
    name: "Indigo Blue Hand-Block Print Sari",
    price: 3299,
    desc: "Crafted from fine mulmul cotton, this indigo blue sari is hand-printed using natural dyes by traditional artisans. Offers a soft drape, breezy comfort, and a rustic artistic appeal. Perfect for summer afternoons.",
    category: "Saris",
    tag: "100% Mul Cotton",
    stock: 6,
    images: [
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80"
    ],
    sizeConfig: null
  },
  {
    id: "prod-6",
    name: "Blush Pink Short Cotton Kurti",
    price: 1299,
    desc: "Comfort meets chic in this pastel blush pink short kurti. Handcrafted from pure organic cotton, featuring keyhole detail, short flared sleeves, and fine crochet lace border trims.",
    category: "Short Kurtis",
    tag: "Daily Wear",
    stock: 12,
    images: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1608748010899-18f300247112?auto=format&fit=crop&w=800&q=80"
    ],
    sizeConfig: [
      { name: "Kurti Size", type: "options", values: ["XS", "S", "M", "L", "XL", "XXL"] }
    ]
  },
  {
    id: "prod-7",
    name: "Forest Green Handloom Tussar Silk Sari",
    price: 6799,
    desc: "A rich forest green Tussar silk sari featuring a contrasting copper-gold border. Hand-woven on traditional looms, its unique natural texture and elegant sheen make it a stellar outfit for formal gatherings and weddings.",
    category: "Saris",
    tag: "Handloom Tussar",
    stock: 3,
    images: [
      "https://images.unsplash.com/photo-1583391265517-35bbdba01229?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1610030470352-70df5c68b75e?auto=format&fit=crop&w=800&q=80"
    ],
    sizeConfig: null
  },
  {
    id: "prod-8",
    name: "Peach Floral Angrakha Kurti Set",
    price: 3899,
    desc: "Vibrant and elegant Angrakha style overlap kurti set in warm peach. Screen-printed with delicate floral motifs and paired with comfortable ankle-length solid trousers and a matching printed cotton dupatta.",
    category: "Designer Sets",
    tag: "Cotton Print",
    stock: 5,
    images: [
      "https://images.unsplash.com/photo-1561414927-6d86591d0c4f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80"
    ],
    sizeConfig: [
      { name: "Kurta Size", type: "options", values: ["XS", "S", "M", "L", "XL", "XXL"] },
      { name: "Pant Size", type: "options", values: ["S", "M", "L", "XL"] },
      { name: "Custom Length Notes", type: "custom", placeholder: "e.g. +2 inches length" }
    ]
  }
];

const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const Section = ({ id, children, className = "" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref} id={id}
      className={`py-16 md:py-24 px-4 md:px-12 lg:px-24 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} ${className}`}
    >
      {children}
    </section>
  );
};

const Button = ({ children, variant = 'primary', className = "", onClick, type = "button", disabled = false }) => {
  const base = "px-6 py-3 md:px-8 md:py-3 rounded-full font-medium transition-all duration-500 transform active:scale-95 flex items-center justify-center gap-2 overflow-hidden relative disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base tracking-wide font-sans";
  const styles = {
    primary: "bg-[#B87D4B] text-white hover:bg-[#9E6535] hover:shadow-[0_12px_36px_-12px_rgba(184,125,75,0.4)]",
    secondary: "bg-transparent border border-[#B87D4B] text-[#B87D4B] hover:bg-[#B87D4B] hover:text-white",
    ghost: "text-[#2B1F1D] hover:bg-black/5",
    magic: "bg-gradient-to-r from-[#B87D4B] to-[#9E6535] text-white hover:shadow-[0_12px_36px_-12px_rgba(184,125,75,0.3)]"
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]} ${className}`}>
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
};

const Loader = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(onFinish, 3000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-[1000] bg-[#FAF6F0] flex flex-col items-center justify-center overflow-hidden animate-pure-fade-in-out pointer-events-none">
      <div className="text-center px-4 animate-scale-in">
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-[#2B1F1D] tracking-[0.25em] mb-4">
          K O L K A A
        </h1>
        <div className="w-16 h-[1.5px] bg-[#B87D4B] mx-auto my-3 animate-loading-bar" />
        <p className="text-[10px] md:text-xs text-[#B87D4B] uppercase tracking-[0.3em] font-medium font-sans">
          A T E L I E R
        </p>
      </div>
    </div>
  );
};

const playSuccessChime = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const playNote = (freq, startTime, duration) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
    gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + startTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + startTime);
    osc.stop(ctx.currentTime + startTime + duration);
  };
  playNote(329.63, 0, 1.5);
  playNote(415.30, 0.1, 1.5);
  playNote(493.88, 0.2, 1.5);
  playNote(659.25, 0.35, 3.0);
};

export default function App() {
  const [isAppBooting, setIsAppBooting] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [bookingType, setBookingType] = useState('styling'); // 'styling' or 'bridal'
  
  // Auth & Dashboard States
  const [user, setUser] = useState(undefined);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authError, setAuthError] = useState('');
  const [zoomedImage, setZoomedImage] = useState(null);

  const [userBookings, setUserBookings] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [bookingView, setBookingView] = useState('dashboard'); // 'dashboard' or 'form'
  const [successModal, setSuccessModal] = useState({ isOpen: false, title: '', message: '' });

  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedQty, setSelectedQty] = useState(1);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selections, setSelections] = useState({});
  const [rememberSize, setRememberSize] = useState(false);

  const loadSavedSize = (product) => {
    if (!product) return;
    const initial = {};
    if (product.sizeConfig && Array.isArray(product.sizeConfig)) {
      product.sizeConfig.forEach(field => {
        initial[field.name] = '';
      });
    }

    if (user?.uid) {
      const saved = localStorage.getItem(`size_${user.uid}_${product.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            Object.assign(initial, parsed);
            setSelections(initial);
            setRememberSize(true);
            return;
          }
        } catch(e) {}
      }
    }
    setSelections(initial);
    setRememberSize(false);
  };

  const dynamicCategories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    return ['All', ...cats];
  }, [products]);

  const isSizeSelectionComplete = useMemo(() => {
    if (!selectedProduct) return true;
    if (!selectedProduct.sizeConfig || !Array.isArray(selectedProduct.sizeConfig)) return true;
    return selectedProduct.sizeConfig.every(field => {
      if (field.type === 'custom') return true; // Raw text boxes are optional!
      const val = selections[field.name];
      return val !== undefined && val !== null && String(val).trim() !== '';
    });
  }, [selectedProduct, selections]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const data = [];
      snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      const hasApparel = data.some(p => ['Saris', 'Kurtis', 'Long Kurtis', 'Short Kurtis', 'Designer Sets'].includes(p.category));
      if (data.length > 0 && hasApparel) {
        setProducts(data);
      } else {
        setProducts(MOCK_PRODUCTS);
      }
    });

    return () => { unsubscribe(); unsubProducts(); };
  }, []);

  // Auto-login modal popup after 10 seconds if not logged in
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!auth.currentUser) {
        setIsAuthModalOpen(true);
      }
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  // Sync Bookings & Orders when User Logs in
  useEffect(() => {
    if (user) {
      const qBookings = query(collection(db, 'bookings'), where('userId', '==', user.uid));
      const qOrders = query(collection(db, 'orders'), where('userId', '==', user.uid));

      const unsubBookings = onSnapshot(qBookings, (snapshot) => {
        const data = [];
        snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        setUserBookings(data);
      });

      const unsubOrders = onSnapshot(qOrders, (snapshot) => {
        const data = [];
        snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        setUserOrders(data);
        if (data.length > 0) setBookingView('dashboard');
      });

      return () => { unsubBookings(); unsubOrders(); };
    } else {
      setUserBookings([]);
      setUserOrders([]);
      setBookingView('form');
    }
  }, [user]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const triggerSuccessExperience = (title, message) => {
    setSuccessModal({ isOpen: true, title, message });
    setTimeout(() => { playSuccessChime(); }, 100);
    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 120,
        origin: { y: 0.5 },
        colors: [COLORS.primary, COLORS.accent, '#8A9A86', '#FAF6F0', '#2B1F1D'],
        zIndex: 2200,
        disableForReducedMotion: true
      });
    }, 800);
  };

  const addToCart = (item, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, qty: Math.min(i.qty + qty, item.stock) } : i);
      return [...prev, { ...item, qty: Math.min(qty, item.stock) }];
    });
    setFeedback(`Added ${qty} ${item.name}!`);
    setTimeout(() => setFeedback(null), 2000);
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.min(item.stock, Math.max(0, item.qty + delta));
        return newQty === 0 ? null : { ...item, qty: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const cartTotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.qty), 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.qty, 0), [cart]);
  const filteredItems = useMemo(() => {
    return activeTab === 'All' ? products : products.filter(i => i.category === activeTab);
  }, [activeTab, products]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsLoading(true);
    const form = new FormData(e.target);
    const email = form.get('email');
    const password = form.get('password');

    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        setFeedback('Welcome back to Kolkaa Atelier.');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        setFeedback('Account beautifully created.');
      }
      setIsAuthModalOpen(false);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setAuthError(err.message.replace('Firebase:', ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setAuthError('');
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      setFeedback('Welcome to Kolkaa Atelier with Google.');
      setIsAuthModalOpen(false);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setAuthError(err.message.replace('Firebase:', ''));
    } finally {
      setIsLoading(false);
    }
  };

  const requireAuth = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return false;
    }
    return true;
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const submitOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0 || isLoading) return;
    if (!requireAuth()) return;

    setIsLoading(true);
    try {
      const form = new FormData(e.target);
      const customerData = {
        name: form.get('name'),
        phone: form.get('phone'),
        address: form.get('address'),
        city: form.get('city'),
        state: form.get('state'),
        pincode: form.get('pincode')
      };

      const data = {
        userId: user.uid,
        userEmail: user.email,
        customer: customerData,
        items: cart,
        total: cartTotal,
        status: 'pending', // Pending status matches the Accept/Reject order flow
        payment_id: "bypass_pay_" + Math.random().toString(36).substr(2, 9),
        razorpay_order_id: "bypass_order_" + Math.random().toString(36).substr(2, 9),
        shiprocket_ready: true,
        package_details: {
          weight: 0.5,
          length: 30,
          width: 25,
          height: 5
        },
        createdAt: serverTimestamp()
      };

      // Directly save order document in Firestore (bypassing real money transactions)
      const docRef = await addDoc(collection(db, 'orders'), data);

      // Trigger Shiprocket order creation in the background silently
      try {
        await fetch('/api/createShiprocketOrder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderDetails: { ...data, orderId: docRef.id } })
        });
      } catch(e) {
        console.warn("Shiprocket API call bypassed.");
      }

      setCart([]);
      setIsCheckoutModalOpen(false);
      triggerSuccessExperience("Purchase Confirmed!", "Your boutique order has been placed successfully.");
      setBookingView('dashboard');
    } catch (err) {
      console.error(err);
      alert("Checkout Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!requireAuth()) return;

    setIsLoading(true);
    try {
      const form = new FormData(e.target);
      const data = Object.fromEntries(form.entries());
      data.userId = user.uid;
      data.userEmail = user.email;
      data.type = bookingType;
      data.createdAt = serverTimestamp();

      await addDoc(collection(db, 'bookings'), data);
      e.target.reset();
      triggerSuccessExperience(
        bookingType === 'styling' ? 'Styling Session Scheduled' : 'Bridal Fitting Requested', 
        'We look forward to hosting you in our boutique sanctuary.'
      );
      setBookingView('dashboard');
    } catch (err) {
      console.error(err);
      alert("Firebase Booking Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending':
      case 'paid': 
        return 'bg-[#FAF1E6] text-[#B87D4B] border border-[#B87D4B]/20';
      case 'accepted':
      case 'preparing': 
        return 'bg-amber-50 text-amber-700 border border-amber-200/50';
      case 'dispatched': 
        return 'bg-sky-50 text-sky-700 border border-sky-200/50';
      case 'out_for_delivery': 
        return 'bg-blue-50 text-blue-700 border border-blue-200/50';
      case 'delivered': 
        return 'bg-green-50 text-green-800 border border-green-200/50';
      case 'rejected': 
        return 'bg-red-50 text-red-700 border border-red-200/50';
      default: 
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'paid': return 'Paid (Awaiting Acceptance)';
      case 'accepted': return 'Order Accepted';
      case 'preparing': return 'Preparing Outfit';
      case 'dispatched': return 'Dispatched / Shipped';
      case 'out_for_delivery': return 'Out For Delivery';
      case 'delivered': return 'Delivered & Fulfilled';
      case 'rejected': return 'Cancelled';
      default: return status?.replace(/_/g, ' ') || 'Pending';
    }
  };

  return (
    <div className="kolka-shell min-h-screen font-sans relative w-full overflow-x-hidden selection:bg-[#E8D5C4] selection:text-[#2B1F1D]">
      {isAppBooting && <Loader onFinish={() => setIsAppBooting(false)} />}

      {/* NAVBAR */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled ? 'kolka-nav shadow-sm py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-9 h-9 md:w-10 md:h-10 bg-[#B87D4B] rounded-full flex items-center justify-center text-white transition-all hover:scale-105">
              <Sparkles size={18} />
            </div>
            <span className="text-xl md:text-2xl font-serif font-bold tracking-wider text-[#2B1F1D]">KOLKAA</span>
          </div>

          <div className="hidden md:flex items-center gap-10">
            {[
              { label: 'Home', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
              { label: 'Collection', action: () => document.getElementById('menu').scrollIntoView({ behavior: 'smooth' }) },
              { label: 'My Hub', action: () => document.getElementById('hub').scrollIntoView({ behavior: 'smooth' }) }
            ].map(link => (
              <button key={link.label} onClick={link.action} className="text-[#2B1F1D] font-medium hover:text-[#B87D4B] transition-colors text-xs uppercase tracking-widest">{link.label}</button>
            ))}
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            <button onClick={() => setIsCartOpen(true)} className="relative p-2.5 text-[#2B1F1D] hover:bg-[#FAF1E6] rounded-full transition-colors">
              <ShoppingBag size={21} />
              {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-[#B87D4B] text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">{cartCount}</span>}
            </button>
            
            <button
              onClick={() => user ? signOut(auth) : setIsAuthModalOpen(true)}
              className="px-4 py-2 border border-[#B87D4B]/30 text-[#2B1F1D] hover:bg-[#B87D4B] hover:text-white rounded-full transition-all font-medium text-xs uppercase tracking-wider flex items-center gap-1.5"
            >
              {user ? <><LogOut size={13} /> Sign Out</> : <><User size={13} /> Sign In</>}
            </button>

            <button className="md:hidden p-2 text-[#2B1F1D]" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <MenuIcon size={24} />
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-[#FAF6F0] border-t border-[#B87D4B]/10 p-6 flex flex-col gap-4 shadow-lg animate-in">
            <button onClick={() => { setIsMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-left py-2 font-medium tracking-wide text-sm">Home</button>
            <button onClick={() => { setIsMobileMenuOpen(false); document.getElementById('menu').scrollIntoView({ behavior: 'smooth' }); }} className="text-left py-2 font-medium tracking-wide text-sm">Collection</button>
            <button onClick={() => { setIsMobileMenuOpen(false); document.getElementById('hub').scrollIntoView({ behavior: 'smooth' }); }} className="text-left py-2 font-medium tracking-wide text-sm">My Hub</button>
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <section id="home" className="kolka-hero min-h-[90vh] md:min-h-screen flex items-center pt-24 md:pt-0">
        <div className="max-w-7xl mx-auto px-4 md:px-8 w-full grid md:grid-cols-12 gap-8 md:gap-12 items-center relative z-10">
          <div className="md:col-span-6 text-left space-y-6">
            <div className="inline-flex items-center gap-2 bg-[#E8D5C4]/40 border border-[#B87D4B]/15 px-4 py-1.5 rounded-full text-xs font-medium text-[#2B1F1D] tracking-wide">
              <Sparkles size={13} className="text-[#B87D4B]" /> Handcrafted Heritage & Silk Saris
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-[#2B1F1D] leading-tight">
              Wear the <br />
              <span className="text-[#B87D4B] italic">Artistry</span> of <br />
              Tradition.
            </h1>
            <p className="text-sm md:text-base text-[#6B5650] max-w-lg leading-relaxed">
              Curating exquisite Banarasi silks, breathable organic linen kurtis, and designer sets. Hand-woven textures and muted nude palettes designed for effortless, modern elegance.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-4">
              <Button variant="primary" className="py-4 px-8 shadow-md" onClick={() => document.getElementById('menu').scrollIntoView({ behavior: 'smooth' })}>View Collection</Button>
              <Button variant="secondary" className="py-4 px-8" onClick={() => document.getElementById('hub').scrollIntoView({ behavior: 'smooth' })}>Styling Session</Button>
            </div>
          </div>

          <div className="hidden md:flex md:col-span-6 justify-center items-center relative">
            {/* Organic rounded picture framing */}
            <div className="w-[85%] md:w-[90%] aspect-[4/5] bg-[#FAF1E6] organic-card overflow-hidden shadow-2xl relative border-4 border-white/60 animate-rich-float">
              <img 
                src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80" 
                alt="Model in Indian ethnic silk dress" 
                className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#FAF6F0]/20 to-transparent pointer-events-none" />
            </div>
            {/* Absolute badge elements */}
            <div className="absolute bottom-10 left-0 bg-white/90 backdrop-blur-md border border-[#B87D4B]/10 p-4 rounded-2xl shadow-lg flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FAF1E6] flex items-center justify-center text-[#B87D4B]">
                <Award size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#2B1F1D]">100% Handloom</p>
                <p className="text-[10px] text-[#6B5650]">Premium Heritage Silks</p>
              </div>
            </div>
          </div>
        </div>

        {/* Wavy bottom divider */}
        <div className="wavy-divider">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C26.9,8.75,57.05,18.3,84.7,25.88,143.72,42,204.83,50.51,265.91,54.38A1201.28,1201.28,0,0,0,321.39,56.44Z" className="shape-fill"></path>
          </svg>
        </div>
      </section>

      {/* COLLECTION SECTION */}
      <Section id="menu" className="kolka-menu-section mt-[-2px]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <p className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#B87D4B] mb-2">Curated Gallery</p>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-[#2B1F1D]">The Boutique Collection</h2>
            <div className="w-12 h-[1px] bg-[#B87D4B] mx-auto mt-4" />
          </div>

          {/* Minimalist Categories List */}
          <div className="flex overflow-x-auto gap-3 pb-8 no-scrollbar -mx-4 px-4 md:justify-center md:flex-wrap md:mx-0">
            {dynamicCategories.map(cat => (
              <button 
                key={cat} 
                onClick={() => setActiveTab(cat)} 
                className={`whitespace-nowrap px-6 py-2.5 rounded-full transition-all text-xs font-medium tracking-wider border ${activeTab === cat ? 'bg-[#2B1F1D] text-white border-[#2B1F1D] shadow-sm' : 'bg-transparent text-[#2B1F1D] border-[#B87D4B]/20 hover:border-[#B87D4B]/50'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {filteredItems.map(item => (
              <div 
                key={item.id} 
                onClick={() => { setSelectedProduct(item); setSelectedQty(1); setSelectedImageIdx(0); loadSavedSize(item); }} 
                className="kolka-product-card group rounded-3xl p-3 md:p-4 flex flex-col relative animate-in cursor-pointer"
              >
                <div className="w-full aspect-[4/5] bg-[#FAF8F5] rounded-2xl mb-4 overflow-hidden relative border border-[#B87D4B]/5 shadow-sm">
                  <img 
                    src={(Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : item.images)} 
                    onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400"; }} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 bg-transparent" 
                  />
                  <div className="absolute top-2 left-2 bg-[#FAF6F0]/90 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-semibold text-[#2B1F1D] border border-[#B87D4B]/15 shadow-sm uppercase tracking-wide">
                    {item.tag}
                  </div>
                </div>
                <div className="flex-1 text-left space-y-1">
                  <h3 className="text-sm md:text-base font-serif font-bold text-[#2B1F1D] line-clamp-1 group-hover:text-[#B87D4B] transition-colors">{item.name}</h3>
                  <p className="text-[11px] text-[#6B5650] line-clamp-2 leading-relaxed">{item.desc}</p>
                </div>
                <div className="flex items-center justify-between pt-4 mt-3 border-t border-[#B87D4B]/10">
                  <span className="text-base md:text-lg font-serif font-bold text-[#2B1F1D]">₹{item.price.toLocaleString('en-IN')}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedProduct(item); setSelectedQty(1); setSelectedImageIdx(0); loadSavedSize(item); }}
                    className="bg-[#B87D4B] text-white hover:bg-[#9E6535] p-2.5 rounded-full flex items-center justify-center transform transition-transform active:scale-90 hover:rotate-3 shadow-md shadow-[#B87D4B]/10"
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* BOUTIQUE HUB - ORDER TRACKING */}
      <Section id="hub" className="kolka-hub-section">
        <div className="max-w-6xl mx-auto space-y-12 lg:space-y-0 lg:grid lg:grid-cols-5 lg:gap-16 lg:items-center text-left">
          <div className="lg:col-span-2 space-y-6">
            <p className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#B87D4B]">Atelier Hub</p>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-[#2B1F1D] leading-tight">My Kolkaa <br />Hub</h2>
            <p className="text-[#6B5650] text-sm md:text-base leading-relaxed">
              Track your handcrafted Kolkaa pieces, from order to doorstep, in one calm little dashboard.
            </p>
          </div>

          <div className="lg:col-span-3">
            {userOrders.length > 0 ? (
              /* Live Order Tracker */
              <div className="bg-[#FAF6F0] p-6 md:p-8 rounded-[2rem] border border-[#B87D4B]/10 shadow-xl">
                <h3 className="text-xl font-serif font-bold text-[#2B1F1D] mb-4 flex items-center gap-2">
                  <ShoppingBag size={20} className="text-[#B87D4B]" /> Live Order Tracker
                </h3>
                
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#B87D4B]/10 text-[#6B5650] uppercase font-bold tracking-wider">
                        <th className="pb-3 pr-2">Order ID</th>
                        <th className="pb-3 px-2">Items</th>
                        <th className="pb-3 px-2">Total</th>
                        <th className="pb-3 pl-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#B87D4B]/5 text-[#2B1F1D]">
                      {userOrders.map(order => (
                        <tr key={order.id} className="hover:bg-[#FAF1E6]/30 transition-colors">
                          <td className="py-4 pr-2 font-bold uppercase">
                            #{order.id.slice(-5)}
                            <span className="block text-[9px] font-normal text-[#6B5650] mt-0.5">{order.createdAt ? new Date(order.createdAt.toDate()).toLocaleDateString() : 'Today'}</span>
                          </td>
                          <td className="py-4 px-2">
                            <span className="font-semibold block truncate max-w-[150px]">{order.items?.[0]?.name}</span>
                            {order.items?.length > 1 && <span className="text-[9px] text-[#B87D4B]">+{order.items.length - 1} more items</span>}
                          </td>
                          <td className="py-4 px-2 font-serif font-bold">₹{order.total?.toLocaleString('en-IN')}</td>
                          <td className="py-4 pl-2 text-right">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${getStatusStyle(order.status)}`}>
                              {getStatusLabel(order.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* PREMIUM EMPTY STATE FOR ORDER TRACKING */
              <div className="bg-[#FAF6F0] p-8 md:p-12 rounded-[2rem] border border-[#B87D4B]/10 shadow-xl text-center flex flex-col items-center justify-center min-h-[350px] animate-in">
                <div className="w-16 h-16 bg-[#FAF1E6] border border-[#B87D4B]/15 rounded-full flex items-center justify-center mb-6 text-[#B87D4B]">
                  <ShoppingBag size={26} />
                </div>
                <h3 className="text-2xl md:text-3xl font-serif font-bold text-[#2B1F1D] mb-3">Your Collection Awaits</h3>
                <p className="text-xs text-[#6B5650] max-w-sm leading-relaxed mb-8">
                  Select your favorite handcrafted Kolkaa pieces to unlock live order tracking.
                </p>
                <Button variant="primary" className="py-3 px-8 text-xs font-bold uppercase tracking-wider shadow-md" onClick={() => document.getElementById('menu').scrollIntoView({ behavior: 'smooth' })}>
                  Explore Kolkaa
                </Button>
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* FOOTER */}
      <footer className="bg-[#2B1F1D] text-[#FAF6F0] py-16 px-4 md:px-8 border-t border-[#B87D4B]/10">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8 mb-12 text-left">
          <div className="space-y-4">
            <h3 className="text-2xl font-serif font-bold tracking-wider">KOLKAA</h3>
            <p className="text-xs text-[#FAF6F0]/60 leading-relaxed">
              Timeless handloom silhouettes, bespoke tailoring consultations, and luxury bridal wear crafted in pure fabrics.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#B87D4B] mb-4">Categories</h4>
            <div className="flex flex-col gap-2.5 text-xs text-[#FAF6F0]/70">
              <button onClick={() => { setActiveTab('Saris'); document.getElementById('menu').scrollIntoView({ behavior: 'smooth' }); }} className="text-left hover:text-white transition-colors">Heritage Silk Saris</button>
              <button onClick={() => { setActiveTab('Long Kurtis'); document.getElementById('menu').scrollIntoView({ behavior: 'smooth' }); }} className="text-left hover:text-white transition-colors">Designer Long Kurtis</button>
              <button onClick={() => { setActiveTab('Short Kurtis'); document.getElementById('menu').scrollIntoView({ behavior: 'smooth' }); }} className="text-left hover:text-white transition-colors">Daily Short Kurtis</button>
              <button onClick={() => { setActiveTab('Designer Sets'); document.getElementById('menu').scrollIntoView({ behavior: 'smooth' }); }} className="text-left hover:text-white transition-colors">Exquisite Sets</button>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#B87D4B] mb-4">Atelier Hours</h4>
            <p className="text-xs text-[#FAF6F0]/70 leading-relaxed">
              Mon - Sat: 10:00 AM to 7:00 PM <br />
              Sunday: By Bridal Appointment Only
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#B87D4B] mb-4">Boutique</h4>
            <p className="text-xs text-[#FAF6F0]/70 leading-relaxed">
              12, Heritage Lane, Colaba <br />
              Mumbai, Maharashtra - 400001
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-[#FAF6F0]/40 uppercase font-bold tracking-[0.2em]">
          <p>&copy; {new Date().getFullYear()} KOLKAA ATELIER. All Rights Reserved.</p>
          <p>Handcrafted Heritage</p>
        </div>
      </footer>

      {/* CLOTHING PRODUCT DETAIL MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center px-4 overflow-hidden">
          <div className="absolute inset-0 bg-[#2B1F1D]/55 backdrop-blur-[3px] transition-opacity duration-300" onClick={() => setSelectedProduct(null)} />
          <div className="relative bg-[#FAF6F0] rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col md:flex-row overflow-hidden transform transition-all animate-in border border-[#B87D4B]/10">

            {/* Close Circle Button */}
            <button 
              onClick={() => setSelectedProduct(null)} 
              className="absolute top-5 right-5 p-2 bg-white/80 hover:bg-white text-[#2B1F1D] rounded-full border border-[#B87D4B]/10 z-30 transition-colors shadow-sm"
            >
              <X size={18} />
            </button>

            {/* Left Column: Image Slider */}
            <div className="w-full md:w-1/2 h-[38vh] md:h-auto shrink-0 bg-[#FAF1E6] relative p-4 md:p-6 flex flex-col justify-center items-center overflow-hidden border-b md:border-b-0 md:border-r border-[#B87D4B]/10">
              <div className="w-full aspect-[4/5] flex items-center justify-center p-2 mb-4">
                <img
                  onClick={() => setZoomedImage(Array.isArray(selectedProduct.images) ? selectedProduct.images[selectedImageIdx] : selectedProduct.images)}
                  src={Array.isArray(selectedProduct.images) ? selectedProduct.images[selectedImageIdx] : selectedProduct.images}
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600'; }}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover rounded-2xl animate-in shadow-md cursor-zoom-in hover:scale-[1.02] transition-transform duration-500"
                />
              </div>

              {Array.isArray(selectedProduct.images) && selectedProduct.images.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto p-1.5 w-full snap-x no-scrollbar justify-center">
                  {selectedProduct.images.map((imgUrl, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setSelectedImageIdx(idx)} 
                      className={`w-14 h-14 shrink-0 rounded-xl overflow-hidden snap-center border-2 transition-all ${selectedImageIdx === idx ? 'border-[#B87D4B] scale-105 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      <img src={imgUrl} className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=100'; }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Customizer & Details */}
            <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col h-[52vh] md:h-auto overflow-hidden text-left bg-[#FAF6F0]">
              <div className="flex-1 overflow-y-auto space-y-6 pr-1.5 scrollbar-thin">
                <div className="space-y-2">
                  <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-[#B87D4B] bg-[#E8D5C4]/30 px-3 py-1 rounded-full">{selectedProduct.category}</span>
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#2B1F1D] leading-tight pt-1">{selectedProduct.name}</h2>
                  <div className="text-2xl font-serif font-bold text-[#B87D4B]">₹{selectedProduct.price.toLocaleString('en-IN')}</div>
                </div>

                <div className="space-y-2 border-t border-[#B87D4B]/10 pt-4">
                  <h4 className="text-[10px] uppercase font-bold text-[#6B5650] tracking-widest">Details</h4>
                  <p className="text-xs text-[#6B5650] leading-relaxed whitespace-pre-wrap">{selectedProduct.desc}</p>
                </div>

                {/* Dynamic Size Configuration Selection */}
                {selectedProduct.sizeConfig && Array.isArray(selectedProduct.sizeConfig) && selectedProduct.sizeConfig.length > 0 && (
                  <div className="space-y-5">
                    {selectedProduct.sizeConfig.map((field, fIdx) => (
                      <div key={fIdx} className="space-y-2">
                        <p className="text-[10px] uppercase font-bold text-[#6B5650] tracking-wider">{field.name}</p>
                        {field.type === 'options' ? (
                          <div className="flex flex-wrap gap-2">
                            {field.values && field.values.map(val => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setSelections(prev => ({ ...prev, [field.name]: val }))}
                                className={`h-10 px-4 rounded-full text-xs font-semibold flex items-center justify-center transition-all border ${selections[field.name] === val ? 'bg-[#2B1F1D] text-white border-[#2B1F1D] shadow-sm scale-105' : 'bg-transparent text-[#2B1F1D] border-[#B87D4B]/20 hover:border-[#B87D4B]/50'}`}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={selections[field.name] || ''}
                            onChange={e => setSelections(prev => ({ ...prev, [field.name]: e.target.value }))}
                            placeholder={field.placeholder || "Enter measurement details (e.g. 44 inch)"}
                            className="w-full rounded-xl p-3 text-xs outline-none bg-white border border-[#B87D4B]/20 focus:border-[#B87D4B] transition-all text-[#2B1F1D]"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {user && selectedProduct.sizeConfig && Array.isArray(selectedProduct.sizeConfig) && selectedProduct.sizeConfig.length > 0 && (
                  <label className="flex items-center gap-2 cursor-pointer group w-max pt-1 select-none">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${rememberSize ? 'bg-[#B87D4B] border-[#B87D4B]' : 'border-[#B87D4B]/20 bg-transparent group-hover:border-[#B87D4B]'}`}>
                      {rememberSize && <Check size={12} className="text-white" />}
                    </div>
                    <span className="text-[9px] text-[#6B5650] font-bold uppercase tracking-wider">Remember my size selections</span>
                    <input type="checkbox" checked={rememberSize} onChange={(e) => setRememberSize(e.target.checked)} className="hidden" />
                  </label>
                )}

                {/* Quantity */}
                <div className="space-y-2.5">
                  <p className="text-[10px] uppercase font-bold text-[#6B5650] tracking-wider">Quantity</p>
                  <div className="flex items-center gap-4 bg-transparent p-1 rounded-xl w-max border border-[#B87D4B]/20">
                    <button onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))} className="w-8 h-8 rounded-lg bg-transparent text-[#2B1F1D] hover:bg-[#FAF1E6] flex items-center justify-center"><Minus size={13} /></button>
                    <span className="text-sm font-bold w-6 text-center">{selectedQty}</span>
                    <button onClick={() => setSelectedQty(prev => Math.min(prev + 1, selectedProduct.stock))} className="w-8 h-8 rounded-lg bg-transparent text-[#2B1F1D] hover:bg-[#FAF1E6] flex items-center justify-center"><Plus size={13} /></button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#B87D4B]/10 mt-3 shrink-0">
                <Button 
                  variant="primary" 
                  disabled={!isSizeSelectionComplete} 
                  className="w-full py-3.5 md:py-4 text-xs md:text-sm font-bold uppercase tracking-wider shadow-lg shadow-[#B87D4B]/10" 
                  onClick={() => {
                    if (user?.uid) {
                      if (rememberSize) {
                        localStorage.setItem(`size_${user.uid}_${selectedProduct.id}`, JSON.stringify(selections));
                      } else {
                        localStorage.removeItem(`size_${user.uid}_${selectedProduct.id}`);
                      }
                    }
                    
                    const cleanSelections = Object.fromEntries(
                      Object.entries(selections).filter(([_, val]) => val !== undefined && val !== null && String(val).trim() !== '')
                    );
                    const selectionStrings = Object.entries(cleanSelections).map(([key, val]) => `${key}: ${val}`);
                    const selectionLabel = selectionStrings.length > 0 ? ` (${selectionStrings.join(', ')})` : '';

                    addToCart({
                      ...selectedProduct,
                      id: `${selectedProduct.id}-${Object.values(cleanSelections).join('-')}`,
                      name: `${selectedProduct.name}${selectionLabel}`,
                      selections: cleanSelections
                    }, selectedQty);
                    setSelectedProduct(null);
                  }}
                >
                  {!isSizeSelectionComplete ? 'Complete Sizing Selections' : `Add to Bag · ₹${(selectedProduct.price * selectedQty).toLocaleString('en-IN')}`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SHOPPING BAG DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[1500] flex justify-end">
          <div className="absolute inset-0 bg-[#2B1F1D]/40 backdrop-blur-[2px]" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full md:max-w-md bg-[#FAF6F0] h-full flex flex-col animate-in border-l border-[#B87D4B]/10">
            <div className="p-6 border-b border-[#B87D4B]/15 flex items-center justify-between text-[#2B1F1D]">
              <div className="flex items-center gap-2.5">
                <ShoppingBag size={20} className="text-[#B87D4B]" />
                <h3 className="text-xl font-serif font-bold">Your Shopping Bag</h3>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-1.5 hover:bg-[#FAF1E6] rounded-full transition-colors"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-[#FAF1E6] border border-[#B87D4B]/15 rounded-full flex items-center justify-center text-[#B87D4B]"><ShoppingBag size={26} /></div>
                  <p className="text-sm font-serif italic text-[#6B5650]">Your bag is feeling light...</p>
                  <Button variant="secondary" className="py-2.5 px-6 text-xs uppercase" onClick={() => setIsCartOpen(false)}>Browse Outfits</Button>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-4 items-center bg-[#FAF1E6] p-3.5 rounded-2xl border border-[#B87D4B]/5 text-left text-xs animate-in">
                    <img 
                      src={(Array.isArray(item.images) ? item.images[0] : item.images)} 
                      onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=150"; }}
                      className="w-16 h-20 bg-white rounded-xl object-cover border border-[#B87D4B]/10 shadow-sm shrink-0" 
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[#2B1F1D] truncate pr-1">{item.name}</h4>
                      <p className="text-[10px] text-[#B87D4B] font-semibold mt-1">₹{item.price.toLocaleString('en-IN')}</p>
                      
                      <div className="flex items-center gap-3 mt-3">
                        <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-md border border-[#B87D4B]/10 hover:bg-white flex items-center justify-center text-[#2B1F1D] transition-colors"><Minus size={11} /></button>
                        <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-md border border-[#B87D4B]/10 hover:bg-white flex items-center justify-center text-[#2B1F1D] transition-colors"><Plus size={11} /></button>
                      </div>
                    </div>
                    <div className="text-right font-serif font-bold text-[#2B1F1D] shrink-0 pl-1">
                      ₹{(item.price * item.qty).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 bg-[#FAF1E6] border-t border-[#B87D4B]/10 shadow-md">
                <div className="flex justify-between items-center text-xl font-serif font-bold text-[#2B1F1D] mb-5">
                  <span>Bag Subtotal</span>
                  <span className="text-[#B87D4B]">₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
                <Button
                  onClick={() => {
                    if (!requireAuth()) return;
                    setIsCartOpen(false);
                    setIsCheckoutModalOpen(true);
                  }}
                  variant="primary"
                  className="w-full py-4 text-sm font-bold uppercase tracking-wider shadow-lg shadow-[#B87D4B]/10"
                >
                  Proceed to Checkout <ArrowRight size={16} />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center px-4 overflow-hidden">
          <div className="absolute inset-0 bg-[#2B1F1D]/55 backdrop-blur-[3px] transition-opacity duration-300" onClick={() => setIsCheckoutModalOpen(false)} />
          <div className="relative bg-[#FAF6F0] rounded-[2.5rem] p-8 md:p-12 max-w-lg w-full shadow-2xl animate-in border border-[#B87D4B]/15 text-left max-h-[90vh] overflow-y-auto no-scrollbar">
            
            <button onClick={() => setIsCheckoutModalOpen(false)} className="absolute top-6 right-6 p-1.5 hover:bg-[#FAF1E6] rounded-full transition-colors text-[#2B1F1D]"><X size={20} /></button>
            
            <div className="w-12 h-12 bg-[#FAF1E6] border border-[#B87D4B]/20 rounded-full flex items-center justify-center mb-5 text-[#B87D4B]">
              <MapPin size={22} />
            </div>

            <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#2B1F1D] mb-1">Shipping Details</h2>
            <p className="text-xs text-[#6B5650] mb-6">Provide delivery details for your custom boutique order.</p>

            <form onSubmit={submitOrder} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-[#6B5650] uppercase tracking-wider ml-1">Recipient Name</label>
                <input name="name" required placeholder="Sanya Sharma" defaultValue={user?.displayName || ''} className="w-full rounded-xl p-3 text-xs outline-none" />
              </div>
              
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-[#6B5650] uppercase tracking-wider ml-1">Contact Phone</label>
                <input name="phone" required placeholder="+91 98765 43210" className="w-full rounded-xl p-3 text-xs outline-none" />
              </div>
              
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-[#6B5650] uppercase tracking-wider ml-1">Delivery Address</label>
                <textarea name="address" required rows="2" placeholder="Street Address, Apartment, Landmark..." className="w-full rounded-xl p-3 text-xs outline-none resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#6B5650] uppercase tracking-wider ml-1">City</label>
                  <input name="city" required placeholder="Mumbai" className="w-full rounded-xl p-3 text-xs outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#6B5650] uppercase tracking-wider ml-1">Pincode</label>
                  <input name="pincode" required placeholder="400001" className="w-full rounded-xl p-3 text-xs outline-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-[#6B5650] uppercase tracking-wider ml-1">State</label>
                <input name="state" required placeholder="Maharashtra" className="w-full rounded-xl p-3 text-xs outline-none" />
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={isLoading} variant="primary" className="w-full py-4 text-sm font-bold uppercase tracking-wider shadow-lg shadow-[#B87D4B]/10">
                  {isLoading ? 'Confirming Order...' : `Pay & Complete Purchase · ₹${cartTotal.toLocaleString('en-IN')}`}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AUTHENTICATION MODAL */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center px-4 overflow-hidden">
          <div className="absolute inset-0 bg-[#2B1F1D]/55 backdrop-blur-[3px] transition-opacity duration-300" onClick={() => setIsAuthModalOpen(false)} />
          <div className="relative bg-[#FAF6F0] rounded-[2.5rem] p-8 md:p-12 max-w-md w-full shadow-2xl animate-in border border-[#B87D4B]/15 text-center">
            
            <button onClick={() => setIsAuthModalOpen(false)} className="absolute top-6 right-6 p-1.5 hover:bg-[#FAF1E6] rounded-full transition-colors text-[#2B1F1D]"><X size={20} /></button>
            
            <div className="w-12 h-12 bg-[#FAF1E6] border border-[#B87D4B]/15 rounded-full flex items-center justify-center mx-auto mb-5 text-[#B87D4B]">
              {authMode === 'login' ? <Lock size={20} /> : <User size={20} />}
            </div>

            <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#2B1F1D] mb-1">{authMode === 'login' ? 'Welcome Back' : 'Create Atelier Account'}</h2>
            <p className="text-[9px] text-[#B87D4B] mb-8 uppercase tracking-widest font-bold">Unlock scheduling and orders</p>
            
            <form onSubmit={handleAuth} className="space-y-4 text-left">
              <div className="relative">
                <Mail size={15} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#6B5650]" />
                <input name="email" type="email" required placeholder="Email Address" className="w-full pl-11 pr-4 py-3.5 rounded-xl text-xs outline-none" />
              </div>
              
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#6B5650]" />
                <input name="password" type="password" required placeholder="Password" minLength="6" className="w-full pl-11 pr-4 py-3.5 rounded-xl text-xs outline-none" />
              </div>

              {authError && <p className="text-[10px] text-red-600 bg-red-50 p-2 rounded-lg font-medium">{authError}</p>}
              
              <Button type="submit" variant="primary" className="w-full py-3.5 text-xs font-bold uppercase tracking-wider shadow-md mt-2">
                {authMode === 'login' ? 'Sign In' : 'Sign Up'}
              </Button>
            </form>
            
            <div className="mt-4 pt-4 border-t border-[#B87D4B]/10">
              <button type="button" onClick={handleGoogleAuth} className="w-full flex items-center justify-center gap-2.5 bg-white border border-[#B87D4B]/15 hover:border-[#B87D4B]/40 text-[#2B1F1D] rounded-xl py-3 text-xs font-semibold shadow-sm transition-all">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 object-contain" />
                Continue with Google
              </button>
            </div>
            
            <div className="mt-6">
              <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-xs font-bold text-[#B87D4B] hover:text-[#9E6535] transition-colors underline underline-offset-4">
                {authMode === 'login' ? "First time at our boutique? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </div>
      )}

      {successModal.isOpen && (
        <>
          {/* Backdrop layer (z-2100) with a little subtle blur */}
          <div className="fixed inset-0 z-[2100] bg-[#2B1F1D]/55 backdrop-blur-[3px] transition-opacity duration-300" onClick={() => setSuccessModal({ isOpen: false, title: '', message: '' })} />
          
          {/* Thank You Note Content layer (z-2300) */}
          <div className="fixed inset-0 z-[2300] flex items-center justify-center px-4 overflow-hidden pointer-events-none">
            <div className="relative bg-[#FAF6F0] rounded-[2.5rem] p-8 md:p-12 max-w-md w-full text-center shadow-2xl border border-[#B87D4B]/15 animate-in pointer-events-auto">
              
              <button onClick={() => setSuccessModal({ isOpen: false, title: '', message: '' })} className="absolute top-6 right-6 p-1.5 hover:bg-[#FAF1E6] rounded-full transition-colors text-[#2B1F1D]"><X size={18} /></button>
              
              <div className="w-12 h-12 bg-[#FAF1E6] border border-[#B87D4B]/20 rounded-full flex items-center justify-center mx-auto mb-5 text-[#B87D4B]">
                <Sparkles size={20} />
              </div>

              <p className="text-[9px] font-bold text-[#B87D4B] uppercase tracking-[0.25em] mb-1">Kolkaa Atelier</p>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#2B1F1D] leading-tight mb-2">{successModal.title}</h2>
              <p className="text-xs text-[#6B5650] max-w-xs mx-auto mb-6 leading-relaxed">{successModal.message}</p>
              
              <Button onClick={() => setSuccessModal({ isOpen: false, title: '', message: '' })} variant="primary" className="py-3 px-8 text-xs font-bold uppercase tracking-wider mx-auto">
                Continue
              </Button>
            </div>
          </div>
        </>
      )}

      {/* FULLSCREEN IMAGE ZOOM MODAL */}
      {zoomedImage && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center px-4" onClick={() => setZoomedImage(null)}>
          <div className="absolute inset-0 bg-black/85 backdrop-blur-[3px]" onClick={() => setZoomedImage(null)} />
          <button onClick={() => setZoomedImage(null)} className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"><X size={20} /></button>
          <img src={zoomedImage} alt="Fullscreen preview" className="relative max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl animate-in" />
        </div>
      )}
      {/* FLOAT TOAST FEEDBACK NOTIFICATION */}
      {feedback && (
        <div className="fixed bottom-8 left-0 right-0 z-[3500] flex justify-center px-4 pointer-events-none">
          <div className="bg-[#2B1F1D]/95 text-[#FAF6F0] backdrop-blur-md px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 text-[11px] font-bold tracking-wider uppercase animate-in pointer-events-auto">
            <CheckCircle2 size={15} className="text-[#B87D4B]" />
            <span>{feedback}</span>
          </div>
        </div>
      )}
    </div>
  );
}
