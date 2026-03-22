import CadastroComponent from "./components/CadastroComponent"
import LoginComponent from "./components/LoginComponent"
import { Routes, Route } from "react-router-dom"
import MainPage from "./pages/MainPage"
import { ProductCatalog } from "./components/ProductCatalog"
import { CreateProduct } from "./components/CreateProduct"

// 1. Importe o ProductDetails aqui! (ajuste o caminho se precisar)
import { ProductDetails } from "./components/ProductDetails"

function App() {
  return (
    <>
    <Routes>
      <Route path="/login" element={<LoginComponent />} />
      <Route path="/cadastro" element={<CadastroComponent />} />
      <Route path="/" element={<MainPage />} />
      <Route path="/catalogo" element={<ProductCatalog />} />
      <Route path="/cadastroProduct" element={<CreateProduct />} />

      <Route path="/produto/:id" element={<ProductDetails />} />
    </Routes>
    </>
  )
}

export default App