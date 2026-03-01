# 📋 Documentação: Configurações da Clínica

> **Última atualização:** 2026-02-28
> **Arquivo:** `pages/Settings.tsx`
> **Módulo:** Sistema / Configurações

---

## 1. Visão Geral
Página centralizada para administração das configurações do sistema. Atua como um **Hub (Dashboard de Configurações)** apresentando uma grade de cards interativos para cada módulo gerenciável do sistema. 
Utiliza **rotas aninhadas (nested routes)** para proporcionar acesso direto (ex: bookmark) às configurações especialistas organizadas por contexto.

### Rotas
- **Hub Principal:** `/settings`
- **Sub-Módulos:** `/settings/clinic`, `/settings/users`, `/settings/fields`, etc.
- **Arquivo Roteador:** `pages/Settings.tsx`

---

## 2. Arquivos Envolvidos

| Rota | Componente | Descrição |
|---|---|---|
| `/settings` | `SettingsHub` | Painel central com grid de cards navegáveis. |
| `/settings/clinic` | `ClinicSettings` | Configurações da clínica (identidade, endereço, etc). |
| `/settings/hospitals` | `HospitalSettings`| Centros clínicos, locais de internação e convênios parceiros. |
| `/settings/fields` | `FieldsSettings` | Configurações de campos obrigatórios. |
| `/settings/users` | `UsersSettings` | Gestão de usuários e permissões. |
| `/settings/notifications` | `NotificationSettings` | Preferências de notificações e alertas. |
| `/settings/security` | `SecuritySettings` | Segurança e auditoria (logs, LGPD, 2FA). |

---

## 3. Banco de Dados — Tabelas Relacionadas

### 3.1 `clinics`

A tabela base utilizada para o formulário de configurações do tenant/clínica. Possui Row Level Security para garantir a segregação de informações.

| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|-------------|-----------|
| `id` | UUID | ✅ PK | Chave primária |
| `name` | text | ✅ | Nome Fantasia da clínica |
| `legal_name` | text | ❌ | Razão Social |
| `cnpj` | text | ❌ UNIQUE | Identificação CNPJ. Uso de máscara localmente. |
| `logo_url` | text | ❌ | Caminho de mídia para logotipo |
| `zip_code` | text | ❌ | CEP, provê inputs automáticos com API ViaCEP |
| `street` | text | ❌ | Logradouro / Rua |
| `number` | text | ❌ | Número de localidade |
| `complement` | text | ❌ | Complemento de endereço |
| `neighborhood`| text | ❌ | Bairro |
| `city` | text | ❌ | Cidade |
| `state` | char(2) | ❌ | UF |
| `phone` | text | ❌ | Telefone (mascarado) |
| `whatsapp` | text | ❌ | WhatsApp (mascarado) |
| `email` | text | ❌ | Endereço de e-mail comercial |
| `website` | text | ❌ | Website da clínica |
| `status` | text | ✅ | Estado de ativação (Ex: ativo). Administrado externamente. |
| `plan` | text | ❌ | Plano de permissões/assinatura (Ex: 'Free') |

---

## 4. Hook de Dados

Atualmente o fluxo e a obtenção de dados ocorre diretamente no componente visando simplicidade, porém pode ser isolado para um `hooks/useClinic.ts` futuramente com o crescimento deste módulo.
Obtém-se via `profiles` o `clinic_id` do usuário logado, buscando os detalhes na tabela `clinics`.

---

## 5. Componentes da Tela

A arquitetura do módulo é controlada pela página de rotas (`Settings.tsx`) que intercala a visualização utilizando o `react-router-dom`:
- Rota base (`/settings`): Painel de ícones (*Hub View*).
- Sub-rotas (`/settings/*`): Renderiza o título, o botão de voltar e acopla o respectivo Componente Especialista (*Module View*).

### 5.1 ClinicSettings (`components/settings/ClinicSettings.tsx`)
Apresenta o formulário de preenchimento dos detalhes principais. Lida com máscaras dinâmicas aplicadas para CNPJ e fones, integração transparente com a REST API VIACEP e interage diretamente com o Supabase instanciado localmente por RLS.

---

## 6. Fluxo Completo de Dados

```text
[Usuário acessa uma rota de /settings]
        ↓
React Router resolve a URL: 
  ├─ Se for `/settings`: Monta a grade (Hub) de botões de navegação.
  └─ Se for `/settings/[module]`: Renderiza botão de voltar + Componente Especialista
        ↓
  [Exemplo: Fluxo na rota /settings/clinic chamando ClinicSettings]
  Supabase Profiles (usa user.id -> acha clinic_id)
        ↓
  Supabase Clinics (usa clinic_id -> pega detalhes)
        ↓
  [Submete dados editados atualizando tabela Clinics]
```

---

## 7. Pendências e Melhorias

- [x] Preenchimento Automático do CEP
- [x] Máscaras de input visual para legibilidade e padronização CNPJ/Fones
- [ ] Construir componente ou aba 'Perfil' (`ProfileSettings`)
- [ ] Construir componente ou aba 'Notificações' (`NotificationSettings`)
- [ ] Construir componente ou aba 'Segurança' (`SecuritySettings`)
- [ ] Mover as lógicas para custom hook (`hooks/useClinic.ts`) se houver reuso.
- [ ] Incluir ferramenta de Upload de Mídia com feedback visual para trocar o `logo_url` em tempo real.

---

## 8. Dependências Externas

| Dependência | Uso |
|-------------|-----|
| Supabase | Persistência, busca autorizada via RLS da tabela Clinics e fetch do identificador em Profiles |
| ViaCEP | Busca de Endereço Automática |
| lucide-react | Ícones dinâmicos de interface |

---

## 9. RoadMap de Produto & Escalabilidade (Redes de Clínicas)

> **Registro de Decisão Arquitetural (ADR)** - 28/02/2026
> O sistema opera atualmente no modelo **Multi-tenant 1:N** (Onde N pacientes pertencem a 1 `clinic_id` fixo via RLS).

**Para expansão futura:**
Visando vender o software para "Redes de Clínicas" (Matriz e Filial da mesma marca) e/ou franquias que necessitam compartilhar a mesma base de pacientes, a evolução ideal no Supabase será a abordagem de **Grupos Econômicos**:

1. **Alteração na Modelagem:** Criação da tabela `tenant_groups` e adição do campo `group_id` na tabela `clinics`.
2. O cadastro do banco permanece Multi-tenant (jamais escalar por Banco Dedicado por cliente/schema isolation).
3. **Escantear RLS (Row Level Security):** O RLS da tabela `patients` passará a liberar acesso se o médico logado pertencer a uma Clínica que possui o mesmo `group_id` da clínica a qual o paciente pertence (ou se o paciente for atrelado diretamente ao nível do grupo).

*Esta etapa foi mapeada e mantida em backlog (MoSCoW - SHOULD/COULD), não compondo o MVP atual para não complexar a captação de clientes iniciais mono-clínica.*
