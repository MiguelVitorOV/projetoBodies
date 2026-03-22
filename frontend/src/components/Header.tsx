import "../css/header.css"
import logoPng from "../img/logo.png"
const Header = () => {
  return (
    <div id="caixa">
    <header>
      <img src={logoPng} alt="logo" />
      <div id="containerHeader">
        <a href="">Home</a>
        <a href="">Produtos</a>
        <a href="">Sobre</a>
        <a href="">Contato</a>
      </div>
      <div id="user">
        <span className="material-symbols-outlined">
shopping_cart
</span>
        <span className="material-symbols-outlined">
account_circle
</span>

      </div>
    </header>
    <main>

    </main>
    </div>
  )
}

export default Header
