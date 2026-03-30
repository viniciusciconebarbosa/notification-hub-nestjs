<p align="center">
  <a href="http://nestjs.com/" target="_blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="90" alt="NestJS Logo"/>
  </a>
  &nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/jestjs/jest/main/website/static/img/jest.png" width="80" alt="Jest Logo"/>
  &nbsp;&nbsp;
  <img src="https://www.docker.com/wp-content/uploads/2022/03/vertical-logo-monochromatic.png" width="90" alt="Docker Logo"/>
  &nbsp;&nbsp;
  <img src="https://www.vectorlogo.zone/logos/rabbitmq/rabbitmq-icon.svg" width="70" alt="RabbitMQ Logo"/>
  &nbsp;&nbsp;
  <img src="https://www.vectorlogo.zone/logos/redis/redis-icon.svg" width="70" alt="Redis Logo"/>
  &nbsp;&nbsp;
  <img src="https://user-images.githubusercontent.com/95200/143832033-32e868df-f3b0-4251-97fb-c64809a43d36.png" width="120" alt="BullMQ Logo"/>
  &nbsp;&nbsp;
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Google_Gemini_logo.svg/2560px-Google_Gemini_logo.svg.png" width="90" alt="Gemini Logo"/>
</p>

<h1 align="center"> Notification Hub</h1>

<p align="center">
  <strong>AI-Powered Notification Microservice</strong><br/>
  Microserviço centralizado de mensageria com refinamento de conteúdo via Google Gemini AI,<br/>
  processamento assíncrono via BullMQ + Redis, persistência em PostgreSQL e envio de e-mail transacional.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-v11-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS"/>
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Gemini-2.0_flash-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI"/>
  <img src="https://img.shields.io/badge/PostgreSQL-17-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Redis-alpine-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis"/>
  <img src="https://img.shields.io/badge/BullMQ-Queue-FF6B35?style=for-the-badge" alt="BullMQ"/>
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/>
  <img src="https://img.shields.io/badge/Jest-Tested-C21325?style=for-the-badge&logo=jest&logoColor=white" alt="Jest"/>
</p>

---

## O Problema que Este Projeto Resolve

Em ecossistemas de microsserviços, cada aplicação implementa sua própria lógica de notificação — gerando duplicação de código, inconsistência nas mensagens enviadas e ausência de rastreio.

O **Notification Hub** resolve isso sendo um **gateway centralizado e agnóstico**: qualquer serviço (Java/Spring, Python, etc.) publica uma mensagem via **RabbitMQ** ou envia uma requisição REST, e o Hub cuida de todo o resto — refinamento opcional via **IA generativa**, enfileiramento assíncrono com **BullMQ + Redis** e envio de e-mail transacional.

---

## Principais Funcionalidades

| | Funcionalidade | Descrição |
|---|---|---|
|  | **AI Content Refinement** | Integração real com `gemini-2.0-flash` via SDK `@google/generative-ai`. O conteúdo bruto é reescrito pela IA antes do envio. Em caso de falha, o sistema aplica **fallback automático** para o conteúdo original — garantindo resiliência. |
|  | **Processamento Assíncrono** | Após salvar no banco, o serviço enfileira o job no **BullMQ** (backed by Redis) e retorna imediatamente. O `NotificationsProcessor` processa o envio em background com **retry automático** (3 tentativas com backoff exponencial). |
|  | **Consumer RabbitMQ** | Escuta a fila `notification.queue` via `@EventPattern`. Qualquer serviço externo (Java/Spring, Python, etc.) pode publicar uma mensagem e o Hub processa automaticamente — sem acoplamento direto. |
|  | **E-mail Transacional** | Envio via **Mailtrap API** com `nodemailer` e template HTML responsivo embutido. Executado pelo worker BullMQ em background. |
|  | **Persistência & Auditoria** | Cada notificação é persistida no **PostgreSQL** com TypeORM. Rastreio completo: `PENDING → SENT / FAILED`, com `originalContent` preservado para comparar o input com o output da IA. |
|  | **Validação Robusta** | Entrada validada com `class-validator` + `class-transformer`. Erros retornam respostas padronizadas conforme as convenções do NestJS. |
|  | **Documentação Interativa** | Interface **Swagger/OpenAPI** disponível em `/api/docs` para testes manuais e integração por outros times. |
|  | **BullBoard** | Dashboard visual para monitorar filas, jobs ativos, falhos e completados. Disponível em `/admin/queues`. |
|  | **Testabilidade** | Testes unitários com **Jest** e mocks completos de dependências externas. Cobre fluxos de sucesso, falhas de IA e propagação de exceções. |
|  | **Pronto para Deploy** | Containerização completa com **Docker + Docker Compose**: app, PostgreSQL, Redis e RabbitMQ isolados, sem configuração manual de ambiente. |

