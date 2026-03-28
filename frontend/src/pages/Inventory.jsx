import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import { PackagePlus, Search, PlusCircle, Edit2, Check, X, DollarSign, AlertTriangle, Layers, BarChart2 } from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import { SyncContext } from '../context/SyncContext';
import { API_BASE_URL } from '../api/apiConfig';
import Select from 'react-select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import './Inventory.css';

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
  }),
  placeholder: (base) => ({
    ...base,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontSize: '0.9rem',
    color: 'var(--color-text-muted)'
  })
};

export default function Inventory() {
  const syncKey = React.useContext(SyncContext);
  const { showAlert } = useAlert();
  const [products, setProducts] = useState([]);
  const [carModels, setCarModels] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', brand: '', code: '', stock: 0, buyPrice: 0, sellPrice: 0, modelIds: [] });
  const [isAddingModel, setIsAddingModel] = useState(false);
  const [newModelName, setNewModelName] = useState('');

  useEffect(() => {
    fetchData();
  }, [syncKey]);

  const fetchData = async () => {
    try {
      const [prodRes, modelRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/products?t=${new Date().getTime()}`),
        axios.get(`${API_BASE_URL}/api/carmodels?t=${new Date().getTime()}`)
      ]);
      setProducts(prodRes.data);
      setCarModels(modelRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCarModel = async () => {
    if (!newModelName || newModelName.trim() === '') return;
    try {
      await axios.post(`${API_BASE_URL}/api/carmodels`, { name: newModelName.trim().toLocaleUpperCase('tr-TR') });
      setNewModelName('');
      setIsAddingModel(false);
      fetchData(); // Modelleri yenile
      showAlert('Araç Modeli başarıyla eklendi!', 'success');
    } catch(e) {
      showAlert('Eklenemedi veya zaten var.', 'error');
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      brand: product.brand || '',
      code: product.code,
      modelIds: product.compatibleModels?.map(m => m.id) || [],
      stock: product.stock,
      buyPrice: product.buyPrice || 0,
      sellPrice: product.sellPrice || 0
    });
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleCreateNew = () => {
    setFormData({ name: '', brand: '', code: '', stock: 0, buyPrice: 0, sellPrice: 0, modelIds: [] });
    setEditingId(null);
    setShowForm(!showForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        stock: parseInt(formData.stock) || 0,
        buyPrice: parseFloat(formData.buyPrice) || 0,
        sellPrice: parseFloat(formData.sellPrice) || 0
      };
      
      if (editingId) {
        await axios.put(`${API_BASE_URL}/api/products/${editingId}`, dataToSend);
      } else {
        await axios.post(`${API_BASE_URL}/api/products`, dataToSend);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', brand: '', code: '', stock: 0, buyPrice: 0, sellPrice: 0, modelIds: [] });
      fetchData();
    } catch (err) {
      showAlert('Kayıt/Düzenleme sırasında hata oluştu veya kod mevcut.', 'error');
    }
  };

  const [showCriticalOnly, setShowCriticalOnly] = useState(false);

  const baseFiltered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    p.compatibleModels?.some(m => m.name.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredProducts = showCriticalOnly ? baseFiltered.filter(p => p.stock < 5) : baseFiltered;

  const columns = [
    { header: 'Parça Kodu', field: 'code' },
    { header: 'Adı', field: 'name' },
    { header: 'Marka', field: 'brand' },
    { header: 'Araç Modelleri', field: 'compatibleModels', render: (row) => (
      row.compatibleModels?.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {row.compatibleModels.map(m => (
            <span key={m.id} style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--color-primary)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>
              {m.name}
            </span>
          ))}
        </div>
      ) : '-'
    ) },
    { header: 'Stok', field: 'stock', render: (row) => (
      <span style={{ color: row.stock < 5 ? 'var(--color-danger)' : 'inherit', fontWeight: row.stock < 5 ? 'bold' : 'normal' }}>
        {row.stock} Adet
      </span>
    )},
    { header: 'Alış Fiyatı', field: 'buyPrice', render: (row) => `${row.buyPrice} ₺` },
    { header: 'Satış Fiyatı', field: 'sellPrice', render: (row) => `${row.sellPrice} ₺` },
    { header: 'İşlemler', field: 'actions', render: (row) => (
      <button onClick={() => handleEdit(row)} className="btn-icon" style={{color: 'var(--color-primary)', background: 'transparent', border:'none', cursor:'pointer'}} title="Düzenle">
        <Edit2 size={18} />
      </button>
    )}
  ];

  const totalItems = products.length;
  const criticalStockCount = products.filter(p => p.stock < 5).length;
  const totalValue = products.reduce((sum, p) => sum + (p.stock * (p.buyPrice || 0)), 0);

  const chartData = [...products]
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 7)
    .map(p => ({
      name: p.code,
      fullName: p.name,
      Stok: p.stock
    }));

  return (
    <div className="inventory-page">
      <div className="page-header">
        <h1 className="page-title">Stok Yönetimi</h1>
        <Button onClick={handleCreateNew} className="action-btn">
          <PackagePlus size={18} /> Yeni Stok Ekle
        </Button>
      </div>

      {showForm && (
        <Card className="form-card mb-4" glass>
          <CardHeader title={editingId ? "Ürün Kartını Düzenle" : "Yeni Ürün Ekle"} />
          <CardContent>
            <form onSubmit={handleSubmit} className="add-form">
              <div className="form-grid">
                <Input label="Parça Kodu" required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toLocaleUpperCase('tr-TR')})} />
                <Input label="Adı" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toLocaleUpperCase('tr-TR')})} />
                <Input label="Marka" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value.toLocaleUpperCase('tr-TR')})} />
                
                {/* Çoklu Araç Modeli Seçimi veya Yeni Model Ekleme */}
                <div className="input-group span-2">
                  <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Uyumlu Modeller</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
                    {!isAddingModel ? (
                      <>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Select
                            isMulti
                            options={carModels.map(cm => ({ value: cm.id, label: cm.name }))}
                            value={carModels
                              .filter(cm => formData.modelIds.includes(cm.id))
                              .map(cm => ({ value: cm.id, label: cm.name }))
                            }
                            onChange={opts => setFormData({...formData, modelIds: opts ? opts.map(o => o.value) : []})}
                            placeholder="-- Modelleri Seç --"
                            isSearchable
                            menuPortalTarget={document.body}
                            noOptionsMessage={() => "Model bulunamadı"}
                            styles={customSelectStyles}
                          />
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setIsAddingModel(true)} 
                          title="Yeni Model Ekle"
                          className="btn-add-inline"
                          style={{ 
                            backgroundColor: 'var(--color-primary)', 
                            color: 'white', 
                            borderRadius: 'var(--radius-md)', 
                            padding: '0 0.75rem', 
                            border: 'none', 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <PlusCircle size={18} />
                        </button>
                      </>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.25rem', flex: 1 }}>
                        <input 
                          type="text" 
                          placeholder="Yeni model adı... (Örn: MEGANE 4)"
                          value={newModelName}
                          onChange={e => setNewModelName(e.target.value)}
                          className="input-field"
                          style={{ flex: 1, padding: '0.5rem' }}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCarModel();
                            }
                            if (e.key === 'Escape') setIsAddingModel(false);
                          }}
                        />
                        <button type="button" onClick={handleAddCarModel} style={{ color: 'var(--color-success)', padding: '0 0.5rem' }} title="Kaydet">
                          <Check size={20} />
                        </button>
                        <button type="button" onClick={() => { setIsAddingModel(false); setNewModelName(''); }} style={{ color: 'var(--color-danger)', padding: '0 0.5rem' }} title="İptal">
                          <X size={20} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <Input label="Stok Miktarı" type="number" required value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                <Input label="Alış Fiyatı (₺)" type="number" step="0.01" value={formData.buyPrice} onChange={e => setFormData({...formData, buyPrice: e.target.value})} />
                <Input label="Satış Fiyatı (₺)" type="number" step="0.01" value={formData.sellPrice} onChange={e => setFormData({...formData, sellPrice: e.target.value})} />
              </div>
              <div className="form-actions">
                <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>İptal</Button>
                <Button type="submit" variant="primary">{editingId ? "Güncelle" : "Kaydet"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* STOK ÖZETİ VE GRAFİK EKLENTİSİ */}
      {!showForm && (
        <>
          <div className="summary-grid mb-4">
            <Card glass className="summary-card animate-fade-in" style={{ animationDelay: '100ms' }}>
              <CardContent>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="summary-info">
                    <p className="summary-title">Depodaki Ürün Çeşidi</p>
                    <h2 className="summary-amount">{totalItems} <span style={{fontSize:'1rem', color:'var(--color-text-muted)'}}>Kalem</span></h2>
                  </div>
                  <div className="summary-icon" style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'var(--color-primary)' }}>
                    <Layers size={24} />
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
                borderColor: showCriticalOnly ? 'var(--color-danger)' : 'var(--color-border)',
                boxShadow: showCriticalOnly ? '0 0 0 2px rgba(244, 63, 94, 0.3)' : ''
              }}
              onClick={() => setShowCriticalOnly(!showCriticalOnly)}
              title="Tıklayarak kritik stokları filtreleyin"
            >
              <CardContent>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="summary-info">
                    <p className="summary-title">Kritik Stok Uyarısı</p>
                    <h2 className="summary-amount" style={{ color: criticalStockCount > 0 ? 'var(--color-danger)' : 'var(--color-text-main)' }}>
                      {criticalStockCount} <span style={{fontSize:'1rem', color:'var(--color-text-muted)'}}>Ürün ( &lt; 5 Adet )</span>
                    </h2>
                  </div>
                  <div className="summary-icon" style={{ backgroundColor: 'rgba(244, 63, 94, 0.1)', color: 'var(--color-danger)' }}>
                    <AlertTriangle size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card glass className="summary-card animate-fade-in" style={{ animationDelay: '300ms' }}>
              <CardContent>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="summary-info">
                    <p className="summary-title">Toplam Depo Maliyeti</p>
                    <h2 className="summary-amount">{totalValue.toLocaleString('tr-TR')} ₺</h2>
                  </div>
                  <div className="summary-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>
                    <DollarSign size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <Card glass className="animate-fade-in" style={{ animationDelay: '400ms' }}>
              <CardHeader 
                title={<span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BarChart2 size={20} style={{ color: 'var(--color-primary)' }} /> En Çok Bulunan İlk 7 Ürün</span>} 
                subtitle="Depoda en yüksek adette bulunan ürünlerin stok hacmi analizi"
              />
              <CardContent>
                <div style={{ width: '100%', height: 300, marginTop: '1rem' }}>
                  <ResponsiveContainer>
                    <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--color-border)" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: '0.875rem' }} />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-main)', fontSize: '0.875rem', fontWeight: 600 }} width={120} />
                      <Tooltip 
                        cursor={{ fill: 'var(--color-primary-soft)', opacity: 0.4 }}
                        contentStyle={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-lg)', backgroundColor: 'var(--color-surface)', backdropFilter: 'blur(8px)' }}
                        formatter={(value, name, props) => [`${value} Adet`, props.payload.fullName]}
                        labelStyle={{ color: 'var(--color-primary)', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="Stok" radius={[0, 4, 4, 0]} barSize={25} animationDuration={1500}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.Stok > 20 ? 'var(--color-success)' : entry.Stok > 5 ? 'var(--color-primary)' : 'var(--color-warning)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Card className="table-card">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Ad, kod veya araç modeli..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="search-input"
            />
          </div>
        </div>
        <Table columns={columns} data={filteredProducts} />
      </Card>
    </div>
  );
}
