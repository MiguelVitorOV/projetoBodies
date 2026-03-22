import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../css/Auth.css'; // <-- IMPORTANTE!

export default function CadastroComponent() {

    const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', cpf: '', phone: ''
  });
  const [erro, setErro] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    try {
      // ATENÇÃO: Confirme se a sua rota no backend é /users ou /cadastro!
      const response = await fetch('http://localhost:3000/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Conta criada com sucesso na Bereshit!');
        navigate('/login'); // Manda o usuário fazer login
      } else {
        const data = await response.json();
        // Se o Yup estourar erro, ele vem no array 'errors' ou no 'error'
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

      <form onSubmit={handleSubmit} className="auth-form">
        <input className="auth-input" type="text" name="name" placeholder="Nome Completo" onChange={handleChange} required />
        <input className="auth-input" type="email" name="email" placeholder="E-mail" onChange={handleChange} required />
        <input className="auth-input" type="text" name="cpf" placeholder="CPF (só números)" maxLength={11} onChange={handleChange} required />
        <input className="auth-input" type="text" name="phone" placeholder="Telefone (com DDD)" onChange={handleChange} required />
        <input className="auth-input" type="password" name="password" placeholder="Senha (mínimo 6 caracteres)" onChange={handleChange} required />
        
        <button type="submit" className="auth-button">
          Cadastrar
        </button>
      </form>
      
      <p className="auth-footer">
        Já tem conta? <Link to="/login" className="auth-link">Faça Login</Link>
      </p>
    </div>
  );
}