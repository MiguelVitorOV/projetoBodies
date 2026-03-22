import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../css/Auth.css'; 
import { useAuth } from '../context/AuthContext'; // <-- IMPORTANTE: Puxando o contexto!

export default function LoginComponent() {
  const navigate = useNavigate();
  const { login } = useAuth(); // <-- Pegamos a função login de dentro da "nuvem"
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    try {
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        // A MÁGICA ACONTECE AQUI: 
        // Em vez de fazer o localStorage manual, chamamos a função do contexto.
        // Ela salva no localStorage e AVISA o Header pra mudar a tela na mesma hora!
        login({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          token: data.token || '' // Passa o token se sua API retornar
        });
        
        // Redireciona pra vitrine/catálogo
        navigate('/catalogo');
      } else {
        setErro(data.error || 'Erro ao fazer login');
      }
    } catch (error) {
      setErro('Erro de conexão com o servidor.');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <h2 className="auth-title">Login Bereshit</h2>
        
        {erro && <div className="auth-error">{erro}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <input 
            className="auth-input"
            type="email" 
            placeholder="E-mail" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
          />
          <input 
            className="auth-input"
            type="password" 
            placeholder="Senha" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
          />
          
          <button type="submit" className="auth-button green">
            Entrar
          </button>
        </form>

        <p className="auth-footer">
          Não tem conta? <Link to="/cadastro" className="auth-link">Crie uma agora</Link>
        </p>
      </div>
    </div>
  );
}