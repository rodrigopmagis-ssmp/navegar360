# 📋 Documentação: Tela de Pacientes

> **Última atualização:** 2026-02-28  
> **Arquivo:** `pages/Patients.tsx`  
> **Módulo:** Gestão de Pacientes

---

## 1. Visão Geral

A tela de **Gestão de Pacientes** é o hub central para gerenciar todos os pacientes cadastrados na clínica. Permite visualizar, buscar, criar e editar pacientes, bem como navegar para o prontuário detalhado de cada um.

### Rota
- **Path:** `/patients`
- **Arquivo:** `pages/Patients.tsx`
- **Layout:** Inserida dentro do `<Layout>` padrão (Topbar + Sidebar + `<main>`)

---

## 2. Arquivos Envolvidos

| Arquivo | Papel |
|---------|-------|
| `pages/Patients.tsx` | Componente principal da tela |
| `components/PatientModal.tsx` | Modal de criação/edição do paciente |
| `pages/PatientDetail.tsx` | Tela de detalhe do paciente (prontuário) |
| `hooks/usePatients.ts` | Hook de busca de dados no Supabase |
| `types.ts` | Interfaces TypeScript (`PatientV2`, `PatientEmergencyContact`, etc.) |
| `lib/supabase.ts` | Cliente Supabase configurado |
| `contexts/DarkModeContext.tsx` | Contexto de dark mode (consumido no Layout) |

---

## 3. Banco de Dados — Tabelas Relacionadas

### 3.1 `patients_v2` (tabela principal)

| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|-------------|-----------|
| `id` | UUID | ✅ PK | Gerado automaticamente |
| `clinic_id` | UUID | ✅ FK→clinics | Clínica do paciente |
| `full_name` | text | ✅ | Nome completo do paciente |
| `cpf` | text | ❌ | CPF com validação de dígito verificador |
| `rg` | text | ❌ | RG (mín. 7 dígitos) |
| `rg_issuer` | text | ❌ | Órgão emissor do RG (ex: SSP/SP) |
| `birth_date` | date | ❌ | Data de nascimento (YYYY-MM-DD) |
| `gender` | text | ❌ | Gênero |
| `marital_status` | text | ❌ | Estado civil |
| `profession` | text | ❌ | Profissão |
| `ethnicity` | text | ❌ | Etnia/cor (autodeclarada) |
| `origin` | text | ❌ | Como conheceu a clínica |
| `phone` | text | ❌ | Telefone fixo |
| `whatsapp` | text | ❌ | WhatsApp |
| `email` | text | ❌ | E-mail |
| `father_name` | text | ❌ | Nome do pai |
| `mother_name` | text | ❌ | Nome da mãe |
| `nationality` | text | ❌ | `'brasileiro'` ou `'estrangeiro'` |
| `country_of_origin` | text | ❌ | País de origem (estrangeiros) |
| `document_type` | text | ❌ | `'passaporte'`, `'crnm'`, `'protocolo_refugio'` |
| `document_number` | text | ❌ | Número do documento estrangeiro |
| `document_validity` | date | ❌ | Validade do documento estrangeiro |
| `has_brazilian_cpf` | boolean | ❌ | Estrangeiro com CPF brasileiro |
| `cnpj` | text | ❌ | CNPJ (uso futuro) |
| `address_zipcode` | text | ❌ | CEP (busca automática via ViaCEP) |
| `address_street` | text | ❌ | Logradouro |
| `address_number` | text | ❌ | Número |
| `address_complement` | text | ❌ | Complemento |
| `address_neighborhood` | text | ❌ | Bairro |
| `address_city` | text | ❌ | Cidade |
| `address_state` | text | ❌ | Estado (UF) |
| `status` | text | ✅ | `'ativo'` (verde) ou `'inativo'` (vermelho) |
| `lgpd_consent` | boolean | ✅ | Consentimento LGPD |
| `lgpd_consent_at` | timestamptz | ❌ | Data/hora do consentimento |
| `created_at` | timestamptz | ✅ | Auto gerado |
| `updated_at` | timestamptz | ✅ | Auto atualizado |

> **Constraint:** `patients_v2_status_check CHECK (status IN ('ativo', 'inativo'))`

---

### 3.2 `patient_insurances` (convênios)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `clinic_id` | UUID | FK→clinics |
| `patient_id` | UUID | FK→patients_v2 |
| `plan_id` | UUID | FK→insurance_plans |
| `card_number` | text | Número da carteirinha |
| `holder_name` | text | Nome do titular |
| `holder_cpf` | text | CPF do titular (validado) |
| `valid_from` | date | Início de vigência |
| `valid_until` | date | Fim de vigência |
| `is_primary` | boolean | Convênio principal |

