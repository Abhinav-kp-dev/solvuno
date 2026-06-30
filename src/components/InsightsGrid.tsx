import MapDashboard from './MapDashboard';
import NeighborhoodFeed from './NeighborhoodFeed';
import Leaderboard from './Leaderboard';

export default function InsightsGrid() {
  return (
    <>
      {/* Center Map Section */}
      <div className="w-[500px] shrink-0 h-full">
        <MapDashboard />
      </div>

      {/* Right Social Section */}
      <div className="flex-1 h-full flex flex-col gap-8 min-w-[300px]">
        <div className="flex-1 min-h-[250px]">
          <NeighborhoodFeed />
        </div>
        <div className="flex-1 min-h-[250px]">
          <Leaderboard />
        </div>
      </div>
    </>
  );
}
