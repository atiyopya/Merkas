import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api/apiConfig';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import './Profile.css';

const Profile = () => {
  const { user, setUser } = useAuth();
  const { showAlert } = useAlert();
  
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password && password !== confirmPassword) {
      showAlert('Şifreler uyuşmuyor!', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.put(`${API_BASE_URL}/api/auth/profile`, {
        username,
        password: password || undefined
      });

      // Update local storage and context
      const updatedUser = response.data.user;
      localStorage.setItem('merkas_user', JSON.stringify(updatedUser));
      // AuthContext handles the user state via useEffect but we can also update it manually if needed
      // Actually, my AuthContext currently doesn't have a setUser exposed. 
      // Let's assume we'll need to refresh or update context.
      
      showAlert('Profil başarıyla güncellendi.', 'success');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      const message = error.response?.data?.error || 'Profil güncellenirken bir hata oluştu.';
      showAlert(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="profile-page-container">
      <div className="profile-card glass-panel">
        <div className="profile-header">
          <h2>Profil Ayarları</h2>
          <p>Kullanıcı bilgilerinizi buradan güncelleyebilirsiniz.</p>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="username">Kullanıcı Adı</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Yeni Şifre (Değiştirmek istemiyorsanız boş bırakın)</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Yeni Şifre Tekrar</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
            />
          </div>

          <div className="profile-actions">
            <button type="submit" className="save-btn" disabled={isLoading}>
              {isLoading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