---

### 3.3 `patient_emergency_contacts` (contatos de emergência)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `clinic_id` | UUID | FK→clinics |
| `patient_id` | UUID | FK→patients_v2 ON DELETE CASCADE |
| `full_name` | text | Nome do contato |
| `relationship` | text | Parentesco (Mãe, Pai, Cônjuge, Filho, etc.) |
| `phone` | text | Telefone principal (obrigatório) |
| `phone_secondary` | text | Telefone secundário |
| `email` | text | E-mail |
| `is_whatsapp` | boolean | Tem WhatsApp |
| `is_emergency_contact` | boolean | Autoriza contato em emergências |
| `can_receive_medical_info` | boolean | Pode receber informações médicas (LGPD) |
| `can_authorize` | boolean | Pode autorizar procedimentos |
| `is_financial_responsible` | boolean | Responsável financeiro |
| `is_primary_contact` | boolean | Contato principal |
| `priority` | integer | Ordem de prioridade (1, 2, 3...) |
| `created_at` | timestamptz | Auto gerado |

---

### 3.4 Tabelas Auxiliares (leitura)

| Tabela | Uso |
|--------|-----|
| `health_insurers` | Lista de operadoras (select no modal de convênio) |
| `insurance_plans` | Planos por operadora (filtrado por `insurer_id`) |
| `profiles` | Obtém `clinic_id` do usuário logado para isolar dados |

---

## 4. Hook de Dados: `usePatients`

**Arquivo:** `hooks/usePatients.ts`

```typescript
const usePatients = () => {
    // Busca todos os pacientes da clínica do usuário logado
    // Query: SELECT * FROM patients_v2 ORDER BY full_name ASC
    // Retorna: { patients, loading, error, refetch }
}
```

**Comportamento:**
- Busca todos os pacientes ao montar (`useEffect` sem deps)
- `refetch` é chamado após criar/editar paciente com sucesso no modal
- **Não há filtro por `clinic_id` na query** — o isolamento é feito via **RLS (Row Level Security)** no Supabase, que automaticamente filtra pelo `clinic_id` do usuário autenticado.

---

## 5. Componentes da Tela

### 5.1 `StatCard`
Cards de métricas no topo da página.

```
Total de Pacientes | Leads Iniciais | Em Tratamento | Indicações
```

> ⚠️ **Pendência técnica:** Os valores "Leads Iniciais", "Em Tratamento" e "Indicações" ainda filtraram pelos status antigos (`lead`, `em_avaliacao`, `indicado_cirurgia`). Com a migração para `ativo`/`inativo`, **esses cards precisam ser atualizados** para mostrar métricas relevantes.

---

### 5.2 `StatusBadge`
Badge visual do status do paciente.

| Status | Cor | Visual |
|--------|-----|--------|
| `ativo` | Verde esmeralda | `bg-emerald-50 text-emerald-700` |
| `inativo` | Vermelho | `bg-red-50 text-red-700` |

---

### 5.3 `PatientCard` (Visualização em Grade)
Card individual do paciente exibido na view de grade (4 colunas em XL).

- Avatar com iniciais do nome (2 letras)
- StatusBadge
- Data de nascimento, WhatsApp/Telefone, E-mail
- Botões: **Ver Prontuário** (olho) → `/patients/:id`, **Editar** (lápis) → abre modal, **Mais Opções** (⋯)

---

### 5.4 Visualização em Lista (tabela)
Tabela com colunas: **Paciente**, **Contato**, **Status**, **Ações**.

A busca filtra em tempo real por: **nome**, **CPF** e **e-mail**.

---

### 5.5 Alternância de Visualização
Toggle Lista ↔ Grade via ícones `List` / `LayoutGrid`. Estado local (`useState`).

---

## 6. Modal de Cadastro/Edição: `PatientModal`

**Arquivo:** `components/PatientModal.tsx`

### Características do Modal
- **Largura:** `max-w-5xl` (layout horizontal/paisagem)
- **Altura:** `max-h-[92vh]`
- **Step Indicator:** 4 etapas visuais com círculos numerados e linhas conectoras
  - Etapa ativa → azul (`primary-600`)
  - Etapa concluída → verde (`emerald-500`) com ícone ✓
  - Etapa pendente → cinza

