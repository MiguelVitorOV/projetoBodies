import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

// Importe o seu Header e agora o CartDrawer também!
import Header from "./components/Header"; 
import { CartDrawer } from "./components/CartDrawer"; // <-- NOVO IMPORT

import LoginComponent from "./components/LoginComponent";
import CadastroComponent from "./components/CadastroComponent";
import MainPage from "./pages/MainPage";
import { ProductCatalog } from "./components/ProductCatalog";
import { CreateProduct } from "./components/CreateProduct";
import { ProductDetails } from "./components/ProductDetails";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        
        {/* O Header e o CartDrawer ficam FORA das rotas para aparecerem em todo lugar */}
        <Header />
        <CartDrawer /> {/* <-- ELE ENTRA AQUI! */}

        <Routes>
          <Route path="/login" element={<LoginComponent />} />
          <Route path="/cadastro" element={<CadastroComponent />} />
          <Route path="/" element={<MainPage />} />
          <Route path="/catalogo" element={<ProductCatalog />} />
          <Route path="/cadastroProduct" element={<CreateProduct />} />
          <Route path="/produto/:id" element={<ProductDetails />} />
        </Routes>
        
      </CartProvider>
    </AuthProvider>
  );
}

export default App;