-- Função para incrementar contagem de visualizações de forma atômica
CREATE OR REPLACE FUNCTION increment_view_count_covers(delivery_slug TEXT)
RETURNS void AS $$
BEGIN
  UPDATE covers_entregas
  SET visualizacoes = COALESCE(visualizacoes, 0) + 1
  WHERE slug = delivery_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
