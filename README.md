# RocketMotionLab Web v2

Versão web com análise física + módulo químico teórico.

## Novidades da v2

- Entrada do volume de solução alcoólica.
- Entrada da concentração de etanol.
- Suporte a % v/v e % m/m.
- Cálculo teórico de:
  - volume equivalente de etanol;
  - massa de etanol;
  - mol de etanol;
  - O2 estequiométrico necessário;
  - mol de CO2;
  - massa de CO2;
  - volume ideal de CO2 a ~25 °C e 1 atm.
- Alinhamento opcional do tempo pelo início do movimento.
- Limiar configurável para detectar início do movimento.
- Comparações:
  - CO2 teórico × altura máxima;
  - CO2 teórico × velocidade máxima;
  - CO2 teórico × aceleração máxima;
  - volume de solução × altura máxima.

## Reação usada

C2H5OH + 3 O2 -> 2 CO2 + 3 H2O

## Observação

Os valores químicos são máximos teóricos calculados por estequiometria, assumindo combustão completa.
Eles não representam medição direta da combustão real.

## Como publicar no GitHub Pages

1. Envie `index.html`, `styles.css` e `app.js` para a raiz do repositório.
2. Vá em `Settings > Pages`.
3. Em `Build and deployment`, selecione `Deploy from a branch`.
4. Branch: `main`.
5. Folder: `/ (root)`.
6. Salve.

Se o repositório já estiver publicado via GitHub Pages, basta substituir os três arquivos antigos pelos da v2.
