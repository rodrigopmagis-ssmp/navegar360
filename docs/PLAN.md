# Plano de Execução: Kits Padrão de Cirurgia (Orchestration - Phase 1)

## 🎯 Objetivo
Criar um cadastro de "Kits Padrão" que agrupe múltiplos itens (procedimentos, exames, OPME, equipamentos, participante e documentos) para padronizar e agilizar a criação de pedidos médicos rotineiros (ex: "Kit Colecistectomia"). 

Os principais pontos de extensão na UI serão:
1. **Configurações > Protocolos Cirúrgicos:** Adicionar uma nova aba chamada "Kit Padrão".
2. **Novo Pedido Médico:** Adicionar um botão "Carregar Kit Padrão" que preenche automaticamente as seções do formulário ativo.

## 🏗️ 1. Arquitetura de Banco de Dados (Supabase)
Precisaremos espelhar a estrutura dos itens que compõem um "pedido" (`order_*`), mas associados a um `kit_id` genérico e uma `clinic_id`.

**Novas Tabelas (Data Schema):**
- `standard_kits` (`id`, `clinic_id`, `name`, `description`, `status`)
- `standard_kit_procedures` (`id`, `kit_id`, `code`, `name`, `description`, `quantity`, `is_main`)
- `standard_kit_exams` (`id`, `kit_id`, `exam_name`, `exam_type`, `justification`, `quantity`)
- `standard_kit_documents` (`id`, `kit_id`, `document_type`, `template_name`, `is_required`)
- `standard_kit_opme` (`id`, `kit_id`, `name`, `description`, `quantity`, `justification`)
- `standard_kit_equipments` (`id`, `kit_id`, `name`, `description`, `quantity`)
- `standard_kit_participants` (`id`, `kit_id`, `role`, `specialty`)

**Regras de Segurança (RLS):**
- Serão vinculadas ao `clinic_id` via as tabelas para garantir que as clínicas só enxergam e aplicam seus próprios "Kits Padrão".

## 💻 2. Alterações Frontend

### 2.1 Tela "Protocolos Cirúrgicos" (`components/settings/ProtocolsSettings.tsx`)
- Adição de Tab Navigation (Aba 1: "Etapas/Ações", Aba 2: "Kits Padrão").
- A tela de "Kits Padrão" terá um Sidebar pareado (Lista de Kits) e um painel de edição (Detalhes, Itens do Kit).
- Poderemos adicionar itens semelhantes ao formulário de cadastro, salvando no banco.

### 2.2 Tela "Novo Pedido Médico" (`pages/NewOrder.tsx`)
- Adição de um botão de conveniência próximo ao Título: **[+ Carregar Kit Padrão]**.
- Ao clicar, um Modal abre listando todos os Kits da clínica (`status = 'active'`).
- Ao escolher o Kit, as listas no `estado global/local` (ex: `selectedProcedures`, `selectedOPME`, `selectedEquipments`, etc.) são **alimentadas com os dados do Kit Padrão**.

## 🛠️ Próximos Passos (Orquestração Phase 2 - Implementação Paralela)

Assim que obter sua aprovação, orquestraremos os seguintes Agentes para executar as mudanças:
1. **`database-architect`** e **`security-auditor`**: Criarão o script SQL para as 7 novas tabelas os respectivos RLS.
2. **`backend-specialist`** e **`frontend-specialist`**: Criarão o CRUD de Kits na tela de Protocolos e a função de injeção dos itens no formulário de `NewOrder.tsx`.
3. **`test-engineer`**: Garantirá que o payload da cirurgia saia íntegro após um Kit ter sido carregado e enviado.
