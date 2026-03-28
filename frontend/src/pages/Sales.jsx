import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { ShoppingCart, Trash2, CheckCircle, Wallet, CreditCard, Mail, Clock } from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import { SyncContext } from '../context/SyncContext';
import { API_BASE_URL } from '../api/apiConfig';
import Select from 'react-select';
import './Sales.css';

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

export default function Sales() {
  const syncKey = React.useContext(SyncContext);
  const { showAlert } = useAlert();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [discountedPrice, setDiscountedPrice] = useState('');
  
  const [customerId, setCustomerId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  useEffect(() => {
    fetchData();
  }, [syncKey]);

  const fetchData = async () => {
    try {
      const [prodRes, custRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/products?t=${new Date().getTime()}`),
        axios.get(`${API_BASE_URL}/api/customers?t=${new Date().getTime()}`)
      ]);
      setProducts(prodRes.data);
      setCustomers(custRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddToCart = () => {
    const product = products.find(p => p.id === parseInt(selectedProduct));
    if (!product) return;

    const unitPrice = discountedPrice ? parseFloat(discountedPrice) : product.sellPrice;
    const qty = parseInt(quantity);
    
    if (qty > product.stock) {
      showAlert(`Stok yetersiz! Mevcut stok: ${product.stock}`, 'warning');
      return;
    }

    const item = {
      productId: product.id,
      name: product.name,
      code: product.code,
      quantity: qty,
      unitPrice,
      totalPrice: qty * unitPrice
    };

    setCart([...cart, item]);
    setSelectedProduct('');
    setQuantity(1);
    setDiscountedPrice('');
  };

  const totalAmount = React.useMemo(() => {
    return cart.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
  }, [cart]);

  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return showAlert('Sepet boş!', 'warning');
    if (!customerId) return showAlert('Lütfen satışı işlemek için bir Müşteri (Cari) seçiniz!', 'warning');
    if (paymentMethod === 'VERESIYE' && !customerId) {
      return showAlert('Veresiye satış için müşteri seçmelisiniz!', 'warning');
    }

    try {
      await axios.post(`${API_BASE_URL}/api/sales/checkout`, {
        customerId: customerId ? parseInt(customerId) : null,
        vehicleId: vehicleId ? parseInt(vehicleId) : null,
        items: cart,
        paymentMethod,
        totalAmount: totalAmount || 0
      });
      showAlert('Satış Başarılı!', 'success');
      setCart([]);
      setCustomerId('');
      setVehicleId('');
      fetchData(); // Stokları güncelle
    } catch (err) {
      showAlert('Satış sırasında hata oluştu.', 'error');
    }
  };

  const cartColumns = [
    { header: 'Ürün Kodu', field: 'code' },
    { header: 'Ürün Adı', field: 'name' },
    { header: 'Birim Fiyat', field: 'unitPrice', render: r => `${r.unitPrice} ₺` },
    { header: 'Adet', field: 'quantity' },
    { header: 'Toplam', field: 'totalPrice', render: r => `${r.totalPrice} ₺` },
    { header: 'İşlem', field: 'action', render: (r) => (
      <button onClick={() => removeFromCart(r.idx)} className="btn-icon danger">
        <Trash2 size={16} />
      </button>
    )}
  ];

  return (
    <div className="sales-page">
      <h1 className="page-title">Hızlı Satış Ekranı</h1>

      <div className="sales-grid">
        {/* Sol Panel: Sepete Ekleme */}
        {/* Sol Panel: Müşteri ve Ürün Seçimi */}
        <div className="sales-left">
          <Card glass className="mb-4">
            <CardHeader title="Müşteri & Ödeme Bilgisi" />
            <CardContent>
              <div className="form-group mb-3">
                <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Müşteri (Cari) Seçimi</label>
                <Select
                  options={customers.map(c => ({
                    value: c.id,
                    label: `${c.name} - Bakiye: ${c.balance.toLocaleString('tr-TR')}₺`,
                    searchString: `${c.name} ${c.vehicles ? c.vehicles.map(v => v.plate).join(' ') : ''}`
                  }))}
                  filterOption={(candidate, input) => {
                    if (!input) return true;
                    return candidate.data.searchString.toLowerCase().includes(input.toLowerCase()) || 
                           candidate.label.toLowerCase().includes(input.toLowerCase());
                  }}
                  value={
                    customerId 
                      ? { 
                          value: customerId, 
                          label: (() => {
                            const c = customers.find(x => x.id === parseInt(customerId));
                            return c ? `${c.name} - Bakiye: ${c.balance.toLocaleString('tr-TR')}₺` : '';
                          })()
                        }
                      : null
                  }
                  onChange={opt => {
                    setCustomerId(opt ? opt.value : '');
                    setVehicleId('');
                  }}
                  placeholder="-- Cari Ara --"
                  isClearable
                  isSearchable
                  menuPortalTarget={document.body}
                  menuPosition={'fixed'}
                  noOptionsMessage={() => "Müşteri bulunamadı"}
                  styles={customSelectStyles}
                />
              </div>

              {customerId && (
                <div className="form-group mb-3">
                  <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Araç Seçimi (İsteğe Bağlı)</label>
                  <Select
                    options={customers.find(c => c.id === parseInt(customerId))?.vehicles.map(v => ({
                      value: v.id,
                      label: `${v.plate}${v.model ? ` - ${v.model}` : ''}`
                    })) || []}
                    value={
                      vehicleId 
                        ? { 
                            value: vehicleId, 
                            label: (() => {
                              const c = customers.find(x => x.id === parseInt(customerId));
                              const v = c?.vehicles.find(y => y.id === parseInt(vehicleId));
                              return v ? `${v.plate}${v.model ? ` - ${v.model}` : ''}` : '';
                            })()
                          }
                        : null
                    }
                    onChange={opt => setVehicleId(opt ? opt.value : '')}
                    placeholder="-- Aracı Seç (Opsiyonel) --"
                    isClearable
                    menuPortalTarget={document.body}
                    menuPosition={'fixed'}
                    styles={customSelectStyles}
                    noOptionsMessage={() => "Bu cariye kayıtlı araç bulunamadı"}
                  />
                </div>
              )}
              
              <div className="form-group mb-4">
                <label className="input-label">Ödeme Yöntemi</label>
                <div className="payment-methods">
                  {[
                    { id: 'CASH', label: 'Nakit', icon: Wallet },
                    { id: 'POS', label: 'Kredi Kartı', icon: CreditCard },
                    { id: 'MAIL_ORDER', label: 'Mail Order', icon: Mail },
                    { id: 'VERESIYE', label: 'Veresiye', icon: Clock }
                  ].map(method => (
                    <button 
                      key={method.id}
                      type="button"
                      className={`payment-btn ${method.id} ${paymentMethod === method.id ? 'active' : ''}`}
                      onClick={() => setPaymentMethod(method.id)}
                    >
                      <method.icon size={20} />
                      <span>{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card glass>
            <CardHeader title="Modele / Klasik Parça Ekle" />
            <CardContent>
              <div className="form-group mb-3">
                <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Stoktan Ürün Seç</label>
                <Select
                  options={products.map(p => ({
                    value: p.id,
                    label: `${p.code} - ${p.name} [${p.compatibleModels?.map(m => m.name).join(', ') || '-'}] (Stok: ${p.stock} | Fiyat: ${p.sellPrice}₺)`
                  }))}
                  value={
                    selectedProduct 
                      ? { 
                          value: selectedProduct, 
                          label: (() => {
                            const p = products.find(x => x.id === parseInt(selectedProduct));
                            return p ? `${p.code} - ${p.name} [${p.compatibleModels?.map(m => m.name).join(', ') || '-'}] (Stok: ${p.stock} | Fiyat: ${p.sellPrice}₺)` : '';
                          })()
                        }
                      : null
                  }
                  onChange={opt => setSelectedProduct(opt ? opt.value : '')}
                  placeholder="-- Ürün Ara --"
                  isClearable
                  isSearchable
                  menuPortalTarget={document.body}
                  menuPosition={'fixed'}
                  noOptionsMessage={() => "Ürün bulunamadı"}
                  styles={customSelectStyles}
                />
              </div>
              <div className="form-grid mb-3">
                <Input 
                  label="Adet" 
                  type="number" 
                  min="1"
                  value={quantity} 
                  onChange={e => setQuantity(e.target.value)} 
                />
                <Input 
                  label="Özel Fiyat (Opsiyonel)" 
                  type="number" 
                  step="0.01"
                  value={discountedPrice} 
                  onChange={e => setDiscountedPrice(e.target.value)} 
                  placeholder="İndirimli fiyat yazın"
                />
              </div>
              <Button onClick={handleAddToCart} disabled={!selectedProduct} className="w-100">
                <ShoppingCart size={18} style={{marginRight: '8px'}} /> Sepete Ekle
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sağ Panel: Sepet ve Toplam */}
        <div className="sales-right">
          <Card glass className="h-100">
            <CardHeader title="Sepet" />
            <div className="cart-table-wrapper">
              <Table 
                columns={cartColumns} 
                data={cart.map((item, idx) => ({...item, idx}))} 
                keyField="idx" 
                emptyMessage="Sepete ürün ekleyin"
              />
            </div>
            <div className="cart-summary">
              <div className="cart-total">
                <span>Genel Toplam (Net):</span>
                <h2>{totalAmount.toLocaleString('tr-TR')} ₺</h2>
              </div>
              <Button onClick={handleCheckout} className="btn-checkout" variant="success" disabled={cart.length === 0}>
                <CheckCircle size={20} /> Satışı Tamamla
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
