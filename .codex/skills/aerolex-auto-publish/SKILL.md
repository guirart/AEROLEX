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
3. Extraia fatos, cronologia, pedidos, teses, provas, citações, jurisprudências e riscos com indicação das páginas de origem.
4. Para jurisprudência, localizar apenas precedentes efetivamente citados no documento. Reconhecer, entre outros, REsp, AREsp, AgInt, AgRg, RMS, HC, RHC, RE, ARE, ADI, ADC, ADPF, temas de repercussão geral/repetitivos, IRDR, IAC, súmulas e números CNJ associados a tribunal ou classe processual.
5. Para cada precedente identificado, registrar: tribunal, classe/número ou tema, título resumido, página da petição, trecho citado e URL do Jusbrasil. Pesquisar o precedente pelo identificador exato no Jusbrasil e preferir o hyperlink direto da página correspondente. Confirmar que tribunal e número/tema do resultado coincidem com a petição antes de gravar a URL.
6. Se não for possível confirmar um link direto do Jusbrasil, usar a busca do Jusbrasil com consulta codificada pelo tribunal + identificador do precedente. Nunca inventar URL específica.
7. Ignorar números que não sejam precedentes, como CPF, CNPJ, protocolos administrativos, valores, datas, números de voo e número do processo principal sem contexto jurisprudencial.
8. Persistir toda jurisprudência extraída no projeto Supabase `wefovgbdapaanqqgqapp`, tabela `public.aerolex_jurisprudence`, usando upsert por `id`. Preencher `title`, `court`, `reference`, `excerpt`, `page`, `jusbrasil_url` e `document_name`. A tela do AeroLex lê esta tabela diretamente; o banco é a fonte primária da área de Jurisprudência.
9. Manter também `seedJurisprudences` em `app/page.tsx` como fallback estático do documento publicado, para que a interface continue funcional se o Supabase estiver temporariamente indisponível. Se não houver jurisprudência citada, usar array vazio.
10. Substitua integralmente no app os dados do caso anterior. Não misture nomes, valores, datas, trechos, miniaturas, jurisprudências ou documentos de casos diferentes.
11. Copie o PDF original sem qualquer transformação. Confirme por hash que a cópia disponibilizada para download é idêntica ao arquivo enviado.
13. Gere o PDF analisado adicionando somente anotações e destaques sobrepostos. Não reconstrua o texto, não altere fontes, margens, paginação, espaçamento ou conteúdo.
12. Gere a miniatura diretamente da primeira página do PDF original.
14. Não anonimize nomes, documentos, endereços ou outros dados. A anonimização somente pode ocorrer mediante pedido expresso do usuário para aquele arquivo.
15. Execute as verificações de compilação e confirme que os botões baixam o PDF original e o PDF marcado corretos.
16. Publique no projeto de produção vinculado ao domínio `https://aerolex-rho.vercel.app` e aguarde o estado `READY`.
17. Se a publicação direta pela Vercel não estiver disponível, atualize o repositório `guirart/AEROLEX` para acionar o deploy conectado. Não publique apenas no Sites quando o destino esperado pelo usuário for a Vercel.

## Validações finais

Antes de concluir, confirme:

- o nome do arquivo e a quantidade de páginas;
- as partes atuais e seus papéis processuais;
- a igualdade por hash entre o upload e o PDF original disponibilizado;
- a igualdade do texto, das dimensões e da paginação entre o original e o PDF marcado;
- a ausência de dados herdados da análise anterior;
- todas as jurisprudências citadas na petição foram extraídas sem falsos positivos;
- cada jurisprudência possui tribunal e referência conferíveis e hyperlink Jusbrasil direto quando confirmado, ou busca Jusbrasil como fallback;
- as jurisprudências do documento foram persistidas no Supabase e podem ser recuperadas pela Data API;
- o deploy de produção com o commit atual e estado `READY`.

Informe o link da Vercel e resuma as partes, o número de páginas e a quantidade de marcações. Caso os dados estejam publicados sem anonimização, deixe isso claro ao usuário.
