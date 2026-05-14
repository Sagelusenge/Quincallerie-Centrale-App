CREATE DATABASE IF NOT EXISTS crm_pme;
USE crm_pme;

-- 1. Gestion des IDs (Indispensable pour les triggers à venir)
CREATE TABLE sequences (
    nom_table VARCHAR(50) PRIMARY KEY,
    derniere_valeur INT NOT NULL DEFAULT 0
);

-- 2. Administration Système (SaaS)
CREATE TABLE super_admin (
    id_super_admin VARCHAR(50) PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL
);

CREATE TABLE entreprise (
    id_entreprise VARCHAR(50) PRIMARY KEY,
    raison_sociale VARCHAR(200) NOT NULL,
    num_id_nationale VARCHAR(50) UNIQUE,
    email VARCHAR(150),
    ville VARCHAR(100),
    statut_abonnement ENUM('actif', 'suspendu', 'expire') DEFAULT 'actif',
    date_expiration_abonnement DATE,
    cree_par_admin_id VARCHAR(50),
    FOREIGN KEY (cree_par_admin_id) REFERENCES super_admin(id_super_admin)
);

-- 3. Gestion des Utilisateurs et Clients
CREATE TABLE utilisateur (
    id_utilisateur VARCHAR(50) PRIMARY KEY,
    entreprise_id VARCHAR(50) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    role ENUM('manager','caissier','magasinier') NOT NULL,
    actif BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (entreprise_id) REFERENCES entreprise(id_entreprise) ON DELETE CASCADE
);

CREATE TABLE client (
    id_client VARCHAR(50) PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    postnom VARCHAR(100),
    telephone VARCHAR(20),
    entreprise_id VARCHAR(50) NOT NULL,
    FOREIGN KEY (entreprise_id) REFERENCES entreprise(id_entreprise) ON DELETE CASCADE
);

-- 4. Catalogue et Stock
CREATE TABLE produits (
    id_produit VARCHAR(50) PRIMARY KEY,
    reference_produit VARCHAR(50) NOT NULL,
    nom VARCHAR(200) NOT NULL,
    prix_ht DECIMAL(10,2) NOT NULL,
    taux_tva DECIMAL(5,2) DEFAULT 16.00,
    quantite_stock INT DEFAULT 0,
    seuil_alerte INT DEFAULT 5,
    entreprise_id VARCHAR(50) NOT NULL,
    FOREIGN KEY (entreprise_id) REFERENCES entreprise(id_entreprise) ON DELETE CASCADE
);

CREATE TABLE mouvements_stock (
    id_mouvement VARCHAR(50) PRIMARY KEY,
    produit_id VARCHAR(50) NOT NULL,
    type_mouvement ENUM('entree', 'sortie') NOT NULL,
    quantite INT NOT NULL,
    date_mouvement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produit_id) REFERENCES produits(id_produit) ON DELETE CASCADE
);

-- 5. Cycle Commercial (Devis & Ventes)
CREATE TABLE devis (
    id_devis VARCHAR(50) PRIMARY KEY,
    numero_devis VARCHAR(50) UNIQUE NOT NULL,
    client_id VARCHAR(50) NOT NULL,
    entreprise_id VARCHAR(50) NOT NULL,
    montant_ttc DECIMAL(10,2) DEFAULT 0,
    statut ENUM('en_attente', 'converti', 'annule') DEFAULT 'en_attente',
    date_devis TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES client(id_client),
    FOREIGN KEY (entreprise_id) REFERENCES entreprise(id_entreprise) ON DELETE CASCADE
);

CREATE TABLE lignes_devis (
    id_lignes_devis VARCHAR(50) PRIMARY KEY,
    devis_id VARCHAR(50) NOT NULL,
    produit_id VARCHAR(50) NOT NULL,
    quantite INT NOT NULL,
    prix_unitaire_ht DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (devis_id) REFERENCES devis(id_devis) ON DELETE CASCADE,
    FOREIGN KEY (produit_id) REFERENCES produits(id_produit)
);

