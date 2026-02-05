# 🚀 Orquestrador de Pedidos

API NestJS para receber pedidos via webhook, validar, enfileirar e enriquecer dados através de integrações externas.

---

## 📋 Índice

1. [Como Rodar o Projeto](#-como-rodar-o-projeto)
2. [Regras de Negócio](#-regras-de-negócio)
3. [Arquitetura Técnica](#-arquitetura-técnica)
4. [Endpoints da API](#-endpoints-da-api)
5. [Documentação Swagger](#-documentação-swagger)

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** 18 ou superior ([Download](https://nodejs.org/))
- **Docker** e **Docker Compose** ([Download](https://www.docker.com/get-started))
- **npm** ou **yarn** (vem com Node.js)
- **Git** (opcional, para clonar o repositório)

### Passo 1: Clonar o Repositório (se aplicável)

```bash
git clone <url-do-repositorio>
cd orquestrador-de-pedidos
```

### Passo 2: Instalar Dependências

```bash
npm install
```

Este comando instala todas as dependências do projeto listadas no `package.json`.

**Tempo estimado**: 2-5 minutos (dependendo da conexão)

### Passo 3: Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

O arquivo `.env` contém as configurações necessárias:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/order_orchestrator?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Application
PORT=3000
NODE_ENV=development

# External Integration (Exchange Rate API)
EXCHANGE_API_URL=https://api.exchangerate-api.com/v4/latest
EXCHANGE_API_TIMEOUT=5000

# External Integration (CEP API - ViaCEP)
CEP_API_URL=https://viacep.com.br/ws
CEP_API_TIMEOUT=5000
```

**Nota**: Você pode modificar essas variáveis conforme necessário, mas os valores padrão funcionam para desenvolvimento local.

### Passo 4: Subir a Infraestrutura (PostgreSQL + Redis)

```bash
docker compose up -d
```

Este comando:
- ✅ Cria e inicia containers Docker para PostgreSQL e Redis
- ✅ Configura volumes persistentes para dados
- ✅ Expõe portas necessárias (5432 para PostgreSQL, 6379 para Redis)
- ✅ Executa em background (`-d`)

**Verificar se os containers estão rodando**:
```bash
docker compose ps
```

Você deve ver dois containers:
- `order-orchestrator-postgres` (Status: Up)
- `order-orchestrator-redis` (Status: Up)

**Tempo estimado**: 30-60 segundos

### Passo 5: Gerar Prisma Client

```bash
npm run prisma:generate
```

Este comando gera o cliente Prisma baseado no schema em `prisma/schema.prisma`.

**Tempo estimado**: 10-20 segundos

### Passo 6: Executar Migrations do Banco de Dados

```bash
npm run prisma:migrate
```

Este comando:
- ✅ Cria as tabelas no banco de dados PostgreSQL
- ✅ Aplica o schema definido no Prisma
- ✅ Cria índices e constraints

**Tempo estimado**: 5-10 segundos

### Passo 7: Iniciar a Aplicação

```bash
npm run start:dev
```

Este comando:
- ✅ Inicia o servidor NestJS em modo desenvolvimento
- ✅ Ativa hot-reload (recarrega automaticamente ao salvar arquivos)
- ✅ Compila TypeScript em tempo real

**Saída esperada**:
```
🚀 Application is running on: http://localhost:3000
📚 Swagger documentation available at: http://localhost:3000/api
```

**Tempo estimado**: 10-20 segundos

### ✅ Verificação Final

Teste se a API está funcionando:

```bash
curl http://localhost:3000/health
```

**Resposta esperada**:
```json
{
  "status": "ok",
  "timestamp": "2026-02-04T12:00:00.000Z"
}
```

---

## 🎯 Regras de Negócio

### 1. Recebimento de Pedidos via Webhook

#### Fluxo Principal

1. **Cliente envia pedido** via `POST /webhooks/orders`
2. **Validação automática** do payload (campos obrigatórios, tipos, formatos)
3. **Verificação de idempotência** através da `idempotency_key`
4. **Cálculo automático** do valor total do pedido
5. **Persistência** no banco de dados com status `RECEIVED`
6. **Enfileiramento** para processamento assíncrono
7. **Resposta imediata** `202 Accepted` com dados do pedido

#### Validações Aplicadas

- ✅ `order_id`: Obrigatório, string não vazia
- ✅ `customer.email`: Obrigatório, formato de email válido
- ✅ `customer.name`: Obrigatório, string não vazia
- ✅ `items`: Obrigatório, array com mínimo 1 item
- ✅ `items[].sku`: Obrigatório, string não vazia
- ✅ `items[].qty`: Obrigatório, número inteiro maior que 0
- ✅ `items[].unit_price`: Obrigatório, número maior que 0.01
- ✅ `currency`: Obrigatório, código ISO 4217 (3 letras maiúsculas, ex: USD, BRL, EUR)
- ✅ `idempotency_key`: Obrigatório, string não vazia

#### Cálculo do Total

O valor total é calculado automaticamente:

```
totalAmount = Σ(items[i].qty * items[i].unit_price)
```

**Exemplo**:
- Item 1: qty=2, unit_price=59.90 → subtotal = 119.80
- Item 2: qty=1, unit_price=29.50 → subtotal = 29.50
- **Total**: 149.30

---

### 2. Idempotência

#### Conceito

A API garante que o mesmo pedido não seja processado múltiplas vezes, mesmo que o webhook seja chamado várias vezes.

#### Como Funciona

1. **Primeira requisição** com `idempotency_key: "abc-123"`:
   - ✅ Cria novo pedido
   - ✅ Enfileira para processamento
   - ✅ Retorna pedido criado

2. **Requisições subsequentes** com a mesma `idempotency_key: "abc-123"`:
   - ✅ Retorna o pedido existente
   - ✅ **NÃO** cria novo registro
   - ✅ **NÃO** reenfileira job
   - ✅ Retorna `202 Accepted` com dados existentes

#### Casos de Uso

- **Retentativas automáticas**: Se o cliente não receber resposta, pode reenviar com segurança
- **Duplicação acidental**: Previne processamento duplicado por erros de rede
- **Sincronização**: Permite sincronizar estado sem criar duplicatas

---

### 3. Processamento Assíncrono

#### Por que Assíncrono?

O processamento de enriquecimento pode demorar (chamadas a APIs externas), então:
- ✅ Cliente recebe resposta **imediatamente** (~250ms)
- ✅ Processamento acontece em **background**
- ✅ Não bloqueia outras requisições

#### Fluxo de Processamento

```
1. Pedido recebido → Status: RECEIVED
2. Job enfileirado → Status: ENQUEUED
3. Worker pega job → Status: PROCESSING_ENRICHMENT
4. Chama API externa → (conversão de moeda)
5. Salva resultado → Status: ENRICHED
```

**Tempo de resposta HTTP**: ~250ms  
**Tempo total de processamento**: ~2-5 segundos (em background)

---

### 4. Enriquecimento de Dados

#### O que é Enriquecimento?

Processo de adicionar informações complementares ao pedido através de integrações externas.

#### Integrações Implementadas

**1. API de Câmbio (ExchangeRate API)**
- **Função**: Converte valor do pedido para BRL
- **Quando**: Sempre que o pedido tem moeda diferente de BRL
- **Dados salvos**: Taxa de câmbio, valor convertido, timestamp

**Exemplo**:
```json
{
  "enrichmentData": {
    "exchange": {
      "convertedAmount": 599.00,
      "rate": 5.0,
      "targetCurrency": "BRL",
      "providerMeta": {
        "baseCurrency": "USD",
        "timestamp": "2026-02-04T12:00:00.000Z"
      }
    },
    "originalAmount": 119.80,
    "originalCurrency": "USD"
  }
}
```

**2. API de CEP (ViaCEP)** - Disponível para uso futuro
- **Função**: Valida e enriquece endereços via CEP brasileiro
- **Quando**: Pode ser usado para validar endereços de clientes
- **Dados retornados**: Logradouro, bairro, cidade, UF, etc.

---

### 5. Retry e Resiliência

#### Mecanismo de Retry

Quando uma integração externa falha, o sistema tenta novamente automaticamente:

- **5 tentativas** no total
- **Backoff exponencial**: Aguarda antes de cada retry
  - Tentativa 1: Imediata
  - Tentativa 2: Aguarda 2 segundos
  - Tentativa 3: Aguarda 4 segundos
  - Tentativa 4: Aguarda 8 segundos
  - Tentativa 5: Aguarda 16 segundos

#### Dead Letter Queue (DLQ)

Se todas as tentativas falharem:
- ✅ Job é enviado para **DLQ** (Dead Letter Queue)
- ✅ Status atualizado para `FAILED_ENRICHMENT`
- ✅ Erro detalhado salvo no banco de dados
- ✅ Pode ser processado manualmente depois

#### Por que Backoff Exponencial?

- ✅ Evita sobrecarregar APIs externas
- ✅ Dá tempo para problemas temporários se resolverem
- ✅ Reduz consumo de recursos

---

### 6. Estados do Pedido

O pedido passa por diferentes estados durante seu ciclo de vida:

| Estado | Descrição | Quando Ocorre |
|--------|-----------|---------------|
| `RECEIVED` | Pedido recebido | Imediatamente após validação e persistência |
| `ENQUEUED` | Enfileirado | Após ser adicionado à fila de processamento |
| `PROCESSING_ENRICHMENT` | Sendo enriquecido | Quando worker começa a processar |
| `ENRICHED` | Enriquecido com sucesso | Após integração externa retornar com sucesso |
| `FAILED_ENRICHMENT` | Falhou no enriquecimento | Após esgotar todas as tentativas de retry |

**Fluxo normal**: `RECEIVED` → `ENQUEUED` → `PROCESSING_ENRICHMENT` → `ENRICHED`  
**Fluxo com falha**: `RECEIVED` → `ENQUEUED` → `PROCESSING_ENRICHMENT` → (retry) → `FAILED_ENRICHMENT`

---

## 🏗️ Arquitetura Técnica

### Visão Geral

```
┌─────────────┐
│   Cliente   │ POST /webhooks/orders
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│   WebhooksController                │
│   - Valida payload                  │
│   - Retorna 202 Accepted            │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│   WebhooksService                   │
│   - Verifica idempotência           │
│   - Calcula total                   │
│   - Persiste pedido                 │
│   - Enfileira job                   │
└──────┬──────────────────────────────┘
       │
       ├─────────────────┐
       ▼                 ▼
┌─────────────┐  ┌──────────────┐
│ PostgreSQL  │  │   Redis      │
│ (Dados)     │  │   (Fila)     │
└─────────────┘  └──────┬───────┘
                        │
                        ▼
              ┌─────────────────────┐
              │ EnrichmentProcessor │
              │ - Processa job       │
              │ - Chama API externa  │
              │ - Atualiza pedido    │
              └─────────────────────┘
```

---

### Stack Tecnológica

#### Backend Framework
- **NestJS 10.3**: Framework Node.js baseado em TypeScript
  - Arquitetura modular
  - Dependency Injection nativa
  - Decorators para rotas, validação, etc.

#### Banco de Dados
- **PostgreSQL 15**: Banco relacional
  - ACID compliance
  - Suporte a JSON/JSONB
  - Índices para performance

#### ORM
- **Prisma 5.7**: ORM moderno
  - Type-safe queries
  - Migrations automáticas
  - Prisma Studio para visualização

#### Fila de Processamento
- **BullMQ (Bull) 4.12**: Sistema de filas
  - Baseado em Redis
  - Retry automático
  - Dead Letter Queue
  - Processamento paralelo

#### Cache/Fila
- **Redis 7**: Armazenamento em memória
  - Usado pelo BullMQ para filas
  - Persistência configurável

#### Validação
- **class-validator**: Validação declarativa
- **class-transformer**: Transformação de dados

#### Documentação
- **Swagger/OpenAPI**: Documentação interativa

#### Cliente HTTP
- **Axios**: Para chamadas a APIs externas

---

### Estrutura de Módulos

```
src/
├── app.module.ts              # Módulo raiz
├── main.ts                    # Bootstrap da aplicação
│
├── common/                    # Código compartilhado
│   ├── constants/            # Constantes (filas, paginação)
│   ├── dto/                  # DTOs compartilhados
│   ├── enums/                # Enums (OrderStatus)
│   ├── filters/              # Exception filters globais
│   ├── interceptors/         # Interceptors (logging)
│   └── interfaces/           # Interfaces TypeScript
│
├── config/                    # Configurações
│   └── configuration.ts      # Configuração centralizada
│
├── prisma/                   # Prisma
│   ├── prisma.module.ts     # Módulo Prisma
│   └── prisma.service.ts    # Service do Prisma
│
├── orders/                   # Módulo de Pedidos
│   ├── orders.module.ts     # Módulo
│   ├── orders.controller.ts # Controller (GET /orders)
│   ├── orders.service.ts    # Service (lógica de negócio)
│   └── dto/                 # DTOs específicos
│
├── webhooks/                 # Módulo de Webhooks
│   ├── webhooks.module.ts   # Módulo
│   ├── webhooks.controller.ts # Controller (POST /webhooks/orders)
│   ├── webhooks.service.ts  # Service (processamento)
│   └── dto/                 # DTOs específicos
│
├── queue/                    # Módulo de Filas
│   ├── queue.module.ts      # Módulo (configura BullMQ)
│   ├── queue.controller.ts  # Controller (GET /queue/metrics)
│   ├── queue.service.ts     # Service (métricas)
│   └── processors/          # Processors (workers)
│       └── enrichment.processor.ts # Processa jobs
│
└── integrations/             # Integrações Externas
    ├── integrations.module.ts # Módulo
    ├── exchange/            # API de Câmbio
    │   └── exchange.service.ts
    └── cep/                 # API de CEP
        └── cep.service.ts
```

---

### Padrões Arquiteturais

#### 1. Layered Architecture (Arquitetura em Camadas)

```
Controller (Roteamento)
    ↓
Service (Lógica de Negócio)
    ↓
Repository/Prisma (Acesso a Dados)
    ↓
Database
```

**Benefícios**:
- ✅ Separação clara de responsabilidades
- ✅ Fácil testar cada camada isoladamente
- ✅ Manutenção simplificada

#### 2. Dependency Injection

```typescript
@Injectable()
export class WebhooksService {
  constructor(
    private readonly ordersService: OrdersService,
    @InjectQueue(QUEUE_NAMES.ENRICHMENT) 
    private readonly enrichmentQueue: Queue,
  ) {}
}
```

**Benefícios**:
- ✅ Baixo acoplamento
- ✅ Fácil mockar em testes
- ✅ Inversão de controle

#### 3. Module Pattern

Cada funcionalidade é um módulo independente:
- `OrdersModule`: Gerencia pedidos
- `WebhooksModule`: Recebe webhooks
- `QueueModule`: Gerencia filas
- `IntegrationsModule`: Integrações externas

**Benefícios**:
- ✅ Organização clara
- ✅ Reutilização
- ✅ Escalabilidade

---

### Fluxo de Dados Detalhado

#### 1. Recebimento de Webhook

```
POST /webhooks/orders
    ↓
ValidationPipe (valida payload)
    ↓
WebhooksController.receiveOrder()
    ↓
WebhooksService.processWebhook()
    ├─ OrdersService.findByIdempotencyKey() → Verifica idempotência
    ├─ Calcula totalAmount
    ├─ OrdersService.create() → Persiste no PostgreSQL
    ├─ enrichmentQueue.add() → Enfileira no Redis
    └─ OrdersService.updateStatus() → Atualiza para ENQUEUED
    ↓
Retorna 202 Accepted
```

#### 2. Processamento Assíncrono

```
BullMQ detecta novo job
    ↓
EnrichmentProcessor.handleEnrichment()
    ├─ OrdersService.updateStatus() → PROCESSING_ENRICHMENT
    ├─ ExchangeService.convertToBRL() → Chama API externa
    │   └─ HTTP GET para ExchangeRate API
    ├─ OrdersService.updateEnrichment() → Salva resultado
    └─ OrdersService.updateStatus() → ENRICHED
```

#### 3. Tratamento de Erros

```
Erro na integração externa
    ↓
Catch no EnrichmentProcessor
    ├─ Log erro
    ├─ Re-throw error
    ↓
BullMQ detecta erro
    ├─ Aguarda backoff (2s, 4s, 8s, 16s)
    └─ Retry automático (até 5x)
    ↓
Se esgotar tentativas:
    ├─ dlqQueue.add() → Envia para DLQ
    └─ OrdersService.updateError() → FAILED_ENRICHMENT
```

---

### Configurações Importantes

#### Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `DATABASE_URL` | URL de conexão PostgreSQL | `postgresql://...` |
| `REDIS_HOST` | Host do Redis | `localhost` |
| `REDIS_PORT` | Porta do Redis | `6379` |
| `PORT` | Porta da aplicação | `3000` |
| `EXCHANGE_API_URL` | URL da API de câmbio | `https://api.exchangerate-api.com/v4/latest` |
| `EXCHANGE_API_TIMEOUT` | Timeout da API (ms) | `5000` |

#### Configuração de Retry

```typescript
{
  attempts: 5,                    // 5 tentativas
  backoff: {
    type: 'exponential',          // Backoff exponencial
    delay: 2000,                  // Delay inicial: 2s
  }
}
```

#### Configuração de Paginação

```typescript
{
  PAGE: 1,                        // Página padrão
  LIMIT: 10,                      // Itens por página
  MAX_LIMIT: 100,                 // Máximo permitido
}
```

---

## 📡 Endpoints da API

### Health Check

```http
GET /health
```

**Resposta**:
```json
{
  "status": "ok",
  "timestamp": "2026-02-04T12:00:00.000Z"
}
```

---

### Receber Pedido (Webhook)

```http
POST /webhooks/orders
Content-Type: application/json
```

**Body**:
```json
{
  "order_id": "ext-123",
  "customer": {
    "email": "user@example.com",
    "name": "Ana Silva"
  },
  "items": [
    {
      "sku": "ABC123",
      "qty": 2,
      "unit_price": 59.9
    }
  ],
  "currency": "USD",
  "idempotency_key": "unique-key-123"
}
```

**Resposta** (202 Accepted):
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "externalOrderId": "ext-123",
  "idempotencyKey": "unique-key-123",
  "status": "ENQUEUED",
  "totalAmount": "119.80",
  "currency": "USD",
  "payload": { ... },
  "createdAt": "2026-02-04T12:00:00.000Z",
  "updatedAt": "2026-02-04T12:00:00.000Z"
}
```

---

### Listar Pedidos

```http
GET /orders?page=1&limit=10&status=ENRICHED
```

**Query Parameters**:
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 10, máximo: 100)
- `status` (opcional): Filtrar por status (RECEIVED, ENQUEUED, PROCESSING_ENRICHMENT, ENRICHED, FAILED_ENRICHMENT)

**Resposta**:
```json
{
  "data": [
    {
      "id": "...",
      "externalOrderId": "ext-123",
      "status": "ENRICHED",
      ...
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

### Detalhes de um Pedido

```http
GET /orders/{id}
```

**Resposta**:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "externalOrderId": "ext-123",
  "idempotencyKey": "unique-key-123",
  "status": "ENRICHED",
  "payload": { ... },
  "totalAmount": "119.80",
  "currency": "USD",
  "enrichmentData": {
    "exchange": {
      "convertedAmount": 599.00,
      "rate": 5.0,
      "targetCurrency": "BRL",
      ...
    },
    "originalAmount": 119.80,
    "originalCurrency": "USD"
  },
  "createdAt": "2026-02-04T12:00:00.000Z",
  "updatedAt": "2026-02-04T12:05:00.000Z"
}
```

---

### Métricas da Fila

```http
GET /queue/metrics
```

**Resposta**:
```json
{
  "enrichmentQueue": {
    "waiting": 0,
    "active": 1,
    "completed": 42,
    "failed": 2,
    "delayed": 0
  },
  "dlq": {
    "waiting": 2,
    "active": 0,
    "completed": 0,
    "failed": 0,
    "delayed": 0
  }
}
```

---

## 📚 Documentação Swagger

A documentação interativa está disponível em:

**http://localhost:3000/api**

### Recursos do Swagger:

- ✅ **Visualização de todos os endpoints**
- ✅ **Testar requisições diretamente no navegador**
- ✅ **Ver exemplos de payloads e respostas**
- ✅ **Entender modelos de dados**
- ✅ **Copiar código de exemplo** (cURL, JavaScript, etc.)

---

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run start:dev          # Inicia com hot-reload
npm run start:debug        # Inicia com debug

# Produção
npm run build              # Compila TypeScript
npm run start:prod         # Inicia versão compilada

# Qualidade de Código
npm run lint               # Executa ESLint
npm run format             # Formata código com Prettier

# Testes
npm run test               # Testes unitários
npm run test:watch         # Testes em modo watch
npm run test:cov           # Testes com coverage
npm run test:e2e           # Testes end-to-end

# Prisma
npm run prisma:generate    # Gera Prisma Client
npm run prisma:migrate     # Executa migrations
npm run prisma:studio      # Abre Prisma Studio (UI)
npm run prisma:seed        # Executa seed (se configurado)
```

---

## 🐛 Troubleshooting

### Problema: Docker não inicia

**Solução**:
```bash
# Verificar se Docker está rodando
docker ps

# Se não estiver, iniciar Docker Desktop
# Depois tentar novamente:
docker compose up -d
```

### Problema: Erro de conexão com banco

**Solução**:
```bash
# Verificar se PostgreSQL está rodando
docker compose ps

# Ver logs
docker compose logs postgres

# Reiniciar containers
docker compose restart
```

### Problema: Erro de conexão com Redis

**Solução**:
```bash
# Verificar se Redis está rodando
docker compose ps

# Testar conexão
docker exec -it order-orchestrator-redis redis-cli ping
# Deve retornar: PONG
```

### Problema: Erro nas migrations

**Solução**:
```bash
# Resetar banco (CUIDADO: apaga dados)
npm run prisma:migrate reset

# Ou criar nova migration
npm run prisma:migrate dev --name nome_da_migration
```

### Problema: Porta 3000 já em uso

**Solução**:
```bash
# Mudar porta no .env
PORT=3001

# Ou matar processo na porta 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:3000 | xargs kill
```

---

## 📊 Monitoramento

### Logs da Aplicação

Os logs são exibidos no console e incluem:
- ✅ Requisições HTTP (método, URL, status, tempo)
- ✅ Criação de pedidos
- ✅ Processamento de jobs
- ✅ Tentativas de retry
- ✅ Erros e exceções

### Prisma Studio

Visualize dados do banco:

```bash
npm run prisma:studio
```

Acesse: **http://localhost:5555**

### Métricas da Fila

```bash
curl http://localhost:3000/queue/metrics
```

---

## 🔐 Segurança

- ✅ Validação rigorosa de inputs
- ✅ Sanitização de dados
- ✅ Tratamento seguro de erros (sem vazar stack traces)
- ✅ CORS configurável (se necessário)
- ✅ Rate limiting (pode ser adicionado)

---


**Desenvolvido com ❤️ usando NestJS**
