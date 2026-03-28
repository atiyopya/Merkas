import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Table from '../components/ui/Table';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import { History, Search, ArrowUpRight, ArrowDownLeft, BarChart2, PackagePlus, PackageMinus } from 'lucide-react';
import Select from 'react-select';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SyncContext } from '../context/SyncContext';
import { API_BASE_URL } from '../api/apiConfig';
import './Inventory.css'; // Stil benzerliği için aynı dosyayı kullanalım

// Local YYYY-MM-DD format helper
const toLocalISO = (date) => {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

// Get absolute boundary for a local date string (e.g. "2026-03-27" -> ISO UTC start/end)
const getBoundaryISO = (dateStr, isEnd = false) => {
  if (!dateStr || dateStr === 'ALL') return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (isEnd) date.setHours(23, 59, 59, 999);
  else date.setHours(0, 0, 0, 0);
  return date.toISOString();
};

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    background: 'var(--color-surface)',
    borderColor: state.isFocused ? 'var(--color-primary)' : 'var(--color-border)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.875rem'
  }),
  menu: (base) => ({
    ...base,
    background: '#ffffff',
    borderRadius: 'var(--radius-md)',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    border: '1px solid var(--color-border)',
    overflow: 'hidden',
    zIndex: 999
  })
};

export default function StockMovements() {
  const syncKey = React.useContext(SyncContext);
  const isFirstLoad = React.useRef(true);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [search, setSearch] = useState('');
  
  const [dateFilter, setDateFilter] = useState('THIS_MONTH');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(toLocalISO(new Date()));

  const getEffectiveDates = () => {
    const now = new Date();
    let start = '';
    let end = toLocalISO(now);

    if (dateFilter === 'BU_GUN') {
      start = end;
    } else if (dateFilter === 'THIS_WEEK') {
      const d = new Date(now);
      const day = d.getDay();
      d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
      start = toLocalISO(d);
    } else if (dateFilter === 'THIS_MONTH') {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      start = toLocalISO(d);
    } else if (dateFilter === 'THIS_YEAR') {
      const d = new Date(now.getFullYear(), 0, 1);
      start = toLocalISO(d);
    } else if (dateFilter === 'CUSTOM') {
      start = startDate;
      end = endDate;
    } else if (dateFilter === 'ALL') {
      return { start: 'ALL', end: 'ALL' };
    }

    return { 
      start: getBoundaryISO(start, false), 
      end: getBoundaryISO(end, true) 
    };
  };

  useEffect(() => {
    fetchMovements();
  }, [dateFilter, startDate, endDate, syncKey]);

  const fetchMovements = async () => {
    if (isFirstLoad.current) setLoading(true);
    try {
      const { start, end } = getEffectiveDates();
      const query = `?startDate=${start}&endDate=${end}&t=${new Date().getTime()}`;
      const res = await axios.get(`${API_BASE_URL}/api/products/movements${query}`);
      setMovements(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      isFirstLoad.current = false;
    }
  };

  const filteredMovements = movements.filter(m => {
    const productName = m.product?.name || '';
    const productCode = m.product?.code || '';
    const customerName = m.customer?.name || '';

    const matchesSearch = productName.toLowerCase().includes(search.toLowerCase()) || 
                         productCode.toLowerCase().includes(search.toLowerCase()) ||
                         customerName.toLowerCase().includes(search.toLowerCase());
    
    if (filterType === 'ALL') return matchesSearch;
    if (filterType === 'IN') return matchesSearch && m.quantity > 0;
    if (filterType === 'OUT') return matchesSearch && m.quantity < 0;
    return matchesSearch;
  });

  const columns = [
    { 
      header: 'Tarih', 
      field: 'createdAt', 
      render: (row) => new Date(row.createdAt).toLocaleString('tr-TR') 
    },
    { 
      header: 'Ürün koda / Adı', 
      field: 'product', 
      render: (row) => (
        <div>
            <div style={{fontWeight: '600'}}>{row.product?.code}</div>
            <div style={{fontSize: '0.8rem', color: 'var(--color-text-muted)'}}>{row.product?.name}</div>
        </div>
      )
    },
    {
      header: 'Cari / Müşteri',
      field: 'customer',
      render: (row) => (
        <div style={{fontWeight: '500', color: 'var(--color-primary)'}}>
          {row.customer?.name || '-'}
        </div>
      )
    },
    { 
      header: 'İşlem Tipi', 
      field: 'type',
      render: (row) => {
          const isEntry = row.quantity > 0;
          return (
              <div style={{
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  color: isEntry ? '#10b981' : '#ef4444',
                  fontWeight: '600'
              }}>
                  {isEntry ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                  {isEntry ? 'Stok Girişi' : 'Stok Çıkışı'}
                  <span style={{fontSize: '0.7rem', opacity: 0.7, marginLeft:'4px'}}>({row.type})</span>
              </div>
          )
      }
    },
    { 
      header: 'Miktar', 
      field: 'quantity', 
      render: (row) => (
        <span style={{ 
            fontWeight: 'bold', 
            fontSize: '1rem',
            color: row.quantity > 0 ? '#10b981' : '#ef4444' 
        }}>
          {row.quantity > 0 ? `+${row.quantity}` : row.quantity}
        </span>
      )
    },
    { header: 'Açıklama', field: 'description' }
  ];

  const totalIn = filteredMovements.filter(m => m.quantity > 0).reduce((sum, m) => sum + m.quantity, 0);
  const totalOut = filteredMovements.filter(m => m.quantity < 0).reduce((sum, m) => sum + Math.abs(m.quantity), 0);
  
  const groupedDates = {};
  filteredMovements.forEach(m => {
    const d = new Date(m.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
    if (!groupedDates[d]) groupedDates[d] = { name: d, Giris: 0, Cikis: 0 };
    if (m.quantity > 0) groupedDates[d].Giris += m.quantity;
    else groupedDates[d].Cikis += Math.abs(m.quantity);
  });
  
  const chartData = Object.values(groupedDates).reverse();

  return (
    <div className="inventory-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Stok Hareket Raporu</h1>
        
        <div className="finance-filters" style={{ margin: 0 }}>
          <div className="segmented-control">
            <button className={`segment-btn ${dateFilter === 'ALL' ? 'active' : ''}`} onClick={() => setDateFilter('ALL')}>Hepsi</button>
            <button className={`segment-btn ${dateFilter === 'BU_GUN' ? 'active' : ''}`} onClick={() => setDateFilter('BU_GUN')}>Bu Gün</button>
            <button className={`segment-btn ${dateFilter === 'THIS_WEEK' ? 'active' : ''}`} onClick={() => setDateFilter('THIS_WEEK')}>Bu Hafta</button>
            <button className={`segment-btn ${dateFilter === 'THIS_MONTH' ? 'active' : ''}`} onClick={() => setDateFilter('THIS_MONTH')}>Bu Ay</button>
            <button className={`segment-btn ${dateFilter === 'THIS_YEAR' ? 'active' : ''}`} onClick={() => setDateFilter('THIS_YEAR')}>Bu Yıl</button>
            <button className={`segment-btn ${dateFilter === 'CUSTOM' ? 'active' : ''}`} onClick={() => setDateFilter('CUSTOM')}>Özel</button>
          </div>

          {dateFilter === 'CUSTOM' && (
            <div className="date-inputs-wrapper animate-fade-in">
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="date-input-modern" style={{ width: '130px' }} />
              <span className="date-separator">-</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="date-input-modern" style={{ width: '130px' }} />
            </div>
          )}
        </div>
      </div>

      <div className="summary-grid mb-4">
        <Card glass className="summary-card animate-fade-in" style={{ animationDelay: '100ms' }}>
          <CardContent>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="summary-info">
                <p className="summary-title">Dönem İçi Toplam Giriş</p>
                <h2 className="summary-amount" style={{ color: 'var(--color-success)' }}>+{totalIn} <span style={{fontSize:'1rem', color:'var(--color-text-muted)'}}>Adet</span></h2>
              </div>
              <div className="summary-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>
                <PackagePlus size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card glass className="summary-card animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardContent>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="summary-info">
                <p className="summary-title">Dönem İçi Toplam Çıkış</p>
                <h2 className="summary-amount" style={{ color: 'var(--color-danger)' }}>-{totalOut} <span style={{fontSize:'1rem', color:'var(--color-text-muted)'}}>Adet</span></h2>
              </div>
              <div className="summary-icon" style={{ backgroundColor: 'rgba(244, 63, 94, 0.1)', color: 'var(--color-danger)' }}>
                <PackageMinus size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <Card glass className="animate-fade-in" style={{ animationDelay: '300ms' }}>
          <CardHeader 
            title={<span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BarChart2 size={20} style={{ color: 'var(--color-primary)' }} /> Stok Hareket Trendi (Günlük)</span>} 
            subtitle="Seçili dönemdeki ürün giriş ve çıkış hacimleri"
          />
          <CardContent>
            <div style={{ width: '100%', height: 300, marginTop: '1rem' }}>
              <ResponsiveContainer>
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGiris" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCikis" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-danger)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-danger)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: '0.875rem' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: '0.875rem' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-lg)', backgroundColor: 'var(--color-surface)', backdropFilter: 'blur(8px)' }}
                  />
                  <Area type="monotone" dataKey="Giris" name="Stok Girişi" stroke="var(--color-success)" fillOpacity={1} fill="url(#colorGiris)" strokeWidth={3} />
                  <Area type="monotone" dataKey="Cikis" name="Stok Çıkışı" stroke="var(--color-danger)" fillOpacity={1} fill="url(#colorCikis)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="table-card">
        <div className="table-toolbar" style={{display:'flex', gap:'1rem', alignItems:'center'}}>
          <div className="search-box" style={{flex: 1}}>
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Ürün adı veya kodu ara..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="search-input"
            />
          </div>
          
          <div style={{width: '200px'}}>
            <Select
                options={[
                    {value: 'ALL', label: 'Tüm Hareketler'},
                    {value: 'IN', label: 'Sadece Girişler'},
                    {value: 'OUT', label: 'Sadece Çıkışlar'}
                ]}
                value={{
                    value: filterType,
                    label: filterType === 'ALL' ? 'Tüm Hareketler' : filterType === 'IN' ? 'Sadece Girişler' : 'Sadece Çıkışlar'
                }}
                onChange={opt => setFilterType(opt.value)}
                styles={customSelectStyles}
                isSearchable={false}
            />
          </div>
        </div>
        
        <Table 
            columns={columns} 
            data={filteredMovements} 
            loading={loading}
        />
      </Card>
    </div>
  );
}