CREATE TABLE ventes (
    id_ventes VARCHAR(50) PRIMARY KEY,
    numero_facture VARCHAR(50) UNIQUE NOT NULL,
    client_id VARCHAR(50) NOT NULL,
    entreprise_id VARCHAR(50) NOT NULL,
    montant_ttc DECIMAL(10,2) DEFAULT 0,
    date_vente TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES client(id_client),
    FOREIGN KEY (entreprise_id) REFERENCES entreprise(id_entreprise) ON DELETE CASCADE
);

CREATE TABLE lignes_ventes (
    id_lignes_ventes VARCHAR(50) PRIMARY KEY,
    vente_id VARCHAR(50) NOT NULL,
    produit_id VARCHAR(50) NOT NULL,
    quantite INT NOT NULL,
    prix_unitaire_ht DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (vente_id) REFERENCES ventes(id_ventes) ON DELETE CASCADE,
    FOREIGN KEY (produit_id) REFERENCES produits(id_produit)
);

-- 6. Finances et Paiements
CREATE TABLE paiement (
    id_paiement VARCHAR(50) PRIMARY KEY,
    vente_id VARCHAR(50) NOT NULL,
    montant DECIMAL(10,2) NOT NULL,
    mode_paiement ENUM('especes', 'carte', 'virement', 'mobile_money') NOT NULL,
    reference_externe VARCHAR(100),
    telephone_payeur VARCHAR(20),
    date_paiement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vente_id) REFERENCES ventes(id_ventes) ON DELETE CASCADE
);

CREATE TABLE demandes_abonnement (
    id_demande INT AUTO_INCREMENT PRIMARY KEY,
    entreprise_id VARCHAR(50) NOT NULL,
    montant DECIMAL(10,2) NOT NULL,
    monnaie VARCHAR(10) DEFAULT 'USD',
    statut ENUM('en_attente', 'succes', 'echec') DEFAULT 'en_attente',
    transaction_id_externe VARCHAR(100),
    date_paiement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entreprise_id) REFERENCES entreprise(id_entreprise) ON DELETE CASCADE
);

-- 7. Initialisation des compteurs
INSERT INTO sequences (nom_table, derniere_valeur) VALUES 
('entreprise', 0), ('utilisateur', 0), ('client', 0), 
('super_admin', 0), ('ventes', 0), ('lignes_ventes', 0), ('paiement', 0), 
('mouvements_stock', 0), ('devis', 0), ('lignes_devis', 0);

DELIMITER $$

-- 1. GÉNÉRATION D'IDS AUTOMATIQUES --

-- ID Entreprise (Ex: ENT-SOK-0001)
CREATE TRIGGER tg_id_entreprise BEFORE INSERT ON entreprise FOR EACH ROW 
BEGIN
    DECLARE v_nb INT;
    DECLARE v_pref VARCHAR(10);
    UPDATE sequences SET derniere_valeur = derniere_valeur + 1 WHERE nom_table = 'entreprise';
    SELECT derniere_valeur INTO v_nb FROM sequences WHERE nom_table = 'entreprise';
    SET v_pref = UPPER(LEFT(REPLACE(NEW.raison_sociale, ' ', ''), 3));
    SET NEW.id_entreprise = CONCAT('ENT-', v_pref, '-', LPAD(v_nb, 4, '0'));
END$$

-- ID Client (Ex: CLI-00001)
CREATE TRIGGER tg_id_client BEFORE INSERT ON client FOR EACH ROW 
BEGIN
    DECLARE v_nb INT;
    UPDATE sequences SET derniere_valeur = derniere_valeur + 1 WHERE nom_table = 'client';
    SELECT derniere_valeur INTO v_nb FROM sequences WHERE nom_table = 'client';
    SET NEW.id_client = CONCAT('CLI-', LPAD(v_nb, 5, '0'));
END$$

-- ID Produit (Ex: PRD-REF-ENTID)
CREATE TRIGGER tg_id_produits BEFORE INSERT ON produits FOR EACH ROW 
BEGIN
    SET NEW.id_produit = UPPER(CONCAT('PRD-', REPLACE(NEW.reference_produit, ' ', ''), '-', LEFT(NEW.entreprise_id, 8)));
