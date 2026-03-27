<p align="center">
  <a href="http://nestjs.com/" target="_blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="90" alt="NestJS Logo"/>
  </a>
  &nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/jestjs/jest/main/website/static/img/jest.png" width="80" alt="Jest Logo"/>
  &nbsp;&nbsp;
  <img src="https://www.docker.com/wp-content/uploads/2022/03/vertical-logo-monochromatic.png" width="90" alt="Docker Logo"/>
  &nbsp;&nbsp;
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Google_Gemini_logo.svg/2560px-Google_Gemini_logo.svg.png" width="90" alt="Gemini Logo"/>
</p>

<h1 align="center">🔔 Notification Hub</h1>

<p align="center">
  <strong>AI-Powered Notification Microservice</strong><br/>
  Microserviço centralizado de mensageria com refinamento de conteúdo via Google Gemini AI,<br/>
  persistência em PostgreSQL, rastreio de status e envio de e-mail transacional.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-v11-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS"/>
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Gemini-2.0_flash-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI"/>
  <img src="https://img.shields.io/badge/PostgreSQL-17-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/>
  <img src="https://img.shields.io/badge/Jest-Tested-C21325?style=for-the-badge&logo=jest&logoColor=white" alt="Jest"/>
</p>

---

## O Problema que Este Projeto Resolve

Em ecossistemas de microsserviços, cada aplicação implementa sua própria lógica de notificação — gerando duplicação de código, inconsistência nas mensagens enviadas e ausência de rastreio.

O **Notification Hub** resolve isso sendo um **gateway centralizado e agnóstico**: qualquer serviço (Java/Spring, Python, etc.) envia uma única requisição REST, e o Hub cuida de todo o resto — incluindo o refinamento opcional do conteúdo via **IA generativa** para garantir mensagens claras e profissionais.

---

## Principais Funcionalidades

| | Funcionalidade | Descrição |
|---|---|---|
| 🤖 | **AI Content Refinement** | Integração real com `gemini-2.0-flash` via SDK `@google/generative-ai`. O conteúdo bruto é reescrito pela IA antes do envio. Em caso de falha, o sistema aplica **fallback automático** para o conteúdo original — garantindo resiliência. |
| 📬 | **E-mail Transacional** | Envio via **Mailtrap API** com `nodemailer` e template HTML responsivo embutido. Sender e destinatário configuráveis por requisição. |
| 🗄️ | **Persistência & Auditoria** | Cada notificação é persistida no **PostgreSQL** com TypeORM. Rastreio completo: `PENDING → SENT / FAILED`, com `originalContent` preservado para comparar o input com o output da IA. |
| 🔒 | **Validação Robusta** | Entrada validada com `class-validator` + `class-transformer`. Erros retornam respostas padronizadas conforme as convenções do NestJS. |
| 📖 | **Documentação Interativa** | Interface **Swagger/OpenAPI** disponível em `/api` para testes manuais e integração por outros times. |
| 🧪 | **Testabilidade** | Testes unitários com **Jest** e mocks completos de dependências externas. Cobre fluxos de sucesso, falhas de IA e falhas de e-mail. |
| 🐳 | **Pronto para Deploy** | Containerização completa com **Docker + Docker Compose**: app e banco isolados, sem configuração manual de ambiente. |

---

## Decisões de Arquitetura

### Módulo de IA isolado (`AiModule`)

A integração com o Gemini vive em um módulo próprio em vez de ficar acoplado ao módulo de notificações. Isso permite:
- **Trocar o modelo de IA** (ex: OpenAI, Anthropic) sem tocar no `NotificationsService`
- **Testar o `AiService` de forma independente**
- **Reutilizar** em outros módulos futuros

### Fallback resiliente

Se a chamada ao Gemini falhar (timeout, cota, etc.), o `NotificationsService` captura a exceção, loga o aviso e continua o fluxo com o conteúdo original — **o envio nunca é bloqueado por falha de IA**.

### Separação entre `content` e `originalContent`

A entidade persiste os dois campos para permitir auditoria: é possível comparar o que o sistema externo enviou vs. o que o usuário final recebeu após o refinamento da IA.

---

## Estrutura do Projeto

```
src/
├── ai/
│   ├── ai.module.ts              # Módulo isolado — single responsibility
│   └── ai.service.ts             # Encapsula o SDK @google/generative-ai
│
├── notifications/
│   ├── dto/                      # Contratos de entrada (validação + Swagger decorators)
│   ├── entities/                 # NotificationEntity (TypeORM)
│   ├── enums/                    # NotificationStatus: PENDING | SENT | FAILED
│   ├── notifications.controller.ts
│   ├── notifications.module.ts   # Importa AiModule
│   └── notifications.service.ts  # Orquestra IA → DB → E-mail
│
├── app.module.ts                 # ConfigModule (global), TypeORM, MailerModule
└── main.ts                       # Bootstrap + Swagger setup

test/
├── unit/
│   ├── notifications.service.spec.ts    # 8 cenários unitários
│   └── notifications.controller.spec.ts # 5 cenários unitários
└── app.e2e-spec.ts                      # Testes de integração
```

