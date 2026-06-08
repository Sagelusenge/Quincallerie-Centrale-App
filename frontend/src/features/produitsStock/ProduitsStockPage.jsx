import { useMemo, useState } from "react";
import { PackagePlus } from "lucide-react";
import { Badge } from "../../components/ui/Badge.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Loader } from "../../components/ui/Loader.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import { Table } from "../../components/ui/Table.jsx";
import { FormField } from "../../components/forms/FormField.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { STOCK_STATUS_COLORS } from "../../utils/constants.js";
import { useFournisseurs } from "../fournisseurs/fournisseurQueries.js";
import {
  useApprovisionnerProduit,
  useProduits,
} from "../produits/produitQueries.js";

const selectClass =
  "min-h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-sky-950";

export function ProduitsStockPage() {
  const [modalProduitId, setModalProduitId] = useState("");
  const [search, setSearch] = useState("");
  const { showToast } = useToast();
  const produits = useProduits();
  const fournisseurs = useFournisseurs();
  const approvisionner = useApprovisionnerProduit();

  const selectedProduit = useMemo(
    () =>
      (produits.data || []).find(
        (produit) => String(produit.id_produit) === String(modalProduitId),
      ),
    [produits.data, modalProduitId],
  );

  const activeFournisseurs = useMemo(
    () => (fournisseurs.data || []).filter((fournisseur) => fournisseur.actif),
    [fournisseurs.data],
  );

  const filteredProduits = useMemo(
    () =>
      (produits.data || []).filter((produit) =>
        `${produit.nom || ""} ${produit.reference_produit || ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [produits.data, search],
  );

  const submit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!selectedProduit) {
      showToast("Selectionnez un produit", "error");
      return;
    }

    const payload = Object.fromEntries(new FormData(form).entries());
    approvisionner
      .mutateAsync({ id: selectedProduit.id_produit, payload })
      .then(() => {
        showToast("Stock mis a jour");
        form.reset();
        setModalProduitId("");
      })
      .catch((error) => showToast(error.message, "error"));
  };

  if (produits.isLoading || fournisseurs.isLoading) return <Loader />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">
          Produits stock
        </h1>
        <p className="text-sm text-slate-500">
          Approvisionner un produit avec un fournisseur actif.
        </p>
      </div>

      <div className="space-y-3">
        <Input
          className="max-w-md"
          placeholder="Rechercher par nom ou reference"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Table
          data={filteredProduits}
          columns={[
            { key: "reference_produit", header: "Reference" },
            { key: "nom", header: "Produit" },
            { key: "quantite_stock", header: "Stock" },
            {
              key: "statut_stock",
              header: "Statut",
              render: (row) => (
                <Badge
                  color={STOCK_STATUS_COLORS[row.statut_stock] || "neutral"}
                >
                  {row.statut_stock || "OK"}
                </Badge>
              ),
            },
          ]}
          renderActions={(row) => (
            <Button
              variant={
                String(modalProduitId) === String(row.id_produit)
                  ? "primary"
                  : "secondary"
              }
              onClick={() => setModalProduitId(row.id_produit)}
            >
              <PackagePlus size={16} /> Choisir
            </Button>
          )}
        />
      </div>

      <Modal
        open={Boolean(selectedProduit)}
        title="Nouvel approvisionnement"
        onClose={() => setModalProduitId("")}
      >
        <form onSubmit={submit} className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
              Nouvel approvisionnement
            </h2>
            <p className="text-sm text-slate-500">
              {selectedProduit
                ? selectedProduit.nom
                : "Aucun produit selectionne"}
            </p>
          </div>
          <FormField label="Fournisseur">
            <select
              name="fournisseur_id"
              required
              defaultValue=""
              className={selectClass}
            >
              <option value="" disabled>
                Choisir un fournisseur
              </option>
              {activeFournisseurs.map((fournisseur) => (
                <option
                  key={fournisseur.id_fournisseur}
                  value={fournisseur.id_fournisseur}
                >
                  {fournisseur.nom}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Quantite">
            <Input name="quantite" type="number" min="1" required />
          </FormField>
          <Button
            type="submit"
            isLoading={approvisionner.isPending}
            disabled={!selectedProduit || activeFournisseurs.length === 0}
          >
            <PackagePlus size={18} /> Approvisionner
          </Button>
        </form>
      </Modal>
    </div>
  );
}
