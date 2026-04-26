import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Scan, Beef, Package, Pill, FileText } from "lucide-react";
import { BarcodeScanner, ScanButton } from "./BarcodeScanner";
import { mockAnimals } from "@/data/rebanho-mock";
import { mockProducts } from "@/data/estoque-mock";
import { toast } from "sonner";

export function GlobalScannerButton() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleScan = useCallback((code: string) => {
    // Try to match animal by ear_tag
    const animal = mockAnimals.find(a => a.ear_tag === code);
    if (animal) {
      toast.success(`Animal encontrado: ${animal.ear_tag} — ${animal.name}`);
      navigate(`/rebanho/animais/${animal.id}`);
      return;
    }

    // Try to match product by barcode or name
    const product = mockProducts.find(p => (p as any).barcode === code || p.name === code);
    if (product) {
      toast.success(`Produto encontrado: ${product.name}`);
      navigate("/fazenda/estoque");
      return;
    }

    // Check if it's a boleto barcode (44+ digits)
    if (/^\d{44,}$/.test(code.replace(/[\.\-\s]/g, ""))) {
      toast.info("Código de boleto detectado — abrindo A Pagar");
      navigate("/financeiro/pagar-receber");
      return;
    }

    toast.info(`Código lido: ${code} — nenhum item correspondente encontrado`);
  }, [navigate]);

  return (
    <>
      <ScanButton onClick={() => setOpen(true)} className="h-8 w-8" />
      <BarcodeScanner
        open={open}
        onOpenChange={setOpen}
        onScan={handleScan}
        title="Busca Rápida por Scanner"
        description="Escaneie QR Code de animal, código de produto, medicamento ou boleto"
      />
    </>
  );
}
