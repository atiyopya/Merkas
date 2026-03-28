import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Table from '../components/ui/Table';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Search, Car, Info, Package, AlertCircle, X, Plus, Edit2 } from 'lucide-react';
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
  const [selectedModel, setSelectedModel] = useState(null);
  const [compatibleParts, setCompatibleParts] = useState([]);
  const [partsLoading, setPartsLoading] = useState(false);
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

  const handleShowParts = async (model) => {
    setSelectedModel(model);
    setCompatibleParts([]);
    setPartsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/carmodels/${model.id}/parts`);
      setCompatibleParts(res.data);
    } catch (error) {
      console.error('Uyumlu parçalar yüklenemedi:', error);
    } finally {
      setPartsLoading(false);
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
      header: 'İşlemler', 
      field: 'actions', 
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => handleShowParts(row)}
            className="action-btn-slim"
            title="Uyumlu Parçaları Gör"
          >
            <Package size={14} /> Uyumlu Parçalar
          </Button>
          <button 
            onClick={() => handleOpenEdit(row)} 
            className="btn-icon-edit" 
            title="Düzenle"
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
        <h1 className="page-title">Araç Modelleri & Uyumlu Parçalar</h1>
        <div className="header-actions">
          <Button onClick={handleOpenCreate}>
            <Plus size={18} /> Yeni Model Ekle
          </Button>
        </div>
      </div>

      <div className="header-stats mb-4">
        <div className="stat-item glass-panel">
          <span className="stat-value text-primary">{models.length}</span>
          <span className="stat-label">Kayıtlı Model Sayısı</span>
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

      {/* Uyumlu Parçalar Modalı */}
      {selectedModel && (
        <div className="modal-overlay" onClick={() => setSelectedModel(null)}>
          <div className="modal-content glass-panel parts-modal animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-title">
                <h3>{selectedModel.name} - Uyumlu Parçalar</h3>
                <p>Uyumlu modeller listesinde <b>{selectedModel.name}</b> bulunan stok kalemi sayısı: {compatibleParts.length}</p>
              </div>
              <button className="close-btn" onClick={() => setSelectedModel(null)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              {partsLoading ? (
                <div className="loading-state">
                  <div className="loader"></div>
                </div>
              ) : compatibleParts.length > 0 ? (
                <div className="parts-list">
                  {compatibleParts.map(part => (
                    <div key={part.id} className="part-item-card">
                      <div className="part-info">
                        <div className="part-code">{part.code}</div>
                        <div className="part-name">{part.name}</div>
                        <div className="part-brand">{part.brand}</div>
                      </div>
                      <div className="part-stock-info">
                        <div className={`stock-badge ${part.stock < 5 ? 'low' : ''}`}>
                          {part.stock} Adet
                        </div>
                        <div className="part-price">{part.sellPrice} ₺</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <AlertCircle size={48} color="var(--color-warning)" />
                  <h4>Uyumlu Parça Bulunamadı</h4>
                  <p>Stoklarınızda <b>{selectedModel.name}</b> ile eşleşen bir ürün henüz kaydedilmemiş.</p>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <Button onClick={() => setSelectedModel(null)}>Kapat</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
