import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchStats,
  clearStats,
  selectStats,
  selectStatsLoading,
  selectStatsError,
} from '../stats/statsSlice';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Card, CardContent, Typography, Button, Grid } from '@mui/material';

export const StatisticsDashboard: React.FC = () => {
  const dispatch = useDispatch();
  const stats = useSelector(selectStats);
  const loading = useSelector(selectStatsLoading);
  const error = useSelector(selectStatsError);

  useEffect(() => {
    dispatch(fetchStats());
    return () => dispatch(clearStats());
  }, [dispatch]);

  const handleRefresh = () => dispatch(fetchStats());

  if (loading) return <Typography>Loading stats…</Typography>;
  if (error) return <Typography color="error">Error: {error}</Typography>;

  const chartData = [
    { name: 'S1', count: stats.trueCount[0] },
    { name: 'S2', count: stats.trueCount[1] },
    { name: 'S3', count: stats.trueCount[2] },
    { name: 'S4', count: stats.trueCount[3] },
    { name: 'S5', count: stats.trueCount[4] },
  ];

  return (
    <div className="stats-dashboard">
      <Typography variant="h4" gutterBottom>
        Advanced Statistics
      </Typography>

      <Button variant="contained" onClick={handleRefresh} sx={{ mb: 2 }}>
        Refresh
      </Button>

      <Grid container spacing={2}>
        <StatCard title="Total Cards Tracked" value={stats.totalCards} />
        <StatCard title="Running Count" value={stats.runningCount} />
        <StatCard title="True Count" value={stats.trueCountAvg.toFixed(2)} />
        <StatCard title="Bet Correlation" value={`${stats.betCorrelation}%`} />
        <StatCard title="Win/Loss Ratio" value={stats.winLossRatio.toFixed(2)} />
        <StatCard title="Profit / Loss" value={`$${stats.profitLoss.toFixed(2)}`} />
        <StatCard title="Sessions Played" value={stats.sessionsPlayed} />
        <StatCard
          title="High / Low Distribution"
          value={`${stats.highCount} / ${stats.lowCount}`}
        />
      </Grid>

      <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>
        True Count by Session
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="#1976d2" activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string | number }> = ({
  title,
  value,
}) => (
  <Grid item xs={12} sm={6} md={4}>
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle1">{title}</Typography>
        <Typography variant="h5" sx={{ mt: 1 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  </Grid>
);
