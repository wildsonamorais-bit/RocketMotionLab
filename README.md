# Rocket Motion Lab — Android MVP

Projeto Android nativo para analisar vídeos de até ~10 s com câmera fixa e fita métrica visível.

## Recursos
- Seleção de vídeo do celular.
- Calibração manual por dois pontos da fita métrica.
- Marcação manual do foguete no primeiro frame.
- Rastreamento 2D simples por similaridade de cor.
- Posição, trajetória, altura, velocidade e aceleração.
- Força resultante e energias cinética/potencial quando a massa é informada.
- Índice didático de estabilidade lateral.
- Gráficos no próprio app.
- Histórico local e comparação de experimentos.

## Como abrir
1. Descompacte o ZIP.
2. Abra a pasta `RocketMotionLab` no Android Studio.
3. Use JDK 17 e Android SDK 35.
4. Aguarde a sincronização do Gradle.
5. Rode em celular Android API 26+.

## Uso
1. Selecione um vídeo.
2. Informe a massa total se quiser força e energia.
3. Toque em dois pontos conhecidos da fita métrica e informe a distância entre eles.
4. Toque no centro do foguete no primeiro frame.
5. Analise e visualize os gráficos.

## Limitações do MVP
- O rastreamento por cor funciona melhor com bom contraste entre objeto e fundo.
- A fita e a trajetória devem estar aproximadamente no mesmo plano para reduzir erro de perspectiva.
- Aceleração amplifica ruído; o app usa média móvel.
- Força e energia são estimativas derivadas do vídeo, não medições instrumentais diretas.
- O app não determina composição química nem energia química de combustão a partir do vídeo.

## Próximas melhorias
- Tracker óptico/Kalman ou detector treinado.
- Correção de perspectiva por homografia.
- Vídeos 60/120/240 fps.
- Incerteza experimental e score de qualidade do tracking.
- Análise óptica relativa de luminosidade.
- Exportação CSV/PDF.

## Segurança
Este projeto contém apenas análise de vídeo e cálculos físicos. Não inclui instruções de ignição, combustível ou execução de experimentos com chama.