END$$

-- ID Ventes/Factures (Ex: FAC-2026-00001)
CREATE TRIGGER tg_id_ventes BEFORE INSERT ON ventes FOR EACH ROW 
BEGIN
    DECLARE v_nb INT;
    UPDATE sequences SET derniere_valeur = derniere_valeur + 1 WHERE nom_table = 'ventes';
    SELECT derniere_valeur INTO v_nb FROM sequences WHERE nom_table = 'ventes';
    SET NEW.id_ventes = CONCAT('FAC-', YEAR(CURDATE()), '-', LPAD(v_nb, 5, '0'));
    SET NEW.numero_facture = NEW.id_ventes;
END$$

-- ID Paiement (Ex: PAY-2604-00001)
CREATE TRIGGER tg_id_paiement BEFORE INSERT ON paiement FOR EACH ROW 
BEGIN
    DECLARE v_nb INT;
    UPDATE sequences SET derniere_valeur = derniere_valeur + 1 WHERE nom_table = 'paiement';
    SELECT derniere_valeur INTO v_nb FROM sequences WHERE nom_table = 'paiement';
    SET NEW.id_paiement = CONCAT('PAY-', DATE_FORMAT(NOW(), '%y%m'), '-', LPAD(v_nb, 5, '0'));
END$$

-- ID Devis (Ex: DEV-00001)
CREATE TRIGGER tg_id_devis BEFORE INSERT ON devis FOR EACH ROW 
BEGIN
    DECLARE v_nb INT;
    UPDATE sequences SET derniere_valeur = derniere_valeur + 1 WHERE nom_table = 'devis';
    SELECT derniere_valeur INTO v_nb FROM sequences WHERE nom_table = 'devis';
    SET NEW.id_devis = CONCAT('DEV-', LPAD(v_nb, 5, '0'));
    SET NEW.numero_devis = NEW.id_devis;
END$$

-- ID Utilisateur (Ex: USR-00001)
CREATE TRIGGER tg_id_utilisateur BEFORE INSERT ON utilisateur FOR EACH ROW
BEGIN
    DECLARE v_nb INT;
    IF NEW.id_utilisateur IS NULL OR NEW.id_utilisateur = '' THEN
        UPDATE sequences SET derniere_valeur = derniere_valeur + 1 WHERE nom_table = 'utilisateur';
        SELECT derniere_valeur INTO v_nb FROM sequences WHERE nom_table = 'utilisateur';
        SET NEW.id_utilisateur = CONCAT('USR-', LPAD(v_nb, 5, '0'));
    END IF;
END$$

-- ID Ligne Devis (Ex: LDV-000001)
CREATE TRIGGER tg_id_lignes_devis BEFORE INSERT ON lignes_devis FOR EACH ROW
BEGIN
    DECLARE v_nb INT;
    IF NEW.id_lignes_devis IS NULL OR NEW.id_lignes_devis = '' THEN
        UPDATE sequences SET derniere_valeur = derniere_valeur + 1 WHERE nom_table = 'lignes_devis';
        SELECT derniere_valeur INTO v_nb FROM sequences WHERE nom_table = 'lignes_devis';
        SET NEW.id_lignes_devis = CONCAT('LDV-', LPAD(v_nb, 6, '0'));
    END IF;
END$$

-- ID Ligne Vente (Ex: LVT-000001)
CREATE TRIGGER tg_id_lignes_ventes BEFORE INSERT ON lignes_ventes FOR EACH ROW
BEGIN
    DECLARE v_nb INT;
    IF NEW.id_lignes_ventes IS NULL OR NEW.id_lignes_ventes = '' THEN
        UPDATE sequences SET derniere_valeur = derniere_valeur + 1 WHERE nom_table = 'lignes_ventes';
        SELECT derniere_valeur INTO v_nb FROM sequences WHERE nom_table = 'lignes_ventes';
        SET NEW.id_lignes_ventes = CONCAT('LVT-', LPAD(v_nb, 6, '0'));
    END IF;