### Abas / Etapas

| # | ID | Label | Ícone | Campos Principais |
|---|----|----|-------|-------------------|
| 1 | `personal` | Dados Pessoais | User | Nome, CPF, RG, Nascimento, Gênero, Etnia, Profissão, Estado Civil, Nacionalidade |
| 2 | `address` | Endereço | MapPin | CEP (busca via ViaCEP), Logradouro, Número, Bairro, Cidade, UF |
| 3 | `insurance` | Convênio | Shield | Operadora, Plano, Nº Carteirinha, Titular, CPF Titular, Vigência |
| 4 | `contacts` | Contatos | Users2 | Múltiplos contatos de emergência com permissões individuais |

### Lógica de Salvamento

1. `handleSubmit()` é chamado ao clicar "Salvar" na aba `contacts`
2. Obtém `clinic_id` do `profiles` do usuário autenticado
3. **Novo paciente:** INSERT em `patients_v2` com `status: 'ativo'`
4. **Edição:** UPDATE em `patients_v2`
5. Salva convênio em `patient_insurances` (upsert por `is_primary`)
6. Salva contatos em `patient_emergency_contacts` (upsert por `id`)
7. Chama `onSuccess()` → dispara `refetch()` → atualiza lista
8. Fecha modal e reseta formulário

### Validações

| Campo | Regra |
|-------|-------|
| CPF | Algoritmo de dígito verificador. Rejeita sequências iguais (111.111.111-11) |
| RG | Mínimo 7 dígitos numéricos |
| Holder CPF | Mesma validação do CPF do paciente |
| CEP | Busca via ViaCEP API apenas após confirmar com botão 🔍 |
| Estrangeiro | Exige `country_of_origin` + `document_number` |

---

## 7. Tela de Detalhe: `PatientDetail`

**Arquivo:** `pages/PatientDetail.tsx`  
**Rota:** `/patients/:id`

### Layout
- **Sidebar esquerda (fixa):** Avatar com iniciais, badge de status, botão Editar, métricas de consultas, dados de contato
- **Área principal:** Abas — Atendimento | Prontuário | Relacionamento | Arquivos

### Status Display

| Status | Label | Cor |
|--------|-------|-----|
| `ativo` | Ativo | Verde esmeralda |
| `inativo` | Inativo | Vermelho |

---

## 8. Fluxo Completo de Dados

```
[Usuário acessa /patients]
        ↓
usePatients() → Supabase RLS filtra por clinic_id
        ↓
SELECT * FROM patients_v2 ORDER BY full_name
        ↓
Exibe lista/grade com StatusBadge e ações

[Clicar em "Novo Paciente" ou "Editar"]
        ↓
PatientModal abre (isOpen=true)
        ↓
Step 1: Dados Pessoais → validação CPF/RG/documentos
Step 2: Endereço → busca CEP via ViaCEP
Step 3: Convênio → busca operadoras/planos no Supabase
Step 4: Contatos → gerencia array local de contatos
        ↓
handleSubmit() → INSERT/UPDATE patients_v2
              → UPSERT patient_insurances
              → UPSERT patient_emergency_contacts
        ↓
onSuccess() → refetch() → lista atualizada

[Clicar em "Ver Prontuário" (olho)]
        ↓
navigate(`/patients/${id}`) → PatientDetail
```

---

## 9. Pendências e Melhorias Identificadas

- [ ] **StatCards desatualizados:** Ainda exibem contagens de status antigos (`lead`, `em_avaliacao`). Devem ser atualizados para `ativo`/`inativo` + métricas de consultas agendadas.
- [ ] **Botão "Filtrar Status"** sem funcionalidade implementada (apenas visual)
- [ ] **Paginação** nos botões Anterior/Próximo sem lógica real (sempre mostra página 1)
- [ ] **Soft delete** para inativar paciente sem excluir do banco
- [ ] **Botão "Mais opções" (⋯)** sem menu implementado
- [ ] **PatientCard:** indicador de status (dot verde) sempre hardcoded como verde — deveria refletir `patient.status`

---

## 10. Dependências Externas

| Dependência | Uso |
|-------------|-----|
| **Supabase** | Banco de dados principal (autenticação + RLS + queries) |
| **ViaCEP API** | `https://viacep.com.br/ws/{cep}/json/` — busca endereço por CEP |
| **lucide-react** | Ícones de toda a interface |
| **react-router-dom** | Navegação (`useNavigate`, rotas) |
