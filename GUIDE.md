🛡️ LoreHub Backend - Arquitetura e Diretrizes
Este documento serve como a "Fonte da Verdade" para o desenvolvimento do backend (NestJS + Prisma + Supabase). Todas as implementações devem seguir os padrões descritos aqui.

🏗️ Estrutura de Arquitetura
Seguimos o padrão Service-Controller-Mapper.

Controllers: Apenas para roteamento e validação de entrada (DTOs).

Services: Toda a lógica de negócio e chamadas ao Prisma.

Mappers (Data Mappers): Camada obrigatória de tradução. Nunca retorne o modelo cru do Prisma (User, Game, Theory) diretamente para o Front-end. Utilize o Mapper para limpar o payload e renomear campos técnicos (ex: \_count -> stats).

💾 Banco de Dados & Infraestrutura
⚡ Gatilhos (Triggers) no Postgres
Já possuímos lógica crítica rodando diretamente no banco de dados para garantir performance e integridade atômica:

Contador de Votos: Existe um Trigger (on_vote_change) e uma Function (handle_theory_vote_change) na tabela Vote.

Comportamento: Ao inserir (UP ou DOWN), atualizar ou deletar um voto, a coluna upvotes na tabela Theory é atualizada automaticamente.

Nota: O Backend NÃO deve atualizar o contador de upvotes manualmente; apenas manipule a tabela Vote.

🔐 Segurança e RLS (Row Level Security)
O projeto utiliza o Supabase RLS no modo "Lockdown Total":

Status: RLS está habilitado em todas as tabelas (User, Game, Theory, Comment, Vote).

Políticas: O Front-end não possui acesso direto às tabelas via anon_key (apenas leitura mínima necessária para os Triggers).

NestJS Access: O Backend deve SEMPRE utilizar a SERVICE_ROLE_KEY para interagir com o banco, ignorando as restrições do RLS.

🛠️ Boas Práticas Obrigatórias
Imutabilidade de IDs: Use UUID para IDs em todas as novas tabelas.

Relacionamentos: Ao buscar listas (findMany), utilize o include do Prisma para trazer contadores (\_count) e passe pelo Mapper para formatar a saída.

Soft Deletes: (Se aplicável) Verifique sempre o campo deletedAt antes de retornar registros.

Slugification: Jogos e Teorias devem ter slugs únicos gerados a partir do título para URLs amigáveis (SEO).

Campos Opcionais: O campo wikiUrl na tabela Theory é opcional (String? no Prisma). Trate-o com IsOptional() nos DTOs.