### Fluxo de uma requisição

```
POST /notifications
        │
        ▼
  Validação do DTO
        │
   useAI === true?
   ┌────┴────────┐
  SIM           NÃO
   │             │
   ▼             │
AiService        │
(Gemini API)     │
   │             │
   ▼ (ou fallback se falhar)
  conteúdo final
        │
        ▼
  Salva no DB ── status: PENDING
        │
        ▼
  Envia e-mail (Mailtrap API)
        │
   ┌────┴────┐
 SENT      FAILED
```

---

## 🛠️ Stack Técnica

| Camada | Tecnologia | Motivo |
|---|---|---|
| Framework | NestJS v11 | DI nativa, modularidade, padrão enterprise para Node.js |
| Linguagem | TypeScript 5.7 | Type safety + decorators para NestJS e TypeORM |
| IA | Google Gemini 2.0 Flash | Modelo rápido e de baixo custo para refinamento de texto |
| Banco de Dados | PostgreSQL 17 + TypeORM | ORM maduro com suporte a migrações e repository pattern |
| E-mail | Mailtrap API + `@nestjs-modules/mailer` | Entrega confiável com suporte a HTML templates |
| Validação | `class-validator` + `class-transformer` | Integração nativa com os pipes do NestJS |
| Documentação | Swagger / OpenAPI | Essencial para integração com outros times |
| Testes | Jest + Supertest | Padrão da comunidade NestJS, suporte a mocks typescript-first |
| Containerização | Docker + Docker Compose | Zero setup para rodar localmente ou em CI/CD |
| Config | `@nestjs/config` + `.env` | Gestão de segredos desacoplada do código |

---

## Como Rodar

### Pré-requisitos
- Docker e Docker Compose instalados
- Chaves de API: [Google Gemini](https://aistudio.google.com/) e [Mailtrap](https://mailtrap.io/)

### Setup

```bash
# 1. Clone o repositório
git clone https://github.com/viniciusciconebarbosa/notification-hub
cd notification-hub

# 2. Configure as variáveis de ambiente
cp .env.example .env
# edite o .env com suas chaves de API

# 3. Suba os containers (app + PostgreSQL)
docker-compose up --build
```

| Serviço | URL |
|---|---|
| API REST | `http://localhost:3000` |
| Swagger UI | `http://localhost:3000/api` |

---

## 📡 API Reference

### `POST /notifications`

Processa e envia uma notificação. Com `useAI: true`, o campo `content` é reescrito pelo Gemini antes do envio.

**Body:**
```json
{
  "appId": "minha-app",
  "recipientEmail": "usuario@email.com",
  "recipientName": "João Silva",
  "subject": "Atualização importante",
  "content": "Pedido 1234 aprovado.",
  "useAI": true
}
```

**Response `201`:**
```json
{
  "message": "Notification processed successfully",
  "sentContent": "Olá, João! Ficamos felizes em informar que o seu Pedido #1234 foi aprovado com sucesso.",
  "aiUsed": true
}
```

### `GET /notifications`

Retorna o histórico completo de notificações ordenado por `createdAt DESC`, com `originalContent`, `content` (refinado), `status` e metadados.

---

## 🧪 Testes

```bash
# Unitários
npm run test

# Com relatório de cobertura
npm run test:cov

# End-to-end
npm run test:e2e
```

Testes unitários vivem em `test/unit/` com **mocks completos** de todas as dependências externas — zero chamadas reais à rede.

**Cenários cobertos:**
- ✅ Fluxo completo sem IA (`useAI: false`)
- ✅ Refinamento com Gemini ativo (`useAI: true`)
- ✅ Fallback para conteúdo original quando a IA falha
- ✅ Status `FAILED` quando o e-mail não é entregue
- ✅ Status `SENT` após entrega bem-sucedida
- ✅ `originalContent` preservado independente do refinamento
- ✅ `BadRequestException` para e-mail ausente
- ✅ Controller propaga exceções do service corretamente

---

## 👤 Autor

Desenvolvido por **Vinicius Barbosa**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-viniciusciconebarbosa-0A66C2?style=flat-square&logo=linkedin)](https://linkedin.com/in/viniciusciconebarbosa)
[![GitHub](https://img.shields.io/badge/GitHub-viniciusciconebarbosa-181717?style=flat-square&logo=github)](https://github.com/viniciusciconebarbosa)
