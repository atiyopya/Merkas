import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import { UserPlus, Search, Edit2, Wallet, TrendingUp, HandCoins, Users, BarChart2 } from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import { SyncContext } from '../context/SyncContext';
import { API_BASE_URL } from '../api/apiConfig';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Plus, Trash2 } from 'lucide-react';
import './Customers.css';

export default function Customers() {
  const syncKey = React.useContext(SyncContext);
  const { showAlert } = useAlert();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    phone: '', 
    balance: 0,
    vehicles: [{ plate: '', model: '' }] 
  });

  useEffect(() => {
    fetchCustomers();
  }, [syncKey]);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/customers`);
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (customer) => {
    setFormData({ 
      name: customer.name, 
      phone: customer.phone || '', 
      balance: customer.balance || 0,
      vehicles: customer.vehicles && customer.vehicles.length > 0 
        ? customer.vehicles.map(v => ({ plate: v.plate, model: v.model || '' }))
        : [{ plate: '', model: '' }]
    });
    setEditingId(customer.id);
    setShowForm(true);
  };

  const handleCreateNew = () => {
    setFormData({ name: '', phone: '', balance: 0, vehicles: [{ plate: '', model: '' }] });
    setEditingId(null);
    setShowForm(!showForm);
  };

  const handleAddVehicle = () => {
    setFormData({
      ...formData,
      vehicles: [...formData.vehicles, { plate: '', model: '' }]
    });
  };

  const handleRemoveVehicle = (index) => {
    const newVehicles = [...formData.vehicles];
    newVehicles.splice(index, 1);
    setFormData({ ...formData, vehicles: newVehicles.length > 0 ? newVehicles : [{ plate: '', model: '' }] });
  };

  const handleVehicleChange = (index, field, value) => {
    const newVehicles = [...formData.vehicles];
    newVehicles[index][field] = field === 'plate' ? value.toLocaleUpperCase('tr-TR') : value;
    setFormData({ ...formData, vehicles: newVehicles });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, balance: parseFloat(formData.balance) || 0 };
      if (editingId) {
        await axios.put(`${API_BASE_URL}/api/customers/${editingId}`, payload);
      } else {
        await axios.post(`${API_BASE_URL}/api/customers`, payload);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', phone: '', balance: 0, vehicles: [{ plate: '', model: '' }] });
      fetchCustomers();
      showAlert(editingId ? 'Cari başarıyla güncellendi!' : 'Yeni cari başarıyla eklendi!', 'success');
    } catch (err) {
      showAlert('Kayıt/Düzenleme sırasında hata oluştu.', 'error');
    }
  };

  const [showDebtOnly, setShowDebtOnly] = useState(false);

  const baseFiltered = customers.filter(c => 
    c.name.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR')) || 
    (c.vehicles && c.vehicles.some(v => v.plate.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR'))))
  );

  const filteredCustomers = showDebtOnly ? baseFiltered.filter(c => c.balance > 0) : baseFiltered;

  const columns = [
    { header: 'Ad Soyad / Firma', field: 'name' },
    { header: 'Telefon', field: 'phone', render: (row) => row.phone || '-' },
    { header: 'Araç Bilgileri', field: 'vehicles', render: (row) => (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {row.vehicles && row.vehicles.length > 0 ? row.vehicles.map((v, i) => (
          <div key={i} style={{ 
            fontSize: '0.75rem', 
            backgroundColor: 'rgba(99, 102, 241, 0.1)', 
            padding: '2px 6px', 
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            border: '1px solid rgba(99, 102, 241, 0.2)'
          }}>
            <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{v.plate}</span>
          </div>
        )) : '-'}
      </div>
    )},
    { header: 'Bakiye Durumu', field: 'balance', render: (row) => {
      const isDebt = row.balance > 0;
      const isCredit = row.balance < 0;
      return (
        <span className={`badge ${isDebt ? 'badge-danger' : isCredit ? 'badge-warning' : 'badge-success'}`}>
          {isDebt ? `${row.balance.toLocaleString('tr-TR')} ₺ (Borçlu)` : isCredit ? `${Math.abs(row.balance).toLocaleString('tr-TR')} ₺ (Alacaklı)` : '0 ₺ (Temiz)'}
        </span>
      );
    }},
    { header: 'İşlemler', field: 'actions', render: (row) => (
      <button onClick={() => handleEdit(row)} className="btn-icon" style={{color: 'var(--color-primary)', background: 'transparent', border:'none', cursor:'pointer'}} title="Düzenle">
        <Edit2 size={18} />
      </button>
    )}
  ];

  const totalCustomers = customers.length;
  const totalDebt = customers.filter(c => c.balance > 0).reduce((sum, c) => sum + c.balance, 0);
  const totalCredit = customers.filter(c => c.balance < 0).reduce((sum, c) => sum + Math.abs(c.balance), 0);

  const chartData = [...customers]
    .filter(c => c.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 7)
    .map(c => ({
      name: c.name.length > 20 ? c.name.substring(0, 20) + '...' : c.name,
      fullName: c.name,
      Borc: c.balance
    }));

  return (
    <div className="customers-page">
      <div className="page-header">
        <h1 className="page-title">Cari Hesabı Yönetimi</h1>
        <Button onClick={handleCreateNew} className="action-btn">
          <UserPlus size={18} /> Yeni Cari Ekle
        </Button>
      </div>

      {!showForm && (
        <>
          <div className="summary-grid mb-4">
            <Card glass className="summary-card animate-fade-in" style={{ animationDelay: '100ms' }}>
              <CardContent>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="summary-info">
                    <p className="summary-title">Kayıtlı Cari Sayısı</p>
                    <h2 className="summary-amount">{totalCustomers} <span style={{fontSize:'1rem', color:'var(--color-text-muted)'}}>Firma/Kişi</span></h2>
                  </div>
                  <div className="summary-icon" style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'var(--color-primary)' }}>
                    <Users size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              glass 
              className="summary-card animate-fade-in" 
              style={{ 
                animationDelay: '200ms',
                cursor: 'pointer',
                borderColor: showDebtOnly ? 'var(--color-success)' : 'var(--color-border)',
                boxShadow: showDebtOnly ? '0 0 0 2px rgba(16, 185, 129, 0.3)' : ''
              }}
              onClick={() => setShowDebtOnly(!showDebtOnly)}
              title="Sadece borcu olan carileri filtrelemek için tıklayın"
            >
              <CardContent>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="summary-info">
                    <p className="summary-title">Piyasadaki Alacak (Tahsil Bekleyen)</p>
                    <h2 className="summary-amount" style={{ color: 'var(--color-success)' }}>{totalDebt.toLocaleString('tr-TR')} ₺</h2>
                  </div>
                  <div className="summary-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>
                    <TrendingUp size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card glass className="summary-card animate-fade-in" style={{ animationDelay: '300ms' }}>
              <CardContent>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="summary-info">
                    <p className="summary-title">Müşteriye Ödenecek (Avans/Eksi)</p>
                    <h2 className="summary-amount" style={{ color: totalCredit > 0 ? 'var(--color-danger)' : 'var(--color-text-main)' }}>{totalCredit.toLocaleString('tr-TR')} ₺</h2>
                  </div>
                  <div className="summary-icon" style={{ backgroundColor: 'rgba(244, 63, 94, 0.1)', color: 'var(--color-danger)' }}>
                    <HandCoins size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {chartData.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <Card glass className="animate-fade-in" style={{ animationDelay: '400ms' }}>
                <CardHeader 
                  title={<span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BarChart2 size={20} style={{ color: 'var(--color-primary)' }} /> En Çok Borcu Olan 7 Cari (Alacaklar)</span>} 
                  subtitle="Ödeme bekleyen en yüksek riskli cari hesapların dağılımı"
                />
                <CardContent>
                  <div style={{ width: '100%', height: 350, marginTop: '1rem' }}>
                    <ResponsiveContainer>
                      <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--color-border)" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: '0.875rem' }} tickFormatter={(value) => `${value.toLocaleString('tr-TR')} ₺`} />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-main)', fontSize: '0.875rem', fontWeight: 600 }} width={140} />
                        <Tooltip 
                          cursor={{ fill: 'var(--color-primary-soft)', opacity: 0.4 }}
                          contentStyle={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-lg)', backgroundColor: 'var(--color-surface)', backdropFilter: 'blur(8px)' }}
                          formatter={(value, name, props) => [`${value.toLocaleString('tr-TR')} ₺`, props.payload.fullName]}
                          labelStyle={{ color: 'var(--color-primary)', fontWeight: 'bold', marginBottom: '4px' }}
                        />
                        <Bar dataKey="Borc" radius={[0, 4, 4, 0]} barSize={25} animationDuration={1500}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index < 2 ? 'var(--color-danger)' : index < 4 ? 'var(--color-warning)' : 'var(--color-primary)'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {showForm && (
        <Card className="form-card mb-4" glass>
          <CardHeader title={editingId ? "Cari Kartını Düzenle" : "Yeni Cari Kartı Oluştur"} />
          <CardContent>
            <form onSubmit={handleSubmit} className="add-form">
              <div className="form-grid">
                <Input label="Müşteri / Firma Adı" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toLocaleUpperCase('tr-TR')})} />
                <Input label="Telefon Numarası" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                <Input label="Mevcut Bakiye (Borç)" type="number" step="0.01" value={formData.balance} onChange={e => setFormData({...formData, balance: e.target.value})} />
              </div>

              <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ margin: 0 }}>Araçlar (Plaka & Model)</h4>
                  <Button type="button" variant="secondary" size="sm" onClick={handleAddVehicle} style={{ padding: '0.4rem 0.8rem' }}>
                    <Plus size={16} /> Araç Ekle
                  </Button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {formData.vehicles.map((vehicle, index) => (
                    <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                      <Input 
                        label={index === 0 ? "Plaka" : ""} 
                        value={vehicle.plate} 
                        placeholder="Örn: 34ABC123"
                        onChange={e => handleVehicleChange(index, 'plate', e.target.value)} 
                        required={index === 0}
                      />
                      <Input 
                        label={index === 0 ? "Araç Modeli (Opsiyonel)" : ""} 
                        value={vehicle.model} 
                        placeholder="Örn: Renault Megane"
                        onChange={e => handleVehicleChange(index, 'model', e.target.value)} 
                      />
                      <button 
                        type="button" 
                        onClick={() => handleRemoveVehicle(index)}
                        style={{ 
                          marginBottom: '0.75rem', 
                          color: 'var(--color-danger)', 
                          padding: '0.5rem',
                          display: index === 0 && formData.vehicles.length === 1 ? 'none' : 'block'
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-actions">
                <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>İptal</Button>
                <Button type="submit" variant="primary">{editingId ? "Güncelle" : "Kaydet"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="table-card">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="İsim veya plaka ile ara..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="search-input"
            />
          </div>
        </div>
        <Table columns={columns} data={filteredCustomers} />
      </Card>
    </div>
  );
}