---

## Decisões de Arquitetura

### Módulo de IA isolado (`AiModule`)

A integração com o Gemini vive em um módulo próprio em vez de ficar acoplado ao módulo de notificações. Isso permite:
- **Trocar o modelo de IA** (ex: OpenAI, Anthropic) sem tocar no `NotificationsService`
- **Testar o `AiService` de forma independente**
- **Reutilizar** em outros módulos futuros

### Processamento assíncrono com BullMQ

O `NotificationsService` não envia o e-mail diretamente — ele **enfileira um job** na `mail-queue` e retorna imediatamente. O `NotificationsProcessor` (worker BullMQ) processa o job em background:

- **Retry automático**: 3 tentativas com backoff exponencial de 5 segundos
- **Resiliência**: se o worker falhar, o job fica na fila e é reprocessado automaticamente
- **Responsabilidade separada**: service orquestra, worker executa

### Fallback resiliente na IA

Se a chamada ao Gemini falhar (timeout, cota, etc.), o `NotificationsService` captura a exceção, loga o aviso e continua o fluxo com o conteúdo original — **o envio nunca é bloqueado por falha de IA**.

### Separação entre `content` e `originalContent`

A entidade persiste os dois campos para permitir auditoria: é possível comparar o que o sistema externo enviou vs. o que o usuário final recebeu após o refinamento da IA.

---

## Estrutura do Projeto

```
src/
├── ai/
│   ├── ai.module.ts                    # Módulo isolado — single responsibility
│   └── ai.service.ts                   # Encapsula o SDK @google/generative-ai
│
├── notifications/
│   ├── dto/                            # Contratos de entrada (validação + Swagger decorators)
│   ├── entities/                       # NotificationEntity (TypeORM)
│   ├── enums/                          # NotificationStatus: PENDING | SENT | FAILED
│   ├── notifications.controller.ts     # REST + @EventPattern (RabbitMQ consumer)
│   ├── notifications.module.ts         # Registra BullMQ, BullBoard, AiModule
│   ├── notifications.processor.ts      # Worker BullMQ — envia e-mail e atualiza status
│   └── notifications.service.ts        # Orquestra IA → DB → enfileira job
│
├── app.module.ts                       # ConfigModule, TypeORM, MailerModule, BullMQ, BullBoard
└── main.ts                             # Bootstrap + Swagger + RabbitMQ microservice

test/
├── unit/
│   ├── notifications.service.spec.ts    # Cenários unitários do service
│   └── notifications.controller.spec.ts # Cenários unitários do controller
└── app.e2e-spec.ts                      # Testes de integração
```

### Fluxo de uma notificação

```
RabbitMQ (Spring Boot)         REST (qualquer cliente)
        │                               │
        ▼                               ▼
  @EventPattern                  POST /api/notifications/send
        │                               │
        └───────────────┬───────────────┘
                        ▼
                  Validação do DTO
                        │
                   useAI === true?
                ┌───────┴────────┐
               SIM              NÃO
                │                │
                ▼                │
           AiService             │
          (Gemini API)           │
                │                │
                ▼ (fallback se falhar)
            conteúdo final
                │
                ▼
        Salva no DB — status: PENDING
                │
                ▼
     Enfileira job na mail-queue (BullMQ)
                │
         retorna 201 imediatamente
                │
                ▼ (background — NotificationsProcessor)
        Worker processa o job
                │
           ┌────┴────┐
          SENT     FAILED (retry automático até 3x)
```


---
## Dashboards

