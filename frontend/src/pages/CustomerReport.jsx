import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import { API_BASE_URL } from '../api/apiConfig';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Table from '../components/ui/Table';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAlert } from '../context/AlertContext';
import { Download, FileSearch, History } from 'lucide-react';
import { SyncContext } from '../context/SyncContext';
import Button from '../components/ui/Button';
import './CustomerReport.css';

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    background: 'var(--color-surface)',
    borderColor: state.isFocused ? 'var(--color-primary)' : 'var(--color-border)',
    boxShadow: state.isFocused ? '0 0 0 1px var(--color-primary)' : 'none',
    borderRadius: 'var(--radius-md)',
    padding: '0 0.2rem',
    cursor: 'text',
    minHeight: '36px',
    fontSize: '0.875rem'
  }),
  menu: (base) => ({
    ...base,
    background: '#ffffff',
    borderRadius: 'var(--radius-md)',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    border: '1px solid var(--color-border)',
    overflow: 'hidden',
    zIndex: 9999
  }),
  option: (base, state) => ({
    ...base,
    background: state.isSelected ? 'var(--color-primary)' : state.isFocused ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
    color: state.isSelected ? 'white' : 'var(--color-text-main)',
    cursor: 'pointer',
    padding: '0.75rem 1rem'
  }),
  singleValue: (base) => ({
    ...base,
    color: 'var(--color-text-main)'
  }),
  input: (base) => ({
    ...base,
    color: 'var(--color-text-main)'
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999
  })
};

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

