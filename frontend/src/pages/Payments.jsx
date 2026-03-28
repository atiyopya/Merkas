import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Table from '../components/ui/Table';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAlert } from '../context/AlertContext';
import { SyncContext } from '../context/SyncContext';
import { API_BASE_URL } from '../api/apiConfig';
import Select from 'react-select';

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

export default function Payments() {
  const syncKey = React.useContext(SyncContext);
  const { showAlert } = useAlert();
  const [debtors, setDebtors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [vehicleId, setVehicleId] = useState('');

  useEffect(() => {
    fetchDebtors();
  }, [syncKey]);

  const fetchDebtors = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/customers`);
      setDebtors(res.data.filter(c => c.balance > 0));
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenModal = (customer) => {
    setSelectedCustomer(customer);
    setAmount('');
    setPaymentMethod('CASH');
    setVehicleId('');
    setShowModal(true);
  };

  const setFullDebt = () => {
    if (selectedCustomer) {
      setAmount(selectedCustomer.balance);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) return showAlert('Lütfen geçerli bir tutar giriniz.', 'warning');
    if (amount > selectedCustomer.balance) return showAlert('Tahsilat tutarı toplam borçtan büyük olamaz.', 'warning');

    try {
      await axios.post(`${API_BASE_URL}/api/finance/payment`, {
        customerId: selectedCustomer.id,
        amount: parseFloat(amount),
        paymentMethod,
        vehicleId: vehicleId ? parseInt(vehicleId) : null
      });
      showAlert('Tahsilat başarıyla kaydedildi!', 'success');
      setShowModal(false);
      setSelectedCustomer(null);
      fetchDebtors();
    } catch (err) {
      showAlert('Tahsilat işlemi sırasında hata oluştu.', 'error');
    }
  };

  const columns = [
    { header: 'Cari / Müşteri Adı', field: 'name' },
    { header: 'Telefon', field: 'phone', render: r => r.phone || '-' },
    { header: 'Toplam Veresiye Borcu', field: 'balance', render: r => (
      <span style={{ color: 'var(--color-danger)', fontWeight: 'bold', fontSize: '1rem' }}>
        {r.balance.toLocaleString('tr-TR')} ₺
      </span>
    )},
    { header: 'İşlem', field: 'action', render: (row) => (
      <Button variant="primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} onClick={() => handleOpenModal(row)}>
        Tahsilat Al
      </Button>
    )}
  ];

  return (
    <div className="payments-page">
      <h1 className="page-title">Tahsilat ve Veresiye Takibi</h1>
      <Card glass>
        <CardHeader title="Borçlu (Veresiye) Cariler" subtitle="Ödeme bekleyen hesaplar" />
        <Table columns={columns} data={debtors} />
      </Card>

      {showModal && selectedCustomer && (
        <div style={modalOverlayStyle}>
          <div className="glass-modal" style={modalCardStyle}>
            <CardHeader title="Tahsilat İşlemi" />
            <CardContent>
              <div style={customerInfoStyle}>
                <p style={{ margin: '0 0 0.5rem 0' }}><strong>Cari:</strong> {selectedCustomer.name}</p>
                <p style={{ margin: 0 }}><strong>Mevcut Borç:</strong> <span style={{color:'var(--color-danger)', fontWeight:'bold', fontSize:'1.125rem'}}>{selectedCustomer.balance.toLocaleString('tr-TR')} ₺</span></p>
              </div>

              <form onSubmit={handlePaymentSubmit}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="input-label" style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 500 }}>Ödeme Yöntemi</label>
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
                          {method === 'CASH' ? 'Nakit' : method === 'POS' ? 'Kredi Kartı' : 'Posta Siparişi'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label className="input-label" style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 500 }}>İlgili Araç (Opsiyonel)</label>
                    <Select
                        options={selectedCustomer.vehicles?.map(v => ({
                            value: v.id,
                            label: `${v.plate}${v.model ? ` - ${v.model}` : ''}`
                        })) || []}
                        value={
                            vehicleId 
                                ? { 
                                    value: vehicleId, 
                                    label: selectedCustomer.vehicles?.find(v => v.id === vehicleId)?.plate || ''
                                }
                                : null
                        }
                        onChange={opt => setVehicleId(opt ? opt.value : '')}
                        placeholder="-- Araç Seç --"
                        isClearable
                        menuPortalTarget={document.body}
                        menuPosition={'fixed'}
                        styles={customSelectStyles}
                        noOptionsMessage={() => "Bu cariye kayıtlı araç bulunamadı"}
                    />
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '2rem' }}>
                  <div style={{ flex: 1 }}>
                    <Input 
                      label="Tahsil Edilecek Tutar (₺)" 
                      type="number" 
                      step="0.01" 
                      required 
                      value={amount} 
                      onChange={e => setAmount(e.target.value)} 
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={setFullDebt} 
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
                    Tamamını Seç
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>İptal</Button>
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
                    Tahsilatı Onayla
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
