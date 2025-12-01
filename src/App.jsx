import React, { useState, useEffect, useRef } from 'react';
import { 
  Map, CheckSquare, Home, Plus, Trash2, Sun, Calendar, Plane,
  ChevronRight, ChevronLeft, Coffee, Camera, MapPin, ShoppingBag,
  Train, Gift, X, Clock, Tag, PenLine, Briefcase, Zap, Pill, Shirt,
  Palmtree, AlignJustify, Pencil, Save, Settings, ArrowLeft,
  Link, FileJson, RefreshCw, AlertCircle, Database, Globe, FileText, ExternalLink, CloudUpload, Check, AlertTriangle, LogOut, User, Lock, Mail, Info, Shield, List, PlusCircle
} from 'lucide-react';

// Firebase SDK Imports
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, setDoc, addDoc, onSnapshot, updateDoc, deleteDoc, query, orderBy 
} from 'firebase/firestore';
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged 
} from 'firebase/auth';

// ==========================================
// 🔧 核心設定區 (Firebase Config)
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyD-1nxGONhQgGc-F05-BgIj6HEGSfLazsc",
  authDomain: "mytravelapp-3264f.firebaseapp.com",
  projectId: "mytravelapp-3264f",
  storageBucket: "mytravelapp-3264f.firebasestorage.app",
  messagingSenderId: "345155187926",
  appId: "1:345155187926:web:b7a85c803994e361868577",
  measurementId: "G-BW02YF1F1S"
};

// ==========================================
// 🛠️ Firebase 初始化
// ==========================================
let app, auth, db;
try {
  if (firebaseConfig.apiKey) {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (e) {
  console.error("Firebase init error:", e);
}

// --- Liquid Glass Style Constants ---
const glassCardStyle = "bg-white/40 backdrop-blur-3xl border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] bg-gradient-to-br from-white/40 to-white/10 relative overflow-hidden";
const glassShine = "after:content-[''] after:absolute after:top-0 after:-left-full after:w-full after:h-full after:bg-gradient-to-r after:from-transparent after:via-white/40 after:to-transparent after:transform after:skew-x-12 after:transition-all after:duration-1000 group-hover:after:left-full";

// 預設空白行程結構
const DEFAULT_EMPTY_TRIP = {
    destination: '新行程',
    date: '----/--/--',
    endDate: '----/--/--',
    themeColor: 'from-blue-400 to-indigo-600',
    flights: [], days: [], packingList: [], shoppingList: []
};

// ==========================================
// 🧩 獨立元件區 (COMPONENTS)
// ==========================================

const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
  const bgColor = type === 'error' ? 'bg-red-500/95' : 'bg-gray-800/90';
  const icon = type === 'error' ? <AlertCircle size={18} /> : <Check size={18} />;
  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl text-white shadow-2xl backdrop-blur-md animate-fade-in-down ${bgColor} min-w-[300px] justify-center`}>
      <div className="shrink-0">{icon}</div><span className="font-bold text-sm leading-snug">{message}</span>
    </div>
  );
};

const ConfirmModal = ({ title, message, onConfirm, onCancel }) => (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 animate-fade-in">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel}></div>
        <div className={`relative ${glassCardStyle} rounded-[2rem] p-6 w-full max-w-xs transform transition-all scale-100 text-center`}>
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-500"><AlertTriangle size={24} /></div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
            <p className="text-sm text-gray-500 mb-6">{message}</p>
            <div className="flex gap-3">
                <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-white/50 font-bold text-gray-600 hover:bg-white/80 transition-all">取消</button>
                <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-red-500 font-bold text-white shadow-lg shadow-red-500/30 hover:bg-red-600 transition-all">刪除</button>
            </div>
        </div>
    </div>
);

const Header = ({ title, subtitle, showBack, leftAction, rightAction }) => (
    <div className="sticky top-0 z-40 pt-14 pb-4 px-6 transition-all duration-500">
      <div className="absolute inset-0 bg-white/10 backdrop-blur-md border-b border-white/20 shadow-sm z-[-1]"></div>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          {leftAction}
          <div className="drop-shadow-sm"><h1 className="text-3xl font-[900] tracking-tight text-gray-800">{title}</h1>{subtitle && <p className="text-gray-600 font-bold text-sm mt-0.5 tracking-wide opacity-80 truncate max-w-[200px]">{subtitle}</p>}</div>
        </div>
        {rightAction}
      </div>
    </div>
);

// 行程切換/管理列表
const TripListModal = ({ trips, activeTripId, onSelectTrip, onDeleteTrip, onOpenImport, onClose, userEmail, onLogout }) => {
    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 animate-fade-in">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose}></div>
            <div className={`relative ${glassCardStyle} rounded-[2.5rem] p-6 w-full max-w-sm max-h-[85vh] flex flex-col transform transition-all scale-100`}>
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-80"></div>
                <div className="flex justify-between items-center mb-6 relative z-10">
                    <h2 className="text-2xl font-[800] text-gray-800 tracking-tight drop-shadow-sm">我的行程</h2>
                    <button onClick={onClose} className="p-2 bg-white/30 rounded-full hover:bg-white/50 transition active:scale-90 border border-white/40"><X size={20} className="text-gray-700"/></button>
                </div>
                
                {/* User Info Section */}
                <div className="mb-4 p-3 bg-white/40 rounded-2xl border border-white/50 flex justify-between items-center relative z-10">
                    <div className="overflow-hidden">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">目前登入</div>
                        <div className="text-sm font-bold text-gray-800 truncate max-w-[180px]">{userEmail}</div>
                    </div>
                    <button onClick={onLogout} className="px-3 py-1.5 bg-red-100 text-red-600 text-xs font-bold rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1 shrink-0"><LogOut size={12} /> 登出</button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-hide relative z-10 mb-4">
                    {trips.length === 0 && (
                        <div className="text-center py-10 text-gray-500 text-sm">尚無行程，請點擊下方匯入</div>
                    )}
                    {trips.map(trip => (
                        <div key={trip.id} onClick={() => onSelectTrip(trip.id)} className={`group p-4 rounded-[2rem] border cursor-pointer relative overflow-hidden transition-all duration-300 flex justify-between items-center ${activeTripId === trip.id ? 'bg-white/80 border-blue-400 ring-2 ring-blue-400/30 shadow-lg' : 'bg-white/40 border-white/40 hover:bg-white/60'}`}>
                            <div className="overflow-hidden mr-2">
                                <h3 className="font-bold text-gray-800 text-lg leading-tight truncate">{trip.destination || '未命名行程'}</h3>
                                <div className="flex items-center text-xs text-gray-500 mt-1 font-medium">
                                    <Calendar size={12} className="mr-1" />
                                    {trip.date || '--/--'}
                                </div>
                            </div>
                            {/* 刪除按鈕 */}
                            <button 
                                onClick={(e) => { 
                                    e.stopPropagation(); // 阻止冒泡，避免觸發選擇行程
                                    onDeleteTrip(trip.id); 
                                }} 
                                className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-100/50 rounded-full transition-all z-20"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-auto relative z-10">
                     <button onClick={onOpenImport} className="w-full py-3.5 rounded-2xl font-bold text-white shadow-lg flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/30 hover:shadow-blue-500/50 active:scale-95 transition-all"><PlusCircle size={20} /> 匯入/新增行程</button>
                </div>
            </div>
        </div>
    );
};

const AuthScreen = ({ onLogin, onRegister, isLoading }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = () => {
        if (!email || !password) return;
        if (isRegistering) {
            onRegister(email, password);
        } else {
            onLogin(email, password);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-[#E0E5EC]">
             <div className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] bg-blue-300/40 rounded-full blur-[100px] animate-blob mix-blend-multiply"></div>
             <div className="absolute bottom-[-10%] right-[-10%] w-[70vw] h-[70vw] bg-pink-300/40 rounded-full blur-[100px] animate-blob animation-delay-2000 mix-blend-multiply"></div>
             
             <div className={`relative ${glassCardStyle} rounded-[2.5rem] p-8 w-full max-w-sm flex flex-col items-center shadow-2xl`}>
                <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-lg mb-6 transform rotate-3">
                    <User size={40} />
                </div>
                <h1 className="text-3xl font-[900] text-gray-800 mb-2 tracking-tight">隨身旅伴</h1>
                <p className="text-gray-500 text-sm mb-8 font-medium">{isRegistering ? '註冊帳號以保存您的行程' : '請登入以同步您的資料'}</p>
                
                <div className="w-full space-y-4 mb-6">
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Mail size={18} /></div>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="電子信箱" className="w-full bg-white/60 border border-white/50 rounded-2xl py-3.5 pl-11 pr-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-bold" />
                    </div>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={18} /></div>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="密碼 (至少 6 位數)" className="w-full bg-white/60 border border-white/50 rounded-2xl py-3.5 pl-11 pr-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-bold" />
                    </div>
                </div>

                <button onClick={handleSubmit} disabled={isLoading || !email || !password} className={`w-full py-4 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${!email || !password ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/40'}`}>
                    {isLoading ? <RefreshCw className="animate-spin" /> : (isRegistering ? '註冊並登入' : '登入')}
                </button>
                
                <button onClick={() => setIsRegistering(!isRegistering)} className="mt-6 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">
                    {isRegistering ? '已有帳號？點此登入' : '沒有帳號？建立新帳號'}
                </button>
             </div>
        </div>
    );
};

const ImportModal = ({ onClose, onImport, isLoading }) => {
    const [importType, setImportType] = useState('json');
    const [inputValue, setInputValue] = useState('');
    const handleImport = () => { onImport(inputValue, importType); };
    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 animate-fade-in">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose}></div>
            <div className={`relative ${glassCardStyle} rounded-[2.5rem] p-6 w-full max-w-sm flex flex-col transform transition-all scale-100`}>
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-80"></div>
                <div className="flex justify-between items-center mb-6 relative z-10">
                    <h2 className="text-2xl font-[800] text-gray-800 tracking-tight drop-shadow-sm">匯入行程</h2>
                    <button onClick={onClose} className="p-2 bg-white/30 rounded-full hover:bg-white/50 transition active:scale-90 border border-white/40"><X size={20} className="text-gray-700"/></button>
                </div>
                <div className="flex bg-white/30 p-1 rounded-xl mb-4 relative z-10"><button onClick={() => setImportType('json')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${importType === 'json' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:bg-white/20'}`}>貼上 JSON</button><button onClick={() => setImportType('url')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${importType === 'url' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:bg-white/20'}`}>輸入網址</button></div>
                <div className="space-y-4 relative z-10">
                    <div className="p-4 rounded-2xl bg-white/40 border border-white/50 shadow-inner">
                        {importType === 'json' ? <textarea value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder='請貼上 AI 生成的 JSON 內容...' className="w-full h-32 bg-white/80 border border-blue-200/50 rounded-xl py-3 px-4 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm resize-none" /> : <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="https://..." className="w-full bg-white/80 border border-blue-200/50 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm" />}
                        <p className="text-[10px] text-gray-500 mt-2 ml-1">匯入後將新增一個行程到您的列表。</p>
                    </div>
                    <button onClick={handleImport} disabled={!inputValue.trim() || isLoading} className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${!inputValue.trim() || isLoading ? 'bg-gray-400/50 cursor-not-allowed text-white/50' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/30 active:scale-95'}`}>{isLoading ? <><RefreshCw className="animate-spin" size={16} /> 處理中...</> : <><CloudUpload size={16} /> 確認加入</>}</button>
                </div>
            </div>
        </div>
    );
};

