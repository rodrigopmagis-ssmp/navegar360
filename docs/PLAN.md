# PLAN.md - Refatoração do Novo Pedido Médico Detalhado

## 🎯 Objetivo Principal
Melhorar a experiência e estrutura do "Cadastro de Pedido Médico Detalhado" (`/new-order`), substituindo o modelo atual de scroll vertical único por um sistema de **Abas Isoladas**. A principal alteração ocorrerá na primeira aba ("Pedido Médico"), que deverá trazer maior detalhamento e validações avançadas (cruzamento com agenda do médico).

---

## 🏗️ Requisitos do Novo Formato

### 1. Sistema de Abas Isoladas
A navegação não deve mais utilizar scroll âncora para descer a página mostrando todas as seções. Cada seção será renderizada isoladamente com base na aba ativada (`activeTab`), semelhante ao feito em `PatientDetail.tsx` e `DoctorDetail.tsx`:
- Pedido Médico
- Procedimentos
- Exames
- Documentos
- OPME
- Equipamentos

### 2. Primeira Aba: "Pedido Médico"
Deve reunir as seguintes informações dispostas de forma ergonômica e limpa:

#### A. Dados do Beneficiário (Paciente)
* Nome
* Idade (Calculada a partir da Data de Nascimento)
* Telefone / Celular
* E-mail
* Sexo Biológico
* Operadora (Convênio)
* Número da Carteira/Cartão
* Validade do Cartão

#### B. Profissional Solicitante (Médico)
* Nome do Médico Solicitante
* Conselho (Ex: CRM, CRO)
* Número do Conselho

#### C. Local de Execução
* Seleção: "Na própria clínica" ou "Em parceiro externo"
* Se parceiro externo, mostrar select com a lista de hospitais
* Informações do Hospital: Nome Fantasia e CNPJ

#### D. Agendamento e Validação
* Data e Hora prevista do procedimento
*  **Regra de Cruzamento:** Ao escolher o Profissional e a Data Prevista, o sistema deve garantir de que a **agenda do médico** não possui outro *surgery_case* (procedimento) alocado para esse exato mesmo horário, impedindo marcações simultâneas e alertando o usuário.

#### E. Classificação Clínica e Atendimento
* **Tipo de Atendimento:**
  - Ambulatorial (Sem opção de informar número de diárias)
  - Internamento (Selecionar "Diária de Internação" ou "Hospital Dia". Se for Internação, mostrar campo input "Número de Diárias")
* **Caráter:** Urgência ou Eletiva
* **CID 10:** Input combobox autoavaliador (ou simples se for digitável por código)
* **Diagnóstico:** Campo de texto descritivo e extenso (`textarea` preferencialmente com dimensionamento ajustável pelo usuário para descrever com detalhes).

---

## 🤖 Agentes Orquestrados Para Implementação

1. **`project-planner`**: (Concluído) Definição do plano de abas e mapeamento da primeira tela de Dados da Cirurgia/Beneficiário.
2. **`frontend-specialist`**: (Pendente) Transformar o layut atual `<NewOrder />` em abas de estado local. Modularizar os componentes de cada aba (ex: `<DataSurgeryTab />`). Integrar campos visuais listados no requisito `2`.
3. **`backend-specialist` e `explorer`**: (Pendente) Implementar o script de "Verificação de Choque de Horário" na agenda do médico (Supabase Queries e RLS de listagem das cirurgias agendadas da clínica/médico) e preencher combos de autocomplete de pacientes/médicos.
4. **`test-engineer`**: (Pendente) Testar todo o preenchimento, validando se a aba "Pedido Médico" esconde completamente o restante do conteúdo, bloqueia choque de agendas e se os campos condicionados (ex: "Número de Diárias" se mostrar só em Internação) trocam corretamente de estado.

---

## 🔒 User Review Required
> [!IMPORTANT]
> O Plano acima engloba toda a refatoração pedida sobre o Pedido Médico Detalhado (abas isoladas, dados explícitos de paciente/médico com cruze da agenda, local da cirurgia e formulário de diagnóstico/CID). 
> 
> Gostaria de aprovar este **Plano Oficial** e iniciar a execução técnica (Fase de Implementação) com os Agentes Front-end e Back-end agora mesmo?
