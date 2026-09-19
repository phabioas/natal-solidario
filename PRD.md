# PRD — Natal Solidário GETJ

## Visão Geral

**Produto:** Aplicação web para gestão completa do evento Natal Solidário do Grupo Espírita Trabalhadores de Jesus (GETJ).

**Tipo:** Web app administrativo (SPA)

**Objetivo:** Substituir o controle manual em Excel por uma aplicação web que centraliza o cadastro de mães e crianças, o apadrinhamento, o controle de sacolas, o check-in no dia da festa e relatórios — suportando múltiplos anos/campanhas.

**Motivação central:** A pessoa que cadastra as crianças tem dificuldade com planilhas Excel. O app existe principalmente para dar a ela uma interface simples e guiada de cadastro. Esta é a prioridade zero do projeto.

**Stack:** React + Vite + TypeScript + Firebase (Auth Google + Firestore) + TailwindCSS + shadcn/ui

**Projeto Firebase:** `getj-natal` (reutilizado do `festa_natal_checkin`)

---

## Requisitos Funcionais

### RF01 — Autenticação Google com Dois Perfis (Must)
Login via Google (Firebase Auth). Controle de acesso por whitelist de emails na collection `usuarios` com dois perfis:

- **Admin** (gestores): acesso total — campanhas, fichas, apadrinhamento, sacolas, contatos, check-in, relatórios, usuários
- **Cadastrador** (pessoa que cadastra): acesso **apenas à página de cadastro de fichas** com interface simplificada. Não vê apadrinhamento, sacolas, relatórios, nem configurações.

O admin define o perfil ao autorizar um email.

### RF02 — Gestão de Campanhas / Multi-ano (Must)
Criar, listar e ativar campanhas anuais (ex: "Natal Solidário 2026"). Cada campanha tem ano, nome, data e local do evento, e está ativa ou não. A campanha ativa é o contexto padrão de todas as operações. Dados de campanhas anteriores são preservados para consulta e comparação.

### RF03 — Configuração de Origens por Campanha (Must)
Ao criar/editar uma campanha, o admin define as origens (regiões/grupos) e seus ranges de numeração de fichas:
- Nome da origem (ex: Canadá, Itapark, PROVER, Amélia, Avulsas)
- Range de fichas (início e fim, ex: 001–099)
- Meta de crianças (opcional)

A origem de uma ficha é derivada automaticamente do seu número.

### RF04 — Cadastro de Fichas (Mães + Crianças) (Must)
Página de cadastro onde o admin ou cadastrador cria e edita fichas. Cada ficha representa uma mãe/responsável e seus filhos:

**Dados da mãe:**
- Número da ficha (sugerido automaticamente como o próximo disponível da origem, mas editável — não exige ordem sequencial)
- Nome completo
- Documento (CPF ou RG; opcional quando não informado)
- Telefone
- Quantidade de adultos
- Observação
- Status: `ativa` | `cancelada` (ver RF04b)

**Dados de cada criança (até 10 por ficha):**
- Nome completo
- Sexo (M/F)
- Data de nascimento **OU** idade (algumas mães não sabem a data)
- Tamanho de camisa
- Tamanho de calça
- Tamanho de calçado
- Tem TEA (autismo) — boolean
- Observação
- Preferencial (opcional)
- Observação 2 (opcional)

O ID da criança é gerado automaticamente: `{numeroFicha}/{sequenciaDe2Digitos}` (ex: `001/01`, `001/02`). O separador facilita a conferência e a entrega das sacolas.

### RF04b — Cancelamento de Ficha (Must)
Uma ficha pode ser **cancelada** (não deletada). Motivo: fichas são pré-impressas e números não podem ser reusados quando preenchidas errado.

- Status da ficha: `ativa` | `cancelada`
- Ao cancelar, registra motivo (ex: "preenchida errada")
- Número da ficha cancelada fica **queimado** — não pode ser reusado em novo cadastro
- Fichas canceladas aparecem na lista cinza/marcadas, mas não entram em dashboard, apadrinhamento, sacolas ou relatórios
- Não é possível cancelar ficha com crianças apadrinhadas — desfazer apadrinhamento primeiro
- Admin pode cancelar; cadastrador pode cancelar fichas que ele mesmo criou (com confirmação)

