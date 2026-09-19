# Natal Solidário - GETJ

Aplicação web para gestão completa do evento Natal Solidário do Grupo Espírita Trabalhadores de Jesus.

## Stack

- **React + Vite + TypeScript**
- **Firebase** (Auth Google + Firestore) — projeto `getj-natal`
- **TailwindCSS** + componentes UI customizados
- **React Router** para navegação

## Pré-requisitos

1. Node.js 18+
2. Firebase CLI (`npm install -g firebase-tools`)

## Setup

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build de produção
npm run build

# Deploy para Firebase Hosting
npm run deploy
```

## Primeiro uso — PASSO A PASSO

### 1. Habilitar Google Auth no Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com) → projeto `getj-natal`
2. **Authentication** → **Sign-in method** → **Google** → Enable
3. **Authentication** → **Settings** → **Authorized domains** → adicione `localhost` e o domínio do deploy (ex: `getj-natal.web.app`)

### 2. Deployar as Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### 3. Criar seu usuário admin no Firestore

No Firebase Console → **Firestore** → adicione um documento na collection `usuarios`:

- **Document ID:** seu UID do Firebase Auth (pegue em Authentication → Users, após fazer login uma vez)
- **Fields:**
  ```
  email: "seuemail@gmail.com"  (string)
  nome: "Seu Nome"              (string)
  role: "admin"                (string)
  createdAt: <timestamp>       (timestamp)
  ```

> **Dica:** Faça login no app uma vez (vai dar erro "não autorizado"), depois vá no Console do Firebase → Authentication, copie o UID, e crie o documento `usuarios/{uid}` com role `admin`. Faça login novamente.

### 4. Criar uma campanha

Como admin, vá em **Campanhas** → **Nova Campanha**:
- Nome: "XIII Natal Solidário 2026"
- Ano: 2026
- Data do evento
- Local
- Origens (já vêm pré-preenchidas: Canadá 1-99, Itapark 100-199, PROVER 200-299, Amélia 300-399, Avulsas 400-499)

### 5. Autorizar a pessoa que vai cadastrar

Vá em **Usuários** → **Autorizar Email**:
- Email da pessoa (Google)
- Nome
- Perfil: **Cadastrador**

Ela vai fazer login com Google e ir direto para a tela de cadastro de fichas (interface simplificada).

## Estrutura do projeto

```
src/
├── components/ui/        # Componentes base (Button, Input, Card, Badge, Label)
├── contexts/             # AuthContext (login/role) + CampanhaContext (campanha ativa)
├── lib/                  # Firebase init + utils
├── models/               # Tipos TypeScript (Ficha, Crianca, Campanha, etc)
├── pages/
│   ├── admin/            # Páginas do admin (Dashboard, Fichas, Apadrinhamento, etc)
│   └── cadastro/         # Páginas do cadastrador (interface simplificada)
├── services/             # FirestoreService (CRUD + regras de negócio)
├── App.tsx               # Roteamento + role-based access
└── main.tsx              # Entry point
```

## Perfis de acesso

| Perfil | Acesso |
|---|---|
| **Admin** | Dashboard, Fichas, Apadrinhamento, Sacolas, Contatos, Check-in, Relatórios, Campanhas, Usuários |
| **Cadastrador** | Apenas cadastro de fichas (interface simplificada, sem opções avançadas) |

## Modelo de dados (Firestore)

```
campanhas/{campanhaId}
  ├── fichas/{numeroFicha}     → mãe + array de crianças (até 10)
  └── contatos/{contatoId}     → voluntários GETJ

usuarios/{uid}                 → admins e cadastradores (whitelist)
```

## Status de sacola

```
pendente → entregue → conferida → no_salao → entregue_crianca
                  ↘ faltando_itens ↗
```

## Apadrinhamento e materiais para compartilhamento

- O identificador da criança usa o formato `{ficha}/{sequência}`, por exemplo `001/01`.
- A idade é calculada automaticamente para a data do evento quando há data de nascimento.
- A tela de apadrinhamento permite imprimir ou compartilhar uma lista alfabética das crianças ainda disponíveis, com número, nome, sexo e idade.
- Após o apadrinhamento, é possível abrir a ficha individual da criança contendo tamanhos, indicação de TEA, itens esperados na sacola, prazo e contato.
- A ficha individual pode ser compartilhada como texto pelo WhatsApp, salva como PNG, compartilhada pelo recurso nativo do celular ou impressa em PDF.
- As fichas cadastrais podem ser impressas individualmente ou em lote.

## Situação atual e pendências

### Entregue

- Menu administrativo em formato drawer no celular.
- Telas de Fichas, Apadrinhamento e Sacolas adaptadas para mobile com cards, filtros recolhíveis e ações touch-friendly.
- Geração de imagem da ficha via Canvas, sem dependência de captura do DOM.
- Compartilhamento e download da ficha individual.

### Pendente

- **Continuar o ajuste do layout geral para mobile** nas telas de Check-in, Contatos, Usuários, Campanhas, Relatórios, Dashboard e ficha individual. O drawer e as telas de Fichas, Apadrinhamento e Sacolas já foram adaptados.

### Removido após a carga inicial

- A importação de Excel/CSV foi utilizada somente para migrar os cadastros existentes. Após a carga inicial, a tela e a dependência `xlsx` foram removidas. Novos registros são feitos diretamente no sistema.

## Fase 2 (futuro)

- Login Google opcional para contatos
- Página pública para padrinhos escolherem crianças
- Comparação entre campanhas no dashboard
- PWA para check-in offline
