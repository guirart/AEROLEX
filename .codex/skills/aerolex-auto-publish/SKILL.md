---
name: aerolex-auto-publish
description: Analisa e publica automaticamente no AeroLex todo novo PDF jurídico enviado pelo usuário, inclusive quando a mensagem contém apenas o anexo. Use para PDFs destinados ao projeto guirart/AEROLEX e ao domínio aerolex-rho.vercel.app.
---

# AeroLex Auto Publish

## Gatilho

Use esta skill sempre que Rafael enviar um novo PDF jurídico destinado ao AeroLex. Um PDF anexado sem instrução textual é uma ordem completa para executar o fluxo. Não solicite que o usuário escreva “analisar”, “atualizar” ou “publicar”.

## Fluxo obrigatório

1. Leia todas as páginas e faça conferência visual do PDF.
2. Identifique as partes somente pelo preâmbulo, cabeçalho processual ou campo equivalente. Nunca classifique como parte uma pessoa mencionada apenas em jurisprudência, doutrina, prova, narrativa ou precedente.
3. Extraia fatos, cronologia, pedidos, teses, provas, citações e riscos com indicação das páginas de origem.
4. Substitua integralmente no app os dados do caso anterior. Não misture nomes, valores, datas, trechos, miniaturas ou documentos de casos diferentes.
5. Copie o PDF original sem qualquer transformação. Confirme por hash que a cópia disponibilizada para download é idêntica ao arquivo enviado.
6. Gere o PDF analisado adicionando somente anotações e destaques sobrepostos. Não reconstrua o texto, não altere fontes, margens, paginação, espaçamento ou conteúdo.
7. Gere a miniatura diretamente da primeira página do PDF original.
8. Não anonimize nomes, documentos, endereços ou outros dados. A anonimização somente pode ocorrer mediante pedido expresso do usuário para aquele arquivo.
9. Execute as verificações de compilação e confirme que os botões baixam o PDF original e o PDF marcado corretos.
10. Publique no projeto de produção vinculado ao domínio `https://aerolex-rho.vercel.app` e aguarde o estado `READY`.
11. Se a publicação direta pela Vercel não estiver disponível, atualize o repositório `guirart/AEROLEX` para acionar o deploy conectado. Não publique apenas no Sites quando o destino esperado pelo usuário for a Vercel.

## Validações finais

Antes de concluir, confirme:

- o nome do arquivo e a quantidade de páginas;
- as partes atuais e seus papéis processuais;
- a igualdade por hash entre o upload e o PDF original disponibilizado;
- a igualdade do texto, das dimensões e da paginação entre o original e o PDF marcado;
- a ausência de dados herdados da análise anterior;
- o deploy de produção com o commit atual e estado `READY`.

Informe o link da Vercel e resuma as partes, o número de páginas e a quantidade de marcações. Caso os dados estejam publicados sem anonimização, deixe isso claro ao usuário.
