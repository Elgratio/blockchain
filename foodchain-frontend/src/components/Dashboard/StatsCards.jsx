import React from 'react';

const StatsCards = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="card flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
            <p className={`text-2xl font-bold ${stat.color || 'text-gray-800'}`}>
              {stat.value?.toLocaleString() || 0}
            </p>
          </div>
          <div className={`p-3 rounded-full bg-opacity-10 ${stat.color?.replace('text-', 'bg-') || 'bg-gray-100'}`}>
            {stat.icon && <stat.icon className={`text-2xl ${stat.color || 'text-gray-600'}`} />}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;