# Documentação do Sistema de Cardápio Virtual

## Introdução
Este documento tem como objetivo descrever detalhadamente o funcionamento, arquitetura e uso do sistema de **Cardápio Virtual para Restaurantes**, desenvolvido em **React**, **TailwindCSS**, **Vite** e **Supabase**.

### Objetivo
O sistema visa oferecer aos restaurantes uma plataforma para exibição e gestão de cardápios digitais, com possibilidade de personalização.

### Público-Alvo
- Restaurantes
- Cafeterias
- Lanchonetes
- Pizzarias

## Arquitetura
### Tecnologias Utilizadas
- **Frontend:** React + Vite
- **Estilização:** TailwindCSS
- **Backend:** Supabase (Banco de Dados + Autenticação)
- **QR Code:** Biblioteca `qrcode.react`

### Fluxo Geral do Sistema
1. Cadastro Manual do Restaurante (feito pelo administrador diretamente no Supabase)
2. Login do Restaurante
3. Gestão do Cardápio (CRUD de produtos, categorias e imagens)
5. Visualização Pública do Cardápio (sem necessidade de login)
6. Geração de QR Code para acesso rápido ao cardápio

## Funcionalidades
### Para Restaurantes
- Cadastro de Produtos
- Cadastro de Categorias
- Upload de Imagens
- Edição de Preços e Descrições
- Definição de Produtos em Destaque
- Sincronização Automática com o Supabase

### Para Clientes
- Visualização do Cardápio
- Busca de Produtos
- Filtragem por Categoria
- Exibição de Produtos em Destaque

## Layout
### Painel Administrativo
- Página de Login
- Dashboard
- Lista de Produtos
- Formulário de Cadastro/Edição de Produto
- Configurações do Restaurante (Nome, Logo, Cores)

### Cardápio Público
- Página Inicial
- Lista de Categorias
- Lista de Produtos
- Busca
- Página de Produto (Imagem, Descrição e Preço)

## Banco de Dados (Supabase)
### Tabelas
- `restaurants`
  - id 
  - name (varchar)
  - description (text)
  - logo_url (text)
  - address (text)
  - phone (varchar)
  - email (varchar)
  - hours_of_operation (text)
  - social_media (jsonb)
  - created_at (timestampz)
  - updated_at (timestampz)
  - slug (text)
  - owner_id (uuid)
  - customizations (jsonb)

- `profiles`
  - id
  - restaurant_id (FK)
  - is_admin (boolean)
  - created_at (timestampz)
  - updated_at (timestampz)

- `menu_itens`
  - id
  - restaurant_id (FK)
  - category_id (FK)
  - name (varchar)
  - description (text)
  -price (numeric)
  - image_url (text)
  - dietary_info (text)
  - created_at (timestampz)
  - updated_at (timestampz)
  - active (boolean)
  - order_itens (integer)
  
- `categories`
  - id
  - restaurant_id (FK)
  - name (varchar)
  - slug (varchar)
  - created_at (timestampz)
  - order (integer)
  - banner_url (text)

## Personalização
- Cores Primária e Secundária
- Logo do Restaurante
- QR Code com URL do cardápio

## Segurança
- Autenticação via Supabase
- Restrições de permissões por restaurante
- Sanitização de inputs

## QR Code
- Geração automática na página de administração
- Download em formato PNG

## Deploy
- Hospedagem em ...
- Conexão direta com o Supabase

## Melhorias Futuras
- Pedidos online
- Pagamento integrado
- Avaliação de produtos
- Notificações push

---

**Essa documentação será atualizada conforme o sistema evoluir.**

