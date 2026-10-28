# Arrendamento

Aplicação estática de demonstração para gestão de imóveis, receitas, despesas,
utilizadores e mapa de resultados por ano/imóvel. Servir a raiz do projeto ou a
pasta `app` por HTTP e abrir `app/login/` ou `login/`, respetivamente.

Os dados e as credenciais continuam guardados no navegador. Antes de utilizar
com dados reais ou vários utilizadores, consultar a [avaliação de segurança e plano de migração](docs/seguranca.md).

## Validação

Com Node.js 24:

```sh
npm ci --ignore-scripts
npm run check
npm test
```

Os testes usam o HTML real das páginas com jsdom e cobrem XSS, permissões,
sincronização da sessão e regressões de gestão/mapas. O workflow `Tests` executa
as mesmas verificações em pushes e pull requests.
