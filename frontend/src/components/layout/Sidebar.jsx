import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  CreditCard, 
  FileText, 
  Wallet, 
  History, 
  FileSearch, 
  BarChart3,
  Car,
  X
} from 'lucide-react';
import './Sidebar.css';

const menuItems = [
  { path: '/', name: 'Finans', icon: LayoutDashboard },
  { path: '/debts', name: 'Firma Borçları', icon: Wallet },
  { path: '/inventory', name: 'Stok Yönetimi', icon: Package },
  { path: '/stock-movements', name: 'Stok Hareketleri', icon: History },
  { path: '/vehicles', name: 'Araçlar', icon: Car },
  { path: '/customers', name: 'Cari Hesaplar', icon: Users },
  { path: '/customer-report', name: 'Cari Ekstre', icon: FileSearch },
  { path: '/sales', name: 'Satış', icon: ShoppingCart },
  { path: '/payments', name: 'Tahsilat', icon: CreditCard },
  { path: '/reports', name: 'Raporlar', icon: BarChart3 },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-header">
            <div>
              <h2>Merkas</h2>
              <p>Otomasyon</p>
            </div>
            <button className="sidebar-close-btn" onClick={onClose}>
              <X size={24} color="white" />
            </button>
          </div>
        </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} className="icon" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
      </aside>
    </>
  );
}
