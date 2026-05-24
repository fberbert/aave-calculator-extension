# Cálculos

Os cálculos ficam em `src/domain/calculations.ts` e são testados em `src/tests/calculations.test.ts`.

## Snapshot base

A calculadora normaliza a posição para:

- `supplies`: ativo, quantidade, preço em USDT, flag de colateral.
- `borrows`: ativo, quantidade, preço em USDT, APY variável.
- `usdtBrl`: cotação USDT/BRL vinda da KuCoin.

## LTV

```txt
LTV = dívida total / garantia total
```

Exemplo das imagens:

```txt
garantia = 678.41 USDT
dívida = 219.93 USDT
LTV = 219.93 / 678.41 * 100 = 32.42%
```

## Margem até 70%

```txt
disponível = garantia * 0.70 - dívida
```

Exemplo:

```txt
678.41 * 0.70 - 219.93 = 254.96 USDT
```

## Liquidação simulada a 75%

Para uma posição em que o colateral relevante é WBTC:

```txt
preço WBTC = dívida / (quantidade WBTC * 0.75)
```

Com outros colaterais:

```txt
preço WBTC = ((dívida / 0.75) - outros_colaterais_usdt) / quantidade WBTC
```

## Simulação de novo borrow

```txt
nova_dívida = dívida + borrow_simulado
novo_ltv = nova_dívida / garantia * 100
sobra_ate_70 = garantia * 0.70 - nova_dívida
```

## Borrow disponível por LTV alvo

Quando o simulador está no modo `LTV`, o usuário informa o LTV desejado e a calculadora resolve o borrow adicional disponível:

```txt
borrow_disponivel = max(0, garantia * ltv_alvo - dívida)
```

Se o LTV alvo informado já estiver abaixo do LTV atual, o resultado é `0 USDT`.
