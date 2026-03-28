import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Table from '../components/ui/Table';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Search, Car, User, Info, Package, AlertCircle, X } from 'lucide-react';
import { API_BASE_URL } from '../api/apiConfig';
import { SyncContext } from '../context/SyncContext';
import './Vehicles.css';

export default function Vehicles() {
  const syncKey = useContext(SyncContext);
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [compatibleParts, setCompatibleParts] = useState([]);
  const [partsLoading, setPartsLoading] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, [syncKey]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/vehicles?t=${new Date().getTime()}`);
      setVehicles(res.data);
    } catch (error) {
      console.error('Araçlar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowParts = async (vehicle) => {
    setSelectedVehicle(vehicle);
    setCompatibleParts([]);
    setPartsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/vehicles/${vehicle.id}/parts`);
      setCompatibleParts(res.data);
    } catch (error) {
      console.error('Uyumlu parçalar yüklenemedi:', error);
    } finally {
      setPartsLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter(v => 
    v.plate.toLowerCase().includes(search.toLowerCase()) ||
    v.model?.toLowerCase().includes(search.toLowerCase()) ||
    v.customer?.name.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { 
      header: 'Plaka', 
      field: 'plate', 
      render: (row) => (
        <div className="plate-badge">
          {row.plate.toLocaleUpperCase('tr-TR')}
        </div>
      )
    },
    { 
      header: 'Model', 
      field: 'model', 
      render: (row) => (
        <div className="vehicle-model-info">
          <Car size={16} className="text-muted" />
          <span>{row.model || 'Belirtilmemiş'}</span>
        </div>
      )
    },
    { 
      header: 'Müşteri / Sahibi', 
      field: 'customer', 
      render: (row) => (
        <div className="customer-info-cell">
          <User size={16} className="text-muted" />
          <div>
            <div style={{fontWeight: 600}}>{row.customer?.name}</div>
            <div style={{fontSize: '0.75rem', color: 'var(--color-text-muted)'}}>{row.customer?.phone}</div>
          </div>
        </div>
      )
    },
    { 
      header: 'İşlemler', 
      field: 'actions', 
      render: (row) => (
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => handleShowParts(row)}
          className="action-btn-slim"
        >
          <Package size={14} /> Uyumlu Parçalar
        </Button>
      )
    }
  ];

  return (
    <div className="vehicles-page animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Araçlar</h1>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-value">{vehicles.length}</span>
            <span className="stat-label">Toplam Araç</span>
          </div>
        </div>
      </div>

      <Card className="table-card">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Plaka, model veya müşteri ismi ara..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="search-input"
            />
          </div>
        </div>
        
        {loading ? (
          <div className="loading-state">
            <div className="loader"></div>
            <p>Araçlar yükleniyor...</p>
          </div>
        ) : (
          <Table columns={columns} data={filteredVehicles} />
        )}
      </Card>

      {/* Uyumlu Parçalar Modalı */}
      {selectedVehicle && (
        <div className="modal-overlay" onClick={() => setSelectedVehicle(null)}>
          <div className="modal-content glass-panel parts-modal animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-title">
                <h3>{selectedVehicle.plate} - Uyumlu Parçalar</h3>
                <p>{selectedVehicle.model} modeli için stoktaki tüm parçalar</p>
              </div>
              <button className="close-btn" onClick={() => setSelectedVehicle(null)}>
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
                  <p>Bu aracın modeline (<b>{selectedVehicle.model}</b>) uygun stok kaydı bulunmamaktadır.</p>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <Button onClick={() => setSelectedVehicle(null)}>Kapat</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
