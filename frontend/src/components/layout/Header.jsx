import React from 'react';
import { Bell, UserCircle, LogOut, Settings, Database, RefreshCw, Search, Clock, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AsyncSelect from 'react-select/async';
import { API_BASE_URL } from '../../api/apiConfig';
import './Header.css';

export default function Header({ onToggleSidebar }) {
    const { user, logout } = useAuth();
    const { showAlert } = useAlert();
    const location = useLocation();
    const navigate = useNavigate();
    const [isBackingUp, setIsBackingUp] = React.useState(false);
    const [currentTime, setCurrentTime] = React.useState(new Date());
    const [isSearchOpen, setIsSearchOpen] = React.useState(false);


    // Saati güncelle
    React.useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleBackup = async () => {
        setIsBackingUp(true);
        try {
            await axios.post(`${API_BASE_URL}/api/backup`);
            showAlert('Veritabanı Google Drive\'a başarıyla yedeklendi!', 'success');
        } catch (error) {
            showAlert('Yedekleme sırasında bir hata oluştu.', 'error');
        } finally {
            setIsBackingUp(false);
        }
    };

    // Global Arama Fonksiyonu
    const loadOptions = async (inputValue) => {
        if (!inputValue) return [];
        try {
            const response = await axios.get(`${API_BASE_URL}/api/search?q=${inputValue}`);
            return response.data.results.map(res => ({
                value: res.id,
                label: res.title,
                subtitle: res.subtitle,
                type: res.type,
                link: res.link
            }));
        } catch (error) {
            return [];
        }
    };

    const handleSearchSelect = (option) => {
        if (option) {
            setIsSearchOpen(false);
            if (option.type === 'CUSTOMER' || option.type === 'VEHICLE') {
                navigate(`/customers?id=${option.value}`);
            } else {
                navigate(option.link);
            }
        }
    };

    const searchStyles = {
        control: (base) => ({
            ...base,
            background: 'var(--color-primary-soft)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
            minWidth: '280px',
            boxShadow: 'none',
            '&:hover': { border: '1px solid var(--color-primary)' }
        }),
        placeholder: (base) => ({ 
            ...base, 
            color: 'var(--color-text-muted)', 
            fontSize: '0.85rem',
            marginLeft: '28px' // İkon boşluğu
        }),
        input: (base) => ({ 
            ...base, 
            color: 'var(--color-text-main)',
            marginLeft: '28px'
        }),
        singleValue: (base) => ({ ...base, color: 'var(--color-text-main)', marginLeft: '28px' }),
        menu: (base) => ({
            ...base,
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
            zIndex: 1000
        }),
        option: (base, state) => ({
            ...base,
            background: state.isFocused ? 'var(--color-surface-hover)' : 'transparent',
            color: 'var(--color-text-main)',
            cursor: 'pointer'
        })
    };

    const CustomOption = ({ innerProps, label, data }) => (
        <div {...innerProps} className="search-option">
            <div className="search-option-title">{label}</div>
            <div className="search-option-subtitle">{data.subtitle}</div>
        </div>
    );

    return (
        <header className="header glass-panel">
            <div className="header-left">
                <button className="mobile-menu-btn" onClick={onToggleSidebar}>
                    <Menu size={24} />
                </button>
                
                <div className={`global-search-wrapper ${isSearchOpen ? 'open' : ''}`}>
                    <button 
                        className="search-toggle-btn" 
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                        title="Arama Yap"
                    >
                        <Search size={20} />
                    </button>
                    {isSearchOpen && (
                        <div className="search-input-container">
                            <Search className="search-inner-icon" size={16} />
                            <AsyncSelect
                                autoFocus
                                cacheOptions
                                loadOptions={loadOptions}
                                onChange={handleSearchSelect}
                                placeholder="Müşteri, plaka veya ürün ara..."
                                components={{ Option: CustomOption, DropdownIndicator: () => null, IndicatorSeparator: () => null }}
                                styles={searchStyles}
                                noOptionsMessage={() => "Sonuç bulunamadı"}
                                onBlur={() => {!isSearchOpen && setIsSearchOpen(false)}}
                            />
                        </div>
                    )}
                </div>
            </div>
            
            <div className="header-right">
                <div className="digital-clock">
                    <Clock size={16} />
                    <span>{currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    <span className="clock-date">{currentTime.toLocaleDateString('tr-TR')}</span>
                </div>

                <button 
                    className={`header-action-btn ${isBackingUp ? 'spinning' : ''}`} 
                    onClick={handleBackup} 
                    title="Google Drive'a Yedekle"
                    disabled={isBackingUp}
                >
                    {isBackingUp ? <RefreshCw size={20} /> : <Database size={20} />}
                </button>
                <button className="header-action-btn">
                    <Bell size={20} />
                </button>
        <div className="header-profile">
          <UserCircle size={32} color="var(--color-primary)" />
          <div className="profile-info">
            <span className="profile-name">{user?.username || 'Misafir'}</span>
            <span className="profile-role">{user?.role === 'ADMIN' ? 'Yönetici' : 'Kullanıcı'}</span>
          </div>
          <Link to="/profile" className="header-action-btn" title="Profil Ayarları">
            <Settings size={20} />
          </Link>
          <button className="logout-btn" onClick={logout} title="Çıkış Yap">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
