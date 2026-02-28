# 📋 Documentação: Tela de Médicos

> **Última atualização:** 2026-02-28
> **Arquivo:** `pages/Doctors.tsx`
> **Módulo:** Gestão de Médicos

---

## 1. Visão Geral

A tela de **Gestão de Médicos** é o cadastro central de profissionais médicos da clínica. Permite registrar cirurgiões, assistentes, anestesistas e residentes, com seus respectivos dados profissionais (conselho, RQE, especialidade) e dados de contato.

### Rota

- **Path:** `/doctors`
- **Arquivo:** `pages/Doctors.tsx`
- **Layout:** Dentro do `<Layout>` padrão (Topbar + Sidebar + `<main>`)

---

## 2. Arquivos Envolvidos

| Arquivo | Papel |
|---------|-------|
| `pages/Doctors.tsx` | Componente principal da tela |
| `components/DoctorModal.tsx` | Modal de criação/edição |
| `hooks/useDoctors.ts` | Hook de busca de dados no Supabase |
| `types.ts` → `Doctor` | Interface TypeScript |
| `components/Sidebar.tsx` | Item de navegação adicionado |
| `App.tsx` | Rota `/doctors` adicionada |
| `lib/supabase.ts` | Cliente Supabase |

---

## 3. Banco de Dados — Tabelas Relacionadas

### 3.1 `doctors` (tabela principal — criada em 2026-02-28)

| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|-------------|-----------|
| `id` | UUID | ✅ PK | Auto gerado |
| `clinic_id` | UUID | ✅ FK→clinics | Isolamento por clínica (RLS) |
| `profile_id` | UUID | ❌ FK→profiles | Vínculo com auth — nullable para médicos externos |
| `full_name` | text | ✅ | Nome completo |
| `council` | text | ❌ | Conselho: CRM, CRO, CREFITO, CFN, COREN, CFF |
| `council_number` | text | ❌ | Número do registro |
| `council_state` | text | ❌ | Estado do registro (SP, RJ...) |
| `rqe` | text | ❌ | Registro de Qualificação de Especialista (convênios) |
| `specialty` | text | ❌ | Especialidade principal |
| `subspecialty` | text | ❌ | Subespecialidade |
| `role_type` | text | ✅ | `cirurgiao`, `assistente`, `anestesista`, `residente` |
| `phone` | text | ❌ | Telefone fixo |
| `whatsapp` | text | ❌ | WhatsApp |
| `email` | text | ❌ | E-mail |
| `status` | text | ✅ | `ativo` (verde) ou `inativo` (vermelho) |
| `notes` | text | ❌ | Observações livres |
| `created_at` | timestamptz | ✅ | Auto gerado |
| `updated_at` | timestamptz | ✅ | Auto atualizado via trigger `set_doctors_updated_at` |

**Constraints:**
- `doctors_role_type_check CHECK (role_type IN ('cirurgiao','assistente','anestesista','residente'))`
- `doctors_status_check CHECK (status IN ('ativo', 'inativo'))`

**Índices:**
- `idx_doctors_clinic_id` ON `clinic_id`
- `idx_doctors_full_name` ON `full_name`
- `idx_doctors_council_num` ON `council_number`
- `idx_doctors_specialty` ON `specialty`

**RLS:**
- Policy `clinic_isolation` com COALESCE para evitar silêncio em usuários sem perfil.

---

### 3.2 Tabelas estendidas

| Tabela | Coluna adicionada | Tipo | Descrição |
|--------|-------------------|------|-----------|
| `surgery_cases` | `doctor_id` | UUID FK→doctors | Substitui campo texto `doctor` no futuro |
| `team_members` | `doctor_id` | UUID FK→doctors | Vínculo estruturado com médicos cadastrados |

> ⚠️ Os campos texto legados (`surgery_cases.doctor`, `team_members.name`) foram mantidos como fallback e não removidos nesta migration.

---

## 4. Hook de Dados: `useDoctors`

**Arquivo:** `hooks/useDoctors.ts`

```typescript
// Query: SELECT * FROM doctors ORDER BY full_name ASC
// RLS filtra automaticamente por clinic_id
// Retorna: { doctors, loading, error, refetch }
```

---

## 5. Componentes da Tela

### 5.1 `StatCard`
4 cards no topo: **Total**, **Cirurgiões**, **Assistentes/Anest.**, **Inativos**

> O StatCard de Assistentes/Anestesistas usa `role_type IN ('assistente', 'anestesista')`.

### 5.2 `StatusBadge`
| Status | Cor |
|--------|-----|
| `ativo` | Verde esmeralda |
| `inativo` | Vermelho |

### 5.3 `RoleBadge`
| role_type | Label | Cor |
|-----------|-------|-----|
| `cirurgiao` | Cirurgião | Azul primary |
| `assistente` | Assistente | Âmbar |
| `anestesista` | Anestesista | Roxo |
| `residente` | Residente | Slate |

### 5.4 `DoctorCard` (grade)
Avatar com iniciais, conselho/número/estado, especialidade, telefone, e-mail, RoleBadge, RQE.

### 5.5 Vista lista (tabela)
Colunas: Médico, Registro (conselho+RQE), Especialidade, Tipo, Status, Ações.

---

## 6. Modal: `DoctorModal`

**Arquivo:** `components/DoctorModal.tsx`

### Abas

| # | ID | Label | Campos |
|---|----|----|--------|
| 1 | `professional` | Dados Profissionais | Nome, Conselho, Número, Estado, RQE, Especialidade, Subespecialidade, Tipo de Atuação, Status |
| 2 | `contact` | Contato & Observações | Telefone, WhatsApp, E-mail, Observações |

### Lógica de salvamento

1. Valida `full_name` (obrigatório)
2. Obtém `clinic_id` via `profiles` do usuário autenticado
3. Novo: `INSERT INTO doctors`
4. Edição: `UPDATE doctors WHERE id = doctorToEdit.id`
5. Chama `onSuccess()` → `refetch()` → lista atualizada

---

## 7. Fluxo de Dados

```
[Usuário acessa /doctors]
        ↓
useDoctors() → Supabase RLS filtra por clinic_id
        ↓
SELECT * FROM doctors ORDER BY full_name
        ↓
Exibe lista/grade com StatusBadge e RoleBadge

[Clicar em "Novo Médico" ou editar]
        ↓
DoctorModal abre
        ↓
Aba 1: Dados Profissionais
Aba 2: Contato & Observações
        ↓
handleSubmit() → INSERT/UPDATE doctors
        ↓
onSuccess() → refetch()
```

---

## 8. Pendências e Melhorias

- [ ] **Vincular `surgery_cases.doctor_id`** na tela de agenda (substituir texto livre)
- [ ] **Vincular `team_members.doctor_id`** nas equipes cirúrgicas
- [ ] **Tela de detalhe do médico** (`/doctors/:id` com histórico de cirurgias)
- [ ] **Foto do médico** (upload para Supabase Storage)
- [ ] **Filtro por tipo de atuação** (botão "Filtrar Tipo" ainda sem funcionalidade)
- [ ] **Soft delete** para inativar sem excluir do banco
- [ ] **Associar `profile_id`** para médicos que têm acesso ao sistema

---

## 9. Dependências Externas

| Dependência | Uso |
|-------------|-----|
| **Supabase** | Banco de dados + RLS + trigger `moddatetime` |
| **lucide-react** | Ícones (`Stethoscope`, `Users`, `Phone`, etc.) |
| **react-router-dom** | Navegação |