export default function CustomerReport() {
  const [customers, setCustomers] = useState([]);
  const [activeCustomers, setActiveCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [reports, setReports] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(toLocalISO(new Date()));
  const syncKey = React.useContext(SyncContext);
  const [filterType, setFilterType] = useState('ALL'); // ALL, THIS_MONTH, CUSTOM

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/customers`).then(res => setCustomers(res.data));
    axios.get(`${API_BASE_URL}/api/customers/active`).then(res => setActiveCustomers(res.data));
    
    // If a customer is already selected, refresh their specific report too
    if (selectedCustomerId) {
       handleSelectCustomer({ value: selectedCustomerId });
    }
  }, [syncKey]);

  const handleSelectCustomer = async (opt) => {
    const cid = opt ? opt.value : '';
    setSelectedCustomerId(cid);
    if (!cid) {
      setReports([]);
      setSelectedCustomer(null);
      return;
    }
    
    try {
      const res = await axios.get(`${API_BASE_URL}/api/customers/${cid}/transactions`);
      setSelectedCustomer(res.data);
      setReports(res.data.transactions || []);
    } catch(err) {
      console.error(err);
    }
  };

  const getFilteredReports = () => {
    let filtered = [...reports];
    const now = new Date();

    if (filterType === 'BU_GUN') {
      const todayStr = toLocalISO(now);
      filtered = filtered.filter(r => toLocalISO(new Date(r.createdAt)) === todayStr);
    } else if (filterType === 'THIS_WEEK') {
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      d.setDate(diff);
      const startStr = toLocalISO(d);
      filtered = filtered.filter(r => toLocalISO(new Date(r.createdAt)) >= startStr);
    } else if (filterType === 'THIS_MONTH') {
      const startOfMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      filtered = filtered.filter(r => toLocalISO(new Date(r.createdAt)) >= startOfMonthStr);
    } else if (filterType === 'THIS_YEAR') {
      const startOfYearStr = `${now.getFullYear()}-01-01`;
      filtered = filtered.filter(r => toLocalISO(new Date(r.createdAt)) >= startOfYearStr);
    } else if (filterType === 'CUSTOM') {
      if (startDate) {
        filtered = filtered.filter(r => toLocalISO(new Date(r.createdAt)) >= startDate);
      }
      if (endDate) {
        filtered = filtered.filter(r => toLocalISO(new Date(r.createdAt)) <= endDate);
      }
    }

    return filtered;
  };

  const filteredReports = getFilteredReports();
  
  const handleExportPDF = () => {
    if (!selectedCustomer) return;

    const trToEn = (text) => {
      if (!text) return "";
      return text
        .replace(/Ğ/g, "G").replace(/ğ/g, "g")
        .replace(/Ü/g, "U").replace(/ü/g, "u")
        .replace(/Ş/g, "S").replace(/ş/g, "s")
        .replace(/İ/g, "I").replace(/ı/g, "i")
        .replace(/Ö/g, "O").replace(/ö/g, "o")
        .replace(/Ç/g, "C").replace(/ç/g, "c");
    };

    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('tr-TR');

    // ---- Merka Ticaret Logo / Header ----
    doc.setFillColor(50, 50, 50);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('MERKA TICARET', 105, 18, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('PROFESYONEL OTOMOTIV COZUMLERI', 105, 28, { align: 'center' });

    // ---- Müşteri Bilgileri ----
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(trToEn(selectedCustomer.name), 14, 50);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Tarih: ${today}`, 196, 50, { align: 'right' });
    doc.line(14, 54, 196, 54);

    // ---- Veri Filtreleme (Sadece Borçlandıran İşlemler: Satışlar ve Yansımalar) ----
    const salesAndDebts = filteredReports.filter(r => r.type === 'DEBT' || r.invoice);
    
    if (salesAndDebts.length === 0) {
      doc.setFontSize(12);
      doc.text('Secilen kriterlere uygun satis/borc kaydi bulunmamaktadir.', 14, 70);
      doc.save(`${trToEn(selectedCustomer.name)}_Ekstre.pdf`);
      return;
    }

    // ---- Gruplama (Araç Plakasına Göre) ----
    const groups = {};
    salesAndDebts.forEach(r => {
      const plate = r.vehicle ? r.vehicle.plate : 'ARACSIZ ISLEMLER';
      const model = r.vehicle && r.vehicle.model ? r.vehicle.model : '';
      const groupKey = model ? `${plate} - ${model}` : plate;
      
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(r);
    });

    let currentY = 65;
    let grandTotal = 0;

    Object.keys(groups).forEach((groupLabel, index) => {
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFillColor(240, 240, 240);
      doc.rect(14, currentY - 5, 182, 8, 'F');
      doc.text(`ARAC: ${trToEn(groupLabel)}`, 18, currentY + 1);
      currentY += 8;

      let groupTotal = 0;
      const tableRows = [];
      groups[groupLabel].forEach(r => {
        const items = r.invoice?.items || [];
        if (items.length > 0) {
          items.forEach(item => {
            const lineTotal = item.quantity * item.unitPrice;
            tableRows.push([
              new Date(r.createdAt).toLocaleDateString('tr-TR'),
              trToEn(item.product.name),
              item.quantity.toString(),
              lineTotal.toLocaleString('tr-TR') + ' TL'
            ]);
            groupTotal += lineTotal;
            grandTotal += lineTotal;
          });
        } else {
          tableRows.push([
            new Date(r.createdAt).toLocaleDateString('tr-TR'),
            trToEn(r.description || 'Satis Islemi'),
            '1',
            r.amount.toLocaleString('tr-TR') + ' TL'
          ]);
          groupTotal += r.amount;
          grandTotal += r.amount;
        }
      });

      // Araç Toplamı Satırı Ekle
      tableRows.push([
        { 
          content: 'ARAC TOPLAMI:', 
          colSpan: 3, 
          styles: { halign: 'right', fontStyle: 'bold', fillColor: [245, 245, 245], textColor: [0, 0, 0] } 
        },
        { 
          content: groupTotal.toLocaleString('tr-TR') + ' TL', 
          styles: { halign: 'right', fontStyle: 'bold', fillColor: [245, 245, 245], textColor: [0, 0, 0] } 
        }
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Tarih', 'Satilan Urun / Hizmet', 'Adet', 'Tutar']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [80, 80, 80], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3, font: 'helvetica' },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 90 },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 37, halign: 'right' }
        },
        margin: { left: 14, right: 14 }
      });

      currentY = doc.lastAutoTable.finalY + 15;
    });

    // ---- Alt Toplam (Ortalanmış) ----
    if (currentY > 260) {
      doc.addPage();
      currentY = 20;
    }

    doc.setDrawColor(200, 200, 200);
    doc.line(14, currentY, 196, currentY);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOPLAM SATIS TUTARI', 105, currentY + 10, { align: 'center' });
    
    doc.setFontSize(16);
    doc.text(`${grandTotal.toLocaleString('tr-TR')} TL`, 105, currentY + 20, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('Bu belge Merka Ticaret otomasyon sistemi tarafindan hazirlanmistir.', 105, 285, { align: 'center' });

    doc.save(`${trToEn(selectedCustomer.name)}_Satis_Ekstresi_${today}.pdf`);
  };

  const columns = [
    { header: 'Tarih', field: 'createdAt', render: r => new Date(r.createdAt).toLocaleString('tr-TR') },
    { header: 'Araç', field: 'vehicle', render: r => r.vehicle ? <strong style={{color:'var(--color-primary)'}}>{r.vehicle.plate}</strong> : '-' },
    { header: 'İşlem Tipi', field: 'type', render: r => {
       const badgeClass = r.type === 'INCOME' ? 'success' : 'danger';
       const label = r.type === 'INCOME' ? 'Tahsilat' : 'Borçlandırma';
       return <span className={`badge badge-${badgeClass}`}>{label}</span>;
    }},
    { header: 'Detaylar / Ürünler', field: 'method', render: r => {
       const ms = { 
         CASH: 'Nakit Satış', POS: 'Kredi Kartı Satış', MAIL_ORDER: 'Mail Order Satış', 
         VERESIYE: 'Veresiye Satış', FİRMA_BORCU: 'Firma Borcu', 
         BORC_PARCA: 'Yedek Parça', BORC_ISCILIK: 'İşçilik',
         YANSIMA_BORC: 'Dış İşçilik'
       };
       const text = ms[r.method] || r.method;
       const items = r.invoice?.items || [];
       
       return (
        <div style={{ fontSize: '0.85rem' }}>
          <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{text} {r.description && `(${r.description})`}</div>
          {items.map((item, idx) => (
            <div key={idx} style={{ color: 'var(--color-text-muted)', paddingLeft: '0.5rem', borderLeft: '2px solid var(--color-border)', margin: '2px 0' }}>
              • {item.product.name} ({item.quantity} Adet x {item.unitPrice}₺)
            </div>
          ))}
        </div>
       );
    }},
    { header: 'Tutar', field: 'amount', render: r => (
      <span style={{ fontWeight:'bold', color: r.type === 'INCOME' ? 'var(--color-success)' : 'var(--color-danger)'}}>
        {r.type === 'INCOME' ? '+' : '-'}{r.amount.toLocaleString('tr-TR')} ₺
      </span>
    )}
  ];

  return (
    <div className="p-6" style={{ padding: '0 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{margin:0}}>Cari Hareket Raporu (Ekstre)</h1>
      </div>
      
      <Card glass className="mb-4">
        <CardHeader title="Müşteri / Cari" subtitle="Hareketlerini görüntülemek istediğiniz hesabı seçin" />
        <CardContent>
          <div style={{ maxWidth: '600px' }}>
            <Select
              options={customers.map(c => ({
                value: c.id,
                label: `${c.name} - Güncel Bakiye: ${c.balance > 0 ? c.balance + '₺ Borçlu' : c.balance < 0 ? Math.abs(c.balance) + '₺ Alacaklı' : 'Temiz'}`,
                searchString: `${c.name} ${c.vehicles ? c.vehicles.map(v => v.plate).join(' ') : ''}`
              }))}
              filterOption={(candidate, input) => {
                if (!input) return true;
                return candidate.data.searchString.toLowerCase().includes(input.toLowerCase()) || 
                       candidate.label.toLowerCase().includes(input.toLowerCase());
              }}
              onChange={handleSelectCustomer}
              placeholder="-- Müşteri Ara ve Seç --"
              isClearable
              isSearchable
              styles={customSelectStyles}
              menuPortalTarget={document.body}
              menuPosition={'fixed'}
            />
          </div>
        </CardContent>
      </Card>

      {selectedCustomer ? (
        <Card glass className="animate-fade-in">
          <div style={{ padding: '1.5rem', background: selectedCustomer.balance > 0 ? 'rgba(239,68,68,0.05)' : 'rgba(16,185,129,0.05)', borderBottom: '1px solid var(--color-border)', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-main)' }}>{selectedCustomer.name}</h2>
              <p style={{ margin: 0, fontSize: '1.125rem' }}>
                <strong>Güncel Hesap Durumu:</strong>{' '}
                <span style={{ color: selectedCustomer.balance > 0 ? 'var(--color-danger)' : selectedCustomer.balance < 0 ? 'var(--color-warning)' : 'var(--color-success)', fontWeight: 'bold' }}>
                  {selectedCustomer.balance > 0 ? `${selectedCustomer.balance.toLocaleString('tr-TR')} ₺ (Bize Borçlu)` : selectedCustomer.balance < 0 ? `${Math.abs(selectedCustomer.balance).toLocaleString('tr-TR')} ₺ (Bizden Alacaklı)` : '0 ₺ (Temiz)'}
                </span>
              </p>
            </div>
            
            <div className="customer-report-filters">
              <div className="segmented-control">
                <button 
                  className={`segment-btn ${filterType === 'ALL' ? 'active' : ''}`}
                  onClick={() => setFilterType('ALL')}
                >Hepsi</button>
                <button 
                  className={`segment-btn ${filterType === 'BU_GUN' ? 'active' : ''}`}
                  onClick={() => setFilterType('BU_GUN')}
                >Bu Gün</button>
                <button 
                  className={`segment-btn ${filterType === 'THIS_WEEK' ? 'active' : ''}`}
                  onClick={() => setFilterType('THIS_WEEK')}
                >Bu Hafta</button>
                <button 
                  className={`segment-btn ${filterType === 'THIS_MONTH' ? 'active' : ''}`}
                  onClick={() => setFilterType('THIS_MONTH')}
                >Bu Ay</button>
                <button 
                  className={`segment-btn ${filterType === 'THIS_YEAR' ? 'active' : ''}`}
                  onClick={() => setFilterType('THIS_YEAR')}
                >Bu Yıl</button>
                <button 
                  className={`segment-btn ${filterType === 'CUSTOM' ? 'active' : ''}`}
                  onClick={() => setFilterType('CUSTOM')}
                >Özel Aralık</button>
              </div>

              {filterType === 'CUSTOM' && (
                <div className="date-inputs-wrapper">
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="date-input-modern" style={{ width: '130px' }} />
                  <span className="date-separator">-</span>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="date-input-modern" style={{ width: '130px' }} />
                </div>
              )}

              <Button onClick={handleExportPDF} variant="primary" size="md">
                <Download size={18} style={{ marginRight: '8px' }} />
                PDF
              </Button>
            </div>
          </div>
          <div className="table-wrapper" style={{ overflowX: 'auto' }}>
            <Table columns={columns} data={filteredReports} emptyMessage="Seçilen kriterlere uygun hareket bulunmuyor." />
          </div>
        </Card>
      ) : (
        <div className="empty-state animate-fade-in" style={{ textAlign: 'center', padding: '6rem 2rem', border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-xl)', backgroundColor: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(5px)' }}>
          <FileSearch size={64} style={{ color: 'var(--color-primary)', opacity: 0.3, marginBottom: '1.5rem' }} />
          <h2 style={{ color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>Ekstre Görüntülemek İçin Bir Cari Seçin</h2>
          <p style={{ color: 'var(--color-text-muted)' }}>Müşterinin tüm işlemlerini, araç bazlı detaylarını ve ürün kalemlerini burada görebilirsiniz.</p>
          
          {activeCustomers.length > 0 && (
            <div className="active-customers-container">
              <div className="active-customers-title" style={{ justifyContent: 'center' }}>
                <History size={16} />
                Son İşlem Yapılan Cariler
              </div>
              <div className="active-customers-grid">
                {activeCustomers.map(c => (
                  <div 
                    key={c.id} 
                    className="active-customer-card"
                    onClick={() => handleSelectCustomer({ value: c.id, label: c.name })}
                  >
                    <div className="active-customer-tag">Hareket Var</div>
                    <div className="active-customer-name">{c.name}</div>
                    <div className={`active-customer-balance ${c.balance > 0 ? 'debt' : c.balance < 0 ? 'credit' : 'clean'}`}>
                      {c.balance > 0 ? `${c.balance.toLocaleString('tr-TR')} ₺ Borçlu` : c.balance < 0 ? `${Math.abs(c.balance).toLocaleString('tr-TR')} ₺ Alacaklı` : 'Temiz'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
