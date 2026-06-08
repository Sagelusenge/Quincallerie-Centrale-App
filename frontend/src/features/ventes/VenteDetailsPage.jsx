import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Printer } from "lucide-react";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Table } from "../../components/ui/Table.jsx";
import { Loader } from "../../components/ui/Loader.jsx";
import { useVente } from "./venteQueries.js";
import { venteApi } from "../../api/venteApi.js";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { formatDate } from "../../utils/formatDate.js";

const getFactureId = (row, fallback) =>
  row?.id_vente || row?.id_facture || row?.numero_facture || row?.id_ventes || fallback;

export function VenteDetailsPage() {
  const { id } = useParams();
  const [isPrinting, setIsPrinting] = useState(false);
  const vente = useVente(id);
  const data = vente.data || {};
  const lignes = data.lignes || data.articles || [];
  const factureId = getFactureId(data, id);
  const clientName =
    data.client_nom_complet ||
    [data.client_nom || data.nom_client, data.client_postnom].filter(Boolean).join(" ") ||
    data.client_id ||
    "-";
  const dateVente = formatDate(
    data.date_vente || data.date_facture || new Date().toISOString(),
  );

  const totalTTC = useMemo(
    () =>
      formatCurrency(
        data.montant_total_ttc ||
          data.total_ttc ||
          data.montant_ttc ||
          lignes.reduce((sum, row) => {
            const prix = Number(row.prix || row.prix_unitaire_ht || 0);
            const quantite = Number(row.quantite || 0);
            return sum + prix * quantite;
          }, 0),
      ),
    [data, lignes],
  );

  if (vente.isLoading) return <Loader />;

  const openPdf = async () => {
    try {
      setIsPrinting(true);
      const blob = await venteApi.pdf(factureId);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-950 dark:text-white">
              Facture {factureId}
            </h1>
            <Button
              type="button"
              variant="secondary"
              className="min-h-9 px-3 print:hidden"
              onClick={openPdf}
              isLoading={isPrinting}
            >
              <Printer size={16} />
              Imprimer
            </Button>
          </div>
          <p className="text-sm text-slate-500">{dateVente}</p>
        </div>
      </div>

      <Card className="space-y-6 p-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
            Quincaillerie Centrale
          </h2>
          {data.ville && <p className="text-sm text-slate-500">{data.ville}</p>}
        </div>

        <div className="grid gap-4 text-sm md:grid-cols-3">
          <div>
            <p className="font-semibold">Client</p>
            <p>{clientName}</p>
            {data.client_tel && <p>{data.client_tel}</p>}
          </div>
          <div>
            <p className="font-semibold">Facture</p>
            <p>{factureId}</p>
          </div>
          <div>
            <p className="font-semibold">Montant total a payer</p>
            <p>{totalTTC}</p>
            {Number(data.total_paye || 0) > 0 ? (
              <p className="mt-1 text-xs text-slate-500">
                Paye: {formatCurrency(data.total_paye)} - Reste: {formatCurrency(data.reste_a_payer)}
              </p>
            ) : null}
          </div>
        </div>
      </Card>

      <Table
        data={lignes}
        columns={[
          {
            key: "produit_nom",
            header: "Produit",
            render: (row) => row.produit_nom || row.nom,
          },
          { key: "quantite", header: "Quantite" },
          {
            key: "prix",
            header: "Prix",
            render: (row) => formatCurrency(row.prix || row.prix_unitaire_ht),
          },
          {
            key: "total",
            header: "Total",
            render: (row) =>
              formatCurrency(row.total || row.total_ttc || row.sous_total),
          },
        ]}
      />
    </div>
  );
}
