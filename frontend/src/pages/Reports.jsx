import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { SyncContext } from '../context/SyncContext';
import { API_BASE_URL } from '../api/apiConfig';
import { TrendingDown, AlertCircle, PackageSearch } from 'lucide-react';

export default function Reports() {
  const syncKey = React.useContext(SyncContext);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/products?t=${new Date().getTime()}`).then(res => setProducts(res.data));
  }, [syncKey]);

  const criticalStock = products.filter(p => p.stock < 5);

  return (
    <div className="reports-page animate-fade-in" style={{ paddingBottom: '3rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Şık Başlık Modülü */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem', backgroundColor: 'var(--color-surface)', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '0.875rem', background: 'linear-gradient(135deg, #f43f5e, #e11d48)', borderRadius: '14px', color: 'white', boxShadow: '0 8px 16px rgba(225, 29, 72, 0.25)' }}>
          <TrendingDown size={28} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-main)', letterSpacing: '-0.5px' }}>Raporlar & Uyarılar</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', margin: '0.25rem 0 0 0', fontWeight: 500 }}>İşletmenizin durumu, eksikler ve kritik stok özetleri tek bir yerde.</p>
        </div>
      </div>
      
      <div className="warnings">
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 600, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={22} color="#ef4444" /> Kritik Stok Seviyeleri (Tükenmek Üzere)
        </h2>
        
        {criticalStock.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', background: 'linear-gradient(to bottom, var(--color-surface), transparent)', borderRadius: '24px', border: '2px dashed var(--color-border)', color: 'var(--color-text-muted)' }}>
            <PackageSearch size={64} style={{ margin: '0 auto 1.5rem', opacity: 0.3, color: 'var(--color-primary)' }} />
            <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>Harika Haber!</p>
            <p style={{ fontSize: '1rem', opacity: 0.8 }}>Şu an stok seviyesi kritik düzeyde düşmüş olan hiçbir ürün bulunmuyor.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {criticalStock.map(p => (
              <div key={p.id} style={{
                background: 'var(--color-surface)',
                borderRadius: '20px',
                padding: '1.5rem',
                border: '1px solid rgba(239, 68, 68, 0.15)',
                boxShadow: '0 10px 30px rgba(239, 68, 68, 0.05)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1.25rem',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'default'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(239, 68, 68, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(239, 68, 68, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.15)';
              }}
              >
                {/* Sol parlama çubuğu */}
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: 'linear-gradient(to bottom, #f43f5e, #ef4444)' }} />
                
                <div style={{ 
                  background: 'linear-gradient(135deg, rgba(254, 226, 226, 1), rgba(254, 202, 202, 0.5))', 
                  padding: '1rem', 
                  borderRadius: '16px',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 0 0 1px rgba(239, 68, 68, 0.1)'
                }}>
                  <AlertCircle size={28} strokeWidth={2.5} />
                </div>
                
                <div style={{ flex: 1, paddingTop: '0.25rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                    Acil Stok Alarmı
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: 'var(--color-text-main)', lineHeight: 1.3 }}>
                    {p.name}
                  </h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: '0 0 1rem 0', fontWeight: 500 }}>
                    <span style={{opacity: 0.6}}>Parça:</span> {p.code}
                  </p>
                  
                  <div style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    background: p.stock === 0 ? 'linear-gradient(to right, #ef4444, #dc2626)' : 'white',
                    color: p.stock === 0 ? 'white' : '#991b1b',
                    border: p.stock === 0 ? 'none' : '1px solid #fca5a5',
                    padding: '0.4rem 1rem', 
                    borderRadius: '99px', 
                    fontSize: '0.9rem', 
                    fontWeight: 700,
                    boxShadow: p.stock === 0 ? '0 4px 12px rgba(239, 68, 68, 0.3)' : '0 2px 5px rgba(239, 68, 68, 0.05)'
                  }}>
                    {p.stock === 0 ? 'TÜKENDİ!' : `Kalan: ${p.stock} Adet`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