### RF04a — Interface de Cadastro Simplificada (Must)
A interface de cadastro é **prioridade zero** — projetada para uma pessoa com limitação tecnológica:

- Formulário passo-a-passo, uma ficha por vez, tela limpa sem distrações
- Campos grandes com labels em português simples, sem jargão
- Botão "Adicionar criança" grande e visível
- Validação com mensagens claras e amigáveis (ex: "O nome da mãe é obrigatório" em vez de "Field required")
- Confirmação visual ao salvar: "Ficha 001 salva com 2 crianças ✓"
- Seleção de sexo por botões grandes (♂ Masculino / ♀ Feminino), não dropdown
- Tamanho de roupa/calçado por seleção simples, com sugestões comuns
- Data de nascimento com calendário visual OU campo de idade com texto livre — toggle simples "Não sabe a data?"
- Origem mostrada automaticamente ao digitar o número da ficha ("Ficha 045 → Canadá")
- Sem tabelas complexas, sem ações em lote, sem opções avançadas
- Funciona bem em tablet (touch-friendly)

O admin acessa a mesma página de cadastro mas com funcionalidades extras (editar, deletar, buscar, ver todas as fichas).

### RF05 — Migração Inicial de Planilha (Concluído e Removido)
A planilha existente foi utilizada exclusivamente para a carga inicial, pois o sistema começou a operar durante o período de cadastro. Após a migração, a tela de importação e a dependência de leitura de Excel foram removidas. Todos os novos registros são feitos diretamente no sistema.

### RF06 — Cadastro de Contatos (Must)
Contatos são voluntários do GETJ que intermediam o apadrinhamento. O admin cadastra:
- Nome
- Telefone
- Email (opcional — preparado para futuro login Google)

Contatos são referenciados no apadrinhamento. Não logam no sistema na fase 1.

### RF07 — Apadrinhamento (Must)
O admin atribui um padrinho a uma criança, registrando:
- Nome do padrinho (texto livre)
- Contato responsável (referência a um contato cadastrado)
- Data do apadrinhamento

A criança passa a ter status de sacola `pendente`. O admin pode desfazer o apadrinhamento.

### RF07a — Materiais de Apadrinhamento e Compartilhamento (Must)
O admin pode gerar os materiais usados no fluxo de apadrinhamento:

- Lista alfabética das crianças ainda não apadrinhadas, com ID (`001/01`), nome, sexo e idade, disponível para impressão e compartilhamento por WhatsApp.
- Ficha individual da criança apadrinhada, com ID, nome, sexo, idade, tamanhos de camisa/calça/calçado, indicação de TEA, conteúdo esperado da sacola, prazo de entrega e contato.
- Compartilhamento da ficha como texto pelo WhatsApp.
- Geração da ficha como imagem PNG para salvar ou compartilhar pelo recurso nativo do celular.
- Impressão da ficha em papel ou PDF.

### RF08 — Controle de Sacolas (Must)
Cada criança apadrinhada tem um status de sacola com o seguinte ciclo de vida:

```
nao_apadrinhada → pendente → entregue → conferida → no_salao → entregue_crianca
                                    ↘ faltando_itens ↗
```

Estados:
| Status | Significado |
|---|---|
| `nao_apadrinhada` | Criança sem padrinho |
| `pendente` | Apadrinhada, sacola ainda não chegou |
| `entregue` | Padrinho entregou a sacola ao contato |
| `faltando_itens` | Entregue mas incompleta (observação obrigatória) |
| `conferida` | Verificada e completa |
| `no_salao` | Transportada para o local da festa |
| `entregue_crianca` | Entregue à criança no dia do evento |

Cada transição registra data/hora. Há um campo de observação de conferência (ex: "Falta calçado tamanho 31").

O admin pode filtrar sacolas por status, por contato, por origem. Há uma visão "o que falta" agrupada por contato e padrinho para repassar aos contatos próximo à data do evento.

### RF09 — Check-in no Dia da Festa (Must)
No dia do evento, uma página de check-in permite:
- Buscar criança por ID (ex: `001/01`), nome da mãe, ou CPF
- Marcar presença da criança na entrada (`presenteNaEntrada`)
- Marcar entrega do presente à criança (`entregue_crianca` — atualiza o status da sacola)

