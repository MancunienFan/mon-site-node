-- Valeurs de référence des lieux; lecture seule.
-- Cette liste n'applique pas d'éventuelles règles de validité du menu d'origine.
SELECT
    co_valr_prop AS code_lieu,
    nm_valr_prop AS nom_lieu,
    desc_valr_prop AS description_lieu
FROM COU.COUT_VALR_PROP
WHERE nm_prop = 'CO_ENDR'
ORDER BY desc_valr_prop, co_valr_prop;
