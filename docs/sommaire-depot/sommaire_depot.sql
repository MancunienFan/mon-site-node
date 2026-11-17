-- Sommaire de dépôt - application Courses
-- Requête retrouvée dans cou_rapport_datawindow.pbd, objet d_sommaire_dépôt.dwo.
-- Adaptations : les deux marqueurs compilés sont remplacés par les variables
-- :date_recu et :endroit; les tables de la clause FROM sont qualifiées par COU.
-- Les jointures Oracle (+), les filtres et le tri d'origine sont conservés.
-- Lecture seule. Aucune exécution sur la base réelle n'a été effectuée ici.
--
-- SQL Developer : sélectionner le SELECT et exécuter avec Ctrl+Entrée.
-- Renseigner date_recu comme texte au format YYYY-MM-DD, par exemple 2026-11-17.
-- Renseigner endroit avec un code réel obtenu par liste_lieux_depot.sql.
-- Le numéro de bordereau n'est pas un filtre de cette requête.
-- Les totaux du rapport utilisent COUT_PAIE.MT_DU, pas COUT_RECU.MT_RECU.

SELECT cout_recu.no_recu,   
         cout_paie_du.no_doss,   
			cout_recu.co_mode_paie,
			cout_paie_du.co_typ_paie,
         cout_paie.mt_du,   
         cout_paie.co_typ_trans_paie,   
         cout_typ_trans_paie.nm_trans_paie,   
         mod.nm_valr_prop mode_paie,
			endroit.desc_valr_prop,
			cout_paie_du.no_seq_sanc,
			cout_manq.co_endr || TO_CHAR(cout_manq.dt_manq,'yyyymmdd') || cout_manq.no_manq evenement,
			cout_sanc.co_sanc,
			cout_typ_trans_paie.no_post_cpta
    FROM COU.cout_dcis,   
         COU.cout_irven,   
         COU.cout_manq,   
			COU.cout_paie,   
         COU.cout_paie_du,   
         COU.cout_recu,  
			COU.cout_sanc, 
			COU.cout_typ_trans_paie,  
         COU.cout_valr_prop endroit,
         COU.cout_valr_prop mod
   WHERE ( cout_paie_du.no_paie_du = cout_paie.no_paie_du ) and  
         ( cout_recu.no_recu = cout_paie.no_recu ) and  
         ( cout_paie.co_typ_trans_paie = cout_typ_trans_paie.co_typ_trans_paie ) and 
		   ( cout_recu.co_endr = endroit.co_valr_prop ) and
			( endroit.nm_prop = 'CO_ENDR' ) and   
         ( cout_recu.co_mode_paie = mod.co_valr_prop ) and
			( mod.nm_prop = 'CO_MODE_PAI' ) and   
         (TO_DATE(TO_CHAR(cout_recu.dt_recu,'yyyy-mm-dd'),'yyyy-mm-dd') = TO_DATE(:date_recu,'yyyy-mm-dd')) and
			( cout_recu.co_endr = :endroit ) and
			( cout_paie_du.no_seq_sanc = cout_sanc.no_seq_sanc (+)) and
			( cout_sanc.no_dcis = cout_dcis.no_dcis (+))  and  
         ( cout_irven.no_irven(+)= cout_dcis.no_irven ) and  
         ( cout_manq.no_irven (+)= cout_irven.no_irven )    
ORDER BY cout_recu.no_recu;
