# Segurança e evolução para vários utilizadores

Avaliação da PR #4 em 28 de outubro de 2026. Base analisada: `7eee3fb9f507603e936fe15917fe73b7878aafc0`.

## Correções incluídas

- Os campos persistidos são codificados à saída nos contextos de texto e atributos HTML entre aspas: imóveis/moradas/identificadores, opções, movimentos/categorias/notas/auditoria, utilizadores/perfis e nomes dos imóveis no mapa filtrado. Os valores originais são preservados para edição; não é removido conteúdo legítimo.
- A sessão guarda apenas id, nome, email e papel, sem copiar a palavra-passe. Na abertura, após alterações e antes das ações, o perfil e as permissões são obtidos do registo atual do utilizador.
- A alteração do próprio nome/email/papel atualiza imediatamente a sessão persistida, a sessão em memória, o resumo, a navegação e a área de utilizadores. A despromoção limpa a lista/formulário de administração; os handlers antigos também verificam as permissões atuais.
- Alterações em dados/sessão noutros separadores da mesma origem são refletidas através de `storage`. Eliminação do utilizador, logout e limpeza da sessão bloqueiam a vista e encaminham para login. Isto não sincroniza dispositivos diferentes.
- A auditoria dos novos movimentos e alterações usa o nome atual da sessão.

## Limitações que permanecem

**Esta aplicação continua a ser uma demonstração local. As correções não a tornam adequada para dados reais partilhados.** Não foi verificada qualquer utilização em produção.

| Situação atual | Consequência | Requisito para utilização partilhada |
| --- | --- | --- |
| Credenciais em texto simples em `arrendamento_data`; conta de demonstração predefinida | Qualquer pessoa/script com acesso ao armazenamento pode ler palavras-passe e assumir identidades | Autenticação num servidor/fornecedor de identidade; eliminar conta/segredo predefinido da configuração de produção e criar administrador por convite ou bootstrap controlado. Se geridas no servidor, guardar palavras-passe com Argon2id e salt individual; nunca enviar hashes ao navegador |
| Identidade e papéis editáveis no navegador | Pode alterar-se o id da sessão ou promover-se um utilizador pelo DevTools | Sessões verificáveis pelo servidor, cookies HttpOnly/Secure/SameSite, expiração, rotação e revogação; autorização no servidor em cada operação, incluindo acesso a imóveis e movimentos |
| `localStorage` por origem/perfil, sem backend | Dispositivos não partilham dados; apagar o navegador perde registos; escritas concorrentes podem sobrepor dados | Base de dados central com relações, transações, controlo de concorrência, cópias de segurança e ensaios de recuperação |
| Todos os utilizadores locais podem gerir os mesmos imóveis e movimentos | Não existe isolamento por organização/proprietário nem permissões por imóvel | Definir a matriz de acesso: administrador gere utilizadores; permissões explícitas para consultar/criar/editar/remover imóveis, receitas, despesas e mapas. Validar sempre no servidor e testar acessos entre organizações/imóveis |
| Auditoria contém nomes editáveis e pode ser reescrita localmente | Histórico sem garantia de autoria/integridade | Eventos de auditoria no servidor com id estável do ator, data/hora, operação e valores anteriores/posteriores; acesso restrito e retenção definida |
| Validação e tratamento de dados apenas no cliente | Dados manipulados ou JSON inválido podem contornar regras ou impedir o carregamento | Validar esquema, tipos, valores monetários/datas/categorias e referências no servidor; tratar erros e migrações; usar valores decimais adequados a moeda |

Aplicar HTTPS, proteção CSRF quando aplicável, limites de tentativas de login, recuperação segura de conta, gestão de segredos e cabeçalhos de segurança/CSP. Rever dependências e manter testes de autorização, XSS e sessões na CI. A CI aqui incluída executa testes DOM; não certifica segurança operacional nem substitui testes com navegador e servidor reais.

## Migração sem perder funcionalidades

1. Preservar as páginas e fluxos de imóveis, receitas, despesas, utilizadores e mapa por ano/imóvel; substituir apenas o acesso direto ao armazenamento por uma camada de API.
2. Modelar utilizadores, organizações/permissões, imóveis, movimentos e auditoria com identificadores estáveis. Preservar relações e estabelecer a semântica de eliminação dos imóveis/movimentos.
3. Disponibilizar importação validada dos dados locais existentes, com cópia de segurança prévia, reconciliação de duplicados/identificadores e relatório de totais. Não importar palavras-passe em texto simples para produção: exigir ativação/redefinição de credenciais.
4. Comparar contagens de imóveis/movimentos e resultados mensais/anuais por imóvel e portfólio antes/depois; testar CRUD, categorias, filtros, auditoria e concorrência. Ensaiar reposição da cópia de segurança.
5. Testar sessões em dois clientes independentes: despromoção, eliminação e revogação têm de impedir a próxima operação no servidor. Adicionar propagação para atualizar também o interface sem recarregar. Só passar a dados reais após estes critérios e revisão da implantação.

## Validação desta correção

Executar Node.js 24 e `npm ci --ignore-scripts`, `npm run check`, `npm test`. A suite usa `node:test` e jsdom sobre o HTML real de login e da aplicação, sem exportar funções internas de produção.

Os testes verificam HTML malicioso como texto literal (incluindo saída de atributos), opções/listas/perfis/auditoria/mapa filtrado, alteração do próprio perfil/papel, sessão antiga ao recarregar, promoção/despromoção/eliminação noutro separador, ações antes de chegar o evento `storage`, handlers antigos, logout, atualização da palavra-passe no login e CRUD com filtros/totais/auditoria atualizados. Eventos entre separadores são simulados com `StorageEvent`; não foi executado um ensaio de sincronização em navegadores reais.

## Referências

- [OWASP — HTML5 Security](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html): limites do armazenamento local e acesso por JavaScript.
- [OWASP — Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html): proteção e ciclo de vida das sessões.
- [OWASP — Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html): autorização em cada pedido e no servidor.
- [OWASP — Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html): hashing de palavras-passe com salt.
