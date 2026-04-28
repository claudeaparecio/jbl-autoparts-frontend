import React, { useState } from 'react';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import moment from 'moment';
import { Transaction } from 'types/transaction';
import { useLazyGetAllTransactionsQuery } from 'store/apis/transactionsApi';
import toast from 'react-hot-toast';
import * as Sentry from '@sentry/react';

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 10,
  },
  header: {
    fontSize: 14,
    marginBottom: 10,
  },
  transactionSection: {
    marginBottom: 12,
    borderBottom: 1,
    paddingBottom: 6,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  label: {
    width: 80,
    fontWeight: 'bold',
  },
  value: {
    flex: 1,
  },
  itemsHeader: {
    marginTop: 4,
    fontWeight: 'bold',
  },
  itemRow: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  itemCell: {
    flex: 1,
  },
});

const TransactionsDocument = ({ transactions }: { transactions: Transaction[] }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Transaction List as of {moment().format("MMMM DD YYYY")}</Text>

      {transactions?.map((tx: any) => (
        <View key={tx._id} style={styles.transactionSection}>
          <View style={styles.row}>
            <Text style={styles.label}>Invoice:</Text>
            <Text style={styles.value}>{tx.invoiceId || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Cashier:</Text>
            <Text style={styles.value}>{tx.cashier?.name || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Partsman:</Text>
            <Text style={styles.value}>{tx.partsman?.name || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={styles.value}>{tx.status}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total:</Text>
            <Text style={styles.value}>{tx.total.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Discount:</Text>
            <Text style={styles.value}>{(tx.discount).toFixed(0)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{moment(tx.createdAt).format('D-M-YYYY')}</Text>
          </View>

          <Text style={styles.itemsHeader}>Items:</Text>
          {tx.items.map((item: any, index: number) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemCell}>{item._id?.name || 'Unknown product'}</Text>
              <Text style={styles.itemCell}>x {item.count}</Text>
            </View>
          ))}
        </View>
      ))}
    </Page>
  </Document>
);

const ExportTransactionsPDF = () => {
  const [getAllTransactions] = useLazyGetAllTransactionsQuery();
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);
      const response: any = await getAllTransactions();
      if (response?.error) {
        toast.error(response.error?.data?.message ?? "Failed to fetch transactions.");
        return;
      }
      const transactions: Transaction[] = response?.data?.data ?? [];
      const blob = await pdf(<TransactionsDocument transactions={transactions} />).toBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `transactions-${moment().format('D-M-YYYY')}.pdf`;
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

export default ExportTransactionsPDF;
