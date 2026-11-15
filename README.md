# RocketMotionLab Web

Aplicação web para analisar movimento 2D em vídeos.

## Abrir localmente
1. Descompacte o ZIP.
2. Abra `index.html` no Chrome ou Edge.
3. Selecione um vídeo.
4. Marque dois pontos da fita métrica.
5. Informe a distância real.
6. Marque o foguete no primeiro frame.
7. Clique em **Analisar vídeo**.

## Publicar no GitHub Pages
1. Envie `index.html`, `styles.css` e `app.js` para a raiz do repositório.
2. Vá em `Settings > Pages`.
3. Em `Build and deployment`, selecione `Deploy from a branch`.
4. Branch: `main`.
5. Folder: `/ (root)`.
6. Salve.

## O que calcula
- trajetória 2D
- altura máxima
- alcance horizontal
- velocidade
- aceleração
- força estimada, se houver massa
- energia cinética
- energia potencial
- índice didático de estabilidade
- comparação entre até 3 experimentos

## Observação
O rastreamento inicial é por similaridade de cor. Funciona melhor com câmera fixa, boa iluminação e objeto contrastante com o fundo.

O app não determina composição química nem energia química de combustão a partir do vídeo.
