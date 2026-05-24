# Aave LTV Calculator Extension

Extensão Chrome MV3 para `https://app.aave.com/*` que adiciona uma calculadora de margem ao painel da Aave. O ícone da calculadora é inserido ao lado do botão de configurações da própria Aave e abre um painel com métricas de garantia, dívida, LTV, liquidação e simulação de novo borrow.

> Ferramenta auxiliar de acompanhamento. Não é recomendação financeira.

## O que calcula

- Garantia total em cripto original, USDT e BRL.
- Dívida total em USDT e BRL.
- LTV atual em vez de health factor.
- Quanto ainda pode ser tomado emprestado em USDT antes de 70% de LTV.
- Preço de WBTC/BTC em USDT que levaria a posição a 75% de LTV.
- APY ponderado do borrow.
- Simulação de novo borrow por valor em USDT ou por LTV alvo, exibindo o LTV resultante ou o USDT disponível.
- Atualização automática da posição Aave e cotações KuCoin a cada 60 segundos quando há carteira válida.

## Interface

- Ícone de calculadora integrado ao header da Aave, ao lado do botão de configurações.
- Painel colapsável com botão de fechar.
- Cards coloridos por tipo de informação:
  - Garantia
  - Dívida
  - LTV atual
  - Borrow disponível até 70%
  - Preço de liquidação simulado
  - APY do borrow
- Simulador com dois modos:
  - `USDT`: informa um novo borrow e calcula o novo LTV.
  - `LTV`: informa um LTV alvo e calcula quanto USDT ainda pode ser tomado, exibindo também o valor em BRL.
- Scroll contido dentro do painel, sem rolar a página da Aave enquanto a calculadora está aberta.

## Fontes de dados

- Posição Aave: leitura on-chain do Aave V3 Arbitrum `PoolDataProvider`.
- Preços: API pública da KuCoin:
  - `BTC-USDT`
  - `USDT-BRL`
  - fallback para `BRL-USDT` invertido se necessário.
- RPC: `https://arb1.arbitrum.io/rpc`.
- Carteira: tentativa de leitura da carteira conectada no app via provider EVM injetado; também é possível colar manualmente um endereço `0x...`.

O MVP precifica `WBTC`, `USDT`, `USDC` e `DAI`. Outros ativos são ignorados até existir fonte de preço mapeada.

## Arquitetura

```txt
src/content/              content script e injeção no DOM da Aave
src/ui/                   componentes React do painel
src/domain/               cálculos puros e regras de refresh/posição
src/services/             clientes Aave, KuCoin/background e carteira
src/styles/               CSS isolado no Shadow DOM
public/assets/background.js  service worker MV3 para chamadas KuCoin sem CORS da página
```

O content script injeta um Shadow DOM perto do botão `settings-button` da Aave. As chamadas à KuCoin são feitas no background service worker da extensão, porque chamadas diretas do content script saem da origem `app.aave.com` e podem ser bloqueadas por CORS.

## Instalação local

```bash
npm install
npm run build
```

Depois:

1. Abra `chrome://extensions`.
2. Ative `Developer mode`.
3. Clique em `Load unpacked`.
4. Selecione a pasta `dist`.
5. Abra `https://app.aave.com`.

Sempre que alterar o código e rodar `npm run build`, recarregue a extensão em `chrome://extensions`.

## Uso

1. Clique no ícone de calculadora ao lado das configurações da Aave.
2. Se a carteira conectada for detectada, ela aparece no input.
3. Se não for detectada, cole o endereço `0x...`.
4. Clique no botão de atualizar.
5. No simulador, escolha `USDT` para informar um novo borrow ou `LTV` para informar até qual LTV quer chegar.
6. Use `Atualizar automaticamente` para ligar ou desligar a releitura periódica.

## Fórmulas

```txt
collateralUsdt = sum(supply.amount * supply.priceUsdt) onde collateralEnabled = true
debtUsdt = sum(borrow.amount * borrow.priceUsdt)
ltvPercent = debtUsdt / collateralUsdt * 100
borrowRoomAt70 = collateralUsdt * 0.70 - debtUsdt
btcLiquidationPriceAt75 = debtUsdt / (btcAmount * 0.75)
simulatedLtv = (debtUsdt + newBorrowUsdt) / collateralUsdt * 100
```

Com múltiplos colaterais, o cálculo de preço de liquidação desconta os demais colaterais e resolve apenas o preço necessário para o WBTC.

## Desenvolvimento

```bash
npm install
npm test
npm run build
```

Testes cobrem:

- cálculo de garantia, dívida, LTV, margem e liquidação;
- simulação por USDT e por LTV alvo;
- cliente de preços KuCoin;
- chamada ao background worker da extensão;
- regras de auto-refresh.

## Avisos

Esta extensão é uma ferramenta auxiliar de cálculo, não recomendação financeira. Os limites de 70% e 75% são metas configuradas para a calculadora e não substituem os parâmetros oficiais de risco de cada ativo no protocolo.