const FlightModal = ({ flights, onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in">
    <div className="absolute inset-0 bg-black/30 backdrop-blur-md" onClick={onClose}></div>
    <div className={`relative ${glassCardStyle} rounded-[2.5rem] p-6 w-full max-w-sm transform transition-all scale-100`}>
      <div className="flex justify-between items-center mb-6 relative z-10"><h2 className="text-2xl font-[800] text-gray-800 tracking-tight drop-shadow-sm">航班資訊</h2><button onClick={onClose} className="p-2 bg-white/30 rounded-full hover:bg-white/50 transition active:scale-90 border border-white/40"><X size={20} className="text-gray-700"/></button></div>
      {flights && flights.length > 0 ? (
          <div className="space-y-4">{flights.map((flight, idx) => (<div key={idx} className={`p-5 rounded-[1.5rem] border border-white/40 relative overflow-hidden backdrop-blur-md shadow-inner ${flight.color === 'indigo' ? 'bg-gradient-to-r from-purple-500/10 to-indigo-500/10' : 'bg-gradient-to-r from-orange-500/10 to-pink-500/10'}`}><div className="absolute -top-10 -right-10 p-3 opacity-20 rotate-12"><Plane size={100} className={flight.color === 'indigo' ? 'text-indigo-600' : 'text-pink-600'} /></div><div className="flex items-center gap-2 mb-4 relative z-10"><span className={`backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg border border-white/20 ${flight.color === 'indigo' ? 'bg-indigo-500/80' : 'bg-pink-500/80'}`}>{flight.type}</span><span className="font-bold text-gray-800 tracking-wide text-sm drop-shadow-sm">{flight.code}</span></div><div className="flex justify-between items-end relative z-10 text-gray-800"><div><p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{flight.fromCity}</p><p className="text-3xl font-black leading-none drop-shadow-sm">{flight.fromCode}</p><p className="text-sm font-bold mt-1 opacity-80">{flight.fromTime}</p></div><div className="flex flex-col items-center px-2 flex-1 pb-1 opacity-70"><span className="text-[10px] font-medium mb-1">{flight.duration}</span><div className="w-full h-0.5 bg-gray-400/50 relative flex items-center justify-center rounded-full"><Plane size={14} className={`absolute ${flight.color === 'indigo' ? 'text-indigo-600 rotate-90' : 'text-pink-600 -rotate-90'}`} fill="currentColor" /></div></div><div className="text-right"><p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{flight.toCity}</p><p className="text-3xl font-black leading-none drop-shadow-sm">{flight.toCode}</p><p className="text-sm font-bold mt-1 opacity-80">{flight.toTime}{flight.nextDay && <span className="text-[10px] align-top ml-0.5">+1</span>}</p></div></div></div>))}</div>
      ) : (<div className="p-6 bg-white/40 rounded-2xl text-center border border-white/40 shadow-inner"><p className="text-gray-600 font-bold mb-2">尚未安排航班</p><p className="text-xs text-gray-500">請在行程設定中新增航班資訊</p></div>)}
    </div>
  </div>
);

const AddShoppingModal = ({ onClose, onAdd }) => {
  const [name, setName] = useState(''); const [category, setCategory] = useState(''); const [note, setNote] = useState('');
  const handleSubmit = () => { if (!name.trim()) return; onAdd(name, category, note); };
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 animate-fade-in"><div className="absolute inset-0 bg-black/30 backdrop-blur-md" onClick={onClose}></div><div className={`relative ${glassCardStyle} rounded-[2.5rem] p-6 w-full max-w-sm transform transition-all scale-100`}><div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-80"></div><div className="flex justify-between items-center mb-6 relative z-10"><h2 className="text-2xl font-[800] text-gray-800 tracking-tight drop-shadow-sm">新增商品</h2><button onClick={onClose} className="p-2 bg-white/30 rounded-full hover:bg-white/50 transition active:scale-90 border border-white/40"><X size={20} className="text-gray-700"/></button></div><div className="space-y-4 relative z-10"><div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">商品名稱</label><div className="relative"><div className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500"><ShoppingBag size={18} /></div><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：東京香蕉" className="w-full bg-white/40 border border-white/50 rounded-2xl py-3 pl-11 pr-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:bg-white/60 backdrop-blur-sm transition-all shadow-inner font-bold" autoFocus /></div></div><div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">分類 (選填)</label><div className="relative"><div className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400"><Tag size={18} /></div><input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="例如：伴手禮" className="w-full bg-white/40 border border-white/50 rounded-2xl py-3 pl-11 pr-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:bg-white/60 backdrop-blur-sm transition-all shadow-inner" /></div></div><div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">備註 (選填)</label><div className="relative"><div className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400"><PenLine size={18} /></div><input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="例如：要買三盒" className="w-full bg-white/40 border border-white/50 rounded-2xl py-3 pl-11 pr-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:bg-white/60 backdrop-blur-sm transition-all shadow-inner" /></div></div><button onClick={handleSubmit} disabled={!name.trim()} className={`w-full py-4 rounded-2xl font-black text-white shadow-lg transition-all active:scale-95 mt-4 flex items-center justify-center gap-2 ${name.trim() ? 'bg-gradient-to-r from-pink-500 to-rose-600 shadow-pink-500/30 hover:shadow-pink-500/50' : 'bg-gray-400/50 cursor-not-allowed'}`}><Plus size={20} strokeWidth={3} />加入清單</button></div></div></div>
  );
};

