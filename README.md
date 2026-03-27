<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" margin-left="101px" alt="Nest Logo"/></a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/jestjs/jest/main/website/static/img/jest.png" width="100" alt="Jest Logo" />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://www.docker.com/wp-content/uploads/2022/03/vertical-logo-monochromatic.png" width="120" alt="Docker Logo" />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">Hub de Notificações Inteligente (AI-Powered Gateway)</p>
    <p align="center">

#  Notification Hub - Microserviço de Mensageria com IA

Este é um microserviço agnóstico desenvolvido em NestJS projetado para centralizar a mensageria de ecossistemas distribuídos (como aplicações Java/Spring ou Python). O diferencial está na camada de inteligência artificial que refina e personaliza o conteúdo antes do disparo.

##  O Projeto
O objetivo deste Hub é receber requisições de outras aplicações, processar o conteúdo utilizando nestjs para refinar a comunicação e realizar o disparo de notificações de forma assíncrona e organizada.

###  Diferenciais de Engenharia (O que há sob o capô)
Arquitetura desacoplada: Atua como um gateway independente, permitindo que outros sistemas deleguem a complexidade de notificações via chamadas REST padronizadas.

- **Persistência e Confiabilidade**: Utiliza PostgreSQL 17 com TypeORM para garantir o rastreio de entrega (status: PENDING, SENT, FAILED).
- **Qualidade de Código**: Cobertura de testes unitários rigorosos utilizando Jest, garantindo a estabilidade das regras de negócio.
- **Infraestrutura como Código**: Containerização completa com Docker e Docker Compose, facilitando o deploy e a escalabilidade em ambientes cloud.
- **Documentação Viva**: Interface interativa via Swagger (OpenAPI) para facilitar a integração por desenvolvedores de outros times.

##  Tecnologias Utilizadas
- **Framework:** Core: NestJS (Node.js 22)
- **Linguagem:** TypeScript
- **Banco de Dados:** PostgreSQL & TypeORM.
- **Validação:** Class-validator & Class-transformer
- **Integrações:** OpenAI API (Planejado), PostgreSQL (Planejado)
- **Mensageria** Nodemailer (Integração SMTP/Mailtrap).
- **Testes** Jest & Supertest.

##  Estrutura de Pastas
Atualmente o projeto segue a estrutura modular do NestJS:
- `src/notifications`: Módulo principal de notificações.
- `src/notifications/dto`: Contratos de entrada de dados (Validação).

##  Como Rodar

```
# Clone o repositório
git clone https://github.com/seu-usuario/notification-hub

# Configure suas variáveis no .env (Baseie-se no .env.example)

# Suba os containers
docker-compose up --build
```
