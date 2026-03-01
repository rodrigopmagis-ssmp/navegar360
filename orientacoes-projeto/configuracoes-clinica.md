# 📋 Documentação: Configurações da Clínica

> **Última atualização:** 2026-02-28
> **Arquivo:** `components/settings/ClinicSettings.tsx`
> **Módulo:** Configurações

---

## 1. Visão Geral
Esta tela permite que o gestor administre os dados base da própria clínica (Tenant Principal) que o usuário atual logado pertence. As edições são segregadas na interface dividindo "Modo Visualização" e "Modo Edição", além de formatar dados sensíveis como CNPJ, telefones e preenchimento de endereço automatizado via ViaCEP.

### Rota
- **Path:** `/settings/clinic` (Acessível via Hub Principal de Configurações)
- **Arquivo:** `components/settings/ClinicSettings.tsx`

---

## 2. Arquivos Envolvidos

| Arquivo | Papel |
|---------|-------|
| `components/settings/ClinicSettings.tsx` | Componente principal e formulário |
| `pages/Settings.tsx` | View Host / Wrapper de Navegação Contextual |
| `lib/supabase.ts` | Interface com o Banco de Dados PostgREST |

---

## 3. Banco de Dados — Tabelas Relacionadas

### 3.1 `clinics`

A tabela isolada por RLS que carrega o registro da própria instituição que o médico controla.

| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|-------------|-----------|
| `id` | UUID | ✅ PK | ID da Clínica |
| `name` | text | ✅ | Nome Fantasia (Exibido internamente) |
| `legal_name` | text | ❌ | Razão Social |
| `cnpj` | text | ❌ UNIQUE | Cadastro Nacional de Pessoas Jurídicas |
| `zip_code` | text | ❌ | CEP de busca |
| `street` | text | ❌ | Endereço |
| `number` | text | ❌ | Número do local |
| `complement` | text | ❌ | Complemento, sala |
| `neighborhood`| text | ❌ | Bairro |
| `city` | text | ❌ | Cidade |
| `state` | char(2) | ❌ | Estado UF |
| `phone` | text | ❌ | Telefone Comercial |
| `whatsapp` | text | ❌ | WhatsApp |
| `email` | text | ❌ | E-mail de Contato Comercial |
| `website` | text | ❌ | URL / Site |

---

## 4. Hook de Dados

Atualmente não possui um Hook isolado.
- Busca o `user.id` da autenticação atual.
- Filtra a clínica via `profiles.clinic_id`.
- O payload de salvamento é enviado diretamente na função `handleSave` e muda localmente o estado `isEditing`.

---

## 5. Componentes da Tela

### 5.1 Modo Exibição (Read-only)
Tabelas verticais que mostram graficamente Ícones Lucide + Informações atuais da clínica. Otimizado para leitura rápida de endereços e cópia de telefone.

### 5.2 Formulário de Edição
Inputs padronizados com suporte a CEP dinâmico, máscara nativa customizada e cancelamento de save.

---

## 6. Fluxo Completo de Dados

```
[Usuário acessa /settings/clinic]
        ↓
Faz fetchUser() -> acha Profile
        ↓
Faz fetchClinicById() -> Traz de "clinics"
        ↓
[Apresenta Tela ReadOnly] --clica em editar--> [Habilita inputs do Formulário]
                                                    ↓
[Salva no Supabase (Atualizando linha única identificada)] <--
```

---

## 7. Pendências e Melhorias

- [x] Ocultar tela de ReadOnly durante validação se não houver dados preenchidos.
- [ ] Implementar Uploader para `logo_url` na Storage do Supabase.
- [ ] Teste automatizado de Regras do ViaCEP.

---

## 8. Dependências Externas

| Dependência | Uso |
|-------------|-----|
| Supabase | Persistência, busca de autorização de Profile |
| Fetch API / viacep.com.br| Preenchimento automático de input por CEP |
| lucide-react | Iconografia universal (MapPin, Phone, Building) |
