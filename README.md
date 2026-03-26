<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">

#  Notification Hub - Microserviço de Mensageria com IA

Este é um microserviço desenvolvido em **NestJS** focado em centralizar e automatizar notificações (E-mail, Logs, etc.) para sistemas externos.

##  O Projeto
O objetivo deste Hub é receber requisições de outras aplicações, processar o conteúdo utilizando nestjs para refinar a comunicação e realizar o disparo de notificações de forma assíncrona e organizada.

###  Diferenciais Técnicos
- **Arquitetura Modular:** Separação clara de responsabilidades seguindo os padrões do NestJS.
- **Validação de Contratos (DTOs):** Implementação de `class-validator` para garantir a integridade dos dados recebidos.
- **Integração com IA:** Middleware preparado para processamento de linguagem natural.
- **Backend Robusto:** Desenvolvido por um desenvolvedor focado em escalabilidade e automação.

##  Tecnologias Utilizadas
- **Framework:** NestJS (Node.js)
- **Linguagem:** TypeScript
- **Validação:** Class-validator & Class-transformer
- **Integrações:** OpenAI API (Planejado), PostgreSQL (Planejado)

##  Estrutura de Pastas
Atualmente o projeto segue a estrutura modular do NestJS:
- `src/notifications`: Módulo principal de notificações.
- `src/notifications/dto`: Contratos de entrada de dados (Validação).

##  Como Rodar
1. Instale as dependências:
   ```bash
   npm install
