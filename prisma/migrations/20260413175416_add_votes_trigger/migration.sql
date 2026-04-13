-- This is an empty migration.-- 1. Criar a função que calcula a atualização
CREATE OR REPLACE FUNCTION update_theory_upvotes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE "Theory"
        SET "upvotes" = "upvotes" + (CASE WHEN NEW."type" = 'UP' THEN 1 ELSE -1 END)
        WHERE id = NEW."theoryId";
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE "Theory"
        SET "upvotes" = "upvotes" - (CASE WHEN OLD."type" = 'UP' THEN 1 ELSE -1 END)
        WHERE id = OLD."theoryId";
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Se mudou de UP para DOWN, subtrai 2. Se mudou de DOWN para UP, soma 2.
        UPDATE "Theory"
        SET "upvotes" = "upvotes" + (CASE WHEN NEW."type" = 'UP' THEN 2 ELSE -2 END)
        WHERE id = NEW."theoryId";
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Criar a trigger vinculada à tabela Vote
CREATE TRIGGER tr_after_vote_change
AFTER INSERT OR UPDATE OR DELETE ON "Vote"
FOR EACH ROW
EXECUTE FUNCTION update_theory_upvotes_count();