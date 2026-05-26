import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, updateDoc, doc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import {
  ShoppingBag,
  Package,
  MapPin,
  Phone,
  CheckCircle,
  Trash2,
  XCircle,
  Star,
  Mail,
  Edit3,
  Plus,
  ArrowLeft
} from 'lucide-react';

const ADMIN_PASSWORD = '74391';
const ADMIN_SESSION_KEY = 'luminaAdminUnlockedV2';

export default function AdminDashboard() {
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(() => sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

  const initialProductState = { name: '', category: 'Saris', desc: '', price: '', stock: '', images: [], sizeConfig: [] };
  const [productForm, setProductForm] = useState(initialProductState);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const addSizeField = () => {
    setProductForm(prev => ({
      ...prev,
      sizeConfig: [...(prev.sizeConfig || []), { name: '', type: 'options', valuesText: 'S, M, L' }]
    }));
  };

  const removeSizeField = (index) => {
    setProductForm(prev => {
      const newConfig = [...(prev.sizeConfig || [])];
      newConfig.splice(index, 1);
      return { ...prev, sizeConfig: newConfig };
    });
  };

  const updateSizeField = (index, key, val) => {
    setProductForm(prev => {
      const newConfig = [...(prev.sizeConfig || [])];
      newConfig[index] = { ...newConfig[index], [key]: val };
      return { ...prev, sizeConfig: newConfig };
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    let completed = 0;
    const newImages = [];

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 600;

          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const dataURL = canvas.toDataURL('image/jpeg', 0.7);
          newImages.push(dataURL);

          completed++;
          setUploadProgress((completed / files.length) * 100);

          if (completed === files.length) {
            setProductForm((prev) => ({
              ...prev,
              images: [...(prev.images || []), ...newImages]
            }));
            setIsUploading(false);
            setUploadProgress(0);
          }
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setProductForm((prev) => {
      const newImages = [...prev.images];
      newImages.splice(index, 1);
      return { ...prev, images: newImages };
    });
  };

  const setPrimaryImage = (index) => {
    setProductForm((prev) => {
      const newImages = [...prev.images];
      const selected = newImages.splice(index, 1)[0];
      newImages.unshift(selected);
      return { ...prev, images: newImages };
    });
  };

  useEffect(() => {
    if (!isAdminUnlocked) return;

    const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const orderData = [];
      snapshot.forEach((docItem) => orderData.push({ id: docItem.id, ...docItem.data() }));
      orderData.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setOrders(orderData);
    });

    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const productData = [];
      snapshot.forEach((docItem) => productData.push({ id: docItem.id, ...docItem.data() }));
      setProducts(productData);
      setLoading(false);
    });

    return () => {
      unsubOrders();
      unsubProducts();
    };
  }, [isAdminUnlocked]);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (password.trim() !== ADMIN_PASSWORD) {
      setPasswordError('Incorrect unlock code.');
      return;
    }
    sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
    setIsAdminUnlocked(true);
    setPassword('');
    setPasswordError('');
  };

  const updateOrderStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status: newStatus });
    } catch (err) {
      alert('Error updating order: ' + err.message);
    }
  };

  const deleteOrder = async (id) => {
    if (window.confirm('Delete this order record permanently?')) {
      await deleteDoc(doc(db, 'orders', id));
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const cleanedSizeConfig = productForm.sizeConfig && productForm.sizeConfig.length > 0
        ? productForm.sizeConfig.map(field => {
            if (field.type === 'options') {
              let valuesArr = [];
              if (typeof field.valuesText === 'string') {
                valuesArr = field.valuesText.split(',').map(s => s.trim()).filter(Boolean);
              } else if (Array.isArray(field.values)) {
                valuesArr = field.values;
              }
              return {
                name: field.name,
                type: 'options',
                values: valuesArr
              };
            }
            return {
              name: field.name,
              type: 'custom',
              placeholder: field.placeholder || ''
            };
          })
        : null;

      const data = {
        name: productForm.name,
        category: productForm.category,
        desc: productForm.desc,
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock),
        images: productForm.images?.length > 0
          ? productForm.images
          : ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600'],
        sizeConfig: cleanedSizeConfig
      };

      if (editingProductId) {
        await updateDoc(doc(db, 'products', editingProductId), data);
      } else {
        await addDoc(collection(db, 'products'), { ...data, createdAt: serverTimestamp() });
      }

      setProductForm(initialProductState);
      setIsAddingProduct(false);
      setEditingProductId(null);
    } catch (err) {
      alert('Error saving product: ' + err.message);
    }
  };

  const editProduct = (product) => {
    const images = product.images ? product.images : (product.img ? [product.img] : []);
    const sizeConfig = (product.sizeConfig || []).map(field => {
      if (field.type === 'options') {
        return {
          ...field,
          valuesText: Array.isArray(field.values) ? field.values.join(', ') : ''
        };
      }
      return field;
    });
    setProductForm({ ...product, images, sizeConfig });
    setEditingProductId(product.id);
    setIsAddingProduct(true);
  };

  const deleteProduct = async (id) => {
    if (window.confirm('Delete this outfit from the storefront?')) {
      await deleteDoc(doc(db, 'products', id));
    }
  };

  const importSampleProducts = async () => {
    if (window.confirm('Import 8 default handcrafted sample products to your storefront?')) {
      try {
        const samples = [
          {
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

        for (const item of samples) {
          await addDoc(collection(db, 'products'), {
            ...item,
            createdAt: serverTimestamp()
          });
        }
        alert('All 8 default sample products successfully imported into your new Firestore database!');
      } catch (err) {
        alert('Failed to import products: ' + err.message);
      }
    }
  };

  const totalRevenue = orders.reduce((acc, order) => acc + (order.total || 0), 0);

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending': 
      case 'paid': 
        return { color: 'border-[#B87D4B]', label: 'Pending (Paid)', bg: 'bg-[#FAF1E6]', text: 'text-[#B87D4B]', actionBg: 'bg-[#B87D4B]', actionText: 'text-white', actionShadow: 'shadow-[#B87D4B]/10' };
      case 'accepted':
      case 'preparing': 
        return { color: 'border-amber-500', label: 'Accepted / Preparing', bg: 'bg-amber-50', text: 'text-amber-700', actionBg: 'bg-amber-600', actionText: 'text-white', actionShadow: 'shadow-amber-500/10' };
      case 'dispatched': 
        return { color: 'border-sky-500', label: 'Dispatched / Shipped', bg: 'bg-sky-50', text: 'text-sky-700', actionBg: 'bg-sky-600', actionText: 'text-white', actionShadow: 'shadow-sky-500/10' };
      case 'out_for_delivery': 
        return { color: 'border-blue-500', label: 'Out For Delivery', bg: 'bg-blue-50', text: 'text-blue-700', actionBg: 'bg-blue-600', actionText: 'text-white', actionShadow: 'shadow-blue-500/10' };
      case 'delivered': 
        return { color: 'border-green-600', label: 'Delivered', bg: 'bg-green-50', text: 'text-green-800', actionBg: 'bg-green-600', actionText: 'text-white', actionShadow: 'shadow-green-500/10' };
      case 'rejected': 
        return { color: 'border-red-500', label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-700', actionBg: 'bg-red-600', actionText: 'text-white', actionShadow: 'shadow-red-500/10' };
      default: 
        return { color: 'border-gray-200', label: status || 'Pending', bg: 'bg-gray-50', text: 'text-gray-700', actionBg: 'bg-gray-600', actionText: 'text-white', actionShadow: 'shadow-gray-500/10' };
    }
  };

  if (!isAdminUnlocked) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] text-[#2B1F1D] flex items-center justify-center px-4 font-sans selection:bg-[#E8D5C4]">
        <form onSubmit={handleAdminLogin} className="w-full max-w-sm bg-[#FAF1E6] rounded-[2.5rem] shadow-xl border border-[#B87D4B]/10 p-10">
          <p className="text-[10px] font-bold text-[#B87D4B] uppercase tracking-[0.3em] mb-3 text-center">Kolkaa Atelier</p>
          <h1 className="text-3xl font-serif font-bold text-[#2B1F1D] mb-2 text-center">Admin Access</h1>
          <p className="text-xs text-[#6B5650] mb-8 text-center font-semibold">Enter your credentials to secure the boutique CMS.</p>
          <input
            autoFocus
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError('');
            }}
            className="w-full bg-white border border-[#B87D4B]/20 focus:border-[#B87D4B] rounded-xl p-4 text-xs font-semibold outline-none transition-all text-center"
            placeholder="Enter unlock code"
          />
          {passwordError && <p className="text-xs text-red-600 font-bold mt-3 text-center">{passwordError}</p>}
          <button type="submit" className="mt-6 w-full bg-[#B87D4B] hover:bg-[#9E6535] text-white rounded-xl px-5 py-4 font-bold text-sm tracking-wider uppercase transition-all shadow-md shadow-[#B87D4B]/10">
            Open Dashboard
          </button>
          <a href="/" className="block text-center mt-6 text-xs font-bold text-[#B87D4B] hover:text-[#9E6535] transition-colors underline underline-offset-4">Back to Storefront</a>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#2B1F1D] flex flex-col md:flex-row font-sans selection:bg-[#E8D5C4]">
      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 bg-[#FAF1E6] border-b md:border-b-0 md:border-r border-[#B87D4B]/10 p-4 md:p-6 flex flex-col shadow-sm shrink-0 text-left">
        <div className="flex md:flex-col justify-between items-center md:items-stretch mb-6 md:mb-10">
          <div className="text-left">
            <span className="text-[9px] font-bold text-[#B87D4B] tracking-[0.2em] uppercase">Boutique CMS</span>
            <h1 className="text-xl md:text-2xl font-serif font-bold text-[#2B1F1D] tracking-wide mt-0.5">
              Kolkaa Admin
            </h1>
          </div>
          <a href="/" className="md:hidden text-xs font-bold text-[#B87D4B] hover:text-[#9E6535] transition-colors">Storefront</a>
        </div>
        
        <nav className="flex md:flex-col space-x-3 md:space-x-0 md:space-y-3 px-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          <button
            onClick={() => setActiveTab('orders')}
            className={`whitespace-nowrap flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2.5 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${activeTab === 'orders' ? 'bg-[#2B1F1D] text-white shadow-sm' : 'text-[#2B1F1D] hover:bg-white/50 bg-[#FAF6F0] md:bg-transparent border border-[#B87D4B]/10 md:border-transparent'}`}
          >
            <ShoppingBag size={16} /> Orders <span className="ml-2 md:ml-auto bg-[#B87D4B]/10 text-[#B87D4B] text-[10px] px-2.5 py-0.5 rounded-full font-bold">{orders.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`whitespace-nowrap flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2.5 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${activeTab === 'products' ? 'bg-[#2B1F1D] text-white shadow-sm' : 'text-[#2B1F1D] hover:bg-white/50 bg-[#FAF6F0] md:bg-transparent border border-[#B87D4B]/10 md:border-transparent'}`}
          >
            <Package size={16} /> Products <span className="ml-2 md:ml-auto bg-[#B87D4B]/10 text-[#B87D4B] text-[10px] px-2.5 py-0.5 rounded-full font-bold">{products.length}</span>
          </button>
        </nav>
        
        <div className="hidden md:block pt-6 border-t border-[#B87D4B]/10 text-left mt-auto">
          <a href="/" className="text-xs font-bold text-[#6B5650] hover:text-[#2B1F1D] transition-colors flex items-center gap-1.5">
            <ArrowLeft size={14} /> Back to Storefront
          </a>
        </div>
      </aside>

      {/* Main content grid */}
      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto w-full max-w-full text-left">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
          <div className="text-left">
            <p className="text-[10px] font-bold text-[#B87D4B] uppercase tracking-[0.3em] mb-2">Management Console</p>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#2B1F1D] capitalize">{activeTab} CMS</h2>
            <p className="text-xs text-[#6B5650] mt-2 font-medium">Add, update, and manage your handcrafted garments and buyer orders.</p>
          </div>
          {activeTab === 'orders' && (
            <div className="bg-[#FAF1E6] px-8 py-5 rounded-[2rem] shadow-sm border border-[#B87D4B]/10 text-left md:text-right min-w-[200px]">
              <p className="text-[10px] text-[#B87D4B] font-bold tracking-[0.2em] uppercase">Total Revenue</p>
              <p className="text-2xl font-serif font-bold text-[#2B1F1D] mt-1">₹{totalRevenue.toLocaleString('en-IN')}</p>
            </div>
          )}
          {activeTab === 'products' && !isAddingProduct && (
            <div className="flex flex-wrap gap-3">
              <button 
                type="button"
                onClick={importSampleProducts}
                className="bg-[#2B1F1D] hover:bg-[#1A1312] text-white px-5 py-3 rounded-full font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all"
              >
                Import Sample Outfits
              </button>
              <button onClick={() => setIsAddingProduct(true)} className="bg-[#B87D4B] hover:bg-[#9E6535] text-white px-5 py-3 rounded-full font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-[#B87D4B]/10 transition-all">
                <Plus size={15} /> Add New Outfit
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-[#B87D4B]" />
          </div>
        ) : activeTab === 'orders' ? (
          <div className="grid gap-6">
            {orders.length === 0 ? <p className="text-[#6B5650] font-bold text-sm italic">No orders received yet.</p> : orders.map((order) => {
              const statusInfo = getStatusConfig(order.status);
              return (
                <div key={order.id} className={`bg-[#FAF1E6] rounded-3xl p-6 md:p-8 shadow-sm border border-[#B87D4B]/10 border-l-8 transition-all ${statusInfo.color} ${order.status === 'delivered' || order.status === 'rejected' ? 'opacity-80' : ''}`}>
                  <div className="flex flex-col lg:flex-row justify-between items-start mb-6 gap-4">
                    <div className="w-full lg:w-auto">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <h3 className="font-bold text-lg text-[#2B1F1D]">{order.customer?.name}</h3>
                        <span className={`w-fit text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${statusInfo.bg} ${statusInfo.text}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-[#6B5650] flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 mt-3 bg-[#FAF6F0] sm:bg-transparent p-3 sm:p-0 rounded-xl">
                        <span className="flex items-center gap-2"><MapPin size={13} className="text-[#B87D4B] flex-shrink-0" /> <span className="truncate max-w-[200px] sm:max-w-xs">{order.customer?.address}, {order.customer?.city} ({order.customer?.pincode})</span></span>
                        <span className="flex items-center gap-2"><Phone size={13} className="text-[#B87D4B] flex-shrink-0" /> {order.customer?.phone}</span>
                        <span className="flex items-center gap-2 text-gray-500"><Mail size={13} className="text-gray-400 flex-shrink-0" /> {order.userEmail}</span>
                      </div>
                    </div>
                    <div className="text-left lg:text-right w-full lg:w-auto bg-[#FAF6F0] lg:bg-transparent p-4 lg:p-0 rounded-xl">
                      <p className="text-[9px] uppercase font-bold text-[#6B5650] lg:hidden mb-1 tracking-wider">Total Amount</p>
                      <p className="text-2xl font-serif font-bold text-[#2B1F1D]">₹{order.total?.toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  <div className="bg-[#FAF6F0] rounded-2xl p-5 mb-6 border border-[#B87D4B]/15">
                    <p className="text-[9px] font-bold text-[#B87D4B] mb-3 uppercase tracking-[0.2em]">Garments Ordered</p>
                    {order.items?.map((item, i) => (
                      <div key={i} className="text-xs flex justify-between py-2 border-b border-[#B87D4B]/5 last:border-0 font-bold text-[#6B5650]">
                        <span><span className="text-[#B87D4B]">{item.qty}x</span> {item.name}</span>
                        <span className="text-[#2B1F1D]">₹{(item.price * item.qty).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap md:flex-nowrap gap-3 justify-between items-center bg-[#FAF6F0] p-3 rounded-xl border border-[#B87D4B]/10">
                    <button onClick={() => deleteOrder(order.id)} className="w-full md:w-auto p-2.5 bg-[#FAF1E6] hover:bg-[#FAF1E6]/80 border border-[#B87D4B]/15 rounded-lg text-gray-400 hover:text-red-600 hover:border-red-200 transition-all flex justify-center items-center gap-2 order-last md:order-first" title="Delete Record">
                      <Trash2 size={15} /> <span className="md:hidden font-bold text-xs">Delete Record</span>
                    </button>

                    <div className="flex flex-wrap w-full md:w-auto gap-2 justify-end order-first md:order-last">
                      {/* 1. Initial State: Pending / Paid */}
                      {(order.status === 'pending' || order.status === 'paid' || !order.status) && (
                        <>
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'rejected')} 
                            className="flex-1 md:flex-none justify-center flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all border border-red-200 shadow-sm shadow-red-500/5"
                          >
                            Reject
                          </button>
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'accepted')} 
                            className="flex-1 md:flex-none justify-center flex items-center gap-2 px-5 py-2.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all border border-green-200 shadow-sm shadow-green-500/5"
                          >
                            Accept
                          </button>
                        </>
                      )}

                      {/* 2. Accepted / Preparing state */}
                      {(order.status === 'accepted' || order.status === 'preparing') && (
                        <>
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'rejected')} 
                            className="flex-1 md:flex-none justify-center flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all border border-red-200 shadow-sm"
                          >
                            Reject
                          </button>
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'dispatched')} 
                            className="flex-1 md:flex-none justify-center flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white hover:bg-amber-600 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all shadow-md shadow-amber-500/10"
                          >
                            Dispatch Order
                          </button>
                        </>
                      )}

                      {/* 3. Dispatched state */}
                      {order.status === 'dispatched' && (
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'out_for_delivery')} 
                          className="w-full md:w-auto justify-center flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white hover:bg-blue-600 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all shadow-md shadow-blue-500/10"
                        >
                          Out for Delivery
                        </button>
                      )}

                      {/* 4. Out for delivery state */}
                      {order.status === 'out_for_delivery' && (
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'delivered')} 
                          className="w-full md:w-auto justify-center flex items-center gap-2 px-5 py-2.5 bg-[#B87D4B] text-white hover:bg-[#9E6535] rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all shadow-md shadow-[#B87D4B]/10"
                        >
                          Deliver Order
                        </button>
                      )}

                      {/* 5. Fulfilled / Cancelled States */}
                      {order.status === 'delivered' && (
                        <span className="w-full md:w-auto justify-center flex items-center gap-1 text-green-700 font-bold text-[10px] uppercase tracking-wider px-4 py-2 bg-green-50 rounded-lg text-center border border-green-150">
                          Delivered & Fulfilled
                        </span>
                      )}
                      {order.status === 'rejected' && (
                        <span className="w-full md:w-auto justify-center flex items-center gap-1 text-red-700 font-bold text-[10px] uppercase tracking-wider px-4 py-2 bg-red-50 rounded-lg text-center border border-red-155">
                          Cancelled / Rejected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6">
            {isAddingProduct && (
              <div className="bg-[#FAF1E6] p-6 md:p-10 rounded-[2.5rem] border border-[#B87D4B]/15 shadow-md mb-10 animate-in">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl md:text-2xl font-serif font-bold text-[#2B1F1D]">{editingProductId ? 'Edit Outfit' : 'Add New Outfit'}</h3>
                  <button onClick={() => { setIsAddingProduct(false); setProductForm(initialProductState); setEditingProductId(null); }} className="p-2 bg-[#FAF6F0] text-gray-400 hover:text-[#2B1F1D] rounded-full"><XCircle size={18} /></button>
                </div>
                <form onSubmit={handleProductSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#6B5650] ml-2 uppercase tracking-wide">Product Name</label>
                      <input required type="text" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="w-full rounded-xl p-3 text-xs outline-none" placeholder="E.g. Royal Indigo Chanderi Sari" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#6B5650] ml-2 uppercase tracking-wide">Category</label>
                      <input required type="text" list="categoryList" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} className="w-full rounded-xl p-3 text-xs outline-none" placeholder="E.g. Saris, Kurtis..." />
                      <datalist id="categoryList">
                        {['Saris', 'Long Kurtis', 'Short Kurtis', 'Designer Sets'].map((cat) => (
                          <option key={cat} value={cat} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#6B5650] ml-2 uppercase tracking-wide">Detailed Description / Fabric Details</label>
                    <textarea required value={productForm.desc} onChange={(e) => setProductForm({ ...productForm, desc: e.target.value })} className="w-full rounded-xl p-3 text-xs outline-none resize-none h-24" placeholder="Detail the weave, fabric content, craftsmanship details, and styling recommendation..." />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#6B5650] ml-2 uppercase tracking-wide">Price (INR)</label>
                      <input required type="number" step="1" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} className="w-full rounded-xl p-3 text-xs outline-none" placeholder="3499" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#6B5650] ml-2 uppercase tracking-wide">Inventory Stock</label>
                      <input required type="number" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} className="w-full rounded-xl p-3 text-xs outline-none" placeholder="5" />
                    </div>
                    <div className="space-y-1 flex flex-col justify-end">
                      <label className="text-[9px] font-bold text-[#6B5650] ml-2 uppercase tracking-wide">Upload Outfit Photos</label>
                      <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="w-full bg-[#FAF6F0] rounded-xl p-1.5 text-xs font-semibold outline-none cursor-pointer file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-[#B87D4B]/10 file:text-[#B87D4B] hover:file:bg-[#B87D4B]/20" />
                      {isUploading && <div className="text-[9px] font-bold text-[#B87D4B] ml-2 mt-1">Processing images: {Math.round(uploadProgress)}%</div>}
                    </div>
                  </div>

                  {/* Dynamic Size Configuration Editor */}
                  <div className="bg-[#FAF6F0] rounded-2xl p-6 border border-[#B87D4B]/15 space-y-4 text-left">
                    <div className="flex justify-between items-center border-b border-[#B87D4B]/10 pb-3">
                      <div>
                        <h4 className="text-sm font-serif font-bold text-[#2B1F1D]">Dynamic Size Charts</h4>
                        <p className="text-[10px] text-[#6B5650] mt-0.5">Enable size options (e.g. Blouse Size S/M/L) or add raw text inputs for customer measurements. Leave empty for no sizing (e.g. Saris).</p>
                      </div>
                      <button
                        type="button"
                        onClick={addSizeField}
                        className="bg-[#B87D4B] hover:bg-[#9E6535] text-white px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <Plus size={12} /> Add Size Chart
                      </button>
                    </div>

                    {productForm.sizeConfig && productForm.sizeConfig.length > 0 ? (
                      <div className="space-y-4 divide-y divide-[#B87D4B]/5">
                        {productForm.sizeConfig.map((field, idx) => (
                          <div key={idx} className="pt-4 first:pt-0 flex flex-col md:flex-row gap-4 items-start">
                            <div className="w-full md:w-1/3 space-y-1.5">
                              <label className="text-[9px] font-bold text-[#6B5650] uppercase tracking-wide">Size Field Name</label>
                              <input
                                required
                                type="text"
                                value={field.name}
                                onChange={e => updateSizeField(idx, 'name', e.target.value)}
                                placeholder="e.g. Blouse Size, Hip Size"
                                className="w-full rounded-xl p-3 text-xs outline-none bg-white border border-[#B87D4B]/20"
                              />
                            </div>

                            <div className="w-full md:w-1/4 space-y-1.5">
                              <label className="text-[9px] font-bold text-[#6B5650] uppercase tracking-wide">Input Type</label>
                              <select
                                value={field.type}
                                onChange={e => updateSizeField(idx, 'type', e.target.value)}
                                className="w-full rounded-xl p-3 text-xs outline-none bg-white border border-[#B87D4B]/20"
                              >
                                <option value="options">Options Selector (S, M, L...)</option>
                                <option value="custom">Raw Text Box (Customer measurement)</option>
                              </select>
                            </div>

                            <div className="w-full md:flex-1 space-y-1.5">
                              {field.type === 'options' ? (
                                <>
                                  <div className="flex justify-between items-center">
                                    <label className="text-[9px] font-bold text-[#6B5650] uppercase tracking-wide">Options (comma-separated)</label>
                                    <button
                                      type="button"
                                      onClick={() => updateSizeField(idx, 'valuesText', "XS, S, M, L, XL, XXL")}
                                      className="text-[8px] text-[#B87D4B] font-bold hover:underline"
                                    >
                                      Standard (XS-XXL)
                                    </button>
                                  </div>
                                  <input
                                    required
                                    type="text"
                                    value={field.valuesText !== undefined ? field.valuesText : (Array.isArray(field.values) ? field.values.join(', ') : '')}
                                    onChange={e => updateSizeField(idx, 'valuesText', e.target.value)}
                                    placeholder="e.g. S, M, L, XL"
                                    className="w-full rounded-xl p-3 text-xs outline-none bg-white border border-[#B87D4B]/20"
                                  />
                                </>
                              ) : (
                                <>
                                  <label className="text-[9px] font-bold text-[#6B5650] uppercase tracking-wide">Text Field Placeholder</label>
                                  <input
                                    type="text"
                                    value={field.placeholder || ''}
                                    onChange={e => updateSizeField(idx, 'placeholder', e.target.value)}
                                    placeholder="e.g. Enter blouse size (e.g. 44 inch)"
                                    className="w-full rounded-xl p-3 text-xs outline-none bg-white border border-[#B87D4B]/20"
                                  />
                                </>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => removeSizeField(idx)}
                              className="self-end p-3 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 text-red-600 transition-colors"
                              title="Remove field"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 border-2 border-dashed border-[#B87D4B]/10 rounded-xl bg-white/20">
                        <p className="text-xs text-[#6B5650] italic">No size chart configuration. Customers will purchase without choosing sizes (ideal for Saris).</p>
                      </div>
                    )}
                  </div>

                  {productForm.images?.length > 0 && (
                    <div className="bg-[#FAF6F0] rounded-2xl p-4 border border-[#B87D4B]/10">
                      <label className="text-[9px] font-bold text-[#B87D4B] uppercase mb-3 block tracking-wide">Photo Gallery (First image is Cover)</label>
                      <div className="flex gap-4 overflow-x-auto pb-2">
                        {productForm.images.map((img, idx) => (
                          <div key={idx} className={`relative w-20 h-20 rounded-xl shrink-0 overflow-hidden border-2 transition-all ${idx === 0 ? 'border-[#B87D4B] shadow-sm' : 'border-transparent opacity-80 hover:opacity-100'}`}>
                            <img src={img} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-[#2B1F1D]/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                              {idx !== 0 && (
                                <button type="button" onClick={() => setPrimaryImage(idx)} className="p-1 bg-white text-[#B87D4B] rounded-full hover:scale-110" title="Set as cover"><Star size={11} /></button>
                              )}
                              <button type="button" onClick={() => removeImage(idx)} className="p-1 bg-white text-red-500 rounded-full hover:scale-110" title="Delete"><Trash2 size={11} /></button>
                            </div>
                            {idx === 0 && <span className="absolute top-1 left-1 bg-[#B87D4B] text-white text-[8px] font-bold px-1.5 py-0.5 rounded">COVER</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button type="submit" className="w-full bg-[#B87D4B] hover:bg-[#9E6535] text-white py-4 rounded-xl font-bold mt-4 shadow-sm uppercase text-xs tracking-wider transition-all">
                    {editingProductId ? 'Update Outfit Details' : 'Save Outfit to Storefront'}
                  </button>
                </form>
              </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {products.length === 0 && !isAddingProduct && <p className="text-[#6B5650] font-bold text-sm italic col-span-full">No products in storefront yet.</p>}
              {products.map((product) => {
                const imgSource = Array.isArray(product.images) && product.images.length > 0
                  ? product.images[0]
                  : (product.img || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c');

                return (
                  <div key={product.id} className="bg-[#FAF1E6] rounded-3xl p-4 border border-[#B87D4B]/10 shadow-sm flex flex-col hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-3 right-3 z-10 space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => editProduct(product)} className="w-7 h-7 bg-white text-[#B87D4B] rounded-full shadow border border-[#B87D4B]/10 flex justify-center items-center hover:scale-105"><Edit3 size={12} /></button>
                      <button onClick={() => deleteProduct(product.id)} className="w-7 h-7 bg-white text-red-500 rounded-full shadow border border-[#B87D4B]/10 flex justify-center items-center hover:scale-105"><Trash2 size={12} /></button>
                    </div>
                    <img src={imgSource} alt={product.name} className="w-full aspect-[4/5] object-cover rounded-2xl mb-4 bg-white border border-[#B87D4B]/5" />
                    <div className="flex-1 text-left">
                      <h3 className="font-bold text-sm text-[#2B1F1D] leading-tight mb-1 truncate">{product.name}</h3>
                      <span className="text-[8px] font-bold uppercase tracking-wider text-[#B87D4B] bg-[#E8D5C4]/40 px-2 py-0.5 rounded-full inline-block mb-3">{product.category}</span>
                      <p className="text-[11px] text-[#6B5650] line-clamp-2 leading-relaxed mb-4">{product.desc}</p>
                    </div>
                    <div className="flex justify-between items-end pt-3 border-t border-[#B87D4B]/10">
                      <div>
                        <p className="text-[9px] font-bold text-[#6B5650] uppercase">Stock</p>
                        <p className="text-xs font-bold text-[#2B1F1D]">{product.stock} units</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-serif font-bold text-[#B87D4B]">₹{Number(product.price).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
