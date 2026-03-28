import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Table from '../components/ui/Table';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Search, Car, X, Plus, Edit2 } from 'lucide-react';
import { API_BASE_URL } from '../api/apiConfig';
import { SyncContext } from '../context/SyncContext';
import { useAlert } from '../context/AlertContext';
import './Vehicles.css';

export default function Vehicles() {
  const syncKey = useContext(SyncContext);
  const { showAlert } = useAlert();
  const [models, setModels] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [modelName, setModelName] = useState('');

  useEffect(() => {
    fetchModels();
  }, [syncKey]);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/carmodels?t=${new Date().getTime()}`);
      setModels(res.data);
    } catch (error) {
      console.error('Modeller yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingModel(null);
    setModelName('');
    setShowFormModal(true);
  };

  const handleOpenEdit = (model) => {
    setEditingModel(model);
    setModelName(model.name);
    setShowFormModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!modelName.trim()) return;
    try {
      if (editingModel) {
        await axios.put(`${API_BASE_URL}/api/carmodels/${editingModel.id}`, { name: modelName });
        showAlert('Model adı başarıyla güncellendi.', 'success');
      } else {
        await axios.post(`${API_BASE_URL}/api/carmodels`, { name: modelName });
        showAlert('Yeni model başarıyla eklendi.', 'success');
      }
      setModelName('');
      setShowFormModal(false);
      fetchModels();
    } catch (error) {
      showAlert('İşlem sırasında hata oluştu. Bu isimli bir model zaten mevcut olabilir.', 'error');
    }
  };

  const filteredModels = models.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { 
      header: 'Araç Model Adı', 
      field: 'name', 
      render: (row) => (
        <div className="vehicle-model-info">
          <Car size={20} className="text-primary" />
          <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{row.name}</span>
        </div>
      )
    },
    {
      header: 'Kayıtlı Araç Sayısı',
      field: 'vehicleCount',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge" style={{ 
            backgroundColor: row.vehicleCount > 0 ? 'var(--color-primary-soft)' : 'var(--color-border)',
            color: row.vehicleCount > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)',
            padding: '4px 12px',
            borderRadius: '12px',
            fontWeight: 800,
            fontSize: '0.9rem'
          }}>
            {row.vehicleCount} Adet
          </span>
        </div>
      )
    },
    { 
      header: 'İşlemler', 
      field: 'actions', 
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => handleOpenEdit(row)} 
            className="btn-icon-edit" 
            title="Model İsmini Düzenle"
          >
            <Edit2 size={18} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="vehicles-page animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Araç Modelleri Katalog Listesi</h1>
        <div className="header-actions">
          <Button onClick={handleOpenCreate}>
            <Plus size={18} /> Yeni Model Ekle
          </Button>
        </div>
      </div>

      <div className="header-stats mb-4">
        <div className="stat-item glass-panel">
          <span className="stat-value text-primary">{models.length}</span>
          <span className="stat-label">Sistemdeki Tanımlı Model Sayısı</span>
        </div>
      </div>

      <Card className="table-card">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Model ara..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="search-input"
            />
          </div>
        </div>
        
        {loading ? (
          <div className="loading-state">
            <div className="loader"></div>
            <p>Modeller yükleniyor...</p>
          </div>
        ) : (
          <Table columns={columns} data={filteredModels} />
        )}
      </Card>

      {/* Form Modalı (Ekle/Düzenle) */}
      {showFormModal && (
        <div className="modal-overlay" onClick={() => setShowFormModal(false)}>
          <div className="modal-content glass-panel fixed-modal animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingModel ? 'Model İsmini Düzenle' : 'Yeni Araç Modeli Ekle'}</h3>
              <button className="close-btn" onClick={() => setShowFormModal(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <Input 
                  label="Model İsmi" 
                  placeholder="Örn: TRAVEGO, MEGANE 4..."
                  value={modelName}
                  onChange={e => setModelName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="modal-footer">
                <Button variant="secondary" onClick={() => setShowFormModal(false)}>İptal</Button>
                <Button type="submit">{editingModel ? 'Güncelle' : 'Kaydet'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