END$$


-- 2. GESTION DU STOCK ET MOUVEMENTS --

-- Mise à jour du stock et traçabilité UNIQUE (évite les doublons)
CREATE TRIGGER tg_stock_apres_vente 
AFTER INSERT ON lignes_ventes 
FOR EACH ROW 
BEGIN
    DECLARE v_nb INT;
    -- 1. Diminuer le stock réel
    UPDATE produits SET quantite_stock = quantite_stock - NEW.quantite 
    WHERE id_produit = NEW.produit_id;

    -- 2. Créer l'ID du mouvement
    UPDATE sequences SET derniere_valeur = derniere_valeur + 1 WHERE nom_table = 'mouvements_stock';
    SELECT derniere_valeur INTO v_nb FROM sequences WHERE nom_table = 'mouvements_stock';

    -- 3. Tracer le mouvement de sortie
    INSERT INTO mouvements_stock (id_mouvement, produit_id, type_mouvement, quantite)
    VALUES (CONCAT('MVT-', LPAD(v_nb, 6, '0')), NEW.produit_id, 'sortie', NEW.quantite);
END$$

-- Sécurité : Vérifier le stock disponible avant de valider la ligne de vente
CREATE TRIGGER tg_verif_stock_avant_vente BEFORE INSERT ON lignes_ventes FOR EACH ROW 
BEGIN
    DECLARE v_stock INT;
    SELECT quantite_stock INTO v_stock FROM produits WHERE id_produit = NEW.produit_id;
    IF v_stock < NEW.quantite THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Erreur : Stock insuffisant.';
    END IF;
END$$
 
-- 3. CALCULS FINANCIERS AUTOMATIQUES --

-- Recalculer le montant de la vente après insertion/modification/suppression d'une ligne
CREATE TRIGGER tg_calcul_montant_vente_insert AFTER INSERT ON lignes_ventes FOR EACH ROW 
BEGIN
    UPDATE ventes SET montant_ttc = (SELECT SUM(quantite * prix_unitaire_ht) * 1.16 FROM lignes_ventes WHERE vente_id = NEW.vente_id)
    WHERE id_ventes = NEW.vente_id;
END$$


-- 4. GESTION DES ABONNEMENTS (SaaS) --

-- Activation automatique de l'entreprise après succès du paiement Mobile Money
CREATE TRIGGER tg_activation_auto_abonnement AFTER UPDATE ON demandes_abonnement FOR EACH ROW 
BEGIN
    IF NEW.statut = 'succes' AND OLD.statut = 'en_attente' THEN
        UPDATE entreprise 
        SET statut_abonnement = 'actif',
            date_expiration_abonnement = DATE_ADD(IFNULL(date_expiration_abonnement, CURDATE()), INTERVAL 1 MONTH)
        WHERE id_entreprise = NEW.entreprise_id;
    END IF;
END$$

-- Sécurité : Empêcher une vente si l'abonnement est expiré
CREATE TRIGGER tg_verif_abonnement_avant_vente BEFORE INSERT ON ventes FOR EACH ROW 
BEGIN
    DECLARE v_statut VARCHAR(20);
    DECLARE v_expiration DATE;
    SELECT statut_abonnement, date_expiration_abonnement INTO v_statut, v_expiration 
    FROM entreprise WHERE id_entreprise = NEW.entreprise_id;
    IF v_statut != 'actif' OR v_expiration < CURDATE() THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Abonnement expiré ou suspendu.';
    END IF;
END$$

DELIMITER ;

INSERT INTO super_admin (nom, email, mot_de_passe)
VALUES ('Super Administrateur', 'admin@crm-pme.local', SHA2('Admin@2026', 256));

DELIMITER $$

