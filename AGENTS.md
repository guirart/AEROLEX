# Regras permanentes do AeroLex

## Preservação do documento jurídico

Ao processar, exibir ou gerar uma versão analisada de uma petição, contrato, decisão ou outro documento jurídico:

1. Preserve integralmente a formatação do arquivo original, incluindo paginação, margens, fontes, tamanhos, espaçamentos, quebras de linha, títulos, tabelas, imagens, cabeçalhos, rodapés e ordem do conteúdo.
2. Não reconstrua o documento a partir do texto extraído e não converta o conteúdo para um novo modelo visual.
3. Aplique teses, provas e citações como anotações ou destaques sobrepostos ao PDF original, sem deslocar ou substituir o texto.
4. A versão original disponível para download deve permanecer visualmente idêntica ao arquivo enviado pelo usuário.
5. Não anonimize nomes, documentos, endereços ou outros dados. Remova ou substitua informações somente quando o usuário solicitar expressamente a anonimização daquele arquivo.
6. Se uma marcação não puder ser aplicada sem alterar a diagramação, preserve a diagramação e registre a referência fora do conteúdo da página.
7. Antes da publicação, compare visualmente todas as páginas do arquivo original e da versão analisada para confirmar que a única diferença são as marcações autorizadas.

Esta regra prevalece sobre rotinas de geração, anonimização ou otimização de PDF que modifiquem a aparência do documento.

## Atualização automática por novo PDF

Qualquer novo PDF jurídico enviado por Rafael, inclusive sem mensagem textual, deve iniciar automaticamente o fluxo da skill `aerolex-auto-publish`. O novo caso deve substituir integralmente o anterior no app, ser publicado em `https://aerolex-rho.vercel.app` e nunca manter dados residuais de documentos anteriores.