const AddPackingModal = ({ onClose, onAdd }) => {
  const [name, setName] = useState(''); const [category, setCategory] = useState('');
  const handleAddPackingItem = () => { if (!name.trim()) return; onAdd(name, category); };
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 animate-fade-in"><div className="absolute inset-0 bg-black/30 backdrop-blur-md" onClick={onClose}></div><div className={`relative ${glassCardStyle} rounded-[2.5rem] p-6 w-full max-w-sm transform transition-all scale-100`}><div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-80"></div><div className="flex justify-between items-center mb-6 relative z-10"><h2 className="text-2xl font-[800] text-gray-800 tracking-tight drop-shadow-sm">新增行李</h2><button onClick={onClose} className="p-2 bg-white/30 rounded-full hover:bg-white/50 transition active:scale-90 border border-white/40"><X size={20} className="text-gray-700"/></button></div><div className="space-y-4 relative z-10"><div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">物品名稱</label><div className="relative"><div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500"><CheckSquare size={18} /></div><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：太陽眼鏡" className="w-full bg-white/40 border border-white/50 rounded-2xl py-3 pl-11 pr-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:bg-white/60 backdrop-blur-sm transition-all shadow-inner font-bold" autoFocus /></div></div><div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">快速分類</label><div className="flex gap-2 flex-wrap">{['衣物', '電子', '藥品', '重要', '生活'].map(cat => (<button key={cat} onClick={() => setCategory(cat)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${category === cat ? 'bg-blue-500 text-white border-blue-500 shadow-md scale-105' : 'bg-white/30 text-gray-600 border-white/40 hover:bg-white/50'}`}>{cat}</button>))}</div></div><div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">自訂分類</label><div className="relative"><div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400"><Tag size={18} /></div><input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="或手動輸入分類" className="w-full bg-white/40 border border-white/50 rounded-2xl py-3 pl-11 pr-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:bg-white/60 backdrop-blur-sm transition-all shadow-inner" /></div></div><button onClick={handleAddPackingItem} disabled={!name.trim()} className={`w-full py-4 rounded-2xl font-black text-white shadow-lg transition-all active:scale-95 mt-4 flex items-center justify-center gap-2 ${name.trim() ? 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-blue-500/30 hover:shadow-blue-500/50' : 'bg-gray-400/50 cursor-not-allowed'}`}><Plus size={20} strokeWidth={3} />加入行李</button></div></div></div>
  );
};

const EditItemModal = ({ editingState, onClose, onSave }) => {
  const { type, data } = editingState;
  const [itemData, setItemData] = useState(data);
  const isShopping = type === 'shopping';
  const accentColor = isShopping ? 'pink' : 'blue';
  const gradient = isShopping ? 'bg-gradient-to-r from-pink-500 to-rose-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600';
  const iconColor = isShopping ? 'text-pink-500' : 'text-blue-500';
  const handleSave = () => { onSave(itemData); };

  return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 animate-fade-in"><div className="absolute inset-0 bg-black/30 backdrop-blur-md" onClick={onClose}></div><div className={`relative ${glassCardStyle} rounded-[2.5rem] p-6 w-full max-w-sm transform transition-all scale-100`}><div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-80"></div><div className="flex justify-between items-center mb-6 relative z-10"><h2 className="text-2xl font-[800] text-gray-800 tracking-tight drop-shadow-sm">編輯項目</h2><button onClick={onClose} className="p-2 bg-white/30 rounded-full hover:bg-white/50 transition active:scale-90 border border-white/40"><X size={20} className="text-gray-700"/></button></div><div className="space-y-4 relative z-10"><div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">名稱</label><div className="relative"><div className={`absolute left-4 top-1/2 -translate-y-1/2 ${iconColor}`}>{isShopping ? <ShoppingBag size={18} /> : <CheckSquare size={18} />}</div><input type="text" value={itemData.item} onChange={(e) => setItemData({ ...itemData, item: e.target.value })} className={`w-full bg-white/40 border border-white/50 rounded-2xl py-3 pl-11 pr-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-${accentColor}-400/50 focus:bg-white/60 backdrop-blur-sm transition-all shadow-inner font-bold`} autoFocus /></div></div><div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">分類</label><div className="relative"><div className={`absolute left-4 top-1/2 -translate-y-1/2 ${iconColor}`}><Tag size={18} /></div><input type="text" value={itemData.category || ''} onChange={(e) => setItemData({ ...itemData, category: e.target.value })} placeholder="未分類" className={`w-full bg-white/40 border border-white/50 rounded-2xl py-3 pl-11 pr-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-${accentColor}-400/50 focus:bg-white/60 backdrop-blur-sm transition-all shadow-inner`} /></div></div>{isShopping && (<div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">備註</label><div className="relative"><div className={`absolute left-4 top-1/2 -translate-y-1/2 ${iconColor}`}><PenLine size={18} /></div><input type="text" value={itemData.note || ''} onChange={(e) => setItemData({ ...itemData, note: e.target.value })} placeholder="備註事項" className={`w-full bg-white/40 border border-white/50 rounded-2xl py-3 pl-11 pr-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-${accentColor}-400/50 focus:bg-white/60 backdrop-blur-sm transition-all shadow-inner`} /></div></div>)}<button onClick={handleSave} disabled={!itemData.item.trim()} className={`w-full py-4 rounded-2xl font-black text-white shadow-lg transition-all active:scale-95 mt-4 flex items-center justify-center gap-2 ${itemData.item.trim() ? `${gradient} shadow-${accentColor}-500/30 hover:shadow-${accentColor}-500/50` : 'bg-gray-400/50 cursor-not-allowed'}`}><CheckSquare size={20} strokeWidth={3} />儲存修改</button></div></div></div>
  );
};

const HomeView = ({ trips, currentTrip, calculateDaysLeft, setActiveTab, setShowFlightModal, toggleShoppingItem, deleteShoppingItem, togglePackingItem, deletePackingItem, openEditModal, setShowTripListModal }) => (
    <div className="pb-32 animate-fade-in">
      <Header 
        title="隨身旅伴" 
        subtitle="Ready for next trip?" 
        showBack={false} 
        leftAction={<button onClick={() => setShowTripListModal(true)} className="p-2 -ml-2 rounded-full bg-white/20 hover:bg-white/40 border border-white/20 transition-all active:scale-90 backdrop-blur-md text-gray-700"><List size={24} strokeWidth={2.5} /></button>}
        setActiveTab={setActiveTab}
      />
      
      <div className="px-6 mt-6">
        {(!currentTrip || !currentTrip.date || currentTrip.date === '----/--/--') ? (
            <div className={`p-8 rounded-[2.5rem] text-center border border-white/40 bg-white/20 backdrop-blur-md shadow-lg`}>
                <p className="text-gray-600 font-bold text-lg mb-2">👋 歡迎使用</p>
                <p className="text-sm text-gray-500">您目前沒有選擇任何行程。<br/>請點擊左上角選單 → 匯入或選擇行程。</p>
            </div>
        ) : (
            <div onClick={() => setActiveTab('itinerary')} className={`group ${glassCardStyle} rounded-[2.5rem] p-1 mb-8 cursor-pointer hover:scale-[1.02] transition-all duration-500 ${glassShine} relative`}>
                <div className="relative h-64 rounded-[2rem] overflow-hidden shadow-inner">
                    <div className={`absolute inset-0 bg-gradient-to-br ${currentTrip.themeColor || 'from-gray-400 to-gray-600'} opacity-90`}></div>
                    <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-b from-transparent via-white/20 to-transparent rotate-45 animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white bg-gradient-to-t from-black/50 via-black/20 to-transparent backdrop-blur-[2px]">
                    <div className="flex justify-between items-end">
                        <div>
                        <p className="text-blue-100/80 text-xs font-black tracking-[0.2em] uppercase mb-2 shadow-black drop-shadow-md">Current Trip</p>
                        <h3 className="text-4xl font-black leading-none tracking-tight drop-shadow-lg">{currentTrip.destination || "未命名行程"}</h3>
                        <div className="flex items-center text-sm font-bold mt-4 bg-white/20 backdrop-blur-md w-fit px-4 py-1.5 rounded-full border border-white/30 shadow-lg"><Calendar size={14} className="mr-2" />{currentTrip.date || "--/--"}</div>
                        </div>
                    </div>
                    </div>
                </div>
                <div className="p-6 flex justify-between items-center relative z-10">
                    <div className="flex flex-col">
                        <span className="text-gray-500 text-xs font-black uppercase tracking-wider opacity-70">Countdown</span>
                        <div className="flex items-baseline">
                            <span className="text-5xl font-[900] text-gray-800 tracking-tighter drop-shadow-sm">{calculateDaysLeft(currentTrip.date)}</span>
                            <span className="text-gray-500 font-bold ml-1">days</span>
                        </div>
                    </div>
                    <div className="w-14 h-14 rounded-full bg-gray-900/90 text-white flex items-center justify-center shadow-2xl group-hover:rotate-45 transition-transform duration-500 border border-white/20 backdrop-blur-md"><ChevronRight size={28} /></div>
                </div>
            </div>
        )}

        <div className="grid grid-cols-2 gap-5 mt-5">
          <div onClick={() => setActiveTab('shopping')} className={`${glassCardStyle} ${glassShine} p-6 rounded-[2rem] cursor-pointer active:scale-95 transition-all hover:shadow-[0_20px_40px_-12px_rgba(236,72,153,0.3)]`}>
              <div className="bg-pink-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-pink-500 shadow-inner border border-white/50"><ShoppingBag size={28} /></div>
              <h3 className="font-bold text-gray-800 text-lg">購物清單</h3>
              <p className="text-sm text-gray-500 mt-1 font-bold opacity-70">{currentTrip && currentTrip.shoppingList ? currentTrip.shoppingList.filter(i => !i.checked).length : 0} 待買</p>
          </div>
          <div onClick={() => setActiveTab('packing')} className={`${glassCardStyle} ${glassShine} p-6 rounded-[2rem] cursor-pointer active:scale-95 transition-all hover:shadow-[0_20px_40px_-12px_rgba(59,130,246,0.3)]`}>
              <div className="bg-blue-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-blue-500 shadow-inner border border-white/50"><CheckSquare size={28} /></div>
              <h3 className="font-bold text-gray-800 text-lg">行李清單</h3>
              <p className="text-sm text-gray-500 mt-1 font-bold opacity-70">{currentTrip && currentTrip.packingList ? currentTrip.packingList.filter(i => !i.checked).length : 0} 未帶</p>
          </div>
        </div>
      </div>
    </div>
);

const ItineraryView = ({ currentTrip, setActiveTab, setShowFlightModal, getCurrentActivityId, activityRefs }) => {
    const currentActivityId = currentTrip && currentTrip.days && currentTrip.days.length > 0 ? getCurrentActivityId(currentTrip) : null;

    return (
        <div className="pb-32 animate-fade-in">
        <Header 
            title="行程安排" 
            subtitle={currentTrip ? currentTrip.destination : ""} 
            showBack={true} 
            rightAction={
                <button onClick={() => setShowFlightModal(true)} className="bg-white/30 backdrop-blur-xl p-3 rounded-full shadow-[0_4px_16px_0_rgba(0,0,0,0.1)] border border-white/50 active:scale-90 transition-all hover:bg-white/50"><Plane size={20} className="text-blue-700" fill="currentColor" fillOpacity={0.2} /></button>
            }
            setActiveTab={setActiveTab}
        />
        
        <div className="px-6 mt-4 space-y-10">
            {(!currentTrip || !currentTrip.days || currentTrip.days.length === 0) && (
                <div className="text-center py-20 text-gray-400">目前沒有行程資料</div>
            )}
            {currentTrip && currentTrip.days && currentTrip.days.map((day, index) => (
            <div key={index} className="relative pl-4">
                {index !== currentTrip.days.length - 1 && (
                <div className="absolute left-[27px] top-12 bottom-[-40px] w-[3px] bg-gradient-to-b from-white/80 via-white/40 to-transparent rounded-full z-0"></div>
                )}
                
                <div className="flex items-center mb-6 sticky top-28 z-20 py-3 pl-2 -ml-2 bg-inherit backdrop-blur-sm rounded-r-2xl w-fit pr-6">
                <div className="bg-gray-800/90 backdrop-blur-xl text-white w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-lg mr-4 shrink-0 border border-white/20">
                    <span className="text-[10px] font-bold text-gray-400">DAY</span>
                    <span className="text-xl font-black leading-none">{day.day}</span>
                </div>
                <div>
                    <h3 className="font-[900] text-gray-800 text-xl tracking-tight drop-shadow-sm">{day.title}</h3>
                </div>
                </div>

                <div className="space-y-4 pl-4 z-10 relative">
                {day.activities.map((activity, idx) => {
                    const isCurrent = currentActivityId === activity.id;
                    return (
                        <div 
                            key={idx} 
                            ref={(el) => (activityRefs.current[activity.id] = el)}
                            className={`group relative p-5 rounded-[2rem] transition-all duration-300 border backdrop-blur-md shadow-sm ${
                                isCurrent 
                                ? 'bg-white/60 border-blue-200/50 ring-4 ring-blue-400/10 scale-[1.03] shadow-xl' 
                                : 'bg-white/30 border-white/40 hover:bg-white/50'
                            }`}
                        >
                        <div className={`absolute -left-[39px] top-6 w-4 h-4 rounded-full border-[3px] border-white/80 shadow-md z-20 transition-all duration-500 ${
                            isCurrent ? 'scale-150 ring-4 ring-blue-500/30' : 'scale-100'
                        } ${
                            activity.type === 'transport' ? 'bg-purple-400' :
                            activity.type === 'food' ? 'bg-orange-400' : 
                            activity.type === 'shopping' ? 'bg-pink-400' :
                            activity.type === 'relax' ? 'bg-green-400' : 'bg-blue-400'
                        }`}>
                            {isCurrent && <span className="absolute inset-0 rounded-full bg-inherit animate-ping opacity-75"></span>}
                        </div>
                        
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide shadow-sm border bg-white/60 text-gray-600 border-white/40">
                                    {activity.time}
                                </span>
                                {isCurrent && (
                                    <span className="flex items-center gap-1 text-[10px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full animate-pulse shadow-lg shadow-rose-500/30">
                                        NOW
                                    </span>
                                )}
                            </div>
                            
                            <div className="p-1.5 bg-white/40 rounded-full backdrop-blur-sm border border-white/30">
                                {activity.type === 'sightseeing' && <Camera size={14} className="text-gray-500" />}
                                {activity.type === 'food' && <Coffee size={14} className="text-gray-500" />}
                                {activity.type === 'transport' && <Train size={14} className="text-gray-500" />}
                                {activity.type === 'shopping' && <ShoppingBag size={14} className="text-gray-500" />}
                                {activity.type === 'relax' && <Sun size={14} className="text-gray-500" />}
                            </div>
                        </div>
                        <h4 className="font-bold text-gray-800 text-lg leading-snug tracking-tight">{activity.title}</h4>
                        </div>
                    );
                })}
                </div>
            </div>
            ))}
        </div>
        </div>
    );
};

const ShoppingView = ({ currentTrip, setActiveTab, setShowAddShoppingModal, toggleShoppingItem, deleteShoppingItem, openEditModal }) => (
    <div className="pb-32 animate-fade-in min-h-screen">
      <Header title="購物清單" subtitle={currentTrip ? currentTrip.destination : ""} showBack={true} setActiveTab={setActiveTab} />
      <div className="px-6 mt-4">
        <div className={`${glassCardStyle} rounded-[2.5rem] p-6 mb-8`}>
            <div className="flex justify-between items-end mb-4">
                <div><span className="text-pink-500 font-black tracking-wider text-xs uppercase drop-shadow-sm">Progress</span><div className="text-4xl font-[900] text-gray-800 drop-shadow-sm">{currentTrip && currentTrip.shoppingList ? Math.round((currentTrip.shoppingList.filter(i => i.checked).length / (currentTrip.shoppingList.length || 1)) * 100) : 0}%</div></div>
                <button onClick={() => setShowAddShoppingModal(true)} className="bg-gradient-to-br from-pink-500 to-rose-600 text-white p-4 rounded-2xl shadow-lg shadow-pink-500/30 transition-all active:scale-90 border border-white/20 hover:shadow-pink-500/50"><Plus size={24} strokeWidth={3} /></button>
            </div>
            <div className="w-full bg-black/5 rounded-full h-4 overflow-hidden shadow-inner border border-white/20 backdrop-blur-sm">
                <div className="bg-gradient-to-r from-pink-400 to-rose-600 h-4 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(236,72,153,0.5)]" style={{ width: `${currentTrip && currentTrip.shoppingList ? (currentTrip.shoppingList.filter(i => i.checked).length / (currentTrip.shoppingList.length || 1)) * 100 : 0}%` }}></div>
            </div>
        </div>
        <div className="space-y-4">
          {currentTrip && currentTrip.shoppingList && currentTrip.shoppingList.map(item => (
            <div key={item.id} onClick={() => toggleShoppingItem(item.id)} className={`group flex items-center p-4 rounded-[2rem] border transition-all duration-300 active:scale-[0.98] cursor-pointer backdrop-blur-md shadow-sm ${item.checked ? 'bg-gray-50/30 border-transparent opacity-50 grayscale' : 'bg-white/40 border-white/50 hover:bg-white/60 hover:shadow-lg'}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center mr-4 transition-all duration-300 shadow-sm border border-white/40 ${item.checked ? 'bg-pink-500 text-white scale-100' : 'bg-white/50 text-transparent scale-90 group-hover:scale-100 group-hover:bg-pink-100 group-hover:text-pink-400'}`}><CheckSquare size={18} strokeWidth={3} /></div>
              <div className="flex-1"><span className={`font-bold text-lg transition-all tracking-tight ${item.checked ? 'text-gray-500 line-through decoration-2 decoration-pink-300' : 'text-gray-800'}`}>{item.item}</span><div className="flex flex-wrap gap-2 mt-1.5">{item.category && <span className="text-[10px] font-bold text-pink-600 bg-pink-100/80 px-2 py-0.5 rounded-md border border-pink-200/50">{item.category}</span>}{item.note && <span className="text-xs font-medium text-gray-500 bg-white/40 px-2 py-0.5 rounded-md">{item.note}</span>}</div></div>
              <div className="flex gap-1"><button onClick={(e) => { e.stopPropagation(); openEditModal('shopping', item); }} className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-blue-500 hover:bg-white/50 transition-all active:scale-90"><Pencil size={18} /></button><button onClick={(e) => { e.stopPropagation(); deleteShoppingItem(item.id); }} className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-white/50 transition-all active:scale-90"><Trash2 size={18} /></button></div>
            </div>
          ))}
        </div>
      </div>
    </div>
);

const PackingView = ({ currentTrip, setActiveTab, setShowAddPackingModal, togglePackingItem, deletePackingItem, openEditModal }) => (
    <div className="pb-32 animate-fade-in min-h-screen">
      <Header title="行李清單" subtitle={currentTrip ? currentTrip.destination : ""} showBack={true} setActiveTab={setActiveTab} />
      <div className="px-6 mt-4">
         <div className={`${glassCardStyle} rounded-[2.5rem] p-6 mb-8`}>
            <div className="flex justify-between items-end mb-4">
                <div><span className="text-blue-500 font-black tracking-wider text-xs uppercase drop-shadow-sm">Progress</span><div className="text-4xl font-[900] text-gray-800 drop-shadow-sm">{Math.round((currentTrip && currentTrip.packingList && currentTrip.packingList.length > 0) ? (currentTrip.packingList.filter(i => i.checked).length / (currentTrip.packingList.length)) * 100 : 0)}%</div></div>
                <button onClick={() => setShowAddPackingModal(true)} className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-4 rounded-2xl shadow-lg shadow-blue-500/30 transition-all active:scale-90 border border-white/20 hover:shadow-blue-500/50"><Plus size={24} strokeWidth={3} /></button>
            </div>
            <div className="w-full bg-black/5 rounded-full h-4 overflow-hidden shadow-inner border border-white/20 backdrop-blur-sm">
                <div className="bg-gradient-to-r from-blue-400 to-indigo-600 h-4 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${(currentTrip && currentTrip.packingList && currentTrip.packingList.length > 0) ? (currentTrip.packingList.filter(i => i.checked).length / (currentTrip.packingList.length)) * 100 : 0}%` }}></div>
            </div>
        </div>
        <div className="space-y-4">
          {currentTrip && currentTrip.packingList && currentTrip.packingList.map(item => (
            <div key={item.id} onClick={() => togglePackingItem(item.id)} className={`group flex items-center p-4 rounded-[2rem] border transition-all duration-300 active:scale-[0.98] cursor-pointer backdrop-blur-md shadow-sm ${item.checked ? 'bg-gray-50/30 border-transparent opacity-50 grayscale' : 'bg-white/40 border-white/50 hover:bg-white/60 hover:shadow-lg'}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center mr-4 transition-all duration-300 shadow-sm border border-white/40 ${item.checked ? 'bg-blue-500 text-white scale-100' : 'bg-white/50 text-transparent scale-90 group-hover:scale-100 group-hover:bg-blue-100 group-hover:text-blue-400'}`}><CheckSquare size={18} strokeWidth={3} /></div>
              <div className="flex-1"><span className={`font-bold text-lg transition-all tracking-tight ${item.checked ? 'text-gray-500 line-through decoration-2 decoration-blue-300' : 'text-gray-800'}`}>{item.item}</span><span className="block text-xs font-medium text-gray-500 mt-1 bg-white/40 w-fit px-2 py-0.5 rounded-md">{item.category}</span></div>
              <div className="flex gap-1">
                <button onClick={(e) => { e.stopPropagation(); openEditModal('packing', item); }} className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-blue-500 hover:bg-white/50 transition-all active:scale-90"><Pencil size={18} /></button>
                <button onClick={(e) => { e.stopPropagation(); deletePackingItem(item.id); }} className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-white/50 transition-all active:scale-90"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
);

const TabBar = ({ activeTab, setActiveTab }) => (
    <div className="fixed bottom-8 left-0 right-0 z-50 flex justify-center pb-safe pointer-events-none">
      <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-[2.5rem] px-2 py-2 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] flex items-center gap-2 pointer-events-auto transition-transform hover:scale-105 ring-1 ring-white/40">
        <button onClick={() => setActiveTab('home')} className={`p-4 rounded-full transition-all duration-300 ${activeTab === 'home' ? 'bg-white text-blue-600 shadow-lg scale-110' : 'text-white hover:bg-white/10'}`}><Home size={24} strokeWidth={activeTab === 'home' ? 3 : 2} /></button>
        <button onClick={() => setActiveTab('itinerary')} className={`p-4 rounded-full transition-all duration-300 ${activeTab === 'itinerary' ? 'bg-white text-blue-600 shadow-lg scale-110' : 'text-white hover:bg-white/10'}`}><Map size={24} strokeWidth={activeTab === 'itinerary' ? 3 : 2} /></button>
        <button onClick={() => setActiveTab('shopping')} className={`p-4 rounded-full transition-all duration-300 ${activeTab === 'shopping' ? 'bg-white text-blue-600 shadow-lg scale-110' : 'text-white hover:bg-white/10'}`}><ShoppingBag size={24} strokeWidth={activeTab === 'shopping' ? 3 : 2} /></button>
        <button onClick={() => setActiveTab('packing')} className={`p-4 rounded-full transition-all duration-300 ${activeTab === 'packing' ? 'bg-white text-blue-600 shadow-lg scale-110' : 'text-white hover:bg-white/10'}`}><CheckSquare size={24} strokeWidth={activeTab === 'packing' ? 3 : 2} /></button>
      </div>
    </div>
);

// ==========================================
// 🚀 應用程式邏輯區 (APP LOGIC)
// ==========================================

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  
  // Data State
  const [trips, setTrips] = useState([]); 
  const [activeTripId, setActiveTripId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // UI States
  const [showFlightModal, setShowFlightModal] = useState(false);
  const [showAddShoppingModal, setShowAddShoppingModal] = useState(false);
  const [showAddPackingModal, setShowAddPackingModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showTripListModal, setShowTripListModal] = useState(false); // 側邊選單狀態
  const [editingItemState, setEditingItemState] = useState(null);
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null }); // Confirmation Modal State
  
  const activityRefs = useRef({});
  const showToast = (message, type = 'success') => { setToast({ show: true, message, type }); };

  // --- 1. Auth Listener ---
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
             showToast(`歡迎回來 ${currentUser.email}`);
        }
        setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // --- Login & Register Actions ---
  const handleLogin = async (email, password) => {
    setIsLoading(true);
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error(error);
        let msg = "登入失敗";
        if (error.code === 'auth/invalid-credential') msg = "帳號或密碼錯誤";
        if (error.code === 'auth/user-not-found') msg = "找不到此帳號";
        if (error.code === 'auth/wrong-password') msg = "密碼錯誤";
        showToast(msg, "error");
    } finally {
        setIsLoading(false);
    }
  };

  const handleRegister = async (email, password) => {
    setIsLoading(true);
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        showToast("註冊成功！");
    } catch (error) {
        console.error(error);
        let msg = "註冊失敗";
        if (error.code === 'auth/email-already-in-use') msg = "此 Email 已被註冊";
        if (error.code === 'auth/weak-password') msg = "密碼強度不足 (需6位以上)";
        showToast(msg, "error");
    } finally {
        setIsLoading(false);
    }
  };

  const handleLogout = async () => {
      setConfirmModal({
          show: true,
          title: "登出帳號",
          message: "確定要登出目前的帳號嗎？",
          onConfirm: async () => {
              await signOut(auth);
              setTrips([]);
              setActiveTripId(null);
              showToast("已登出");
              setConfirmModal({ ...confirmModal, show: false });
          }
      });
  };

  // --- 2. Data Listener (Multi-Trip) ---
  useEffect(() => {
    if (!user || !db) return;

    const tripsCollectionRef = collection(db, 'users', user.uid, 'trips');
    
    const unsubscribe = onSnapshot(tripsCollectionRef, (snapshot) => {
        const fetchedTrips = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        fetchedTrips.sort((a, b) => {
            const dateA = new Date(a.date).getTime() || 0;
            const dateB = new Date(b.date).getTime() || 0;
            return dateA - dateB;
        });

        setTrips(fetchedTrips);

        if (fetchedTrips.length > 0) {
             setActiveTripId(prev => {
                 return (prev && fetchedTrips.find(t => t.id === prev)) ? prev : fetchedTrips[0].id;
             });
        } else {
             setActiveTripId(null);
        }
    }, (error) => {
        console.error("Firestore Error:", error);
        showToast("資料讀取失敗", "error");
    });

    return () => unsubscribe();
  }, [user]);

  // --- Helpers ---
  const currentTrip = trips.find(t => t.id === activeTripId) || null;

  const updateCurrentTrip = async (updater) => {
      if (!db || !user || !activeTripId) return;
      
      const tripDocRef = doc(db, 'users', user.uid, 'trips', activeTripId);
      const newData = updater(currentTrip);
      
      try {
        await updateDoc(tripDocRef, newData);
      } catch (e) {
        console.error("Save failed", e);
        showToast("儲存失敗", "error");
      }
  };

  const triggerDeleteTrip = (tripId) => {
      setConfirmModal({
          show: true,
          title: "刪除行程",
          message: "確定要刪除這個行程嗎？此動作無法復原。",
          onConfirm: () => {
              handleDeleteTrip(tripId);
              setConfirmModal({ ...confirmModal, show: false });
          }
      });
  };

  const handleDeleteTrip = async (tripId) => {
      if (!db || !user) return;
      try {
          await deleteDoc(doc(db, 'users', user.uid, 'trips', tripId));
          showToast("行程已刪除");
      } catch (e) {
          console.error("Delete failed", e);
          showToast("刪除失敗", "error");
      }
  };

  const handleImportData = async (inputValue, type) => {
      if (!db || !user) return;
      setIsLoading(true);
      const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve('timeout'), 8000));

      try {
          let importData = [];
          if (type === 'url') {
              const res = await fetch(inputValue);
              if (!res.ok) throw new Error("Network error");
              const json = await res.json();
              importData = Array.isArray(json) ? json : [json];
          } else {
              const json = JSON.parse(inputValue);
              importData = Array.isArray(json) ? json : [json];
          }

          const tripsCollectionRef = collection(db, 'users', user.uid, 'trips');
          
          const writePromise = Promise.all(importData.map(async (trip) => {
              const { id, ...tripData } = trip;
              const finalData = { ...DEFAULT_EMPTY_TRIP, ...tripData };
              await addDoc(tripsCollectionRef, finalData);
          }));

          await Promise.race([writePromise, timeoutPromise]);

          setShowImportModal(false);
          setShowTripListModal(false); 
          showToast(`成功匯入 ${importData.length} 筆行程！`);
      } catch (e) {
          console.error("Import failed", e);
          showToast("匯入失敗：格式錯誤或網路問題", "error");
      } finally {
          setIsLoading(false);
      }
  };

  // --- Item Handlers ---
  const togglePackingItem = (itemId) => updateCurrentTrip(t => ({ ...t, packingList: (t.packingList || []).map(i => i.id === itemId ? {...i, checked: !i.checked} : i) }));
  const deletePackingItem = (itemId) => updateCurrentTrip(t => ({ ...t, packingList: (t.packingList || []).filter(i => i.id !== itemId) }));
  const handleAddPackingItem = (name, category) => {
      if (!name.trim()) return;
      updateCurrentTrip(t => ({ ...t, packingList: [...(t.packingList || []), { id: Date.now(), item: name, checked: false, category: category || '未分類' }] }));
      setShowAddPackingModal(false);
      showToast("已加入行李清單");
  };

  const toggleShoppingItem = (itemId) => updateCurrentTrip(t => ({ ...t, shoppingList: (t.shoppingList || []).map(i => i.id === itemId ? {...i, checked: !i.checked} : i) }));
  const deleteShoppingItem = (itemId) => updateCurrentTrip(t => ({ ...t, shoppingList: (t.shoppingList || []).filter(i => i.id !== itemId) }));
  const handleAddShoppingItem = (name, category, note) => {
      if (!name.trim()) return;
      updateCurrentTrip(t => ({ ...t, shoppingList: [...(t.shoppingList || []), { id: Date.now(), item: name, category: category || '未分類', note: note, checked: false }] }));
      setShowAddShoppingModal(false);
      showToast("已加入購物清單");
  };
  
  const openEditModal = (type, item) => setEditingItemState({ type, data: { ...item } });
  const saveEditItem = (updatedItem) => {
    if (!editingItemState) return;
    const { type } = editingItemState;
    const listKey = type === 'shopping' ? 'shoppingList' : 'packingList';
    updateCurrentTrip(t => ({ ...t, [listKey]: (t[listKey] || []).map(i => i.id === updatedItem.id ? updatedItem : i) }));
    setEditingItemState(null);
    showToast("修改已儲存");
  };

  const calculateDaysLeft = (dateString) => {
    if (!dateString || dateString === '----/--/--') return 0;
    const today = new Date();
    const target = new Date(dateString);
    const diffTime = target - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;
  };

  const getCurrentActivityId = (trip) => {
    if(!trip || !trip.days) return null;
    const now = new Date();
    let currentId = null;
    let minTimeDiff = Infinity;
    trip.days.forEach(day => {
        const dayDate = new Date(trip.date);
        dayDate.setDate(dayDate.getDate() + (day.day - 1));
        if (now.toDateString() === dayDate.toDateString()) {
            day.activities.forEach(activity => {
                const [h, m] = activity.time.split(':');
                const activityTime = new Date(dayDate);
                activityTime.setHours(h, m, 0, 0);
                const diff = now - activityTime;
                if (diff >= 0 && diff < minTimeDiff) { minTimeDiff = diff; currentId = activity.id; }
            });
        }
    });
    return currentId;
  };

  useEffect(() => {
    if (activeTab === 'itinerary' && currentTrip && currentTrip.days) {
        const targetId = getCurrentActivityId(currentTrip);
        if (targetId && activityRefs.current[targetId]) {
            setTimeout(() => { activityRefs.current[targetId].scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 300);
        }
    }
  }, [activeTab, currentTrip]);

  // Loading State
  if (!authReady) {
      return (
        <div className="min-h-screen font-sans text-gray-900 select-none bg-[#E0E5EC] flex items-center justify-center relative overflow-hidden">
             <div className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] bg-blue-300/40 rounded-full blur-[100px] animate-blob mix-blend-multiply"></div>
             <div className="absolute bottom-[-10%] right-[-10%] w-[70vw] h-[70vw] bg-pink-300/40 rounded-full blur-[100px] animate-blob animation-delay-2000 mix-blend-multiply"></div>
             <div className="relative z-10 flex flex-col items-center">
                 <RefreshCw className="animate-spin text-gray-600 mb-4" size={32} />
                 <p className="text-gray-500 text-sm font-bold">正在連線至雲端資料庫...</p>
             </div>
        </div>
      );
  }

  // Login Screen
  if (!user) {
      return (
        <div className="min-h-screen font-sans text-gray-900 select-none bg-[#E0E5EC] relative overflow-hidden">
            {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
            <AuthScreen onLogin={handleLogin} onRegister={handleRegister} isLoading={isLoading} />
        </div>
      );
  }

  return (
    <div className="min-h-screen font-sans text-gray-900 select-none bg-[#E0E5EC] relative overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] bg-blue-300/40 rounded-full blur-[100px] animate-blob mix-blend-multiply"></div>
          <div className="absolute top-[20%] right-[-20%] w-[60vw] h-[60vw] bg-purple-300/40 rounded-full blur-[100px] animate-blob animation-delay-2000 mix-blend-multiply"></div>
          <div className="absolute bottom-[-10%] left-[20%] w-[80vw] h-[80vw] bg-pink-300/40 rounded-full blur-[100px] animate-blob animation-delay-4000 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px]"></div>
      </div>
      <style>{`body { -webkit-tap-highlight-color: transparent; overscroll-behavior-y: none; } .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); } .mask-linear-fade { mask-image: linear-gradient(to bottom, black 0%, transparent 100%); } @keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } } .animate-blob { animation: blob 10s infinite; } .animate-fade-in-down { animation: fadeInDown 0.5s ease-out; } @keyframes fadeInDown { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } } .animation-delay-2000 { animation-delay: 2s; } .animation-delay-4000 { animation-delay: 4s; } .scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
      <div className="relative z-10">
        {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
        
        {confirmModal.show && (
            <ConfirmModal 
                title={confirmModal.title} 
                message={confirmModal.message} 
                onConfirm={confirmModal.onConfirm} 
                onCancel={() => setConfirmModal({ ...confirmModal, show: false })} 
            />
        )}

        {showFlightModal && <FlightModal onClose={() => setShowFlightModal(false)} flights={currentTrip ? currentTrip.flights : []} />}
        {showAddShoppingModal && <AddShoppingModal onClose={() => setShowAddShoppingModal(false)} onAdd={handleAddShoppingItem} />}
        {showAddPackingModal && <AddPackingModal onClose={() => setShowAddPackingModal(false)} onAdd={handleAddPackingItem} />}
        {showImportModal && <ImportModal onClose={() => setShowImportModal(false)} onImport={handleImportData} isLoading={isLoading} />}
        {editingItemState && <EditItemModal editingState={editingItemState} onClose={() => setEditingItemState(null)} onSave={saveEditItem} />}
        
        {/* 行程切換選單 */}
        {showTripListModal && (
            <TripListModal 
                trips={trips}
                activeTripId={activeTripId}
                onSelectTrip={(id) => { setActiveTripId(id); setShowTripListModal(false); setActiveTab('home'); }}
                onDeleteTrip={triggerDeleteTrip}
                onOpenImport={() => setShowImportModal(true)}
                onClose={() => setShowTripListModal(false)}
                userEmail={user.email}
                onLogout={handleLogout}
            />
        )}
        
        {activeTab === 'home' && <HomeView 
            trips={trips} 
            currentTrip={currentTrip} 
            calculateDaysLeft={calculateDaysLeft} 
            setActiveTab={setActiveTab} 
            setShowFlightModal={setShowFlightModal} 
            toggleShoppingItem={toggleShoppingItem} 
            deleteShoppingItem={deleteShoppingItem} 
            togglePackingItem={togglePackingItem} 
            deletePackingItem={deletePackingItem} 
            openEditModal={openEditModal} 
            setShowTripListModal={setShowTripListModal} 
        />}
        {activeTab === 'itinerary' && <ItineraryView currentTrip={currentTrip} setActiveTab={setActiveTab} setShowFlightModal={setShowFlightModal} getCurrentActivityId={getCurrentActivityId} activityRefs={activityRefs} />}
        {activeTab === 'shopping' && <ShoppingView currentTrip={currentTrip} setActiveTab={setActiveTab} setShowAddShoppingModal={setShowAddShoppingModal} toggleShoppingItem={toggleShoppingItem} deleteShoppingItem={deleteShoppingItem} openEditModal={openEditModal} />}
        {activeTab === 'packing' && <PackingView currentTrip={currentTrip} setActiveTab={setActiveTab} setShowAddPackingModal={setShowAddPackingModal} togglePackingItem={togglePackingItem} deletePackingItem={deletePackingItem} openEditModal={openEditModal} />}
        <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}