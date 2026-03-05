# 📋 Documentação: Cadastro de Pedido Médico Detalhado

> **Última atualização:** 2026-03-02
> **Arquivo:** `pages/NewOrder.tsx`
> **Módulo:** Financeiro / Pedidos Médicos

---

## 1. Visão Geral

Esta tela é o coração do sistema para o agendamento de cirurgias e procedimentos. Ela permite o cadastro completo de uma solicitação médica, abrangendo desde os dados básicos do paciente e médico até detalhes técnicos como OPME, equipamentos e exames.

A tela suporta dois modos:
- **Criação**: Quando acessada via `/p/new-order` sem parâmetros extras.
- **Edição**: Quando o `orderId` é passado via `location.state`.

### Rota

- **Path:** `/new-order`
- **Arquivo:** `pages/NewOrder.tsx`

---

## 2. Arquivos Envolvidos

| Arquivo | Papel |
|---------|-------|
| `pages/NewOrder.tsx` | Componente principal e orquestrador do formulário |
| `hooks/useDoctors.ts` | Hook para busca e listagem de médicos |
| `components/modals/DoctorSearchModal.tsx` | Modal de busca avançada de médicos |
| `components/modals/HospitalSearchModal.tsx` | Modal de busca de hospitais/parceiros |
| `components/inputs/ProcedureRow.tsx` | Linha de input para procedimentos TUSS |
| `components/inputs/ExamRow.tsx` | Linha de input para exames |
| `components/inputs/OpmeRow.tsx` | Linha de input para itens de OPME |
| `components/inputs/EquipmentRow.tsx` | Linha de input para equipamentos |
| `components/inputs/CidSearchInput.tsx` | Input com autocomplete para CID-10 |

---

## 3. Banco de Dados — Tabelas Relacionadas

### 3.1 `surgery_cases` (Tabela Principal)

Armazena o cabeçalho do pedido.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK do pedido |
| `clinic_id` | UUID | FK para a clínica |
| `patient_id` | UUID | FK para `patients_v2` |
| `doctor_id` | UUID | FK para `profiles` (médico) |
| `hospital_id` | UUID | FK para `hospitals` (se externo) |
| `date` | DATE | Data da cirurgia |
| `time` | TIME | Hora da cirurgia |
| `character` | TEXT | 'eletiva' ou 'urgencia' |
| `attendance_type` | TEXT | 'ambulatorial' ou 'internamento' |
| `status` | TEXT | Status do processo (ex: 'agendado') |

### 3.2 Tabelas de Itens (Relacionadas)

- `order_procedures`: Procedimentos solicitados (Vínculo via `order_id`).
- `order_exams`: Exames laboratoriais ou de imagem.
- `order_opme`: Órteses, Próteses e Materiais Especiais.
- `order_equipments`: Equipamentos necessários (Arco cirúrgico, vídeo, etc).
- `medical_order_documents`: Documentos anexados (Arquivos no storage).

---

## 4. Lógicas e Validações

### 4.1 Verificação de Conflitos

O sistema valida automaticamente se o **médico** ou o **paciente** já possuem outro agendamento no mesmo dia e horário, disparando um alerta visual no campo de data/hora.

### 4.2 Modo de Edição

Ao carregar para edição, o sistema:
1. Busca os dados em `surgery_cases`.
2. Busca todos os itens nas tabelas de relacionamento.
3. Preenche os estados do formulário.
4. Ao salvar, remove os itens antigos e insere os novos (nas tabelas de itens) para garantir integridade.

---

## 5. Fluxo de Abas (Tabs)

O formulário é dividido em 6 abas para melhor UX:
1. **Pedido Médico**: Dados do paciente, médico, local, data e CID.
2. **Procedimentos**: Listagem de procedimentos TUSS.
3. **Exames**: Listagem de exames complementares.
4. **Documentos**: Upload de guias, laudos e termos.
5. **OPME**: Detalhadamento de materiais especiais.
6. **Equipamentos**: Seleção de equipamentos da clínica.

---

## 6. Pendências e Melhorias

- [x] Implementar suporte à edição de pedidos existentes.
- [ ] Adicionar validação de duplicidade de procedimentos (mesmo TUSS no mesmo pedido).
- [ ] Implementar salvamento automático (rascunho).

---

## 7. Referências Técnicas

- **Storage**: Arquivos são salvos no bucket `medical_documents`, pasta `orders/{order_id}/`.
- **Legacy Support**: Colunas `doctor` (nome) e `patientName` são mantidas para compatibilidade com relatórios antigos.