CREATE TRIGGER tg_id_super_admin BEFORE INSERT ON super_admin FOR EACH ROW 
BEGIN
    DECLARE v_nb INT;
    -- Mise à jour du compteur spécifique au super_admin
    UPDATE sequences SET derniere_valeur = derniere_valeur + 1 WHERE nom_table = 'super_admin';
    SELECT derniere_valeur INTO v_nb FROM sequences WHERE nom_table = 'super_admin';
    
    -- Format : ADM-001
    SET NEW.id_super_admin = CONCAT('ADM-', LPAD(v_nb, 3, '0'));
END$$

DELIMITER ;

DELIMITER $$

-- Calcul du montant total à l'insertion d'une ligne
CREATE TRIGGER tg_calcul_montant_devis_insert AFTER INSERT ON lignes_devis FOR EACH ROW 
BEGIN
    UPDATE devis 
    SET montant_ttc = (SELECT SUM(quantite * prix_unitaire_ht) * 1.16 FROM lignes_devis WHERE devis_id = NEW.devis_id)
    WHERE id_devis = NEW.devis_id;
END$$

-- Recalcul après modification (ex: changement de quantité)
CREATE TRIGGER tg_calcul_montant_devis_update AFTER UPDATE ON lignes_devis FOR EACH ROW 
BEGIN
    UPDATE devis 
    SET montant_ttc = (SELECT SUM(quantite * prix_unitaire_ht) * 1.16 FROM lignes_devis WHERE devis_id = NEW.devis_id)
    WHERE id_devis = NEW.devis_id;
END$$

-- Recalcul après suppression d'une ligne
CREATE TRIGGER tg_calcul_montant_devis_delete AFTER DELETE ON lignes_devis FOR EACH ROW 
BEGIN
    UPDATE devis 
    SET montant_ttc = (SELECT IFNULL(SUM(quantite * prix_unitaire_ht), 0) * 1.16 FROM lignes_devis WHERE devis_id = OLD.devis_id)
    WHERE id_devis = OLD.devis_id;
END$$

DELIMITER ;

DELIMITER $$

-- 1. SAAS : CRÉATION D'UNE ENTREPRISE AVEC SON PREMIER GÉRANT
-- Cette procédure crée l'entreprise ET l'utilisateur administrateur en une fois.
CREATE PROCEDURE sp_Admin_CreerEntrepriseComplete(
    IN p_raison_sociale VARCHAR(200),
    IN p_email_ent VARCHAR(150),
    IN p_id_nationale VARCHAR(50),
    IN p_ville VARCHAR(100),
    IN p_admin_id VARCHAR(50), -- ID du SuperAdmin qui crée
    IN p_nom_gerant VARCHAR(100),
    IN p_email_gerant VARCHAR(150),
    IN p_mdp_gerant VARCHAR(255)
)
BEGIN
    DECLARE v_new_ent_id VARCHAR(50);
    
    START TRANSACTION;
        -- Création de l'entreprise (L'ID est généré par le trigger)
        INSERT INTO entreprise (raison_sociale, num_id_nationale, email, ville, cree_par_admin_id, statut_abonnement, date_expiration_abonnement)
        VALUES (p_raison_sociale, p_id_nationale, p_email_ent, p_ville, p_admin_id, 'actif', DATE_ADD(CURDATE(), INTERVAL 1 MONTH));

        -- Récupération de l'ID généré pour l'utilisateur
        SET v_new_ent_id = (SELECT id_entreprise FROM entreprise WHERE num_id_nationale = p_id_nationale);

        -- Création du gérant (Rôle Manager)
        INSERT INTO utilisateur (entreprise_id, nom, email, mot_de_passe, role, actif)
        VALUES (v_new_ent_id, p_nom_gerant, p_email_gerant, p_mdp_gerant, 'manager', TRUE);
    COMMIT;
END$$

