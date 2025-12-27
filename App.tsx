
import React, { useState, useEffect, useRef } from 'react';
import { BillItem, MenuItem, RestaurantDetails } from './types';
import { DEFAULT_MENU } from './constants';

declare const html2pdf: any;

const App: React.FC = () => {
  // Billing State
  const [items, setItems] = useState<BillItem[]>([]);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Menu Management State
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [isEditingMenu, setIsEditingMenu] = useState(false);
  const [tempMenu, setTempMenu] = useState<MenuItem[]>([]);

  // Restaurant Details State
  const [restaurant, setRestaurant] = useState<RestaurantDetails>({
    name: 'THE SNACK BAR',
    tagline: 'Authentic Street Food',
    address: '102 Main Market, East Wing',
    gstin: '22AAAAA0000A1Z5'
  });
  const [isEditingRestaurant, setIsEditingRestaurant] = useState(false);
  const [tempRestaurant, setTempRestaurant] = useState<RestaurantDetails>(restaurant);

  // System State
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  // Initialize Data from LocalStorage or Default
  useEffect(() => {
    const savedMenu = localStorage.getItem('quickbill_menu');
    if (savedMenu) {
      try {
        setMenu(JSON.parse(savedMenu));
      } catch (e) {
        setMenu(DEFAULT_MENU);
      }
    } else {
      setMenu(DEFAULT_MENU);
    }

    const savedRestaurant = localStorage.getItem('quickbill_restaurant');
    if (savedRestaurant) {
      try {
        setRestaurant(JSON.parse(savedRestaurant));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentDate(now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
      setCurrentTime(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveMenu = () => {
    const filteredMenu = tempMenu.filter(m => m.name.trim() !== '');
    setMenu(filteredMenu);
    localStorage.setItem('quickbill_menu', JSON.stringify(filteredMenu));
    setIsEditingMenu(false);
  };

  const handleSaveRestaurant = () => {
    setRestaurant(tempRestaurant);
    localStorage.setItem('quickbill_restaurant', JSON.stringify(tempRestaurant));
    setIsEditingRestaurant(false);
  };

  const startEditingMenu = () => {
    setTempMenu([...menu]);
    setIsEditingMenu(true);
  };

  const startEditingRestaurant = () => {
    setTempRestaurant({ ...restaurant });
    setIsEditingRestaurant(true);
  };

  const addToBill = (menuItem: MenuItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.name === menuItem.name);
      if (existing) {
        return prev.map(i => i.name === menuItem.name ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { 
        id: Math.random().toString(36).substr(2, 9), 
        name: menuItem.name, 
        price: menuItem.price, 
        quantity: 1 
      }];
    });
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const clearBill = (e: React.MouseEvent) => {
    e.preventDefault();
    setItems([]);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal; // GST removed

  const handleDownloadPDF = async () => {
    if (!receiptRef.current || items.length === 0) return;

    setIsExporting(true);
    
    // Tiny delay to ensure the DOM has updated without transitions/transforms
    setTimeout(() => {
      const element = document.getElementById('receipt-to-print');
      if (!element) {
        setIsExporting(false);
        return;
      }

      const opt = {
        margin: [10, 10, 10, 10],
        filename: `Bill_1024_${restaurant.name.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { 
          scale: 3, 
          useCORS: true,
          logging: false,
          letterRendering: true,
          scrollY: 0,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      html2pdf()
        .set(opt)
        .from(element)
        .save()
        .then(() => {
          setIsExporting(false);
        })
        .catch((err: any) => {
          console.error('PDF Generation Error:', err);
          setIsExporting(false);
        });
    }, 150);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-1.5 rounded-lg shadow-inner">
            <span className="material-symbols-outlined text-slate-900 font-bold block">receipt_long</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">QuickBill</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Operator Session</span>
            <span className="text-sm font-mono font-medium text-slate-600 dark:text-slate-300">{currentDate} • {currentTime}</span>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <span className="material-symbols-outlined text-sm">account_circle</span>
            <span className="text-sm font-medium">Admin</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row p-6 gap-6 max-w-[1600px] mx-auto w-full">
        {/* Left Column */}
        <section className="flex-1 flex flex-col gap-6 no-print">
          
          {/* Restaurant Info Panel */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">storefront</span>
                <h2 className="font-bold text-slate-800 dark:text-white tracking-tight">Restaurant Details</h2>
              </div>
              {!isEditingRestaurant ? (
                <button 
                  onClick={startEditingRestaurant}
                  className="text-xs font-bold text-primary-dark dark:text-primary flex items-center gap-1 hover:underline"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  EDIT DETAILS
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsEditingRestaurant(false)} className="text-xs font-bold text-slate-400 uppercase">Cancel</button>
                  <button onClick={handleSaveRestaurant} className="bg-primary text-slate-900 px-4 py-1.5 rounded-full text-xs font-bold shadow-md hover:bg-primary-dark uppercase">Save</button>
                </div>
              )}
            </div>
            <div className="p-5">
              {isEditingRestaurant ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Business Name</label>
                    <input 
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                      value={tempRestaurant.name}
                      onChange={e => setTempRestaurant({...tempRestaurant, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tagline</label>
                    <input 
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                      value={tempRestaurant.tagline}
                      onChange={e => setTempRestaurant({...tempRestaurant, tagline: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Address</label>
                    <input 
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                      value={tempRestaurant.address}
                      onChange={e => setTempRestaurant({...tempRestaurant, address: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GSTIN</label>
                    <input 
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                      value={tempRestaurant.gstin}
                      onChange={e => setTempRestaurant({...tempRestaurant, gstin: e.target.value})}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Business</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{restaurant.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tagline</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 truncate italic">{restaurant.tagline}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GSTIN</p>
                    <p className="text-sm font-mono text-slate-600 dark:text-slate-400 uppercase">{restaurant.gstin}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Address</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{restaurant.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Menu Section */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">restaurant_menu</span>
                <h2 className="font-bold text-slate-800 dark:text-white tracking-tight">Main Menu</h2>
              </div>
              {!isEditingMenu ? (
                <button 
                  onClick={startEditingMenu}
                  className="text-xs font-bold text-primary-dark dark:text-primary flex items-center gap-1 hover:underline uppercase"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  Edit Menu
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsEditingMenu(false)} className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cancel</button>
                  <button onClick={handleSaveMenu} className="bg-primary text-slate-900 px-4 py-1.5 rounded-full text-xs font-bold shadow-md hover:bg-primary-dark uppercase tracking-wider">Save</button>
                </div>
              )}
            </div>
            <div className="p-4 overflow-y-auto max-h-[300px] custom-scroll">
              {isEditingMenu ? (
                <div className="space-y-3">
                  {tempMenu.map((m, idx) => (
                    <div key={idx} className="flex gap-3 items-center group">
                      <input 
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                        value={m.name}
                        onChange={(e) => {
                          const newM = [...tempMenu];
                          newM[idx].name = e.target.value;
                          setTempMenu(newM);
                        }}
                        placeholder="Item Name"
                      />
                      <div className="relative w-28">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                        <input 
                          type="number"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 pl-6 text-sm outline-none font-mono"
                          value={m.price}
                          onChange={(e) => {
                            const newM = [...tempMenu];
                            newM[idx].price = parseFloat(e.target.value) || 0;
                            setTempMenu(newM);
                          }}
                        />
                      </div>
                      <button onClick={() => setTempMenu(tempMenu.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500 transition-colors"><span className="material-symbols-outlined">close</span></button>
                    </div>
                  ))}
                  <button 
                    onClick={() => setTempMenu([...tempMenu, { name: '', price: 0 }])}
                    className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 text-xs font-bold hover:text-primary transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">add</span> ADD ITEM
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {menu.map((m, idx) => (
                    <button 
                      key={idx}
                      onClick={() => addToBill(m)}
                      className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg transition-all text-left"
                    >
                      <span className="font-bold text-slate-700 dark:text-slate-200">{m.name}</span>
                      <span className="text-xs font-mono bg-primary/10 text-primary-dark px-2 py-1 rounded">₹{m.price}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Order Section */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col flex-1 overflow-hidden">
             <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 uppercase text-xs tracking-widest">
                <span className="material-symbols-outlined text-primary text-lg">shopping_basket</span> Order List
              </h3>
              <button 
                onClick={clearBill} 
                className="px-3 py-1 text-[10px] font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-all tracking-widest uppercase border border-red-200 dark:border-red-900/50"
              >
                CLEAR ALL
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scroll min-h-[200px]">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center font-mono font-bold text-xs shadow-sm">
                      {item.quantity}x
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">₹{item.price}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">₹{item.price * item.quantity}</span>
                    <button onClick={() => removeItem(item.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-lg">delete</span></button>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-30 py-12">
                  <span className="material-symbols-outlined text-6xl mb-2">shopping_cart</span>
                  <p className="font-bold uppercase text-xs tracking-widest">Empty Cart</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right Column: Receipt Preview */}
        <section className="flex-1 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900/30 rounded-3xl p-6 lg:p-12 relative border border-slate-200 dark:border-slate-800 group overflow-hidden min-h-[600px]">
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none receipt-pattern"></div>
          
          <div className="relative w-full max-w-[340px] z-10">
            <div 
              id="receipt-to-print" 
              ref={receiptRef} 
              className={`${isExporting ? 'shadow-none transform-none' : 'isometric-card shadow-2xl'} transition-all duration-300 jagged-bottom`}
              style={isExporting ? { transform: 'none', boxShadow: 'none' } : {}}
            >
              <div className="bg-white p-8 pb-14 w-full font-mono text-sm relative z-10 text-slate-900 overflow-hidden">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-slate-900 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3 shadow-lg no-print">
                    <span className="material-symbols-outlined text-3xl">local_fire_department</span>
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tight leading-tight text-black">{restaurant.name}</h2>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">{restaurant.tagline}</p>
                  <div className="my-4 border-b border-slate-200"></div>
                  <p className="text-[10px] text-slate-600">{restaurant.address}</p>
                  <p className="text-[10px] text-slate-600 uppercase">GSTIN: {restaurant.gstin}</p>
                </div>

                <div className="border-y border-dashed border-slate-300 py-3 mb-4 text-[11px] flex justify-between text-slate-700">
                  <div>
                    <p>DATE: {currentDate}</p>
                    <p>TIME: {currentTime}</p>
                  </div>
                  <div className="text-right">
                    <p>BILL NO: #1024</p>
                    <p>POS: TERM-01</p>
                  </div>
                </div>

                <div className="flex justify-between font-bold text-[10px] mb-3 border-b border-slate-200 pb-1 text-slate-500 uppercase tracking-wider">
                  <span className="w-10">QTY</span>
                  <span className="flex-1 px-2">DESCRIPTION</span>
                  <span className="w-16 text-right">PRICE</span>
                </div>

                <div className="space-y-2 mb-6 min-h-[140px]">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start leading-tight text-black">
                      <span className="w-10 text-slate-400">{item.quantity}</span>
                      <span className="flex-1 uppercase text-[11px] px-2">{item.name}</span>
                      <span className="w-16 text-right font-bold tracking-tight">{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  {items.length === 0 && !isExporting && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 italic py-12 text-xs gap-2">
                       <span className="material-symbols-outlined">hourglass_empty</span>
                       Ready for order...
                    </div>
                  )}
                </div>

                <div className="border-t-2 border-dashed border-slate-300 pt-4 space-y-1 text-xs text-slate-800">
                  <div className="flex justify-between">
                    <span>SUBTOTAL</span>
                    <span>{subtotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="border-t-2 border-black mt-4 pt-4 flex justify-between items-end text-black">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">Grand Total</span>
                    <span className="font-black text-2xl tracking-tighter uppercase">TOTAL</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block font-bold">INR</span>
                    <span className="font-black text-3xl tracking-tighter">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="mt-10 text-center">
                  <p className="text-[10px] font-black tracking-[0.4em] mb-2 uppercase opacity-40">Thank You</p>
                  <div className="flex justify-center mb-4">
                     <div className="h-6 w-full max-w-[200px] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQwIj48cmVjdCB3aWR0aD0iMiIgaGVpZ2h0PSI0MCIgZmlsbD0iIzAwMCIvPjwvc3ZnPg==')] opacity-20"></div>
                  </div>
                  <p className="text-[8px] text-slate-400 uppercase tracking-widest">Generated by QuickBill POS</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex justify-center w-full max-w-[340px] z-10 no-print">
            <button 
              onClick={handleDownloadPDF}
              disabled={items.length === 0 || isExporting}
              className="flex flex-col items-center gap-2 p-4 w-full bg-blue-600 dark:bg-blue-700 text-white rounded-2xl border border-blue-500 dark:border-blue-600 shadow-lg hover:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 transition-all group active:scale-95"
            >
              <span className={`material-symbols-outlined text-white/90 ${isExporting ? 'animate-spin' : ''}`}>
                {isExporting ? 'progress_activity' : 'picture_as_pdf'}
              </span>
              <span className="text-[10px] font-black text-white uppercase tracking-widest">
                {isExporting ? 'Processing...' : 'Download PDF'}
              </span>
            </button>
          </div>
        </section>
      </main>

      <footer className="bg-white/80 dark:bg-surface-dark/80 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 py-3 px-6 flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] no-print">
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 text-green-500">
             <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
             SYSTEM ONLINE
           </div>
           <span>VERSION 2.4.0-STABLE</span>
        </div>
        <div>PROUDLY POWERED BY QUICKBILL</div>
      </footer>
    </div>
  );
};

export default App;