### Dashboard RabbitMQ
> O link local de acesso ao Rabbit quando subirem os containers ` -> http://localhost:15672/#/exchanges/%2F/notification.exchange`.
![rabbitmq](https://github.com/user-attachments/assets/f117bc37-909a-4fca-a3a9-3ec677f9ecf5)
### Dashboard BullMQ
> O link local de acesso ao Bull quando subirem os containers ` -> http://localhost:3000/api/admin/queues/queue/mail-queue?status=completed`.
![bullMQ](https://github.com/user-attachments/assets/0e255595-243b-4531-9815-6a5d0eede7d5)
### Dashboard Redis
> O link local de acesso ao Redis quando subirem os containers ` http://localhost:8081/`.
![redis](https://github.com/user-attachments/assets/6ebf6423-96b3-404f-9536-f5dcefd702ed)


---

## 🛠️ Stack Técnica

| Camada | Tecnologia | Motivo |
|---|---|---|
| Framework | NestJS v11 | DI nativa, modularidade, padrão enterprise para Node.js |
| Linguagem | TypeScript 5.7 | Type safety + decorators para NestJS e TypeORM |
| IA | Google Gemini 2.0 Flash | Modelo rápido e de baixo custo para refinamento de texto |
| Banco de Dados | PostgreSQL 17 + TypeORM | ORM maduro com suporte a migrações e repository pattern |
| Fila assíncrona | BullMQ + Redis | Processamento em background com retry automático e backoff exponencial |
| Mensageria | RabbitMQ 3.13 | Desacoplamento entre serviços — qualquer produtor pode publicar notificações |
| E-mail | Mailtrap API + `@nestjs-modules/mailer` | Entrega confiável com suporte a HTML templates |
| Monitoramento de filas | BullBoard | Dashboard visual para inspecionar jobs ativos, falhos e completados |
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

# 3. Suba os containers (app + PostgreSQL + Redis + RabbitMQ)
docker-compose up --build
```

| Serviço | URL |
|---|---|
| API REST | `http://localhost:3000/api` |
| Swagger UI | `http://localhost:3000/api/docs` |
| BullBoard (filas) | `http://localhost:3000/admin/queues` |
| RabbitMQ Management | `http://localhost:15672` (user: `admin` / pass: `admin123`) |
| Redis Commander | `http://localhost:8081` |

---

## 📡 API Reference

### `POST /api/notifications/send`

Enfileira uma notificação para envio assíncrono. Com `useAI: true`, o campo `content` é reescrito pelo Gemini antes de ser enfileirado. O e-mail é enviado em background pelo worker BullMQ.

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

> O retorno `201` confirma que a notificação foi **salva e enfileirada**. O envio do e-mail ocorre em background — consulte o status via `GET /api/notifications` ou acompanhe pelo BullBoard em `/admin/queues`.

### `GET /api/notifications`

Retorna o histórico completo de notificações ordenado por `createdAt DESC`, com `originalContent`, `content` (refinado), `status` e metadados.

| Status | Significado |
|---|---|
| `PENDING` | Salvo no banco, aguardando o worker processar |
| `SENT` | E-mail entregue com sucesso |
| `FAILED` | Todas as tentativas de envio falharam |

---

### Contrato RabbitMQ

Serviços externos podem publicar diretamente na fila em vez de usar o endpoint REST:

- **Exchange:** `notification.exchange`
- **Routing Key:** `notification.routingKey`
- **Queue:** `notification.queue`

**Payload esperado:**
```json
{
  "pattern": "notification.routingKey",
  "data": {
    "appId": "ERP_BIBLIOTECA",
    "recipientEmail": "usuario@email.com",
    "recipientName": "João Silva",
    "subject": "Bem-vindo!",
    "content": "Seu cadastro foi realizado com sucesso.",
    "useAI": true
  }
}
```

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
- ✅ Job enfileirado na `mail-queue` após salvar no banco
- ✅ `originalContent` preservado independente do refinamento
- ✅ `BadRequestException` para e-mail ausente
- ✅ Controller propaga exceções do service corretamente

---

## 👤 Autor

Desenvolvido por **Vinicius Barbosa**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-viniciusciconebarbosa-0A66C2?style=flat-square&logo=linkedin)](https://linkedin.com/in/viniciusciconebarbosa)
[![GitHub](https://img.shields.io/badge/GitHub-viniciusciconebarbosa-181717?style=flat-square&logo=github)](https://github.com/viniciusciconebarbosa)
