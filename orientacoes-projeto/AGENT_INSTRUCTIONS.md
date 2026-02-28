# 🤖 INSTRUÇÃO PERMANENTE PARA O AGENTE AI

> **Este arquivo DEVE ser lido no início de cada sessão antes de qualquer trabalho.**
> **Toda vez que uma página, componente ou tabela for modificada OU CRIADA, o documento correspondente em `orientacoes-projeto/` DEVE SER ATUALIZADO OU CRIADO.**

---

## 📁 Estrutura desta Pasta

```
orientacoes-projeto/
├── AGENT_INSTRUCTIONS.md   ← Este arquivo (leia sempre primeiro)
├── pacientes.md            ← Módulo de pacientes (✅ documentado)
├── agenda.md               ← (criar quando o módulo for implementado)
├── dashboard.md            ← (criar quando o módulo for implementado)
├── financeiro.md           ← (criar quando o módulo for implementado)
└── medicos.md              ← (criar quando o módulo for implementado)
```

---

## ⚠️ PROTOCOLO OBRIGATÓRIO — REGRAS DE DOCUMENTAÇÃO

### REGRA 1 — Ao MODIFICAR uma página existente

**SEMPRE que modificar qualquer item abaixo, ATUALIZE o `.md` correspondente:**

| O que foi modificado | Arquivo a atualizar |
|----------------------|---------------------|
| `pages/Patients.tsx` | `orientacoes-projeto/pacientes.md` |
| `components/PatientModal.tsx` | `orientacoes-projeto/pacientes.md` |
| `pages/PatientDetail.tsx` | `orientacoes-projeto/pacientes.md` |
| `hooks/usePatients.ts` | `orientacoes-projeto/pacientes.md` |
| `types.ts` → interface `PatientV2` | `orientacoes-projeto/pacientes.md` |
| Migration na tabela `patients_v2` | `orientacoes-projeto/pacientes.md` → Seção 3 |
| `pages/Calendar.tsx` ou agenda | `orientacoes-projeto/agenda.md` |
| `pages/Dashboard.tsx` | `orientacoes-projeto/dashboard.md` |
| Qualquer hook em `hooks/` | `.md` do módulo que usa esse hook |

---

### REGRA 2 — Ao CRIAR uma nova página ou módulo

**Quando criar uma nova `pages/NovaTela.tsx`, você DEVE:**

1. **Criar o arquivo** `orientacoes-projeto/novatela.md` usando o template abaixo
2. **Adicionar a linha** na tabela de mapeamento acima (Regra 1)
3. **Atualizar** a árvore de estrutura desta pasta (seção acima)
4. **Atualizar** a tabela de Status do Projeto (seção abaixo)

> ❌ **Nunca encerre o trabalho de criar uma nova página sem criar o `.md` correspondente.**

---

### REGRA 3 — Checklist de encerramento (toda task de código)

Antes de finalizar qualquer tarefa, execute mentalmente este checklist:

```
[ ] Algum arquivo em pages/ foi criado ou modificado?
      → SE SIM: o .md correspondente foi criado/atualizado?

[ ] Alguma tabela/coluna do banco foi alterada?
      → SE SIM: a Seção 3 do .md correspondente foi atualizada?

[ ] Alguma interface em types.ts foi modificada?
      → SE SIM: o .md do módulo afetado foi atualizado?

[ ] O campo "Última atualização" do .md foi atualizado com a data de hoje?

[ ] A seção "Pendências" do .md foi revisada?
      → Marcar [x] no que foi implementado
      → Adicionar novas pendências detectadas
```

---

## 📋 Template para Nova Página

Ao criar `orientacoes-projeto/novomodulo.md`, use esta estrutura:

```markdown
# 📋 Documentação: [Nome da Tela]

> **Última atualização:** YYYY-MM-DD
> **Arquivo:** `pages/NomeTela.tsx`
> **Módulo:** [Nome do Módulo]

---

## 1. Visão Geral
[Descrição do que a tela faz e seu propósito]

### Rota
- **Path:** `/rota`
- **Arquivo:** `pages/NomeTela.tsx`

---

## 2. Arquivos Envolvidos

| Arquivo | Papel |
|---------|-------|
| `pages/NomeTela.tsx` | Componente principal |
| `components/NomeModal.tsx` | Modal de criação/edição (se houver) |
| `hooks/useNome.ts` | Hook de dados |
| `types.ts` | Interfaces TypeScript |

---

## 3. Banco de Dados — Tabelas Relacionadas

### 3.1 `nome_da_tabela`

| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|-------------|-----------|
| `id` | UUID | ✅ PK | Gerado automaticamente |
| `clinic_id` | UUID | ✅ FK→clinics | Clínica |
| ... | ... | ... | ... |

---

## 4. Hook de Dados

**Arquivo:** `hooks/useNome.ts`
- Query principal
- Retorno: `{ data, loading, error, refetch }`

---

## 5. Componentes da Tela

### 5.1 [NomeComponente]
[Descrição e props]

---

## 6. Fluxo Completo de Dados

```
[Usuário acessa /rota]
        ↓
