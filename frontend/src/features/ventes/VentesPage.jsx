import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Badge } from "../../components/ui/Badge.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import { Table } from "../../components/ui/Table.jsx";
import { Loader } from "../../components/ui/Loader.jsx";
import { useClients } from "../clients/clientQueries.js";
import { useProduits } from "../produits/produitQueries.js";
import { useCreateVente, useVentes } from "./venteQueries.js";
import { useConvertirPanier, usePaniers } from "../paniers/panierQueries.js";
import { VenteForm } from "./VenteForm.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { formatDate } from "../../utils/formatDate.js";

const getFactureId = (row) =>
  row?.id_vente || row?.id_facture || row?.numero_facture || row?.id_ventes;

export function VentesPage() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("directe");
  const navigate = useNavigate();
  const { showToast } = useToast();
  const ventes = useVentes();
  const clients = useClients();
  const produits = useProduits();
  const paniers = usePaniers();
  const createVente = useCreateVente();
  const convertirPanier = useConvertirPanier();
  const paniersEnAttente = (paniers.data || []).filter(
    (panier) => (panier.statut || "en_attente") === "en_attente",
  );

  const handleSubmit = (payload) => {
    createVente
      .mutateAsync(payload)
      .then((response) => {
        showToast("Vente enregistree et facture generee");
        setOpen(false);
        if (response?.facture) {
          navigate(`/ventes/${response.facture}`);
        }
      })
      .catch((error) => showToast(error.message, "error"));
  };

  const handleConvertirPanier = (panierId) => {
    convertirPanier
      .mutateAsync(panierId)
      .then((response) => {
        showToast("Panier converti en facture");
        setOpen(false);
        if (response?.facture) {
          navigate(`/ventes/${response.facture}`);
        }
      })
      .catch((error) => showToast(error.message, "error"));
  };

  if (
    ventes.isLoading ||
    clients.isLoading ||
    produits.isLoading ||
    paniers.isLoading
  )
    return <Loader />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 dark:text-white">
            Ventes et factures
          </h1>
          <p className="text-sm text-slate-500">
            Suivi des factures et statuts de paiement.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={18} /> Nouvelle vente
        </Button>
      </div>
      <Table
        data={ventes.data || []}
        columns={[
          {
            key: "id_vente",
            header: "Facture",
            render: (row) => getFactureId(row) || "-",
          },
          {
            key: "client_nom",
            header: "Client",
            render: (row) =>
              row.client_nom_complet ||
              [row.client_nom || row.nom_client, row.client_postnom].filter(Boolean).join(" ") ||
              row.client_id,
          },
          {
            key: "date_vente",
            header: "Date",
            render: (row) => formatDate(row.date_vente || row.date_facture),
          },
          {
            key: "montant_total_ttc",
            header: "Total",
            render: (row) =>
              formatCurrency(row.montant_total_ttc ?? row.total_ttc ?? row.montant_ttc),
          },
          {
            key: "statut_paiement",
            header: "Paiement",
            render: (row) => (
              <Badge
                color={row.statut_paiement === "paye" ? "success" : "warning"}
              >
                {row.statut_paiement || "impaye"}
              </Badge>
            ),
          },
        ]}
        renderActions={(row) => {
          const factureId = getFactureId(row);
          if (!factureId) {
            return <span className="text-sm text-slate-400">Indisponible</span>;
          }

          return (
            <Link
              to={`/ventes/${factureId}`}
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700"
            >
              Voir
            </Link>
          );
        }}
      />

      <Modal open={open} title="Nouvelle vente" onClose={() => setOpen(false)}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 rounded-md bg-slate-100 p-1 dark:bg-slate-950">
            <button
              type="button"
              onClick={() => setMode("directe")}
              className={`rounded px-3 py-2 text-sm font-semibold transition ${
                mode === "directe"
                  ? "bg-white text-sky-700 shadow-sm dark:bg-slate-900 dark:text-sky-200"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              Produit
            </button>
            <button
              type="button"
              onClick={() => setMode("panier")}
              className={`rounded px-3 py-2 text-sm font-semibold transition ${
                mode === "panier"
                  ? "bg-white text-sky-700 shadow-sm dark:bg-slate-900 dark:text-sky-200"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              Panier
            </button>
          </div>

          {mode === "directe" ? (
            <VenteForm
              clients={clients.data || []}
              produits={produits.data || []}
              onSubmit={handleSubmit}
              isLoading={createVente.isPending}
            />
          ) : (
            <div className="space-y-3">
              <Table
                data={paniersEnAttente}
                emptyText="Aucun panier en attente"
                columns={[
                  { key: "id_panier", header: "Panier" },
                  {
                    key: "client_nom",
                    header: "Client",
                    render: (row) =>
                      row.client_nom || row.nom_client || row.client_id,
                  },
                  { key: "total_ttc", header: "Total" },
                ]}
                renderActions={(row) => (
                  <Button
                    variant="secondary"
                    onClick={() => handleConvertirPanier(row.id_panier)}
                    isLoading={convertirPanier.isPending}
                  >
                    Vendre
                  </Button>
                )}
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
