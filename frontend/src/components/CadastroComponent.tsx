import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../css/Auth.css';

export default function CadastroComponent() {
  const navigate = useNavigate();
  const [tipoPessoa, setTipoPessoa] = useState<'PF' | 'PJ'>('PF');
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', cpf: '', phone: ''
  });
  const [erro, setErro] = useState('');

  const API_URL = import.meta.env.VITE_API_URL;

  const formatarDocumento = (valor: string) => {
    const nums = valor.replace(/\D/g, '').slice(0, tipoPessoa === 'PF' ? 11 : 14);
    if (tipoPessoa === 'PF') {
      return nums
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      return nums
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'cpf') {
      setFormData({ ...formData, cpf: formatarDocumento(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleTipo = (tipo: 'PF' | 'PJ') => {
    setTipoPessoa(tipo);
    setFormData({ ...formData, cpf: '' }); // limpa ao trocar
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    const payload = {
      ...formData,
      cpf: formData.cpf.replace(/\D/g, ''), // só números pro backend
    };

    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('Conta criada com sucesso na Bereshit!');
        navigate('/login');
      } else {
        const data = await response.json();
        setErro(data.errors ? data.errors.join(', ') : data.error);
      }
    } catch (error) {
      setErro('Erro de conexão com o servidor.');
    }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title green">Criar Conta Bereshit</h2>

      {erro && <div className="auth-error">{erro}</div>}

      {/* Botões PF / PJ */}
      <div className="auth-tipo-selector">
        <button
          type="button"
          className={`auth-tipo-btn ${tipoPessoa === 'PF' ? 'active' : ''}`}
          onClick={() => handleTipo('PF')}
        >
          👤 Pessoa Física
        </button>
        <button
          type="button"
          className={`auth-tipo-btn ${tipoPessoa === 'PJ' ? 'active' : ''}`}
          onClick={() => handleTipo('PJ')}
        >
          🏢 Pessoa Jurídica
        </button>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <input className="auth-input" type="text" name="name"
          placeholder={tipoPessoa === 'PF' ? 'Nome Completo' : 'Razão Social'}
          onChange={handleChange} required
        />
        <input className="auth-input" type="email" name="email"
          placeholder="E-mail" onChange={handleChange} required
        />
        <input className="auth-input" type="text" name="cpf"
          placeholder={tipoPessoa === 'PF' ? 'CPF' : 'CNPJ'}
          value={formData.cpf}
          onChange={handleChange} required
        />
        <input className="auth-input" type="text" name="phone"
          placeholder="Telefone (com DDD)" onChange={handleChange} required
        />
        <input className="auth-input" type="password" name="password"
          placeholder="Senha (mínimo 6 caracteres)" onChange={handleChange} required
        />

        <button type="submit" className="auth-button">Cadastrar</button>
      </form>

      <p className="auth-footer">
        Já tem conta? <Link to="/login" className="auth-link">Faça Login</Link>
      </p>
    </div>
  );
}