useNome() → Supabase
        ↓
[Exibe dados]
```

---

## 7. Pendências e Melhorias

- [ ] [Pendência 1]
- [ ] [Pendência 2]

---

## 8. Dependências Externas

| Dependência | Uso |
|-------------|-----|
| Supabase | Banco de dados |
```

---

## 🔍 Protocolo de Início de Sessão

```
1. LEIA `orientacoes-projeto/AGENT_INSTRUCTIONS.md` (este arquivo)
2. IDENTIFIQUE qual módulo será trabalhado
3. LEIA o .md correspondente (ex: pacientes.md)
4. Execute o trabalho
5. APLIQUE o Checklist de Encerramento (Regra 3)
```

---

## 🗂️ Informações Gerais do Projeto

### Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | React + TypeScript + Vite |
| **Estilização** | Tailwind CSS |
| **Banco de Dados** | Supabase (PostgreSQL) |
| **Autenticação** | Supabase Auth |
| **Roteamento** | React Router DOM (Hash Router) |
| **Ícones** | lucide-react |
| **Estado Global** | Context API (`DarkModeContext`) |

### Paths Importantes

| Path | Descrição |
|------|-----------|
| `pages/` | Telas principais (uma por rota) |
| `components/` | Componentes reutilizáveis |
| `hooks/` | Custom hooks de dados |
| `contexts/` | Context API providers |
| `lib/supabase.ts` | Cliente Supabase (única instância) |
| `types.ts` | Todas as interfaces TypeScript |
| `orientacoes-projeto/` | Esta pasta — documentação de referência |

### Convenções de Segurança

- **RLS (Row Level Security)** ativo em todas as tabelas — não filtrar `clinic_id` manualmente nas queries.
- `clinic_id` sempre obtido via `profiles` do usuário autenticado, nunca hardcoded.
- Secrets/keys nunca commitados. Variáveis em `.env`.

### Tema Visual

- **Cor primária:** Azul (`primary-600`)
- **Backgrounds:** `slate-50` (claro) / `slate-900` (escuro)
- **Bordas:** `slate-200` (claro) / `slate-700` (escuro)
- **Dark Mode:** `DarkModeContext` — classe `dark` no `<html>`
- **Proibido:** roxo/violeta

### Supabase Project

- **Project ID:** `xafjeyynbnqmudtdqufg`
- **MCP Server:** `supabase-mcp-cliente-2` (usar para DDL/migrations)

### Tabelas existentes no banco (2026-02-28)

| Tabela | Módulo |
|--------|--------|
| `clinics` | Sistema |
| `profiles` | Autenticação |
| `patients_v2` | Pacientes |
| `patient_insurances` | Pacientes → Convênio |
| `patient_emergency_contacts` | Pacientes → Contatos |
| `health_insurers` | Convênios |
| `insurance_plans` | Convênios |
| `medical_records` | Prontuário |
| `surgery_cases` | Agenda Cirúrgica |
| `team_members` | Agenda Cirúrgica |
| `equipment` | Equipamentos |

> ⚠️ **Não existe tabela de médicos** — médicos ficam em `profiles` (role='medic') e como texto livre em `surgery_cases.doctor`.

---

## 📌 Status do Projeto por Módulo

| Módulo | Tela | Documentado | Status Geral |
|--------|------|-------------|--------------|
| **Pacientes** | `pages/Patients.tsx` | ✅ `pacientes.md` | ✅ Produção |
| **Detalhe Paciente** | `pages/PatientDetail.tsx` | ✅ `pacientes.md` | ✅ Produção |
| **Agenda** | `pages/Calendar.tsx` | ❌ a documentar | 🔄 Em progresso |
| **Dashboard** | `pages/Dashboard.tsx` | ❌ a documentar | 🔄 Em progresso |
| **Financeiro** | `pages/NewOrder.tsx` | ❌ a documentar | 🔄 Em progresso |
| **Médicos** | ❌ não criado | ❌ a criar | ❌ Não iniciado |