-- 2. VENTES : TRANSFORMER UN DEVIS EN FACTURE
-- Évite de ressaisir toutes les lignes de produits.
CREATE PROCEDURE sp_ConvertirDevisEnFacture(
    IN p_id_devis VARCHAR(50)
)
BEGIN
    DECLARE v_vente_id VARCHAR(50);
    DECLARE v_statut VARCHAR(20);

    SELECT statut INTO v_statut FROM devis WHERE id_devis = p_id_devis;

    IF v_statut = 'en_attente' THEN
        START TRANSACTION;
            -- 1. Créer l'entête de la vente
            INSERT INTO ventes (client_id, entreprise_id, montant_ttc)
            SELECT client_id, entreprise_id, montant_ttc
            FROM devis WHERE id_devis = p_id_devis;

            -- Récupérer l'ID de la vente fraîchement créée (via le dernier insert de la session)
            -- Note: Puisque nos IDs sont des chaînes via triggers, on utilise le numéro de facture généré
            SET v_vente_id = (
                SELECT CONCAT('FAC-', YEAR(CURDATE()), '-', LPAD(derniere_valeur, 5, '0'))
                FROM sequences WHERE nom_table = 'ventes'
            );

            -- 2. Copier les lignes
            INSERT INTO lignes_ventes (vente_id, produit_id, quantite, prix_unitaire_ht)
            SELECT v_vente_id, produit_id, quantite, prix_unitaire_ht
            FROM lignes_devis WHERE devis_id = p_id_devis;

            -- 3. Marquer le devis comme converti
            UPDATE devis SET statut = 'converti' WHERE id_devis = p_id_devis;
        COMMIT;
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Le devis ne peut plus être converti.';
    END IF;
END$$

-- 3. PAIEMENT : ENREGISTRER UN RÈGLEMENT (MOBILE MONEY INCLUS)
CREATE PROCEDURE sp_EnregistrerPaiement(
    IN p_vente_id VARCHAR(50),
    IN p_montant DECIMAL(10,2),
    IN p_mode ENUM('especes', 'carte', 'virement', 'mobile_money'),
    IN p_ref_externe VARCHAR(100),
    IN p_telephone VARCHAR(20)
)
BEGIN
    INSERT INTO paiement (vente_id, montant, mode_paiement, reference_externe, telephone_payeur)
    VALUES (p_vente_id, p_montant, p_mode, p_ref_externe, p_telephone);
END$$

-- 4. STOCK : AJOUTER DU STOCK (ACHAT FOURNISSEUR)
CREATE PROCEDURE sp_ApprovisionnerProduit(
    IN p_produit_id VARCHAR(50),
    IN p_quantite INT
)
BEGIN
    DECLARE v_nb INT;
    START TRANSACTION;
        -- 1. Mise à jour du stock
        UPDATE produits SET quantite_stock = quantite_stock + p_quantite WHERE id_produit = p_produit_id;

        -- 2. Tracer le mouvement d'entrée
        UPDATE sequences SET derniere_valeur = derniere_valeur + 1 WHERE nom_table = 'mouvements_stock';
        SELECT derniere_valeur INTO v_nb FROM sequences WHERE nom_table = 'mouvements_stock';

        INSERT INTO mouvements_stock (id_mouvement, produit_id, type_mouvement, quantite)
        VALUES (CONCAT('MVT-', LPAD(v_nb, 6, '0')), p_produit_id, 'entree', p_quantite);
    COMMIT;
END$$

-- 5. ADMIN : GÉRER LES ABONNEMENTS
CREATE PROCEDURE sp_Admin_ModifierAbonnement(
    IN p_ent_id VARCHAR(50),
    IN p_action ENUM('ACTIVER', 'SUSPENDRE'),
    IN p_mois INT
)
BEGIN
    IF p_action = 'ACTIVER' THEN
        UPDATE entreprise 
        SET statut_abonnement = 'actif', 
            date_expiration_abonnement = DATE_ADD(CURDATE(), INTERVAL p_mois MONTH)
        WHERE id_entreprise = p_ent_id;
    ELSE
        UPDATE entreprise SET statut_abonnement = 'suspendu' WHERE id_entreprise = p_ent_id;
    END IF;
END$$

DELIMITER ;

DELIMITER $$

