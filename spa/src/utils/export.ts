// src/utils/export.ts
export const exportToCSV = (sessions: any[]) => {
  const header = ['ID', 'Start Time', 'Cards', 'Running Count', 'True Count'];
  const rows = sessions.map((s) => [
    s.id,
    s.startTime,
    s.cards.length,
    s.runningCount,
    s.trueCount,
  ]);

  const csvContent =
    [header, ...rows]
      .map((e) => e.join(','))
      .join('\n') + '\n';

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', 'blackjack-sessions.csv');
  a.click();
  URL.revokeObjectURL(url);
};
