# Plano de Implementação: Configuração e Detalhes de Protocolos Cirúrgicos

## 1. Visão Geral
**Objetivo:** Implementar o fluxo de "Protocolos Cirúrgicos" inspirado no sistema "ssmp", adicionando uma nova tela de configurações "Protocolos" e aplicando regras dinâmicas de validação (Equipamentos, Equipe, Documentos, OPME) dentro da tela de "Detalhes da Cirurgia".
**Project Type:** WEB
**Contexto:** O usuário deseja aplicar um "efeito UAU", onde cada etapa de um procedimento possa ser configurada por módulo (Equipamentos, Equipe, Documentos). OPME terá um fluxo simplificado focado em valores e aprovação. O anestesista passará para dentro da aba "Equipe".

## 2. Critérios de Sucesso (Success Criteria)
- [ ] Nova tela/aba de "Protocolos" em Configurações.
- [ ] Listagem e criação de estágios de validação (mensagens do WhatsApp, ações, checklists) por tipo de profissional ou equipamento.
- [ ] Na tela de "Detalhes da Cirurgia", a aba Equipamentos obriga a confirmar a disponibilidade do item (Sim/Não). Se não, abre pop-up para "Dispensar com justificativa".
- [ ] A aba Anestesia foi removida e o profissional Anestesista movido para a aba Equipe.
- [ ] Documentos e Equipes validam as dependências de check-ins baseadas no que foi configurado na tela de Protocolos.
- [ ] Na aba OPME, agora é exibido se o material foi autorizado, o valor autorizado e o fornecedor que foi efetivamente aprovado.

## 3. Tech Stack
- React & TailwindCSS (Frontend)
- Supabase (Backend: PostgreSQL para tabelas dos protocolos e relacionamentos)
- Lucide React (Ícones para a nova interface)

## 4. Estrutura de Arquivos e Organização
- `pages/Settings.tsx` (e `components/settings/ProtocolsSettings.tsx`)
- `pages/CaseDetails.tsx` (Refatoração de `EquipmentsTab`, `TeamTab`, `DocumentsTab`, e `OpmeTab`)
- Migrations (`.agent/scripts/...`)

## 5. Tabela de Tarefas (Task Breakdown)

| # | Task | Agente Ideal | Skill Recomendada | Dependências |
|---|---|---|---|---|
| 1 | **Modelagem de Dados**<br>*INPUT:* Requisitos de OPME, Equipamentos, Equipe e Protocolos.<br>*OUTPUT:* Migration `.sql` com novas tabelas de estágios/protocolos.<br>*VERIFY:* Rodar migração no Supabase sem erros. | `database-architect` | `database-design` | Nenhuma |
| 2 | **Adicionar Aba 'Protocolos' em Configurações**<br>*INPUT:* Imagens de referência (estágios, timer, ações).<br>*OUTPUT:* `ProtocolsSettings.tsx` com formulário de configuração e abas (Equipe, Equip, Doc).<br>*VERIFY:* UI carrega os componentes visuais sem quebras de layout. | `frontend-specialist` | `frontend-design` | 1 |
| 3 | **Remover Aba Anestesia e Otimizar Equipe Tab**<br>*INPUT:* Movimentação do objeto anestesista.<br>*OUTPUT:* Arquivo `CaseDetails.tsx` refatorado e salvando o profissional na listagem global da equipe.<br>*VERIFY:* Seleção de anestesista funciona na aba Equipe. | `frontend-specialist` | `frontend-design` | 1 |
| 4 | **Refatorar EquipmentsTab em Detalhes da Cirurgia**<br>*INPUT:* Necessidade do fluxo de confirmação.<br>*OUTPUT:* Checkbox de confirmação de "disponibilidade p/ o dia" e Modal de "Justificativa (Dispensado)".<br>*VERIFY:* Estado do equipamento interage entre Permitido/Dispensado ao invés de apagá-lo. | `frontend-specialist` | `frontend-design` | 1, 2 |
| 5 | **Otimizar OpmeTab**<br>*INPUT:* Nova exigência de campos financeiros e decisão mestre das operadoras.<br>*OUTPUT:* Inputs p/ "Autorizado?", "Valor", "Fornecedor Autorizado" e salvamento no DB.<br>*VERIFY:* Inputs carregam e editam as informações mantendo layout moderno. | `frontend-specialist` | `frontend-design` | 1 |
| 6 | **Integrar Status de Documentos/Equipe ao Fluxo**<br>*INPUT:* Aba documentos e equipe.<br>*OUTPUT:* Visualização do progresso dos protocolos configurados na Settings.<br>*VERIFY:* O "pipeline" de check-ins (ex. D+0, D+2) visualmente carrega igual a imagem de ref. | `frontend-specialist` | `frontend-design` | 2, 3, 4 |

## 6. PHASE X: Verificação Final (Validation Steps)
- [ ] Checagem Socrática de segurança e lint de código.
- [ ] Checagem `ux_audit.py` e layout moderno.
- [ ] Build e `tsc --noEmit` bem-sucedido.