-- PROCEDURE : STATISTIQUES DU TABLEAU DE BORD
-- Cette procédure centralise les indicateurs de performance (KPI) pour une entreprise spécifique
CREATE PROCEDURE sp_GetDashboardStats(IN p_entreprise_id VARCHAR(50))
BEGIN
    SELECT 
        -- 1. Nombre total de clients
        (SELECT COUNT(*) FROM client WHERE entreprise_id = p_entreprise_id) AS total_clients,

        -- 2. Nombre de produits en rupture de stock ou sous le seuil d'alerte
        (SELECT COUNT(*) FROM produits 
         WHERE entreprise_id = p_entreprise_id AND quantite_stock <= seuil_alerte) AS alertes_stock,

        -- 3. Chiffre d'affaires du mois en cours
        (SELECT IFNULL(SUM(montant_ttc), 0) FROM ventes 
         WHERE entreprise_id = p_entreprise_id 
         AND MONTH(date_vente) = MONTH(CURDATE()) 
         AND YEAR(date_vente) = YEAR(CURDATE())) AS ca_mois_en_cours,

        -- 4. Nombre de devis en attente de conversion
        (SELECT COUNT(*) FROM devis 
         WHERE entreprise_id = p_entreprise_id AND statut = 'en_attente') AS devis_en_attente,

        -- 5. Total des créances (ce que les clients n'ont pas encore payé)
        (SELECT IFNULL(SUM(v.montant_ttc), 0) - IFNULL(SUM(p.montant), 0)
         FROM ventes v
         LEFT JOIN paiement p ON v.id_ventes = p.vente_id
         WHERE v.entreprise_id = p_entreprise_id) AS total_creances;
END$$

DELIMITER ;

-- Détails complets des factures pour l'impression
CREATE OR REPLACE VIEW v_factures_complet AS
SELECT 
    v.numero_facture AS "Facture_No",
    v.date_vente AS "Date",
    e.raison_sociale AS "Emetteur",
    c.nom AS "Client_Nom",
    c.postnom AS "Client_Postnom",
    p.nom AS "Designation",
    lv.quantite AS "Qté",
    lv.prix_unitaire_ht AS "PU_HT",
    (lv.quantite * lv.prix_unitaire_ht) AS "Total_Ligne_HT",
    p.taux_tva AS "Taux_TVA",
    v.montant_ttc AS "Total_Facture_TTC"
FROM ventes v
JOIN entreprise e ON v.entreprise_id = e.id_entreprise
JOIN client c ON v.client_id = c.id_client
JOIN lignes_ventes lv ON v.id_ventes = lv.vente_id
JOIN produits p ON lv.produit_id = p.id_produit;

-- Suivi des Devis et actions CRM
CREATE OR REPLACE VIEW v_devis_complet AS
SELECT 
    d.numero_devis AS "Devis_No",
    d.date_devis AS "Date_Emission",
    c.nom AS "Client",
    d.montant_ttc AS "Total_Devis",
    d.statut AS "Etat",
    CASE 
        WHEN d.statut = 'en_attente' THEN 'À relancer'
        WHEN d.statut = 'converti' THEN 'Facturé'
        ELSE 'Perdu'
    END AS "Action_CRM"
FROM devis d
JOIN client c ON d.client_id = c.id_client;

-- État des créances (Qui n'a pas encore payé ?)
CREATE OR REPLACE VIEW v_etat_creances AS
SELECT 
    v.numero_facture,
    c.nom AS "Client",
    v.montant_ttc AS "Du",
    IFNULL(SUM(pa.montant), 0) AS "Paye",
    (v.montant_ttc - IFNULL(SUM(pa.montant), 0)) AS "Reste_a_Payer",
    CASE 
        WHEN (v.montant_ttc - IFNULL(SUM(pa.montant), 0)) <= 0 THEN 'Solde'
        WHEN IFNULL(SUM(pa.montant), 0) > 0 THEN 'Partiel'
        ELSE 'Impaye'
    END AS "Statut_Paiement"
FROM ventes v
JOIN client c ON v.client_id = c.id_client
LEFT JOIN paiement pa ON v.id_ventes = pa.vente_id
GROUP BY v.id_ventes;

-- Statistiques par mode de paiement (Espèces vs Mobile Money)
CREATE OR REPLACE VIEW v_statistiques_paiements AS
SELECT 
    e.raison_sociale AS "Entreprise",
    p.mode_paiement AS "Mode",
    SUM(p.montant) AS "Total_Percu",
    COUNT(p.id_paiement) AS "Nombre_Transactions"
FROM paiement p
JOIN ventes v ON p.vente_id = v.id_ventes
JOIN entreprise e ON v.entreprise_id = e.id_entreprise
GROUP BY e.id_entreprise, p.mode_paiement;

-- Monitoring de la plateforme SaaS
CREATE OR REPLACE VIEW v_superadmin_entreprises_stats AS
SELECT 
    e.id_entreprise AS "ID",
    e.raison_sociale AS "Entreprise",
    e.ville AS "Ville",
    e.statut_abonnement AS "Statut",
    e.date_expiration_abonnement AS "Expire_le",
    DATEDIFF(e.date_expiration_abonnement, CURDATE()) AS "Jours_Restants",
    (SELECT COUNT(*) FROM utilisateur u WHERE u.entreprise_id = e.id_entreprise) AS "Employes",
    (SELECT COUNT(*) FROM ventes v WHERE v.entreprise_id = e.id_entreprise) AS "Nombre_Ventes",
    IFNULL((SELECT SUM(montant_ttc) FROM ventes v WHERE v.entreprise_id = e.id_entreprise), 0) AS "CA_Total_USD"
FROM entreprise e;

CREATE OR REPLACE VIEW v_rapport_caisse_journalier AS
SELECT 
    DATE(p.date_paiement) AS "Date",
    v.entreprise_id,
    p.mode_paiement AS "Mode_Paiement",
    COUNT(p.id_paiement) AS "Nombre_Transactions",
    SUM(p.montant) AS "Total_Encaisse"
FROM paiement p
JOIN ventes v ON p.vente_id = v.id_ventes
WHERE DATE(p.date_paiement) = CURDATE()
GROUP BY v.entreprise_id, p.mode_paiement, DATE(p.date_paiement);

CREATE OR REPLACE VIEW v_client_360_top_acheteurs AS
SELECT 
    c.id_client,
    c.nom AS "Nom",
    c.postnom AS "Postnom",
    c.entreprise_id,
    COUNT(v.id_ventes) AS "Nombre_Achats",
    SUM(v.montant_ttc) AS "CA_Total_Genere",
    MAX(v.date_vente) AS "Derniere_Visite"
FROM client c
LEFT JOIN ventes v ON c.id_client = v.client_id
GROUP BY c.id_client
ORDER BY CA_Total_Genere DESC;

CREATE OR REPLACE VIEW v_historique_achats_par_client AS
SELECT 
    c.id_client,
    c.nom AS "Client",
    v.date_vente AS "Date",
    v.numero_facture AS "Facture",
    p.nom AS "Produit",
    lv.quantite AS "Qte",
    lv.prix_unitaire_ht AS "Prix_Unitaire",
    (lv.quantite * lv.prix_unitaire_ht * 1.16) AS "Total_TTC"
FROM client c
JOIN ventes v ON c.id_client = v.client_id
JOIN lignes_ventes lv ON v.id_ventes = lv.vente_id
JOIN produits p ON lv.produit_id = p.id_produit;

CREATE OR REPLACE VIEW v_fiche_stock_inventaire AS
SELECT 
    p.id_produit,
    p.reference_produit AS "Ref",
    p.nom AS "Designation",
    p.quantite_stock AS "Stock_Actuel",
    p.seuil_alerte AS "Alerte",
    (p.quantite_stock * p.prix_ht) AS "Valeur_Stock_HT",
    CASE 
        WHEN p.quantite_stock <= 0 THEN 'RUPTURE'
        WHEN p.quantite_stock <= p.seuil_alerte THEN 'REAPPROVISIONNER'
        ELSE 'OK'
    END AS "Statut"
FROM produits p;
