-- Calculadoras (regras C10 a C13 de Documentacao/regras-de-negocio.md).
-- Entradas validadas aqui também (a camada de servidor valida antes com zod).
-- Erros de validação usam errcode 22023 (invalid_parameter_value) com mensagem em português.

create function public.validar_valor_monetario(p_valor numeric)
returns void
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_valor is null or p_valor <= 0 or p_valor > 1000000000000 then
    raise exception 'Valor deve ser maior que zero e no máximo 1 trilhão.' using errcode = '22023';
  end if;
end;
$$;

create function public.validar_periodo(p_inicio date, p_fim date)
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if p_inicio is null or p_fim is null or p_inicio > p_fim then
    raise exception 'Período inválido: a data inicial deve ser anterior ou igual à final.' using errcode = '22023';
  end if;
  if p_fim > current_date then
    raise exception 'A data final não pode estar no futuro.' using errcode = '22023';
  end if;
end;
$$;

create function public.validar_indice_inflacao(p_codigo text)
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.indicadores i where i.codigo = p_codigo and i.tipo = 'inflacao' and i.ativo
  ) then
    raise exception 'Índice de correção inválido.' using errcode = '22023';
  end if;
end;
$$;

-- C10: correção de um valor por um índice de inflação, do mês inicial ao final (inclusive).
-- percentual null = dado ainda não publicado para algum mês do período.
create function public.corrigir_valor(p_codigo text, p_valor numeric, p_mes_inicio date, p_mes_fim date)
returns table (percentual numeric, valor_corrigido numeric, mes_inicio date, mes_fim date)
language plpgsql
stable
set search_path = ''
as $$
begin
  perform public.validar_indice_inflacao(p_codigo);
  perform public.validar_valor_monetario(p_valor);
  perform public.validar_periodo(p_mes_inicio, p_mes_fim);
  mes_inicio := date_trunc('month', p_mes_inicio)::date;
  mes_fim := date_trunc('month', p_mes_fim)::date;
  percentual := public.acumulado_mensal(p_codigo, mes_inicio, mes_fim);
  valor_corrigido := round(p_valor * (1 + percentual / 100), 2);
  return next;
end;
$$;

-- C11: reajuste anual de contrato. Usa os 12 meses encerrados no mês anterior ao aniversário,
-- para cada índice de inflação ativo (permite comparar "se fosse pelo outro índice").
create function public.reajuste_contrato(p_valor numeric, p_mes_aniversario date)
returns table (
  indicador_codigo text,
  nome text,
  periodo_inicio date,
  periodo_fim date,
  percentual numeric,
  novo_valor numeric
)
language plpgsql
stable
set search_path = ''
as $$
declare
  v_fim date := (date_trunc('month', p_mes_aniversario) - interval '1 month')::date;
  v_inicio date := (date_trunc('month', p_mes_aniversario) - interval '12 months')::date;
begin
  perform public.validar_valor_monetario(p_valor);
  if p_mes_aniversario is null or p_mes_aniversario > (current_date + interval '1 year')::date then
    raise exception 'Mês de aniversário inválido.' using errcode = '22023';
  end if;
  return query
    select i.codigo, i.nome, v_inicio, v_fim, a.pct, round(p_valor * (1 + a.pct / 100), 2)
    from public.indicadores i
    cross join lateral (select public.acumulado_mensal(i.codigo, v_inicio, v_fim) as pct) a
    where i.tipo = 'inflacao' and i.ativo
    order by i.ordem;
end;
$$;

-- C12: poder de compra pelo IPCA. perda = 1 − 1/(1 + inflação).
create function public.poder_de_compra(p_valor numeric, p_mes_inicio date, p_mes_fim date)
returns table (inflacao numeric, valor_equivalente numeric, perda_poder_compra numeric)
language plpgsql
stable
set search_path = ''
as $$
begin
  perform public.validar_valor_monetario(p_valor);
  perform public.validar_periodo(p_mes_inicio, p_mes_fim);
  inflacao := public.acumulado_mensal('ipca', p_mes_inicio, p_mes_fim);
  valor_equivalente := round(p_valor * (1 + inflacao / 100), 2);
  perda_poder_compra := round((1 - 1 / (1 + inflacao / 100)) * 100, 6);
  return next;
end;
$$;

-- C13: rendimento real de uma aplicação a X% do CDI. O IPCA considera os meses do
-- período até o último mês publicado (ipca_ate); ipca_parcial indica que o último mês
-- do período ainda não tinha IPCA publicado.
create function public.rendimento_real_cdi(p_valor numeric, p_percentual_cdi numeric, p_inicio date, p_fim date)
returns table (
  rendimento_nominal numeric,
  ipca_periodo numeric,
  ipca_ate date,
  ipca_parcial boolean,
  rendimento_real numeric,
  valor_final numeric,
  ganho_nominal numeric
)
language plpgsql
stable
set search_path = ''
as $$
begin
  perform public.validar_valor_monetario(p_valor);
  perform public.validar_periodo(p_inicio, p_fim);
  if p_percentual_cdi is null or p_percentual_cdi <= 0 or p_percentual_cdi > 300 then
    raise exception 'Percentual do CDI deve estar entre 0 e 300.' using errcode = '22023';
  end if;

  rendimento_nominal := public.acumulado_diario('cdi', p_inicio, p_fim, p_percentual_cdi);
  ipca_ate := least(date_trunc('month', p_fim)::date, public.ultimo_mes_publicado('ipca', p_fim));
  ipca_parcial := ipca_ate is distinct from date_trunc('month', p_fim)::date;
  if ipca_ate >= date_trunc('month', p_inicio)::date then
    ipca_periodo := public.acumulado_mensal('ipca', p_inicio, ipca_ate);
  end if;
  rendimento_real := round(((1 + rendimento_nominal / 100) / (1 + ipca_periodo / 100) - 1) * 100, 6);
  valor_final := round(p_valor * (1 + rendimento_nominal / 100), 2);
  ganho_nominal := valor_final - p_valor;
  return next;
end;
$$;
