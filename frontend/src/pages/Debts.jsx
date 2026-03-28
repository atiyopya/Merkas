import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Table from '../components/ui/Table';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from 'react-select';
import { useAlert } from '../context/AlertContext';
import { SyncContext } from '../context/SyncContext';
import { API_BASE_URL } from '../api/apiConfig';
import { PlusCircle, Edit2 } from 'lucide-react';

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

export default function Debts() {
  const syncKey = React.useContext(SyncContext);
  const { showAlert } = useAlert();
  const [creditors, setCreditors] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [debtCategory, setDebtCategory] = useState('YEDEK_PARÇA');
  const [relatedCustomerId, setRelatedCustomerId] = useState('');
  const [vehicleId, setVehicleId] = useState('');

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [selectedCreditor, setSelectedCreditor] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCreditor, setEditingCreditor] = useState(null);
  const [editAmount, setEditAmount] = useState('');

  useEffect(() => {
    fetchData();
  }, [syncKey]);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/customers`);
      setAllCustomers(res.data);
      setCreditors(res.data.filter(c => c.balance < 0));
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenModal = () => {
    setDebtCategory('YEDEK_PARÇA');
    setRelatedCustomerId('');
    setVehicleId('');
    setShowModal(true);
  };

  const handleAddDebt = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) return showAlert('Lütfen geçerli bir tutar giriniz.', 'warning');
    if (!selectedCustomerId) return showAlert('Lütfen bir firma veya usta seçiniz.', 'warning');
    if (debtCategory === 'İŞÇİLİK' && !relatedCustomerId) return showAlert('İşçiliğin hangi cari için yapıldığını seçiniz.', 'warning');

    let description = null;
    if (debtCategory === 'İŞÇİLİK' && relatedCustomerId) {
      const relC = allCustomers.find(c => c.id === parseInt(relatedCustomerId));
      if (relC) description = `${relC.name} için`;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/finance/add-debt`, {
        customerId: parseInt(selectedCustomerId),
        amount: parseFloat(amount),
        category: debtCategory,
        description,
        relatedCustomerId: (debtCategory === 'İŞÇİLİK' && relatedCustomerId) ? parseInt(relatedCustomerId) : null,
        vehicleId: vehicleId ? parseInt(vehicleId) : null
      });
      showAlert('Borç başarıyla eklendi!', 'success');
      setShowModal(false);
      fetchData();
    } catch (err) {
      showAlert('İşlem sırasında hata oluştu.', 'error');
    }
  };

  const handleOpenPaymentModal = (creditor) => {
    setSelectedCreditor(creditor);
    setPaymentAmount('');
    setPaymentMethod('CASH');
    setVehicleId('');
    setShowPaymentModal(true);
  };

  const handlePayDebt = async (e) => {
    e.preventDefault();
    if (!paymentAmount || paymentAmount <= 0) return showAlert('Lütfen geçerli bir tutar giriniz.', 'warning');
    if (paymentAmount > Math.abs(selectedCreditor.balance)) return showAlert('Ödeme tutarı toplam borçtan büyük olamaz.', 'warning');

    try {
      await axios.post(`${API_BASE_URL}/api/finance/pay-debt`, {
        customerId: selectedCreditor.id,
        amount: parseFloat(paymentAmount),
        paymentMethod,
        vehicleId: vehicleId ? parseInt(vehicleId) : null
      });
      showAlert('Ödeme başarıyla kaydedildi!', 'success');
      setShowPaymentModal(false);
      setSelectedCreditor(null);
      fetchData();
    } catch (err) {
      showAlert('Ödeme işlemi sırasında hata oluştu.', 'error');
    }
  };

  const handleOpenEditModal = (creditor) => {
    setEditingCreditor(creditor);
    setEditAmount(Math.abs(creditor.balance));
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (editAmount === '' || editAmount < 0) return showAlert('Lütfen geçerli bir tutar giriniz.', 'warning');

    try {
      await axios.put(`${API_BASE_URL}/api/customers/${editingCreditor.id}`, {
        name: editingCreditor.name,
        phone: editingCreditor.phone || null,
        vehicles: editingCreditor.vehicles || [],
        balance: -parseFloat(editAmount)
      });
      showAlert('Borç başarıyla güncellendi!', 'success');
      setShowEditModal(false);
      setEditingCreditor(null);
      fetchData();
    } catch(err) {
      showAlert('Güncelleme sırasında hata oluştu.', 'error');
    }
  };

  const columns = [
    { header: 'Cari / Usta Adı', field: 'name' },
    { header: 'Telefon', field: 'phone', render: r => r.phone || '-' },
    { header: 'Firmamızın Anlık Borcu', field: 'balance', render: r => (
      <span style={{ color: 'var(--color-danger)', fontWeight: 'bold', fontSize: '1rem' }}>
        {Math.abs(r.balance).toLocaleString('tr-TR')} ₺
      </span>
    )},
    { header: 'İşlem', field: 'action', render: (row) => (
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <Button variant="success" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }} onClick={() => handleOpenPaymentModal(row)}>
          Borç Öde
        </Button>
        <button onClick={() => handleOpenEditModal(row)} className="btn-icon" style={{color: 'var(--color-primary)', background: 'transparent', border:'none', cursor:'pointer'}} title="Düzenle">
          <Edit2 size={18} />
        </button>
      </div>
    )}
  ];

  return (
    <div className="debts-page p-6" style={{ padding: '0 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{margin:0}}>Firma Borçları ve Giderler</h1>
        <Button onClick={handleOpenModal} variant="primary">
          <PlusCircle size={18} style={{marginRight: '0.5rem'}} /> Yeni Borç / Gider Ekle
        </Button>
      </div>

      <Card glass>
        <CardHeader title="Alacaklılar (Firmamızın Borcu Olanlar)" subtitle="Ödeme yapılması gereken hesaplar" />
        <Table columns={columns} data={creditors} emptyMessage="Şu anda firmamızın kayıtlı hiçbir borcu bulunmamaktadır." />
      </Card>

      {showModal && (
        <div style={modalOverlayStyle}>
          <div className="glass-modal" style={modalCardStyle}>
            <CardHeader title="Yeni Borç Ekle" />
            <CardContent>
              <form onSubmit={handleAddDebt}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Hangi Firmaya / Ustaya Borçlanıldı?</label>
                  <Select
                    options={allCustomers.map(c => ({
                      value: c.id,
                      label: `${c.name} - Güncel Bakiye: ${c.balance > 0 ? c.balance + '₺ Alacaklıyız' : c.balance < 0 ? Math.abs(c.balance) + '₺ Borçluyuz' : 'Temiz'}`,
                      searchString: `${c.name} ${c.vehicles ? c.vehicles.map(v => v.plate).join(' ') : ''}`
                    }))}
                    filterOption={(candidate, input) => {
                      if (!input) return true;
                      return candidate.data.searchString.toLowerCase().includes(input.toLowerCase()) || 
                             candidate.label.toLowerCase().includes(input.toLowerCase());
                    }}
                    value={
                      selectedCustomerId 
                        ? { 
                            value: selectedCustomerId, 
                            label: (() => {
                              const c = allCustomers.find(x => x.id === parseInt(selectedCustomerId));
                              return c ? `${c.name}` : '';
                            })()
                          }
                        : null
                    }
                    onChange={opt => setSelectedCustomerId(opt ? opt.value : '')}
                    placeholder="-- Cari Ara --"
                    isClearable
                    isSearchable
                    menuPortalTarget={document.body}
                    menuPosition={'fixed'}
                    styles={customSelectStyles}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="input-label" style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 500 }}>Borç Türü (Kategori)</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['YEDEK_PARÇA', 'İŞÇİLİK'].map(cat => {
                      const isActive = debtCategory === cat;
                      return (
                        <button 
                          key={cat}
                          type="button"
                          onClick={() => setDebtCategory(cat)}
                          style={{
                            flex: 1,
                            padding: '0.75rem',
                            border: isActive ? 'none' : '1px solid var(--color-border)',
                            background: isActive ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'var(--color-surface)',
                            color: isActive ? 'white' : 'var(--color-text-main)',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            fontWeight: '600',
                            transition: 'all 0.3s ease',
                            fontSize: '0.875rem',
                            boxShadow: isActive ? '0 4px 10px rgba(79, 70, 229, 0.2)' : 'none'
                          }}
                        >
                          {cat === 'YEDEK_PARÇA' ? 'Yedek Parça' : 'İşçilik'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {debtCategory === 'İŞÇİLİK' && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Hangi Müşteri (Cari) İçin Yapıldı? (Zorunlu)</label>
                    <Select
                      options={allCustomers.map(c => ({
                        value: c.id,
                        label: `${c.name}`,
                        searchString: `${c.name} ${c.vehicles ? c.vehicles.map(v => v.plate).join(' ') : ''}`
                      }))}
                      filterOption={(candidate, input) => {
                        if (!input) return true;
                        return candidate.data.searchString.toLowerCase().includes(input.toLowerCase()) || 
                               candidate.label.toLowerCase().includes(input.toLowerCase());
                      }}
                      value={
                        relatedCustomerId 
                          ? { 
                              value: relatedCustomerId, 
                              label: (() => {
                                const c = allCustomers.find(x => x.id === parseInt(relatedCustomerId));
                                return c ? `${c.name}` : '';
                              })()
                            }
                          : null
                      }
                      onChange={opt => setRelatedCustomerId(opt ? opt.value : '')}
                      placeholder="-- Müşteri Ara --"
                      isClearable
                      isSearchable
                      menuPortalTarget={document.body}
                      menuPosition={'fixed'}
                      styles={customSelectStyles}
                    />
                  </div>
                )}

                {(debtCategory === 'İŞÇİLİK' && relatedCustomerId) && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>İlgili Araç (İşçilik Yapılan)</label>
                    <Select
                      options={allCustomers.find(c => c.id === parseInt(relatedCustomerId))?.vehicles?.map(v => ({
                        value: v.id,
                        label: `${v.plate}${v.model ? ` - ${v.model}` : ''}`
                      })) || []}
                      value={
                        vehicleId 
                          ? { 
                              value: vehicleId, 
                              label: allCustomers.find(c => c.id === parseInt(relatedCustomerId))?.vehicles?.find(v => v.id === vehicleId)?.plate || ''
                            }
                          : null
                      }
                      onChange={opt => setVehicleId(opt ? opt.value : '')}
                      menuPortalTarget={document.body}
                      menuPosition={'fixed'}
                      styles={customSelectStyles}
                      noOptionsMessage={() => "Bu cariye kayıtlı araç bulunamadı"}
                    />
                  </div>
                )}

                <div style={{ marginBottom: '2rem' }}>
                  <Input 
                    label="Borç Tutarı (₺)" 
                    type="number" 
                    step="0.01" 
                    required 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>İptal</Button>
                  <button 
                    type="submit" 
                    style={{ 
                      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                      color: 'white',
                      border: 'none',
                      padding: '0 1.5rem',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)'
                    }}>
                    Borç Kaydet
                  </button>
                </div>
              </form>
            </CardContent>
          </div>
        </div>
      )}

      {showPaymentModal && selectedCreditor && (
        <div style={modalOverlayStyle}>
          <div className="glass-modal" style={modalCardStyle}>
            <CardHeader title="Firma Borcu Ödeme İşlemi" />
            <CardContent>
              <div style={customerInfoStyle}>
                <p style={{ margin: '0 0 0.5rem 0' }}><strong>Firma/Cari:</strong> {selectedCreditor.name}</p>
                <p style={{ margin: 0 }}><strong>Firmamızın Güncel Borcu:</strong> <span style={{color:'var(--color-danger)', fontWeight:'bold', fontSize:'1.125rem'}}>{Math.abs(selectedCreditor.balance).toLocaleString('tr-TR')} ₺</span></p>
              </div>

              <form onSubmit={handlePayDebt}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="input-label" style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 500 }}>Ödeme (Çıkış) Yöntemi</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['CASH', 'POS', 'MAIL_ORDER'].map(method => {
                      let activeGradient = '';
                      if (method === 'CASH') activeGradient = 'linear-gradient(135deg, #10b981, #059669)';
                      if (method === 'POS') activeGradient = 'linear-gradient(135deg, #3b82f6, #2563eb)';
                      if (method === 'MAIL_ORDER') activeGradient = 'linear-gradient(135deg, #f97316, #ea580c)';
                      
                      const isActive = paymentMethod === method;
                      return (
                        <button 
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          style={{
                            flex: 1,
                            padding: '0.75rem',
                            border: isActive ? 'none' : '1px solid var(--color-border)',
                            background: isActive ? activeGradient : 'var(--color-surface)',
                            color: isActive ? 'white' : 'var(--color-text-main)',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            fontWeight: '600',
                            transition: 'all 0.3s ease',
                            fontSize: '0.875rem',
                            boxShadow: isActive ? '0 4px 10px rgba(0,0,0,0.15)' : 'none'
                          }}
                        >
                          {method === 'CASH' ? 'Kasadan Nakit' : method === 'POS' ? 'Banka Transferi / POS' : 'Posta Siparişi'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '2rem' }}>
                  <div style={{ flex: 1 }}>
                    <Input 
                      label="Ödenecek Tutar (₺)" 
                      type="number" 
                      step="0.01" 
                      required 
                      value={paymentAmount} 
                      onChange={e => setPaymentAmount(e.target.value)} 
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setPaymentAmount(Math.abs(selectedCreditor.balance))} 
                    style={{ 
                      marginBottom: '1rem', 
                      height: '42px', 
                      padding: '0 1rem',
                      background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      fontWeight: '500',
                      boxShadow: '0 4px 10px rgba(79, 70, 229, 0.2)'
                    }}
                  >
                    Borcu Kapat (Tamamı)
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <Button type="button" variant="secondary" onClick={() => setShowPaymentModal(false)}>İptal</Button>
                  <button 
                    type="submit" 
                    style={{ 
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      border: 'none',
                      padding: '0 1.5rem',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)'
                    }}>
                    Ödemeyi Onayla
                  </button>
                </div>
              </form>
            </CardContent>
          </div>
        </div>
      )}

      {showEditModal && editingCreditor && (
        <div style={modalOverlayStyle}>
          <div className="glass-modal" style={modalCardStyle}>
            <CardHeader title="Borç Tutarını Düzenle" />
            <CardContent>
              <form onSubmit={handleEditSubmit}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ margin: '0 0 1rem 0' }}><strong>Firma/Cari:</strong> {editingCreditor.name}</p>
                  <Input 
                    label="Yeni Borç Tutarı (₺)" 
                    type="number" 
                    step="0.01" 
                    required 
                    value={editAmount} 
                    onChange={e => setEditAmount(e.target.value)} 
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <Button type="button" variant="secondary" onClick={() => setShowEditModal(false)}>İptal</Button>
                  <button 
                    type="submit" 
                    style={{ 
                      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                      color: 'white',
                      border: 'none',
                      padding: '0 1.5rem',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)'
                    }}>
                    Güncelle
                  </button>
                </div>
              </form>
            </CardContent>
          </div>
        </div>
      )}
    </div>
  );
}

const modalOverlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
  backdropFilter: 'blur(8px)'
};

const modalCardStyle = {
  width: '100%',
  maxWidth: '500px',
  margin: '1rem',
  background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(243,244,246,0.95) 100%)',
  border: '1px solid rgba(255,255,255,0.5)',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 40px rgba(255,255,255,0.5) inset',
  borderRadius: '16px',
  overflow: 'hidden'
};

const customerInfoStyle = {
  padding: '1rem',
  background: 'linear-gradient(to right, rgba(99, 102, 241, 0.05), rgba(99, 102, 241, 0.1))',
  borderRadius: 'var(--radius-md)',
  marginBottom: '1.5rem',
  border: '1px solid rgba(99, 102, 241, 0.2)'
};
