'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { 
  Users, 
  Film, 
  Tv, 
  CreditCard, 
  TrendingUp, 
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { userService } from '@/services/userService';
import { movieService, Movie } from '@/services/movieService';
import { subscriptionService } from '@/services/subscriptionService';

// Dynamically import charts to keep initial bundle small
const DashboardCharts = dynamic(() => import('@/components/dashboard/DashboardCharts'), { 
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-muted animate-pulse rounded-xl" />
});

export default function DashboardPage() {
  const [stats, setStats] = useState([
    { label: 'Total Users', value: '0', icon: Users, trend: '0%', isUp: true },
    { label: 'Total Movies', value: '0', icon: Film, trend: '0%', isUp: true },
    { label: 'Total Series', value: '0', icon: Tv, trend: '0%', isUp: true },
    { label: 'Active Subs', value: '0', icon: CreditCard, trend: '0%', isUp: true },
    { label: 'Revenue', value: formatCurrency(0), icon: TrendingUp, trend: '0%', isUp: true },
    { label: 'Total Views', value: '0', icon: Eye, trend: '0%', isUp: true },
  ]);
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [users, movies, subscriptions, trending] = await Promise.all([
        userService.getAll(),
        movieService.getAll(),
        subscriptionService.getAll(),
        movieService.getTrending?.(5) || Promise.resolve([])
      ]);

      const activeSubs = subscriptions.filter(s => s.status === 'active').length;
      const totalRevenue = subscriptions.reduce((acc, curr) => acc + (curr.paid_amount || 0), 0);
      const totalViews = movies.reduce((acc, curr) => acc + (curr.view_count || 0), 0);

      setStats([
        { label: 'Total Users', value: users.length.toLocaleString(), icon: Users, trend: '+0%', isUp: true },
        { label: 'Total Movies', value: movies.length.toLocaleString(), icon: Film, trend: '+0%', isUp: true },
        { label: 'Total Series', value: '0', icon: Tv, trend: '+0%', isUp: true }, // Placeholder for series
        { label: 'Active Subs', value: activeSubs.toLocaleString(), icon: CreditCard, trend: '+0%', isUp: true },
        { label: 'Revenue', value: formatCurrency(totalRevenue), icon: TrendingUp, trend: '+0%', isUp: true },
        { label: 'Total Views', value: totalViews.toLocaleString(), icon: Eye, trend: '+0%', isUp: true },
      ]);

      setTrendingMovies(trending);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">Real-time analytics and platform performance.</p>
        </div>
        {isLoading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {stats.map((stat, i) => (
          <div 
            key={i} 
            className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-muted rounded-xl group-hover:bg-primary/10 transition-colors">
                <stat.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                stat.isUp ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
              )}>
                {stat.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.trend}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
              <p className="text-2xl font-bold tracking-tight">{isLoading ? '...' : stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <DashboardCharts />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card p-6 rounded-2xl border border-border">
          <h3 className="text-lg font-semibold mb-6">Top Watched Movies</h3>
          <div className="space-y-4">
            {isLoading ? (
              [1, 2, 3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)
            ) : trendingMovies.length > 0 ? (
              trendingMovies.map((movie) => (
                <div key={movie.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-xl transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-14 bg-muted rounded-md overflow-hidden relative">
                      <img src={movie.movie_image} alt={movie.title} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-medium">{movie.title}</p>
                      <p className="text-xs text-muted-foreground">{movie.type} • {movie.duration}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{(movie.view_count || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Views</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No trending movies found.</p>
            )}
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border">
          <h3 className="text-lg font-semibold mb-6">Recent Activities</h3>
          <div className="space-y-4 text-center py-8">
            <p className="text-muted-foreground italic text-sm">Real-time activity log integration pending backend update.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
