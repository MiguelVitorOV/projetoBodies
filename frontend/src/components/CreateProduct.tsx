import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/CreateProduct.css';
import { useAuth } from '../context/AuthContext';

// Estado local para facilitar a digitação na tela
interface SizeStock {
  size: string;
  stockQuantity: number;
}

interface ColorGroup {
  color: string;
  sizes: SizeStock[];
}

export function CreateProduct() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const API_URL = import.meta.env.VITE_API_URL;
  const { token, user, isAuthenticated } = useAuth();

 useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      alert("Acesso restrito a administradores.");
      navigate('/'); 
      return; 
    }
  }, [isAuthenticated, user, navigate]);

  // Agora agrupamos por cor!
  const [colorGroups, setColorGroups] = useState<ColorGroup[]>([
    { color: '', sizes: [{ size: 'P', stockQuantity: 0 }] }
  ]);

  // Adiciona uma nova cor vazia
  const handleAddColorGroup = () => {
    setColorGroups([...colorGroups, { color: '', sizes: [{ size: 'P', stockQuantity: 0 }] }]);
  };

  // Adiciona um novo tamanho DENTRO de uma cor específica
  const handleAddSizeToColor = (colorIndex: number) => {
    const newGroups = [...colorGroups];
    newGroups[colorIndex].sizes.push({ size: 'P', stockQuantity: 0 });
    setColorGroups(newGroups);
  };

  // Atualiza o nome da cor
  const handleColorChange = (index: number, value: string) => {
    const newGroups = [...colorGroups];
    newGroups[index].color = value;
    setColorGroups(newGroups);
  };

  // Atualiza o tamanho ou estoque dentro de uma cor
  const handleSizeChange = (colorIndex: number, sizeIndex: number, field: keyof SizeStock, value: string | number) => {
    const newGroups = [...colorGroups];
    newGroups[colorIndex].sizes[sizeIndex] = { ...newGroups[colorIndex].sizes[sizeIndex], [field]: value };
    setColorGroups(newGroups);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!image) {
      alert("A imagem é obrigatória!");
      return;
    }

    // A mágica: Transforma o nosso agrupamento visual de volta pro formato que o backend exige
    // Ex: Se Azul tem P(10) e M(5), vira [{color: 'Azul', size: 'P', stockQuantity: 10}, {color: 'Azul', size: 'M', stockQuantity: 5}]
    const flattenedVariants = colorGroups.flatMap(group => 
      group.sizes.map(sizeObj => ({
        color: group.color,
        size: sizeObj.size,
        stockQuantity: sizeObj.stockQuantity
      }))
    );

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('discount', discount || '0');
    formData.append('image', image);
    formData.append('variants', JSON.stringify(flattenedVariants));

    try { 
      console.log({token})
      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}` 
          },
        body: formData,
      });

      if (response.ok) {
        alert('Produto criado com sucesso na Bereshit!');
        navigate('/catalogo'); // Manda de volta pro catálogo pra ver como ficou
      } else {
        const errorData = await response.json();
        console.error("Erros:", errorData);
        alert('Erro ao criar produto. Olhe o console.');
      }
    } catch (error) {
      console.error(error);
      alert('Erro de conexão com o servidor.');
    }
  };

  return (
    <div className="create-product-container">
      <button className="btn-back-form" onClick={() => navigate('/catalogo')}>← Voltar</button>
      <h2 className="title">Cadastrar Novo Produto</h2>
      
      <form onSubmit={handleSubmit} className="product-form">
        
        <div className="form-group">
          <label>Nome da Peça:</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required />
        </div>

        <div className="form-group">
          <label>Descrição:</label>
          <input type='text' value={description} onChange={e => setDescription(e.target.value)} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Preço (R$):</label>
            <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Desconto (%):</label>
            <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label>Imagem do Produto:</label>
          <input type="file" accept="image/*" onChange={e => setImage(e.target.files ? e.target.files[0] : null)} required />
        </div>

        <div className="variants-section">
          <h3>Cores e Tamanhos (Estoque)</h3>
          
          {colorGroups.map((group, colorIndex) => (
            <div key={colorIndex} className="color-group-box">
              <div className="form-group color-input-group">
                <label>Cor {colorIndex + 1}:</label>
                <input 
                  type="text" 
                  placeholder="Ex: Azul Marinho" 
                  value={group.color} 
                  onChange={e => handleColorChange(colorIndex, e.target.value)} 
                  required 
                />
              </div>

              <div className="sizes-container">
                <label className="sizes-label">Tamanhos desta cor:</label>
                {group.sizes.map((sizeObj, sizeIndex) => (
                  <div key={sizeIndex} className="size-row">
                    <select 
                      value={sizeObj.size} 
                      onChange={e => handleSizeChange(colorIndex, sizeIndex, 'size', e.target.value)} 
                      required 
                    >
                    <option value="P">P</option>
                    <option value="M">M</option>
                    <option value="G">G</option>
                    <option value="GG">GG</option>
                    </select>
                    <input 
                      type="number" 
                      placeholder="Qtd no Estoque" 
                      value={sizeObj.stockQuantity || ''} 
                      onChange={e => handleSizeChange(colorIndex, sizeIndex, 'stockQuantity', Number(e.target.value))} 
                      required 
                    />
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={() => handleAddSizeToColor(colorIndex)} 
                  className="btn-add-size"
                >
                  + Adicionar outro tamanho em {group.color || 'nesta cor'}
                </button>
              </div>
            </div>
          ))}

          <button type="button" onClick={handleAddColorGroup} className="btn-add-color">
            + Adicionar Nova Cor
          </button>
        </div>

        <button type="submit" className="btn-submit">Salvar Produto</button>
      </form>
    </div>
  );
}