import { useCart } from "../context/CartContext";
import "../css/header.css";
import logoPng from "../img/logo.png";

// Importando o nosso contexto de autenticação! (Ajuste o caminho se precisar)
import { useAuth } from '../context/AuthContext'; 

const Header = () => {
  // Puxando as informações do usuário da nossa "nuvem"
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount, openCart } = useCart();

  return (
    <div id="caixa">
      <header>
        <img src={logoPng} alt="Logo Bereshit" />
        
        <div id="containerHeader">
          {/* Se você usar React Router, o ideal é trocar <a href> por <Link to> */}
          <a href="/">Home</a>
          <a href="/produtos">Produtos</a>
          <a href="/sobre">Sobre</a>
          <a href="/contato">Contato</a>
        </div>
        
        <div id="user">
          <div className="cart-icon-container" title="Carrinho de Compras" onClick={openCart}>
  <span className="material-symbols-outlined cart-icon">shopping_cart</span>
  {itemCount > 0 && (
    <span className="cart-badge">{itemCount}</span>
  )}
</div>
          
          {/* LÓGICA DE AUTENTICAÇÃO AQUI */}
          {isAuthenticated ? (
            // Se estiver logado, mostra o nome e o botão de sair COM TEXTO
            <div className="user-logged">
              <span className="user-name">Olá, {user?.name.split(' ')[0]}</span>
              
              {/* Novo botão de Sair mais explícito */}
              <div className="logout-btn-container" onClick={logout}>
                <span className="material-symbols-outlined logout-icon">logout</span>
                <span className="logout-text">Sair</span>
              </div>
            </div>
          ) : (
            // Se NÃO estiver logado, mostra o botão de Entrar
            <div className="auth-buttons">
               <a href="/login" className="login-btn">Entrar</a>
            </div>
          )}

        </div>
      </header>
    </div>
  )
}

export default Header;