Esta funcionalidade recria o que o `festa_natal_checkin` fazia, integrada ao app completo.

### RF10 — Dashboard (Must)
Painel principal da campanha ativa mostrando:
- Total de crianças cadastradas vs. meta
- Total de mães/fichas
- Crianças apadrinhadas vs. não apadrinhadas (com %)
- Distribuição por origem (com barra de progresso vs. meta)
- Status das sacolas (contagem por status)
- Crianças presentes no dia (após o evento)
- Comparação com campanhas anteriores (opcional)

### RF11 — Relatórios (Should)
Páginas de relatório com filtros e exportação:
- Lista de crianças por origem
- Lista de crianças por contato (para imprimir/enviar ao contato)
- Lista de sacolas faltantes por contato
- Lista de presença (quem veio / quem não veio)
- Lista de entregas (quem recebeu presente / quem não recebeu)
- Exportação para CSV/impressão

### RF12 — Gestão de Usuários (Should)
O admin pode autorizar/remover emails e definir o perfil (admin ou cadastrador) de cada usuário. O primeiro admin é configurado manualmente no Firestore.

---

## Requisitos Não-Funcionais

### NRF01 — Responsividade (Must)
App funciona em desktop (uso principal no cadastro/relatórios) e tablet/celular (uso no dia do evento para check-in). Layout adaptativo.

### NRF02 — Offline-tolerant no check-in (Should)
No dia do evento, o check-in deve tolerar instabilidade de internet. Firestore tem cache offline nativo — garantir que está habilitado.

### NRF03 — Performance (Must)
Listas de até 500 fichas / 5000 crianças carregam com paginação virtualizada. Busca por nome/CPF/ID é responsiva (< 500ms).

### NRF04 — Segurança (Must)
Firestore Security Rules negando leitura/escrita para não autenticados. Apenas usuários na whitelist (collection `usuarios`) leem/escrevem. Cadastradores só podem escrever na subcollection `fichas` da campanha ativa. Admins têm acesso total. Validação de dados no client e regras no Firestore.

### NRF05 — Custo Firebase (Must)
Manter-se no tier gratuito (Spark). Volume esperado: ~500 fichas/ano, ~5000 crianças/ano, < 10 admins. Firestore reads/writes e Auth stays well within free tier.

### NRF06 — Deploy (Must)
Hosting no Firebase Hosting. Build via `npm run build` → `firebase deploy`. CI opcional.

---

## Regras de Negócio

### RN01 — Numeração de Fichas
Cada ficha tem um número de 3 dígitos (001–499). O número identifica a origem conforme ranges configurados na campanha. Fichas avulsas (400–499) são para cadastros fora dos grupos fixos.

### RN02 — Numeração de Crianças
O ID da criança é `{numeroFicha}/{sequencia}` onde sequência é 2 dígitos (01–10). Ex: ficha 001, segunda criança → `001/02`. Máximo 10 crianças por ficha.

### RN03 — Data de Nascimento vs. Idade
Uma criança tem **ou** data de nascimento **ou** idade informada (texto livre, ex: "4 anos"). Pelo menos um dos dois deve ser informado. Se ambos forem informados, data de nascimento prevalece.

### RN04 — Origem Derivada
A origem da ficha é sempre derivada do número da ficha contra os ranges configurados. Não é editável manualmente. Se o número não cair em nenhum range, origem = "Avulsas" (ou erro se fora de 400–499).

### RN05 — Apadrinhamento Requer Contato
Não é possível apadrinhar uma criança sem atribuir um contato. O contato é obrigatório. O nome do padrinho também é obrigatório.

### RN06 — Status de Sacola Sequencial
O status da sacola segue uma ordem. Não é possível marcar `conferida` sem antes ter `entregue`. Exceção: `faltando_itens` pode voltar para `conferida` após correção. `entregue_crianca` só pode ser marcado se `presenteNaEntrada` for true (a criança precisa estar presente).

### RN07 — Uma Campanha Ativa
Apenas uma campanha pode estar ativa por vez. Ativar uma campanha desativa as demais.

