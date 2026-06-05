USE crm_pme;

INSERT INTO sequences (nom_table, derniere_valeur) VALUES
('utilisateur', 0),
('lignes_devis', 0),
('lignes_ventes', 0)
ON DUPLICATE KEY UPDATE derniere_valeur = derniere_valeur;

DELIMITER $$

DROP TRIGGER IF EXISTS tg_id_utilisateur$$
CREATE TRIGGER tg_id_utilisateur BEFORE INSERT ON utilisateur FOR EACH ROW
BEGIN
    DECLARE v_nb INT;
    IF NEW.id_utilisateur IS NULL OR NEW.id_utilisateur = '' THEN
        UPDATE sequences SET derniere_valeur = derniere_valeur + 1 WHERE nom_table = 'utilisateur';
        SELECT derniere_valeur INTO v_nb FROM sequences WHERE nom_table = 'utilisateur';
        SET NEW.id_utilisateur = CONCAT('USR-', LPAD(v_nb, 5, '0'));
    END IF;
END$$

DROP TRIGGER IF EXISTS tg_id_lignes_devis$$
CREATE TRIGGER tg_id_lignes_devis BEFORE INSERT ON lignes_devis FOR EACH ROW
BEGIN
    DECLARE v_nb INT;
    IF NEW.id_lignes_devis IS NULL OR NEW.id_lignes_devis = '' THEN
        UPDATE sequences SET derniere_valeur = derniere_valeur + 1 WHERE nom_table = 'lignes_devis';
        SELECT derniere_valeur INTO v_nb FROM sequences WHERE nom_table = 'lignes_devis';
        SET NEW.id_lignes_devis = CONCAT('LDV-', LPAD(v_nb, 6, '0'));
    END IF;
END$$

DROP TRIGGER IF EXISTS tg_id_lignes_ventes$$
CREATE TRIGGER tg_id_lignes_ventes BEFORE INSERT ON lignes_ventes FOR EACH ROW
BEGIN
    DECLARE v_nb INT;
    IF NEW.id_lignes_ventes IS NULL OR NEW.id_lignes_ventes = '' THEN
        UPDATE sequences SET derniere_valeur = derniere_valeur + 1 WHERE nom_table = 'lignes_ventes';
        SELECT derniere_valeur INTO v_nb FROM sequences WHERE nom_table = 'lignes_ventes';
        SET NEW.id_lignes_ventes = CONCAT('LVT-', LPAD(v_nb, 6, '0'));
    END IF;
END$$

DROP PROCEDURE IF EXISTS sp_ConvertirDevisEnFacture$$
CREATE PROCEDURE sp_ConvertirDevisEnFacture(
    IN p_id_devis VARCHAR(50)
)
BEGIN
    DECLARE v_vente_id VARCHAR(50);
    DECLARE v_statut VARCHAR(20);

    SELECT statut INTO v_statut FROM devis WHERE id_devis = p_id_devis;

    IF v_statut = 'en_attente' THEN
        START TRANSACTION;
            INSERT INTO ventes (client_id, entreprise_id, montant_ttc)
            SELECT client_id, entreprise_id, 0
            FROM devis WHERE id_devis = p_id_devis;

            SET v_vente_id = (
                SELECT CONCAT('FAC-', YEAR(CURDATE()), '-', LPAD(derniere_valeur, 5, '0'))
                FROM sequences WHERE nom_table = 'ventes'
            );

            INSERT INTO lignes_ventes (vente_id, produit_id, quantite, prix_unitaire_ht)
            SELECT v_vente_id, produit_id, quantite, prix_unitaire_ht
            FROM lignes_devis WHERE devis_id = p_id_devis;

            UPDATE devis SET statut = 'converti' WHERE id_devis = p_id_devis;
        COMMIT;
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Le devis ne peut plus etre converti.';
    END IF;
END$$

DELIMITER ;
