import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Table from '../components/ui/Table';
import { SyncContext } from '../context/SyncContext';
import { API_BASE_URL } from '../api/apiConfig';
import { Wallet, CreditCard, Mail, Clock, TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

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

export default function Dashboard() {
  const syncKey = React.useContext(SyncContext);
  const [summary, setSummary] = useState({
    Nakit: 0,
    POS: 0,
    MailOrder: 0,
    Veresiye: 0,
    FirmaBorcu: 0
  });

  const [history, setHistory] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [filterType, setFilterType] = useState('THIS_MONTH');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(toLocalISO(new Date()));

  const getEffectiveDates = () => {
    const now = new Date();
    let start = '';
    let end = toLocalISO(now);

    if (filterType === 'BU_GUN') {
      start = toLocalISO(now);
      end = start;
    } else if (filterType === 'THIS_WEEK') {
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      d.setDate(diff);
      start = toLocalISO(d);
    } else if (filterType === 'THIS_MONTH') {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      start = toLocalISO(d);
    } else if (filterType === 'THIS_YEAR') {
      const d = new Date(now.getFullYear(), 0, 1);
      start = toLocalISO(d);
    } else if (filterType === 'CUSTOM') {
      start = startDate;
      end = endDate;
    } else if (filterType === 'ALL') {
      return { start: 'ALL', end: 'ALL' };
    }

    return { 
      start: getBoundaryISO(start, false), 
      end: getBoundaryISO(end, true) 
    };
  };

  const isFirstLoad = React.useRef(true);

  useEffect(() => {
    fetchSummary();
  }, [filterType, startDate, endDate, syncKey]);

  const fetchSummary = async () => {
    if (isFirstLoad.current) {
      setIsLoaded(false);
    }
    try {
      const { start, end } = getEffectiveDates();
      const query = `?startDate=${start}&endDate=${end}&t=${new Date().getTime()}`;
      
      const [sumRes, histRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/finance/summary${query}`),
        axios.get(`${API_BASE_URL}/api/finance/history${query}`)
      ]);
      setSummary(sumRes.data);
      setHistory(histRes.data);
      setIsLoaded(true);
      isFirstLoad.current = false;
    } catch (error) {
      console.error('Finans verileri alınırken hata oluştu:', error);
      setIsLoaded(true);
      isFirstLoad.current = false;
    }
  };

  const incomeHistory = history.filter(h => h.type !== 'EXPENSE');
  const expenseHistory = history.filter(h => h.type === 'EXPENSE');

  const totalIncome = (summary.Gelir_Nakit || 0) + (summary.Gelir_POS || 0) + (summary.Gelir_MailOrder || 0) + (summary.Veresiye || 0);

  const incomeCards = [
    { title: 'Nakit Tahsilat (Gelir)', amount: summary.Gelir_Nakit || 0, icon: Wallet, color: '#10b981' },
    { title: 'Kredi Kartı (Gelir)', amount: summary.Gelir_POS || 0, icon: CreditCard, color: '#3b82f6' },
    { title: 'Mail Order (Gelir)', amount: summary.Gelir_MailOrder || 0, icon: Mail, color: '#f97316' },
    { title: 'Veresiye (Alacak)', amount: summary.Veresiye || 0, icon: Clock, color: '#a855f7' },
    { title: 'TOPLAM GELİR / ALACAK', amount: totalIncome, icon: TrendingUp, color: '#14b8a6' }
  ];

  const totalExpense = (summary.Gider_Nakit || 0) + (summary.Gider_POS || 0) + (summary.Gider_MailOrder || 0) + (summary.FirmaBorcu || 0);

  const expenseCards = [
    { title: 'Nakit Çıkışı (Gider)', amount: summary.Gider_Nakit || 0, icon: Wallet, color: '#ef4444' },
    { title: 'Kredi Kartı (Gider)', amount: summary.Gider_POS || 0, icon: CreditCard, color: '#ef4444' },
    { title: 'Mail Order (Gider)', amount: summary.Gider_MailOrder || 0, icon: Mail, color: '#ef4444' },
    { title: 'Ödenecek Firma Borcu', amount: summary.FirmaBorcu || 0, icon: Clock, color: '#ef4444' },
    { title: 'TOPLAM ÇIKAN / BORÇ', amount: totalExpense, icon: TrendingDown, color: '#e11d48' }
  ];

  const chartData = [
    { name: 'Nakit', Gelir: summary.Gelir_Nakit || 0, Gider: summary.Gider_Nakit || 0 },
    { name: 'Kredi Kartı', Gelir: summary.Gelir_POS || 0, Gider: summary.Gider_POS || 0 },
    { name: 'Mail Order', Gelir: summary.Gelir_MailOrder || 0, Gider: summary.Gider_MailOrder || 0 },
  ];

  const historyColumns = [
    { header: 'Tarih', field: 'createdAt', render: r => new Date(r.createdAt).toLocaleString('tr-TR') },
    { header: 'İşlem Tipi', field: 'method', render: r => {
      const ms = { 
        CASH: 'Nakit', 
        POS: 'Kredi Kartı', 
        MAIL_ORDER: 'Mail Order', 
        VERESIYE: 'Veresiye',
        FİRMA_BORCU: 'Firma Borcu',
        BORC_PARCA: 'Firma Borcu (Parça)',
        BORC_ISCILIK: 'Firma Borcu (İşçilik)'
      };
      const text = ms[r.method] || r.method;
      return r.description ? (
        <span>
          {text} <br/>
          <small style={{color: 'var(--color-primary)', fontWeight: 'normal'}}>{r.description}</small>
        </span>
      ) : text;
    }},
    { header: 'Müşteri (Cari)', field: 'customer', render: r => r.customer?.name || 'Genel / Faturasız' },
    { header: 'Tutar', field: 'amount', render: r => {
      let color = 'inherit';
      if (r.method === 'CASH') color = '#10b981';
      else if (r.method === 'POS') color = '#3b82f6';
      else if (r.method === 'MAIL_ORDER') color = '#f97316';
      else if (r.method === 'VERESIYE') color = '#a855f7';
      else if (r.method === 'BORC_PARCA' || r.method === 'BORC_ISCILIK' || r.method === 'FİRMA_BORCU' || r.method === 'YANSIMA_BORC') color = '#ef4444';
      
      return (
        <span style={{ fontWeight: 'bold', color }}>
          {r.amount.toLocaleString('tr-TR')} ₺
        </span>
      );
    }}
  ];

  if (!isLoaded) {
    return (
      <div className="dashboard" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid var(--color-border)', borderTop: '4px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: 'var(--color-text-muted)' }}>Finansal veriler yükleniyor...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Finans Özeti</h1>
        
        <div className="finance-filters">
          <div className="segmented-control">
            <button className={`segment-btn ${filterType === 'ALL' ? 'active' : ''}`} onClick={() => setFilterType('ALL')}>Hepsi</button>
            <button className={`segment-btn ${filterType === 'BU_GUN' ? 'active' : ''}`} onClick={() => setFilterType('BU_GUN')}>Bu Gün</button>
            <button className={`segment-btn ${filterType === 'THIS_WEEK' ? 'active' : ''}`} onClick={() => setFilterType('THIS_WEEK')}>Bu Hafta</button>
            <button className={`segment-btn ${filterType === 'THIS_MONTH' ? 'active' : ''}`} onClick={() => setFilterType('THIS_MONTH')}>Bu Ay</button>
            <button className={`segment-btn ${filterType === 'THIS_YEAR' ? 'active' : ''}`} onClick={() => setFilterType('THIS_YEAR')}>Bu Yıl</button>
            <button className={`segment-btn ${filterType === 'CUSTOM' ? 'active' : ''}`} onClick={() => setFilterType('CUSTOM')}>Özel</button>
          </div>

          {filterType === 'CUSTOM' && (
            <div className="date-inputs-wrapper animate-fade-in">
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="date-input-modern" style={{ width: '130px' }} />
              <span className="date-separator">-</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="date-input-modern" style={{ width: '130px' }} />
            </div>
          )}
        </div>
      </div>
      
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>
          <TrendingUp size={22} /> Gelirler ve Alacaklar (Net Kasa)
        </h3>
        <div className="summary-grid mb-4">
          {incomeCards.map((card, idx) => (
            <Card 
              key={idx} 
              glass 
              className="summary-card animate-fade-in" 
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <CardContent>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="summary-info">
                    <p className="summary-title">{card.title}</p>
                    <h2 className="summary-amount">{card.amount.toLocaleString('tr-TR')} ₺</h2>
                  </div>
                  <div className="summary-icon" style={{ backgroundColor: `${card.color}20`, color: card.color }}>
                    <card.icon size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>
          <TrendingDown size={22} /> Giderler ve Borçlar
        </h3>
        <div className="summary-grid mb-4">
          {expenseCards.map((card, idx) => (
            <Card 
              key={idx} 
              glass 
              className="summary-card animate-fade-in"
              style={{ animationDelay: `${(idx + 5) * 100}ms` }}
            >
              <CardContent>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="summary-info">
                    <p className="summary-title">{card.title}</p>
                    <h2 className="summary-amount">{card.amount.toLocaleString('tr-TR')} ₺</h2>
                  </div>
                  <div className="summary-icon" style={{ backgroundColor: `${card.color}20`, color: card.color }}>
                    <card.icon size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="dashboard-charts" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem', alignItems: 'start', marginBottom: '2rem' }}>
        <Card glass className="chart-card animate-fade-in" style={{ animationDelay: '800ms' }}>
          <CardHeader title="Gelir ve Tahsilat Geçmişi" subtitle="Alınan tahsilatlar ve satışlar" />
          <div className="chart-scroll-area">
            <Table columns={historyColumns} data={incomeHistory} emptyMessage="Henüz hiçbir gelir işlemi gerçekleşmemiş." />
          </div>
        </Card>

        <Card glass className="chart-card animate-fade-in" style={{ animationDelay: '900ms' }}>
          <CardHeader title="Gider ve Borç Geçmişi" subtitle="Firma işlemleri ve yansıyan giderler" />
          <div className="chart-scroll-area">
            <Table columns={historyColumns} data={expenseHistory} emptyMessage="Henüz hiçbir gider işlemi gerçekleşmemiş." />
          </div>
        </Card>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <Card glass className="animate-fade-in" style={{ animationDelay: '1000ms' }}>
          <CardHeader 
            title={<span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BarChart2 size={20} style={{ color: 'var(--color-primary)' }} /> Dönemsel Nakit Akışı Analizi</span>} 
            subtitle="Seçili tarih aralığındaki cari gelir ve gider (tahsilat/çıkış) karşılaştırması" 
          />
          <CardContent>
            <div style={{ width: '100%', height: 350, marginTop: '1rem' }}>
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: '0.875rem' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: '0.875rem' }} tickFormatter={(value) => `${value.toLocaleString('tr-TR')} ₺`} />
                  <Tooltip 
                    cursor={{ fill: 'var(--color-primary-soft)', opacity: 0.4 }}
                    contentStyle={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-lg)', backgroundColor: 'var(--color-surface)', backdropFilter: 'blur(8px)' }}
                    formatter={(value) => [`${value.toLocaleString('tr-TR')} ₺`]}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                  <Bar dataKey="Gelir" name="Tahsilat (Gelir)" fill="var(--color-success)" radius={[6, 6, 0, 0]} barSize={45} animationDuration={1500} />
                  <Bar dataKey="Gider" name="Firma Ödemesi (Gider)" fill="var(--color-danger)" radius={[6, 6, 0, 0]} barSize={45} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