### RN08 — Cancelamento de Ficha (Soft Delete)
Fichas não são deletadas, apenas canceladas. Ao cancelar, o número é queimado e não pode ser reusado. Não é possível cancelar uma ficha se alguma criança estiver apadrinhada — deve-se desfazer o apadrinhamento primeiro. O cancelamento registra motivo e data/hora.

---

## Decisões de Arquitetura

### ADR-01: React + Vite + TypeScript
Escolhido sobre Flutter Web pela produtividade em app administrativo (tabelas, formulários, relatórios). Ecossistema de componentes maduro (shadcn/ui), hot-reload rápido, Firebase SDK web nativo.

### ADR-02: Firestore — Campanhas como subcollections
Estrutura:
```
campanhas/{campanhaId}/fichas/{fichaId}
campanhas/{campanhaId}/contatos/{contatoId}
usuarios/{uid}
```
Fichas e contatos são subcollection de campanha, isolando dados por ano. Crianças são array embutido na ficha (máx 10, dentro do limite de documento de 1MB do Firestore).

### ADR-03: Auth Google + Whitelist com Roles
Login apenas Google. Authorization por whitelist na collection `usuarios` — email deve estar cadastrado para acessar. Dois roles: `admin` (acesso total) e `cadastrador` (acesso apenas a cadastro de fichas com interface simplificada). Firestore Security Rules diferenciam acesso por role.

### ADR-04: Contatos e Padrinhos como registros, não usuários
Contatos e padrinhos não logam na fase 1. Contatos têm campo `email` e `uid` (vazio) preparados para futuro login. Quando um contato pedir acesso, o admin linka o registro à conta Google preenchendo o `uid`.

### ADR-05: Status de sacola como enum + observação
Um campo `status` (enum) + `observacaoConferencia` (texto), em vez de múltiplos booleanos. Facilita filtros, relatórios ("o que falta"), e transições com timestamp.

### ADR-06: Importação limitada à migração inicial
A importação foi uma funcionalidade temporária para carregar a planilha existente durante a implantação. Com a carga inicial concluída, a tela e a biblioteca `xlsx` foram removidas para reduzir superfície de ataque e manutenção. O cadastro passa a ocorrer exclusivamente pelo sistema.

---

## Schema de Configuração

### Collection: `campanhas`
```typescript
{
  id: string                    // ex: "natal-2026"
  ano: number                   // 2026
  nome: string                  // "XIII Natal Solidário 2026"
  dataEvento: Timestamp         // data da festa
  localEvento: {
    nome: string                // "Centro Recreativo Roque José Orsate"
    endereco: string            // "Rua Alonso Vasconcelos Pacheco, 1593"
    cidade: string              // "Mauá – SP"
    cep: string                 // "09310-695"
  }
  ativa: boolean
  origens: [{
    nome: string                // "Canadá"
    fichaInicio: number         // 1
    fichaFim: number            // 99
    metaCriancas: number        // 175
  }]
  createdAt: Timestamp
}
```

### Subcollection: `campanhas/{id}/fichas`
```typescript
{
  id: string                    // "001" (document ID = numeroFicha)
  numeroFicha: string           // "001"
  nomeResponsavel: string       // "MONICA DE OLIVEIRA PAULA"
  cpfResponsavel: string        // CPF ou RG; nome mantido por compatibilidade
  contatoResponsavel: string    // "11920471722" (telefone)
  origem: string                // "Canadá" (derivado)
  qtdeAdultos: number           // 1
  qtdeCriancas: number          // 2
  observacao: string            // opcional
  status: 'ativa' | 'cancelada' // default: 'ativa'
  motivoCancelamento: string | null
  dataCancelamento: Timestamp | null
  criancas: Crianca[]           // array embutido
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### Crianca (embutido na ficha)
```typescript
{
  idCrianca: string             // "001/01"
  nomeCompleto: string
  sexo: "M" | "F"
  dataNascimento: string | null // ISO date ou null
  idadeTexto: string | null     // "4 anos" quando não sabe a data
  tamCamiseta: string
  tamCalca: string
  tamCalcado: string
  tea: boolean                  // TEA / autismo
  observacao: string
  preferencial: string          // opcional
  observacao2: string           // opcional
  apadrinhamento: {
    padrinho: string            // nome do padrinho
    contatoId: string           // ref to contatos
    status: SacolaStatus        // enum
    observacaoConferencia: string
    pasta: string               // opcional
    dataApadrinhada: Timestamp
    dataEntregue: Timestamp | null
    dataConferida: Timestamp | null
    dataNoSalao: Timestamp | null
    dataEntregueCrianca: Timestamp | null
  } | null                      // null = não apadrinhada
  presenteNaEntrada: boolean    // check-in no dia
}
```

### SacolaStatus (enum)
```typescript
type SacolaStatus =
  | 'pendente'
  | 'entregue'
  | 'faltando_itens'
  | 'conferida'
  | 'no_salao'
  | 'entregue_crianca'
