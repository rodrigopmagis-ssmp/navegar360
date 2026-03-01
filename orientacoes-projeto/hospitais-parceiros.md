# 📋 Documentação: Hospitais Parceiros

> **Última atualização:** 2026-02-28
> **Arquivo:** `components/settings/HospitalSettings.tsx`
> **Módulo:** Configurações

---

## 1. Visão Geral
Módulo gerencial em que a clínica autêntica os Centros de Saúde Externos onde atua. Permite o cadastro da instituição, do setor técnico e observações gerais sobre contratos e tratativas. Esta tela é projetada para rápida visualização e fluidez, sem refresh bruscos por ações simples.

### Rota
- **Path:** `/settings/hospitals` (Acessível via Hub Principal de Configurações)
- **Arquivo:** `components/settings/HospitalSettings.tsx`

---

## 2. Arquivos Envolvidos

| Arquivo | Papel |
|---------|-------|
| `components/settings/HospitalSettings.tsx` | Componente View Principal (Lista de Cards e Formulário Interativo) |
| `pages/Settings.tsx` | Hub e Roteamento de Configurações |
| `lib/supabase.ts` | Conexão para Banco e Autenticação |

---

## 3. Banco de Dados — Tabelas Relacionadas

### 3.1 `hospitals`
Armazena a entidade principal do hospital. Possui forte barreira de *Row Level Security* orientada ao `clinic_id`.

| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|-------------|-----------|
| `id` | UUID | ✅ PK | ID do hospital |
| `clinic_id` | UUID | ✅ FK→clinics | Instância SaaS (Tenant) |
| `name` | text | ✅ | Nome da Instituição |
| `legal_name` | text | ❌ | Razão social |
| `cnpj` | text | ❌ | Documento CNPJ |
| `cnes` | text | ❌ | Cadastro Nacional Especialista da Saúde |
| `type` | text | ✅ | Ex: `hospital`, `day_clinic`, `ambulatorio`, `pronto_socorro` |
| `status` | text | ✅ | Ex: `ativo`, `inativo` |
| `notes` | text | ❌ | Observações macro do cadastro |
| `phone` | text | ❌ | Telefone Geral |
| `email` | text | ❌ | E-mail da matriz |
| Endereços | text | ❌ | Padrão (zip_code, street, number, complement, neighborhood, city, state) |

### 3.2 `hospital_contacts`
Tabela secundária para Contatos Setoriais 1:N com o Hospital Principal.

| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|-------------|-----------|
| `id` | UUID | ✅ PK | ID do Contato |
| `hospital_id`| UUID | ✅ FK→hospitals | Hospital dono vinculador (Deleta CASCADE cascadeado) |
| `name` | text | ✅ | Nome do contato principal ou gerente da área |
| `role` | text | ✅ | Qualificada: Função / Setor (Ex: Financeiro) |
| `phone` | text | ❌ | Celular, Ramal, PBX do Setor |
| `email` | text | ❌ | Contato individual do colaborador de setor |
| `whatsapp` | text | ❌ | Contato Instantâneo exclusivo |
| `notes` | text | ❌ | Resumo, Ex: Horários de atendimento |

---

## 4. Hook de Dados

Atualmente o State de dados provém dentro do próprio componente `HospitalSettings` sem encapsulamento de hook exclusivo. As queries acopladas são:
- Traz Hospitais ordenados alfabeticamente `.order('name')`
- Array atrelado de Foreign Key: `.select('*, hospital_contacts(*)')` usando PostgREST de navegação direta.

---

## 5. Componentes da Tela

### 5.1 Hospital Settings Root Component
Reúne 3 grandes Layouts baseados em estados unificados (`isFormOpen` , `hospitalsList`):
1. **Empty State:** UI com Call-to-action chamando pra primeiro cadastro.
2. **Matrix (Grid de Cards):** Visualiza em grade esteticamente atraente os ícones. Renderiza dinamicamente as "Tags de Contato" (`hospital_contacts`) e botões de `Edit`/`Delete` em Hovers animados.
3. **Modal UI de Inserção/Edição:** Aparece deslocando a grade substituindo-se pela tela "Cadastro". Processa array de "Lista de Contatos Dinâmica" lidando com inclusão ou deleção temporária por formulário antes do Save (`handleSave()`).

---

## 6. Fluxo Completo de Dados (Com Contatos)

```
[Usuário acessa /settings/hospitals]
        ↓
Faz fetchUser() -> acha Profile.clinic_id
        ↓
Faz Query de hospitais com inner joins de 'hospital_contacts' baseado na RLS de 'clinics'
        ↓
Lista os Hospitais
[Clicar 'Novo Parceiro'] 
        ↓
Formulário Vazio (Limpa `currentHospital` e define Array de temporary Contacts [])
[Botão '+ Setor/Contato']
        ↓
Aplica object placeholder `temp-[Date.now()]` no state Array
[Salvar Parceiro e Contato]
        ↓
Se tem 'temp', tira o temp e da UPSERT dos contatos atrelado ao record master (Id do Hospital salvo)
Se existir apagados temporariamente (Remover Contato de index Array), efetiva delete das Keys do Supabase.
```

---

## 7. Pendências e Melhorias

- [x] Ocultar tela principal e isolar o formulário.
- [x] Cadastros aninhados UPSERT (Hospitais + Setores Dinâmicos).
- [ ] Implementar integração VIA CEP.
- [ ] Conectar ao módulo de `surgery_cases` futuramente.

---

## 8. Dependências Externas

| Dependência | Uso |
|-------------|-----|
| Supabase | Persistência Relacional Mestre-Detalhe (UPSERT/Deletes dinâmicos) com RLS ativada |
| lucide-react | Elementos visuais (Building, Stethoscope, Users) |
| React States | Gerenciamento efêmero dinâmico do subformulário |
