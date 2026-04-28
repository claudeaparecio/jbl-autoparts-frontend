import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import ProductPDFDocument from './product-pdf-document';
import { ProductDetails } from 'types/inventory';
import { Status } from 'store/slices/inventorySlice';
import { useLazyGetProductByStatusQuery } from 'store/apis/productsApi';
import toast from 'react-hot-toast';
import moment from 'moment';
import * as Sentry from '@sentry/react';

type ExportPDFButtonProps = {
  products?: ProductDetails[];
  status: Status;
}

const ExportProductsPDFButton = ({ status }: ExportPDFButtonProps) => {
  const [getProductsByStatus] = useLazyGetProductByStatusQuery();
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);
      const response: any = await getProductsByStatus(status.value);
      if (response?.error) {
        toast.error(response.error?.data?.message ?? "Failed to fetch products.");
        return;
      }
      const products: ProductDetails[] = response?.data?.data ?? [];
      if (products.length === 0) {
        toast.error("No products to export.");
        return;
      }
      const blob = await pdf(<ProductPDFDocument status={status} products={products} />).toBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      const statusString = status?.label?.replace(' ', '-');
      anchor.download = `${moment().format('D-M-YYYY')}-${statusString}-Products.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Failed to generate PDF.");
      Sentry.captureException(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="px-4 py-2 rounded-lg bg-secondary-medium text-black font-medium disabled:opacity-50"
    >
      {loading ? 'Generating...' : 'Download PDF'}
    </button>
  );
};

export default ExportProductsPDFButton;