```

### Subcollection: `campanhas/{id}/contatos`
```typescript
{
  id: string
  nome: string
  telefone: string
  email: string | null          // opcional, para futuro login
  uid: string | null            // opcional, future Firebase Auth link
  createdAt: Timestamp
}
```

### Collection: `usuarios` (admins e cadastradores)
```typescript
{
  id: string                    // Firebase Auth UID
  email: string                 // "phabi@gmail.com"
  nome: string
  role: 'admin' | 'cadastrador' // admin = acesso total, cadastrador = só cadastro
  createdAt: Timestamp
}
```

---

## Páginas / Telas

| # | Página | Descrição |
|---|---|---|
| 1 | Login | Tela inicial com botão "Entrar com Google" |
| 2 | Dashboard | Visão geral da campanha ativa com KPIs e gráficos **(admin only)** |
| 3 | Campanhas | Lista de campanhas, criar nova, editar origens, ativar **(admin only)** |
| 4 | Cadastro de Fichas | **Interface simplificada** para cadastrador. Lista + criar/editar ficha com crianças. Prioridade zero de UX |
| 6 | Contatos | Lista CRUD de contatos (voluntários GETJ) **(admin only)** |
| 7 | Apadrinhamento | Lista de crianças com filtros. Atribuir padrinho + contato. Atualizar status da sacola **(admin only)** |
| 8 | Sacolas | Visão do ciclo de vida das sacolas. "O que falta" agrupado por contato. Atualizar status em lote **(admin only)** |
| 9 | Check-in | Busca por ID/nome/CPF, marcar presença e entrega (uso no dia do evento) **(admin only)** |
| 10 | Relatórios | Relatórios com filtros e exportação CSV/impressão **(admin only)** |
| 11 | Usuários | Gerenciar usuários autorizados e definir perfis **(admin only)** |
| 12 | Lista para Apadrinhamento | Crianças disponíveis em ordem alfabética, pronta para impressão ou WhatsApp **(admin only)** |
| 13 | Ficha do Padrinho | Dados da criança e instruções da sacola, com impressão, PNG e compartilhamento **(admin only)** |

**Fluxo do cadastrador:** Login → vai direto para Cadastro de Fichas (página 4). Sem menu de navegação para outras páginas. Botão "Sair" visível.

---

## Estado da Implementação e Pendências

### Implementado
- Identificador da criança no formato `001/01`.
- Cálculo de idade para a data da festa.
- Impressão individual e em lote das fichas cadastrais.
- Lista alfabética de crianças não apadrinhadas para impressão/WhatsApp.
- Ficha individual do padrinho com geração de PNG, download, compartilhamento nativo, texto para WhatsApp e impressão.
- Drawer de navegação com fundo opaco no celular.

### Pendente
- **Ajustar e validar o layout geral para mobile.** Apesar de o menu já usar drawer, ainda é necessário revisar todas as páginas em celulares reais, especialmente tabelas, filtros, formulários, botões de ação, barras superiores e a apresentação da ficha individual.

## Decisões de Escopo — Fase 1 vs Fase 2

### Fase 1 (este projeto)
- Tudo descrito nos RFs acima
- Dois perfis: admin (tudo) + cadastrador (só cadastro, interface simplificada)
- Contatos e padrinhos são registros sem login

### Fase 2 (futuro, se a prática pedir)
- Login Google opcional para contatos — veem apenas suas crianças, atualizam status de sacola
- Linkar um contato cadastrado a uma conta Google (preencher `uid`)
- Página pública para padrinhos escolherem crianças
- Comparação entre campanhas no dashboard
- App mobile (PWA ou nativo) para check-in
