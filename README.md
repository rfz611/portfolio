# Portfólio 3D — Raphael Scharf Passos

Uma cobertura de mafioso dos anos 80, à noite e com chuva, onde cada objeto abre uma parte do portfólio: a TV mostra os projetos, o PC conta quem sou, as revistas são os certificados, o toca-discos toca de verdade e o carro na garagem guarda as skills e o contato.

> Em construção. A especificação completa está em [docs/ESPECIFICACAO.md](docs/ESPECIFICACAO.md).

## Tecnologias

React 18 + TypeScript + Vite · three.js com React Three Fiber e drei · pós-processamento (bloom, N8AO, vinheta, granulado) · GSAP para a câmera · Zustand para o estado · Howler.js para a música · i18next (português e inglês) · Vitest, ESLint e Prettier.

Todos os objetos são modelados no próprio código, em low poly no estilo PS2, com texturas pintadas em canvas. Nada de modelos baixados.

## Como rodar

```bash
npm install
npm run dev
```

Outros comandos:

| Comando                                          | O que faz                                                     |
| ------------------------------------------------ | ------------------------------------------------------------- |
| `npm run build`                                  | Confere os tipos e gera o site em `dist/`                     |
| `npm run test`                                   | Testes do estado, da câmera e do player                       |
| `npm run lint`                                   | ESLint sem avisos                                             |
| `npm run audio`                                  | Renomeia e converte as músicas de `public/audio` (ver abaixo) |
| `npm run shots -- docs/prints/pasta home discos` | Tira prints em desktop e celular                              |

## Música

Os arquivos de áudio não ficam no Git. No desenvolvimento eles moram em `public/audio`; em produção, num bucket Cloudflare R2. O site lê o endereço da variável `VITE_AUDIO_BASE_URL` (veja `.env.example`). Se uma faixa não existir, o disco aparece com o selo "em breve" e o resto segue funcionando.

## Estrutura

```
src/
  scene/      sala, cantinho dos discos, garagem, cidade, chuva, luzes, efeitos
  objects/    toca-discos, TV, PC, revistas, carro...
  textures/   texturas pintadas em canvas e materiais
  ui/         menu de texto, carregamento, idioma, volume, voltar
  content/    textos (pt.json, en.json) e dados (projetos, skills, discos)
  audio/      player (Howler)
  store/      estado (Zustand)
  camera/     planos de câmera
```

---

# 3D Portfolio — Raphael Scharf Passos

An 80s mob-boss penthouse on a rainy night where every object opens a part of the portfolio. Built with React Three Fiber, TypeScript and Vite; every object is modeled in code in a PS2-style low poly look with canvas-painted textures.

Work in progress. Run it with `npm install` and `npm run dev`.
